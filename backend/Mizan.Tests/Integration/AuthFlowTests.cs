using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using Xunit;

namespace Mizan.Tests.Integration;

[Collection("ApiIntegration")]
public class AuthFlowTests
{
    private readonly ApiTestFixture _fixture;

    public AuthFlowTests(ApiTestFixture fixture)
    {
        _fixture = fixture;
    }

    [Fact]
    public async Task GetMe_ReturnsUser_WhenTokenValid()
    {
        await _fixture.ResetDatabaseAsync();

        var userId = Guid.NewGuid();
        var email = $"user-{userId:N}@example.com";
        await _fixture.SeedUserAsync(userId, email, emailVerified: true);

        using var client = _fixture.CreateAuthenticatedClient(userId, email);
        var response = await client.GetAsync("/api/Users/me");

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var user = await response.Content.ReadFromJsonAsync<UserResponse>();
        user.Should().NotBeNull();
        user!.Id.Should().Be(userId);
        user.Email.Should().Be(email);
    }

    [Fact]
    public async Task GetMe_ReturnsUnauthorized_WhenUserMissing()
    {
        await _fixture.ResetDatabaseAsync();

        var userId = Guid.NewGuid();
        var email = $"missing-{userId:N}@example.com";

        using var client = _fixture.CreateAuthenticatedClient(userId, email);
        var response = await client.GetAsync("/api/Users/me");

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task GetMe_ReturnsUnauthorized_WhenEmailNotVerified()
    {
        await _fixture.ResetDatabaseAsync();

        var userId = Guid.NewGuid();
        var email = $"unverified-{userId:N}@example.com";
        await _fixture.SeedUserAsync(userId, email, emailVerified: false);

        using var client = _fixture.CreateAuthenticatedClient(userId, email);
        var response = await client.GetAsync("/api/Users/me");

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task GetMe_ReturnsUnauthorized_WhenUserBanned()
    {
        await _fixture.ResetDatabaseAsync();

        var userId = Guid.NewGuid();
        var email = $"banned-{userId:N}@example.com";
        await _fixture.SeedUserAsync(userId, email, emailVerified: true, banned: true);

        using var client = _fixture.CreateAuthenticatedClient(userId, email);
        var response = await client.GetAsync("/api/Users/me");

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task GetMe_ReturnsUnauthorized_WhenSignatureInvalid()
    {
        await _fixture.ResetDatabaseAsync();

        var userId = Guid.NewGuid();
        var email = $"invalidsig-{userId:N}@example.com";
        await _fixture.SeedUserAsync(userId, email, emailVerified: true);

        using var issuer = TestJwtIssuer.Create();
        var token = issuer.CreateToken(userId, email, "user", _fixture.Issuer, _fixture.Audience);
        using var client = _fixture.CreateClient();
        client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

        var response = await client.GetAsync("/api/Users/me");

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    private sealed record UserResponse(Guid Id, string Email);
}
