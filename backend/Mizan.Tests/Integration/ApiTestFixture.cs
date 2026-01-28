using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;
using Mizan.Api.Authentication;
using Mizan.Domain.Entities;
using Mizan.Infrastructure.Data;
using NSec.Cryptography;
using Xunit;

namespace Mizan.Tests.Integration;

public sealed class ApiTestFixture : WebApplicationFactory<Program>, IAsyncLifetime
{
    private static readonly string[] TablesToTruncate =
    [
        "mcp_usage_logs",
        "mcp_tokens",
        "goal_progress",
        "user_goals",
        "food_diary_entries",
        "favorite_recipes",
        "recipe_tags",
        "recipe_instructions",
        "recipe_ingredients",
        "recipe_nutrition",
        "recipes",
        "foods",
        "household_members",
        "households",
        "audit_logs",
        "users"
    ];

    private readonly TestJwtIssuer _jwtIssuer;
    private readonly string _issuer;
    private readonly string _audience;
    private readonly string _connectionString;
    private readonly string? _redisConnectionString;

    public ApiTestFixture()
    {
        _connectionString = GetRequiredEnvironment("ConnectionStrings__PostgreSQL");
        _redisConnectionString = Environment.GetEnvironmentVariable("ConnectionStrings__Redis");
        _issuer = Environment.GetEnvironmentVariable("BetterAuth__Issuer") ?? "http://localhost:3000";
        _audience = Environment.GetEnvironmentVariable("BetterAuth__Audience") ?? "mizan-api";
        _jwtIssuer = TestJwtIssuer.Create();
    }

    public string Issuer => _issuer;
    public string Audience => _audience;
    public TestJwtIssuer JwtIssuer => _jwtIssuer;

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Development");

        builder.ConfigureAppConfiguration((context, config) =>
        {
            var settings = new Dictionary<string, string?>
            {
                ["ConnectionStrings:PostgreSQL"] = _connectionString,
                ["ConnectionStrings:Redis"] = _redisConnectionString,
                ["BetterAuth:Issuer"] = _issuer,
                ["BetterAuth:Audience"] = _audience,
                ["BetterAuth:JwksUrl"] = "http://jwks.test"
            };

            config.AddInMemoryCollection(settings);
        });

        builder.ConfigureTestServices(services =>
        {
            var descriptors = services.Where(d => d.ServiceType == typeof(IJwksProvider)).ToList();
            foreach (var descriptor in descriptors)
            {
                services.Remove(descriptor);
            }

            services.AddSingleton<IJwksProvider>(new TestJwksProvider(_jwtIssuer.Jwk));
        });
    }

    public async Task InitializeAsync()
    {
        await EnsureDatabaseAsync();
    }

    public async Task DisposeAsync()
    {
        _jwtIssuer.Dispose();
        await base.DisposeAsync();
    }

    public HttpClient CreateAuthenticatedClient(Guid userId, string email, string role = "user")
    {
        var token = CreateToken(userId, email, role);
        var client = CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        return client;
    }

    public string CreateToken(Guid userId, string email, string role = "user")
    {
        return _jwtIssuer.CreateToken(userId, email, role, _issuer, _audience);
    }

    public async Task ResetDatabaseAsync()
    {
        using var scope = Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<MizanDbContext>();
        var tableList = string.Join(", ", TablesToTruncate.Select(t => $"\"{t}\""));
        await db.Database.ExecuteSqlRawAsync($"TRUNCATE TABLE {tableList} RESTART IDENTITY CASCADE;");
    }

    public async Task<User> SeedUserAsync(Guid id, string email, bool emailVerified = true, string role = "user", bool banned = false, DateTime? banExpires = null)
    {
        using var scope = Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<MizanDbContext>();

        var now = DateTime.UtcNow;
        var user = new User
        {
            Id = id,
            Email = email,
            EmailVerified = emailVerified,
            Name = "Test User",
            Role = role,
            Banned = banned,
            BanExpires = banExpires,
            CreatedAt = now,
            UpdatedAt = now
        };

        db.Users.Add(user);
        await db.SaveChangesAsync();
        return user;
    }

    public async Task<Food> SeedFoodAsync(string name, decimal caloriesPer100g, decimal proteinPer100g, decimal carbsPer100g, decimal fatPer100g)
    {
        using var scope = Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<MizanDbContext>();

        var now = DateTime.UtcNow;
        var food = new Food
        {
            Id = Guid.NewGuid(),
            Name = name,
            CaloriesPer100g = caloriesPer100g,
            ProteinPer100g = proteinPer100g,
            CarbsPer100g = carbsPer100g,
            FatPer100g = fatPer100g,
            ServingSize = 100,
            ServingUnit = "g",
            IsVerified = true,
            CreatedAt = now,
            UpdatedAt = now
        };

        db.Foods.Add(food);
        await db.SaveChangesAsync();
        return food;
    }

    public async Task<McpUsageLog> SeedMcpUsageLogAsync(Guid tokenId, Guid userId, string toolName, bool success, int executionTimeMs)
    {
        using var scope = Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<MizanDbContext>();

        var log = new McpUsageLog
        {
            Id = Guid.NewGuid(),
            McpTokenId = tokenId,
            UserId = userId,
            ToolName = toolName,
            Parameters = "{}",
            Success = success,
            ExecutionTimeMs = executionTimeMs,
            Timestamp = DateTime.UtcNow
        };

        db.McpUsageLogs.Add(log);
        await db.SaveChangesAsync();
        return log;
    }

    private async Task EnsureDatabaseAsync()
    {
        using var scope = Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<MizanDbContext>();

        try
        {
            await db.Database.MigrateAsync();
        }
        catch
        {
            await db.Database.EnsureCreatedAsync();
        }
    }

    private static string GetRequiredEnvironment(string name)
    {
        var value = Environment.GetEnvironmentVariable(name);
        if (string.IsNullOrWhiteSpace(value))
        {
            throw new InvalidOperationException($"{name} is required for integration tests.");
        }

        return value;
    }
}

public sealed class TestJwksProvider : IJwksProvider
{
    private readonly IReadOnlyCollection<SecurityKey> _keys;

    public TestJwksProvider(JsonWebKey jwk)
    {
        _keys = new[] { jwk };
    }

    public Task<IReadOnlyCollection<SecurityKey>> GetSigningKeysAsync(CancellationToken cancellationToken = default)
    {
        return Task.FromResult(_keys);
    }
}

public sealed class TestJwtIssuer : IDisposable
{
    private readonly Key _key;
    private readonly JsonWebKey _jwk;

    private TestJwtIssuer(Key key, JsonWebKey jwk)
    {
        _key = key;
        _jwk = jwk;
    }

    public JsonWebKey Jwk => _jwk;

    public static TestJwtIssuer Create()
    {
        var key = Key.Create(SignatureAlgorithm.Ed25519, new KeyCreationParameters
        {
            ExportPolicy = KeyExportPolicies.AllowPlaintextExport
        });

        var publicKey = key.Export(KeyBlobFormat.RawPublicKey);
        var jwk = new JsonWebKey
        {
            Kty = "OKP",
            Crv = "Ed25519",
            Alg = "EdDSA",
            Use = "sig",
            Kid = Guid.NewGuid().ToString("N"),
            X = Base64UrlEncoder.Encode(publicKey)
        };

        return new TestJwtIssuer(key, jwk);
    }

    public string CreateToken(Guid userId, string email, string role, string issuer, string audience)
    {
        var now = DateTimeOffset.UtcNow;
        var header = new Dictionary<string, object>
        {
            ["alg"] = "EdDSA",
            ["typ"] = "JWT",
            ["kid"] = _jwk.Kid!
        };

        var payload = new Dictionary<string, object?>
        {
            ["sub"] = userId.ToString(),
            ["email"] = email,
            ["role"] = role,
            ["iss"] = issuer,
            ["aud"] = audience,
            ["iat"] = now.ToUnixTimeSeconds(),
            ["exp"] = now.AddHours(1).ToUnixTimeSeconds()
        };

        var headerJson = JsonSerializer.Serialize(header);
        var payloadJson = JsonSerializer.Serialize(payload);

        var headerB64 = Base64UrlEncoder.Encode(Encoding.UTF8.GetBytes(headerJson));
        var payloadB64 = Base64UrlEncoder.Encode(Encoding.UTF8.GetBytes(payloadJson));
        var signingInput = $"{headerB64}.{payloadB64}";

        var signature = SignatureAlgorithm.Ed25519.Sign(_key, Encoding.ASCII.GetBytes(signingInput));
        var signatureB64 = Base64UrlEncoder.Encode(signature);

        return $"{signingInput}.{signatureB64}";
    }

    public void Dispose()
    {
        _key.Dispose();
    }
}
