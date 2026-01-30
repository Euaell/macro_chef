extern alias McpServer;
using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using McpServer::Mizan.Mcp.Server.Models;
using McpServer::Mizan.Mcp.Server.Services;
using Xunit;

namespace Mizan.Tests.Integration;

public class McpSystemTests : IClassFixture<ApiTestFixture>, IClassFixture<WebApplicationFactory<McpServer::Program>>
{
    private readonly ApiTestFixture _apiFixture;
    private readonly WebApplicationFactory<McpServer::Program> _mcpFactory;

    public McpSystemTests(ApiTestFixture apiFixture, WebApplicationFactory<McpServer::Program> mcpFactory)
    {
        _apiFixture = apiFixture;
        _mcpFactory = mcpFactory;
    }

    [Fact]
    public async Task CompleteSystemFlow_CreateToken_UseMcpTool_ReturnsData()
    {
        // 1. Setup Backend Data
        await _apiFixture.ResetDatabaseAsync();
        var userId = Guid.NewGuid();
        var email = $"system-mcp-{userId:N}@example.com";
        await _apiFixture.SeedUserAsync(userId, email);
        
        using var apiClient = _apiFixture.CreateAuthenticatedClient(userId, email);

        // 2. Create MCP Token via Main API
        var createResponse = await apiClient.PostAsJsonAsync("/api/McpTokens", new { Name = "system-test" });
        createResponse.EnsureSuccessStatusCode();
        var created = await createResponse.Content.ReadFromJsonAsync<CreateMcpTokenResponse>();
        var mcpToken = created!.PlaintextToken;

        // 3. Configure MCP Server to talk to In-Memory Main API
        var mcpClient = _mcpFactory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureAppConfiguration((ctx, config) =>
            {
                config.AddInMemoryCollection(new Dictionary<string, string?>
                {
                    { "MizanApiUrl", "http://localhost:5000" }, 
                    { "ServiceApiKey", "test-api-key" } // Matches ApiTestFixture's key
                });
            });

            builder.ConfigureTestServices(services =>
            {
                // CRITICAL: We must override the HttpClient named "BackendClient" specifically.
                // We create a custom handler that delegates to the API Fixture's handler.
                // This allows the MCP server to make HTTP calls that are intercepted by the in-memory API server.
                
                services.AddHttpClient("BackendClient", client => 
                {
                    client.BaseAddress = new Uri("http://localhost:5000"); // Must match TestJwtIssuer audience/issuer logic if checked
                })
                .ConfigurePrimaryHttpMessageHandler(() => _apiFixture.Server.CreateHandler());
                
                // Also override the implementation to ensure it picks up the right client configuration
                // though the constructor injection should work if the named client is registered correctly.
            });
        }).CreateClient();

        // 4. Execute MCP Tool Call
        mcpClient.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", mcpToken);

        var request = new JsonRpcRequest
        {
            Method = "tools/call",
            Params = System.Text.Json.JsonSerializer.SerializeToElement(new
            {
                name = "list_ingredients",
                arguments = new { search = "test" }
            }),
            Id = 1
        };

        var response = await mcpClient.PostAsJsonAsync("/mcp/messages?sessionId=sys", request);

        // Debug output if fails
        if (response.StatusCode != HttpStatusCode.OK)
        {
            var error = await response.Content.ReadAsStringAsync();
            throw new Exception($"MCP Call Failed: {response.StatusCode} - {error}");
        }

        // 5. Verify Response
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var jsonResponse = await response.Content.ReadFromJsonAsync<JsonRpcResponse>();
        
        jsonResponse.Should().NotBeNull();
        jsonResponse!.Error.Should().BeNull();
        jsonResponse.Result.Should().NotBeNull();
    }

    private sealed record CreateMcpTokenResponse(Guid Id, string PlaintextToken, string Name);
}
