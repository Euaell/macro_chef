using FluentAssertions;
using Microsoft.IdentityModel.Tokens;
using Moq;
using Xunit;

namespace Mizan.Tests.Unit;

public class EdDsaJwtSignatureValidatorTests
{
    private static readonly JwtSecurityTokenHandler TokenHandler = new();

    public static object[][] ValidJwtData => new[]
    {
        new object[] { "valid-token", CreateTestToken(), true },
        new object[] { "expired-token", CreateExpiredToken(), false },
        new object[] { "wrong-alg-token", CreateWrongAlgToken(), false }
    };

    private static string CreateTestToken()
    {
        var header = Base64UrlEncoder.Encode("{\"alg\":\"EdDSA\",\"typ\":\"JWT\",\"kid\":\"test-key\"}");
        var payload = Base64UrlEncoder.Encode("{\"sub\":\"user123\",\"email\":\"test@example.com\",\"role\":\"user\",\"iss\":\"http://localhost:3000\",\"aud\":\"mizan-api\",\"exp\":" + (DateTimeOffset.UtcNow.AddHours(1).ToUnixTimeSeconds()) + "}");
        var signature = Base64UrlEncoder.Encode("test-signature-256-chars");
        return $"{header}.{payload}.{signature}";
    }

    private static string CreateExpiredToken()
    {
        var header = Base64UrlEncoder.Encode("{\"alg\":\"EdDSA\",\"typ\":\"JWT\",\"kid\":\"test-key\"}");
        var payload = Base64UrlEncoder.Encode("{\"sub\":\"user123\",\"email\":\"test@example.com\",\"role\":\"user\",\"iss\":\"http://localhost:3000\",\"aud\":\"mizan-api\",\"exp\":" + (DateTimeOffset.UtcNow.AddHours(-1).ToUnixTimeSeconds()) + "}");
        var signature = Base64UrlEncoder.Encode("test-signature-256-chars");
        return $"{header}.{payload}.{signature}";
    }

    private static string CreateWrongAlgToken()
    {
        var header = Base64UrlEncoder.Encode("{\"alg\":\"HS256\",\"typ\":\"JWT\",\"kid\":\"test-key\"}");
        var payload = Base64UrlEncoder.Encode("{\"sub\":\"user123\",\"email\":\"test@example.com\",\"role\":\"user\",\"iss\":\"http://localhost:3000\",\"aud\":\"mizan-api\",\"exp\":" + (DateTimeOffset.UtcNow.AddHours(1).ToUnixTimeSeconds()) + "}");
        var signature = Base64UrlEncoder.Encode("test-signature-256-chars");
        return $"{header}.{payload}.{signature}";
    }

    [Theory]
    [MemberData(nameof(ValidJwtData))]
    public void Validate_ExpectedBehavior(string testCase, string token, bool shouldSucceed)
    {
        var mockProvider = new Mock<IJwksProvider>();
        var jwk = new JsonWebKey
        {
            Kty = "OKP",
            Crv = "Ed25519",
            Alg = "EdDSA",
            Kid = "test-key",
            X = "mock-x-coordinate"
        };

        mockProvider
            .Setup(p => p.GetSigningKeysAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<SecurityKey> { jwk });

        var parameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = "http://localhost:3000",
            ValidateAudience = true,
            ValidAudience = "mizan-api",
            RequireSignedTokens = true
        };

        if (shouldSucceed)
        {
            var result = EdDsaJwtSignatureValidator.Validate(token, parameters);
            result.Should().NotBeNull();
        }
        else
        {
            Action act = () => EdDsaJwtSignatureValidator.Validate(token, parameters);
            act.Should().Throw<SecurityTokenInvalidSignatureException>();
        }

        mockProvider.Verify(p => p.GetSigningKeysAsync(It.IsAny<CancellationToken>()), Times.Once());
    }

    [Fact]
    public void Validate_Throws_WhenProviderIsNull()
    {
        var parameters = new TokenValidationParameters();
        Action act = () => EdDsaJwtSignatureValidator.Validate("test-token", parameters);
        act.Should().Throw<SecurityTokenInvalidSignatureException>()
            .WithMessage("JWKS provider not configured.");
    }

    [Fact]
    public void Validate_SkipsJwksLookup_WhenKidIsPresent()
    {
        var tokenWithoutKid = CreateTestToken().Replace("\"kid\":\"test-key\"", "\"kid\":\"\"");
        var mockProvider = new Mock<IJwksProvider>();
        var jwk = new JsonWebKey
        {
            Kty = "OKP",
            Crv = "Ed25519",
            Alg = "EdDSA",
            Kid = "some-other-key",
            X = "mock-x-coordinate"
        };

        mockProvider
            .Setup(p => p.GetSigningKeysAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<SecurityKey> { jwk });

        var parameters = new TokenValidationParameters();
        var result = EdDsaJwtSignatureValidator.Validate(tokenWithoutKid, parameters);
        
        result.Should().BeNull();
        mockProvider.Verify(p => p.GetSigningKeysAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public void IsEd25519Key_ReturnsTrue_ForValidKey()
    {
        var validJwk = new JsonWebKey
        {
            Kty = "OKP",
            Crv = "Ed25519",
            Alg = "EdDSA",
            Kid = "test-key",
            X = Base64UrlEncoder.Encode("mock-x-coordinate")
        };

        var result = EdDsaJwtSignatureValidator.IsEd25519Key(validJwk);
        result.Should().BeTrue();
    }

    [Fact]
    public void IsEd25519Key_ReturnsFalse_ForWrongKeyType()
    {
        var invalidJwk = new JsonWebKey
        {
            Kty = "RSA",
            Alg = "RS256",
            Kid = "test-key"
        };

        var result = EdDsaJwtSignatureValidator.IsEd25519Key(invalidJwk);
        result.Should().BeFalse();
    }

    [Fact]
    public void IsEd25519Key_ReturnsFalse_ForMissingCrv()
    {
        var invalidJwk = new JsonWebKey
        {
            Kty = "OKP",
            Alg = "EdDSA",
            Kid = "test-key",
            X = Base64UrlEncoder.Encode("mock-x-coordinate")
        };

        var result = EdDsaJwtSignatureValidator.IsEd25519Key(invalidJwk);
        result.Should().BeFalse();
    }

    [Fact]
    public void IsEd25519Key_ReturnsFalse_ForMissingAlg()
    {
        var invalidJwk = new JsonWebKey
        {
            Kty = "OKP",
            Kid = "test-key",
            X = Base64UrlEncoder.Encode("mock-x-coordinate")
        };

        var result = EdDsaJwtSignatureValidator.IsEd25519Key(invalidJwk);
        result.Should().BeFalse();
    }

    [Fact]
    public void IsEd25519Key_ReturnsFalse_ForWrongAlg()
    {
        var invalidJwk = new JsonWebKey
        {
            Kty = "OKP",
            Crv = "Ed25519",
            Kid = "test-key",
            X = Base64UrlEncoder.Encode("mock-x-coordinate"),
            Alg = "ES256"
        };

        var result = EdDsaJwtSignatureValidator.IsEd25519Key(invalidJwk);
        result.Should().BeFalse();
    }
}
