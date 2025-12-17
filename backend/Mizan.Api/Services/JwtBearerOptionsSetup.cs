using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace Mizan.Api.Services;

/// <summary>
/// Configures JwtBearer options with JWKS caching
/// </summary>
public class JwtBearerOptionsSetup : IConfigureNamedOptions<JwtBearerOptions>
{
    private readonly IJwksCache _jwksCache;
    private readonly IConfiguration _configuration;
    private readonly ILogger<JwtBearerOptionsSetup> _logger;

    public JwtBearerOptionsSetup(
        IJwksCache jwksCache,
        IConfiguration configuration,
        ILogger<JwtBearerOptionsSetup> logger)
    {
        _jwksCache = jwksCache;
        _configuration = configuration;
        _logger = logger;
    }

    public void Configure(string? name, JwtBearerOptions options)
    {
        if (name != JwtBearerDefaults.AuthenticationScheme)
            return;

        Configure(options);
    }

    public void Configure(JwtBearerOptions options)
    {
        var betterAuthUrl = _configuration["BetterAuth:JwksUrl"]
            ?? _configuration["BETTERAUTH_JWKS_URL"]
            ?? "http://localhost:3000/api/auth/jwks";

        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = _configuration["BetterAuth:Issuer"] ?? "http://localhost:3000",
            ValidateAudience = true,
            ValidAudience = _configuration["BetterAuth:Audience"] ?? "mizan-api",
            ValidateIssuerSigningKey = true,
            ValidateLifetime = true,
            ClockSkew = TimeSpan.FromMinutes(5),
            IssuerSigningKeyResolver = (token, securityToken, kid, parameters) =>
            {
                try
                {
                    // Use the JWKS cache service (with Redis + in-memory fallback)
                    var keys = _jwksCache.GetSigningKeysAsync(betterAuthUrl).GetAwaiter().GetResult();

                    _logger.LogDebug("Successfully retrieved {Count} signing keys from JWKS cache", keys.Count);
                    return keys;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to fetch JWKS from {Url}", betterAuthUrl);
                    return Array.Empty<SecurityKey>();
                }
            }
        };

        // Handle SignalR token from query string
        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                var accessToken = context.Request.Query["access_token"];
                var path = context.HttpContext.Request.Path;

                if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/hubs"))
                {
                    context.Token = accessToken;
                }

                return Task.CompletedTask;
            },
            OnAuthenticationFailed = context =>
            {
                _logger.LogError(context.Exception, "Authentication failed: {Error}", context.Exception.Message);
                return Task.CompletedTask;
            },
            OnTokenValidated = context =>
            {
                _logger.LogInformation("Token validated successfully for user");
                return Task.CompletedTask;
            }
        };
    }
}
