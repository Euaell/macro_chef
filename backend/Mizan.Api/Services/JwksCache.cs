using Microsoft.IdentityModel.Tokens;
using StackExchange.Redis;

namespace Mizan.Api.Services;

/// <summary>
/// Service for caching JWKS (JSON Web Key Set) using Redis
/// Caches raw JWKS JSON to properly support all key types including EdDSA
/// </summary>
public interface IJwksCache
{
    Task<ICollection<SecurityKey>> GetSigningKeysAsync(string jwksUrl, CancellationToken cancellationToken = default);
    Task InvalidateCacheAsync();
}

public class JwksCache : IJwksCache
{
    private readonly IConnectionMultiplexer? _redis;
    private readonly HttpClient _httpClient;
    private readonly ILogger<JwksCache> _logger;
    private readonly TimeSpan _cacheDuration = TimeSpan.FromMinutes(1); // 1 minute cache
    private readonly string _cacheKeyPrefix = "jwks:";

    // In-memory fallback cache (used if Redis is not available)
    private static readonly Dictionary<string, CachedJwks> _memoryCache = new();
    private static readonly SemaphoreSlim _cacheLock = new(1, 1);

    public JwksCache(
        IConnectionMultiplexer? redis,
        IHttpClientFactory httpClientFactory,
        ILogger<JwksCache> logger)
    {
        _redis = redis;
        _httpClient = httpClientFactory.CreateClient("JwksClient");
        _logger = logger;
    }

    public async Task<ICollection<SecurityKey>> GetSigningKeysAsync(
        string jwksUrl,
        CancellationToken cancellationToken = default)
    {
        var cacheKey = $"{_cacheKeyPrefix}{jwksUrl}";

        try
        {
            // Try Redis first
            if (_redis?.IsConnected == true)
            {
                var cachedJson = await GetFromRedisAsync(cacheKey, cancellationToken);
                if (cachedJson != null)
                {
                    _logger.LogDebug("JWKS cache hit (Redis) for {JwksUrl}", jwksUrl);
                    var keys = ParseJwks(cachedJson);
                    _logger.LogDebug("Parsed {Count} signing keys from Redis cache", keys.Count);

                    // Invalidate cache if no keys found (corrupted/invalid cache)
                    if (keys.Count == 0)
                    {
                        _logger.LogWarning("Cache contains 0 keys, invalidating and fetching fresh JWKS");
                        await InvalidateCacheAsync();
                        // Continue to fetch fresh JWKS below
                    }
                    else
                    {
                        return keys;
                    }
                }
            }
            else
            {
                // Fallback to in-memory cache
                var cachedJson = GetFromMemoryCache(cacheKey);
                if (cachedJson != null)
                {
                    _logger.LogDebug("JWKS cache hit (Memory) for {JwksUrl}", jwksUrl);
                    var keys = ParseJwks(cachedJson);
                    _logger.LogDebug("Parsed {Count} signing keys from memory cache", keys.Count);

                    // Invalidate cache if no keys found (corrupted/invalid cache)
                    if (keys.Count == 0)
                    {
                        _logger.LogWarning("Cache contains 0 keys, invalidating and fetching fresh JWKS");
                        await InvalidateCacheAsync();
                        // Continue to fetch fresh JWKS below
                    }
                    else
                    {
                        return keys;
                    }
                }
            }

            _logger.LogDebug("JWKS cache miss for {JwksUrl}, fetching from source", jwksUrl);

            // Fetch from source
            var jwksJson = await FetchJwksJsonAsync(jwksUrl, cancellationToken);
            var signingKeys = ParseJwks(jwksJson);

            _logger.LogInformation("Fetched {Count} signing keys from {JwksUrl}", signingKeys.Count, jwksUrl);

            // Cache the raw JSON
            await CacheJwksJsonAsync(cacheKey, jwksJson, cancellationToken);

            return signingKeys;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching JWKS from {JwksUrl}", jwksUrl);

            // Try to return stale cache if available
            var staleJson = GetFromMemoryCache(cacheKey, ignoreExpiry: true);
            if (staleJson != null)
            {
                _logger.LogWarning("Returning stale JWKS cache for {JwksUrl}", jwksUrl);
                return ParseJwks(staleJson);
            }

            throw;
        }
    }

    public async Task InvalidateCacheAsync()
    {
        try
        {
            if (_redis?.IsConnected == true)
            {
                var db = _redis.GetDatabase();
                var server = _redis.GetServer(_redis.GetEndPoints().First());
                var keys = server.Keys(pattern: $"{_cacheKeyPrefix}*").ToArray();

                if (keys.Length > 0)
                {
                    await db.KeyDeleteAsync(keys);
                    _logger.LogInformation("Invalidated {Count} JWKS cache entries in Redis", keys.Length);
                }
            }

            // Clear memory cache
            await _cacheLock.WaitAsync();
            try
            {
                _memoryCache.Clear();
                _logger.LogInformation("Cleared in-memory JWKS cache");
            }
            finally
            {
                _cacheLock.Release();
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error invalidating JWKS cache");
        }
    }

    private async Task<string> FetchJwksJsonAsync(
        string jwksUrl,
        CancellationToken cancellationToken)
    {
        var response = await _httpClient.GetAsync(jwksUrl, cancellationToken);
        response.EnsureSuccessStatusCode();

        var jwksJson = await response.Content.ReadAsStringAsync(cancellationToken);

        _logger.LogDebug("Fetched JWKS JSON: {JwksJson}", jwksJson);

        return jwksJson;
    }

    private ICollection<SecurityKey> ParseJwks(string jwksJson)
    {
        try
        {
            var jwks = new JsonWebKeySet(jwksJson);

            // Use Keys property instead of GetSigningKeys() to get ALL keys
            // GetSigningKeys() filters based on 'use' parameter which EdDSA keys may not have
            var keys = jwks.Keys.Cast<SecurityKey>().ToList();

            _logger.LogDebug("Parsed JWKS: {KeyCount} keys found", keys.Count);

            if (keys.Count > 0)
            {
                foreach (var key in jwks.Keys)
                {
                    _logger.LogDebug("Key: kid={Kid}, kty={Kty}, alg={Alg}, use={Use}",
                        key.Kid, key.Kty, key.Alg, key.Use);
                }
            }

            return keys;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error parsing JWKS JSON: {JwksJson}", jwksJson);
            throw;
        }
    }

    private async Task<string?> GetFromRedisAsync(
        string cacheKey,
        CancellationToken cancellationToken)
    {
        if (_redis?.IsConnected != true)
            return null;

        try
        {
            var db = _redis.GetDatabase();
            var cachedJson = await db.StringGetAsync(cacheKey);

            if (!cachedJson.HasValue)
                return null;

            return cachedJson.ToString();
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Error reading JWKS from Redis cache");
            return null;
        }
    }

    private string? GetFromMemoryCache(string cacheKey, bool ignoreExpiry = false)
    {
        _cacheLock.Wait();
        try
        {
            if (_memoryCache.TryGetValue(cacheKey, out var cached))
            {
                if (ignoreExpiry || cached.ExpiresAt > DateTime.UtcNow)
                {
                    return cached.JwksJson;
                }
                else
                {
                    // Remove expired entry
                    _memoryCache.Remove(cacheKey);
                }
            }

            return null;
        }
        finally
        {
            _cacheLock.Release();
        }
    }

    private async Task CacheJwksJsonAsync(
        string cacheKey,
        string jwksJson,
        CancellationToken cancellationToken)
    {
        // Cache in Redis
        if (_redis?.IsConnected == true)
        {
            try
            {
                var db = _redis.GetDatabase();
                await db.StringSetAsync(cacheKey, jwksJson, _cacheDuration);
                _logger.LogDebug("Cached JWKS in Redis with {Duration} TTL", _cacheDuration);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Error caching JWKS in Redis, will use memory cache");
            }
        }

        // Also cache in memory as fallback
        await _cacheLock.WaitAsync(cancellationToken);
        try
        {
            _memoryCache[cacheKey] = new CachedJwks
            {
                JwksJson = jwksJson,
                ExpiresAt = DateTime.UtcNow.Add(_cacheDuration)
            };
            _logger.LogDebug("Cached JWKS in memory with {Duration} TTL", _cacheDuration);
        }
        finally
        {
            _cacheLock.Release();
        }
    }

    private class CachedJwks
    {
        public string JwksJson { get; set; } = string.Empty;
        public DateTime ExpiresAt { get; set; }
    }
}
