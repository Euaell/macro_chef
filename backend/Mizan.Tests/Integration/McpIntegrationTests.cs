extern alias McpServer;
using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;
using Mizan.Application.Commands;
using Mizan.Domain.Entities; // Added for Food, Recipe
using Xunit;

namespace Mizan.Tests.Integration;

[Collection("ApiIntegration")]
public class McpIntegrationTests : IClassFixture<WebApplicationFactory<McpServer::Program>>, IAsyncLifetime
{
    private readonly WebApplicationFactory<McpServer::Program> _mcpFactory;
    private readonly HttpClient _mcpClient;
    private readonly ApiTestFixture _apiFixture;

    public McpIntegrationTests(WebApplicationFactory<McpServer::Program> mcpFactory, ApiTestFixture apiFixture)
    {
        _mcpFactory = mcpFactory;
        _apiFixture = apiFixture;
        
        // Configure MCP server to use the API fixture's client for backend calls
        _mcpFactory = mcpFactory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureTestServices(services =>
            {
                // Override the HttpClient for BackendClient to point to our in-memory API
                services.AddHttpClient<McpServer::Mizan.Mcp.Server.Services.IBackendClient, McpServer::Mizan.Mcp.Server.Services.BackendClient>()
                    .ConfigurePrimaryHttpMessageHandler(() => _apiFixture.Server.CreateHandler());
            });
        });

        _mcpClient = _mcpFactory.CreateClient();
    }

    public async Task InitializeAsync()
    {
        await _apiFixture.ResetDatabaseAsync();
    }

    public Task DisposeAsync()
    {
        return Task.CompletedTask;
    }

    #region SSE Connection Tests

    [Fact]
    public async Task SSE_Connects_Successfully_WithValidToken()
    {
        var userId = Guid.NewGuid();
        await _apiFixture.SeedUserAsync(userId, "sse@example.com", emailVerified: true);
        var token = await CreateMcpTokenAsync(userId);

        var response = await _mcpClient.GetAsync($"/mcp/sse?token={token}");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        response.Content.Headers.Should().ContainKey("Content-Type", "text/event-stream");
    }

    [Fact]
    public async Task SSE_Connects_WithApiKeyHeader()
    {
        await _apiFixture.ResetDatabaseAsync();
        var userId = Guid.NewGuid();
        await _apiFixture.SeedUserAsync(userId, "sse-apikey@example.com", emailVerified: true);

        _mcpClient.DefaultRequestHeaders.Clear();
        _mcpClient.DefaultRequestHeaders.Add("X-Api-Key", "test-api-key");

        var response = await _mcpClient.GetAsync("/mcp/sse");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        response.Content.Headers.Should().ContainKey("Content-Type", "text/event-stream");
    }

    [Fact]
    public async Task SSE_RejectsConnection_WithoutToken()
    {
        var response = await _mcpClient.GetAsync("/mcp/sse");

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task SSE_RejectsConnection_WithInvalidToken()
    {
        var response = await _mcpClient.GetAsync("/mcp/sse?token=invalid-token");

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    #endregion

    #region MCP Protocol Tests

    [Fact]
    public async Task Initialize_ReturnsCorrectProtocolVersionAndCapabilities()
    {
        var userId = Guid.NewGuid();
        var token = await CreateMcpTokenAsync(userId);

        _mcpClient.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

        var request = new
        {
            jsonrpc = "2.0",
            id = 1,
            method = "initialize",
            @params = (object?)null
        };

        var response = await _mcpClient.PostAsJsonAsync("/mcp/messages?sessionId=test", request);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var jsonResponse = await response.Content.ReadFromJsonAsync<JsonRpcResponse>();
        jsonResponse.Should().NotBeNull();
        jsonResponse!.Result.Should().NotBeNull();

        var result = System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, object>>(jsonResponse.Result.ToString());
        result.Should().ContainKey("protocolVersion");
        result.Should().ContainKey("capabilities");
        result.Should().ContainKey("serverInfo");
    }

    [Fact]
    public async Task ToolsList_ReturnsAllAvailableTools()
    {
        var userId = Guid.NewGuid();
        var token = await CreateMcpTokenAsync(userId);

        _mcpClient.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

        var request = new
        {
            jsonrpc = "2.0",
            id = 1,
            method = "tools/list",
            @params = (object?)null
        };

        var response = await _mcpClient.PostAsJsonAsync("/mcp/messages?sessionId=test", request);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var jsonResponse = await response.Content.ReadFromJsonAsync<JsonRpcResponse>();
        var toolsList = System.Text.Json.JsonSerializer.Deserialize<List<Dictionary<string, object>>>(jsonResponse.Result.ToString());
        toolsList.Should().NotBeNull();
        toolsList.Should().HaveCount(7);

        var toolNames = toolsList.Select(t => t["name"].ToString()).ToList();
        toolNames.Should().Contain(new[]
        {
            "list_ingredients", "add_ingredient", "get_shopping_list",
            "get_nutrition_tracking", "list_recipes", "add_recipe", "log_meal"
        });
    }

    #endregion

    #region list_ingredients Tool Tests

    [Fact]
    public async Task ListIngredients_SearchesByName()
    {
        var userId = Guid.NewGuid();
        await _apiFixture.SeedUserAsync(userId, "search@example.com", emailVerified: true);
        var token = await CreateMcpTokenAsync(userId);

        await _apiFixture.SeedFoodAsync("Chicken Breast", 165, 31, 3.6m, 0.5m);
        await _apiFixture.SeedFoodAsync("Beef", 250, 26, 15, 20m);
        await _apiFixture.SeedFoodAsync("Salmon", 208, 20, 12, 13m);

        _mcpClient.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

        var args = new
        {
            search = "Chicken",
            limit = 10,
            sortBy = "name",
            sortOrder = "asc"
        };

        var request = CreateJsonRpcCallRequest("tools/call", "list_ingredients", args);

        var response = await _mcpClient.PostAsJsonAsync("/mcp/messages?sessionId=test", request);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var jsonResponse = await response.Content.ReadFromJsonAsync<JsonRpcResponse>();
        var result = System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, object>>(jsonResponse.Result.ToString());
        result.Should().ContainKey("content");
    }

    [Fact]
    public async Task ListIngredients_RespectsLimitParameter()
    {
        var userId = Guid.NewGuid();
        await _apiFixture.SeedUserAsync(userId, "limit@example.com", emailVerified: true);
        var token = await CreateMcpTokenAsync(userId);

        for (int i = 0; i < 5; i++)
        {
            await _apiFixture.SeedFoodAsync($"Food{i}", 100, 20, 5, 10m);
        }

        _mcpClient.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

        var args = new
        {
            search = "Food",
            limit = 3
        };

        var request = CreateJsonRpcCallRequest("tools/call", "list_ingredients", args);

        var response = await _mcpClient.PostAsJsonAsync("/mcp/messages?sessionId=test", request);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var jsonResponse = await response.Content.ReadFromJsonAsync<JsonRpcResponse>();
        var result = System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, object>>(jsonResponse.Result.ToString());
        result.Should().ContainKey("content");

        var items = System.Text.Json.JsonSerializer.Deserialize<List<Dictionary<string, object>>>(result["content"].ToString());
        items.Should().HaveCount(3);
    }

    [Fact]
    public async Task ListIngredients_SupportsSorting()
    {
        var userId = Guid.NewGuid();
        await _apiFixture.SeedUserAsync(userId, "sort@example.com", emailVerified: true);
        var token = await CreateMcpTokenAsync(userId);

        await _apiFixture.SeedFoodAsync("Apple", 52, 0.3m, 14, 0.2m);
        await _apiFixture.SeedFoodAsync("Banana", 89, 1.1m, 23, 0.3m);

        _mcpClient.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

        var args = new
        {
            limit = 10,
            sortBy = "caloriesPer100g",
            sortOrder = "desc"
        };

        var request = CreateJsonRpcCallRequest("tools/call", "list_ingredients", args);

        var response = await _mcpClient.PostAsJsonAsync("/mcp/messages?sessionId=test", request);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var jsonResponse = await response.Content.ReadFromJsonAsync<JsonRpcResponse>();
        var result = System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, object>>(jsonResponse.Result.ToString());
        result.Should().ContainKey("content");

        var items = System.Text.Json.JsonSerializer.Deserialize<List<Dictionary<string, object>>>(result["content"].ToString());
        items.Should().NotBeNull();
        items.First()["name"].ToString().Should().Be("Banana");
        items.Last()["name"].ToString().Should().Be("Apple");
    }

    [Fact]
    public async Task ListIngredients_FiltersByCaloriesRange()
    {
        var userId = Guid.NewGuid();
        await _apiFixture.SeedUserAsync(userId, "filter@example.com", emailVerified: true);
        var token = await CreateMcpTokenAsync(userId);

        await _apiFixture.SeedFoodAsync("Vegetables", 50, 1, 10, 0.5m);
        await _apiFixture.SeedFoodAsync("Fruits", 80, 1, 20, 0m);
        await _apiFixture.SeedFoodAsync("Meats", 200, 20, 15, 10m);

        _mcpClient.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

        var args = new
        {
            minCaloriesPer100g = 0m,
            maxCaloriesPer100g = 150m
        };

        var request = CreateJsonRpcCallRequest("tools/call", "list_ingredients", args);

        var response = await _mcpClient.PostAsJsonAsync("/mcp/messages?sessionId=test", request);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var jsonResponse = await response.Content.ReadFromJsonAsync<JsonRpcResponse>();
        var result = System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, object>>(jsonResponse.Result.ToString());
        result.Should().ContainKey("content");

        var items = System.Text.Json.JsonSerializer.Deserialize<List<Dictionary<string, object>>>(result["content"].ToString());
        items.Should().OnlyContain(i => i["name"].ToString() == "Vegetables" || i["name"].ToString() == "Fruits");
    }

    [Fact]
    public async Task ListIngredients_ReturnsEmpty_WhenNoFoodsMatch()
    {
        var userId = Guid.NewGuid();
        await _apiFixture.SeedUserAsync(userId, "empty@example.com", emailVerified: true);
        var token = await CreateMcpTokenAsync(userId);

        _mcpClient.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

        var args = new
        {
            search = "NonExistentFood",
            limit = 10
        };

        var request = CreateJsonRpcCallRequest("tools/call", "list_ingredients", args);

        var response = await _mcpClient.PostAsJsonAsync("/mcp/messages?sessionId=test", request);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var jsonResponse = await response.Content.ReadFromJsonAsync<JsonRpcResponse>();
        var result = System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, object>>(jsonResponse.Result.ToString());
        result.Should().ContainKey("content");

        var items = System.Text.Json.JsonSerializer.Deserialize<List<object>>(result["content"].ToString());
        items.Should().BeEmpty();
    }

    #endregion

    #region add_ingredient Tool Tests

    [Fact]
    public async Task AddIngredient_RejectsUnauthorized_ForNonAdmin()
    {
        var userId = Guid.NewGuid();
        await _apiFixture.SeedUserAsync(userId, "user@example.com", emailVerified: true, role: "user");
        var token = await CreateMcpTokenAsync(userId);

        _mcpClient.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

        var args = new
        {
            name = "Test Ingredient",
            brand = "Test Brand",
            caloriesPer100g = 100,
            proteinPer100g = 25,
            carbsPer100g = 50,
            fatPer100g = 10,
            servingSize = 100,
            servingUnit = "g",
            verified = false
        };

        var request = CreateJsonRpcCallRequest("tools/call", "add_ingredient", args);

        var response = await _mcpClient.PostAsJsonAsync("/mcp/messages?sessionId=test", request);

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
        var jsonResponse = await response.Content.ReadFromJsonAsync<JsonRpcResponse>();
        var error = jsonResponse.Error;
        error.Should().NotBeNull();
        error.Code.Should().Be(-32002);
    }

    [Fact]
    public async Task AddIngredient_CreatesIngredient_ForAdmin()
    {
        var userId = Guid.NewGuid();
        await _apiFixture.SeedUserAsync(userId, "admin@example.com", emailVerified: true, role: "admin");
        var token = await CreateMcpTokenAsync(userId);

        _mcpClient.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

        var args = new
        {
            name = "New Admin Ingredient",
            brand = "Admin Brand",
            caloriesPer100g = 200,
            proteinPer100g = 30,
            carbsPer100g = 60,
            fatPer100g = 12,
            servingSize = 100,
            servingUnit = "g",
            verified = true
        };

        var request = CreateJsonRpcCallRequest("tools/call", "add_ingredient", args);

        var response = await _mcpClient.PostAsJsonAsync("/mcp/messages?sessionId=test", request);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var jsonResponse = await response.Content.ReadFromJsonAsync<JsonRpcResponse>();
        var result = System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, object>>(jsonResponse.Result.ToString());
        result.Should().ContainKey("content");
        result.Should().ContainKey("success");
        result["success"].ToString().Should().Be("true");

        await _apiFixture.ResetDatabaseAsync();
        var foods = await _apiFixture.GetFoodsByUserId(userId);
        foods.Should().Contain(f => f.Name == "New Admin Ingredient");
    }

    [Fact]
    public async Task AddIngredient_ValidatesRequiredFields()
    {
        var userId = Guid.NewGuid();
        await _apiFixture.SeedUserAsync(userId, "validation@example.com", emailVerified: true, role: "admin");
        var token = await CreateMcpTokenAsync(userId);

        _mcpClient.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

        var args = new
        {
            caloriesPer100g = 100,
            proteinPer100g = 25
        };

        var request = CreateJsonRpcCallRequest("tools/call", "add_ingredient", args);

        var response = await _mcpClient.PostAsJsonAsync("/mcp/messages?sessionId=test", request);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var jsonResponse = await response.Content.ReadFromJsonAsync<JsonRpcResponse>();
        var error = jsonResponse.Error;
        error.Should().NotBeNull();
        error.Code.Should().Be(-32602);
        error.Message.Should().Contain("required");
    }

    [Fact]
    public async Task AddIngredient_ValidatesNutrientValues()
    {
        var userId = Guid.NewGuid();
        await _apiFixture.SeedUserAsync(userId, "validation-nutrient@example.com", emailVerified: true, role: "admin");
        var token = await CreateMcpTokenAsync(userId);

        _mcpClient.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

        var args = new
        {
            name = "Valid Ingredient",
            caloriesPer100g = -100,
            proteinPer100g = 25
        };

        var request = CreateJsonRpcCallRequest("tools/call", "add_ingredient", args);

        var response = await _mcpClient.PostAsJsonAsync("/mcp/messages?sessionId=test", request);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var jsonResponse = await response.Content.ReadFromJsonAsync<JsonRpcResponse>();
        var error = jsonResponse.Error;
        error.Should().NotBeNull();
        error.Code.Should().Be(-32602);
    }

    #endregion

    #region get_shopping_list Tool Tests

    [Fact]
    public async Task GetShoppingList_ReturnsUsersLists()
    {
        var userId = Guid.NewGuid();
        await _apiFixture.SeedUserAsync(userId, "shop@example.com", emailVerified: true);
        var token = await CreateMcpTokenAsync(userId);

        var listId1 = await _apiFixture.SeedShoppingListAsync(userId, "Weekly Groceries");
        var listId2 = await _apiFixture.SeedShoppingListAsync(userId, "Meal Plan");

        _mcpClient.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

        var request = CreateJsonRpcCallRequest("tools/call", "get_shopping_list", null);

        var response = await _mcpClient.PostAsJsonAsync("/mcp/messages?sessionId=test", request);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var jsonResponse = await response.Content.ReadFromJsonAsync<JsonRpcResponse>();
        var result = System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, object>>(jsonResponse.Result.ToString());
        result.Should().ContainKey("content");
        result.Should().ContainKey("total");

        var lists = System.Text.Json.JsonSerializer.Deserialize<List<Dictionary<string, object>>>(result["content"].ToString());
        lists.Should().HaveCount(2);
    }

    [Fact]
    public async Task GetShoppingList_SupportsPagination()
    {
        var userId = Guid.NewGuid();
        await _apiFixture.SeedUserAsync(userId, "pagination@example.com", emailVerified: true);
        var token = await CreateMcpTokenAsync(userId);

        for (int i = 0; i < 10; i++)
        {
            await _apiFixture.SeedShoppingListAsync(userId, $"List {i}");
        }

        _mcpClient.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

        var args = new
        {
            page = 1,
            pageSize = 5
        };

        var request = CreateJsonRpcCallRequest("tools/call", "get_shopping_list", args);

        var response = await _mcpClient.PostAsJsonAsync("/mcp/messages?sessionId=test", request);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var jsonResponse = await response.Content.ReadFromJsonAsync<JsonRpcResponse>();
        var result = System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, object>>(jsonResponse.Result.ToString());
        result.Should().ContainKey("content");

        var lists = System.Text.Json.JsonSerializer.Deserialize<List<Dictionary<string, object>>>(result["content"].ToString());
        lists.Should().HaveCount(5);
    }

    [Fact]
    public async Task GetShoppingList_ReturnsEmpty_WhenNoListsExist()
    {
        var userId = Guid.NewGuid();
        await _apiFixture.SeedUserAsync(userId, "empty@example.com", emailVerified: true);
        var token = await CreateMcpTokenAsync(userId);

        _mcpClient.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

        var request = CreateJsonRpcCallRequest("tools/call", "get_shopping_list", null);

        var response = await _mcpClient.PostAsJsonAsync("/mcp/messages?sessionId=test", request);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var jsonResponse = await response.Content.ReadFromJsonAsync<JsonRpcResponse>();
        var result = System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, object>>(jsonResponse.Result.ToString());
        result.Should().ContainKey("content");

        var lists = System.Text.Json.JsonSerializer.Deserialize<List<object>>(result["content"].ToString());
        lists.Should().BeEmpty();
    }

    #endregion

    #region get_nutrition_tracking Tool Tests

    [Fact]
    public async Task GetNutritionTracking_ReturnsDailySummary()
    {
        var userId = Guid.NewGuid();
        await _apiFixture.SeedUserAsync(userId, "nutrition@example.com", emailVerified: true);
        var token = await CreateMcpTokenAsync(userId);

        var date = DateTime.UtcNow.ToString("yyyy-MM-dd");

        _mcpClient.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

        var args = new
        {
            date = date
        };

        var request = CreateJsonRpcCallRequest("tools/call", "get_nutrition_tracking", args);

        var response = await _mcpClient.PostAsJsonAsync("/mcp/messages?sessionId=test", request);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var jsonResponse = await response.Content.ReadFromJsonAsync<JsonRpcResponse>();
        var result = System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, object>>(jsonResponse.Result.ToString());
        result.Should().ContainKey("content");

        var summary = System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, object>>(result["content"].ToString());
        summary.Should().ContainKey("date");
        summary.Should().ContainKey("totalCalories");
        summary.Should().ContainKey("totalProtein");
        summary.Should().ContainKey("totalCarbs");
        summary.Should().ContainKey("totalFat");
    }

    [Fact]
    public async Task GetNutritionTracking_ReturnsSummary_ForSpecificDate()
    {
        var userId = Guid.NewGuid();
        await _apiFixture.SeedUserAsync(userId, "nutrition-date@example.com", emailVerified: true);
        var token = await CreateMcpTokenAsync(userId);

        var specificDate = DateTime.UtcNow.AddDays(-7).ToString("yyyy-MM-dd");

        _mcpClient.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

        var args = new
        {
            date = specificDate,
            startDate = specificDate,
            endDate = specificDate
        };

        var request = CreateJsonRpcCallRequest("tools/call", "get_nutrition_tracking", args);

        var response = await _mcpClient.PostAsJsonAsync("/mcp/messages?sessionId=test", request);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var jsonResponse = await response.Content.ReadFromJsonAsync<JsonRpcResponse>();
        var result = System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, object>>(jsonResponse.Result.ToString());
        result.Should().ContainKey("content");

        var summary = System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, object>>(result["content"].ToString());
        summary.Should().ContainKey("date");
    }

    [Fact]
    public async Task GetNutritionTracking_SupportsDateRange()
    {
        var userId = Guid.NewGuid();
        await _apiFixture.SeedUserAsync(userId, "nutrition-range@example.com", emailVerified: true);
        var token = await CreateMcpTokenAsync(userId);

        var startDate = DateTime.UtcNow.AddDays(-30).ToString("yyyy-MM-dd");
        var endDate = DateTime.UtcNow.ToString("yyyy-MM-dd");

        _mcpClient.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

        var args = new
        {
            startDate = startDate,
            endDate = endDate
        };

        var request = CreateJsonRpcCallRequest("tools/call", "get_nutrition_tracking", args);

        var response = await _mcpClient.PostAsJsonAsync("/mcp/messages?sessionId=test", request);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var jsonResponse = await response.Content.ReadFromJsonAsync<JsonRpcResponse>();
        var result = System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, object>>(jsonResponse.Result.ToString());
        result.Should().ContainKey("content");

        var summary = System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, object>>(result["content"].ToString());
        summary.Should().ContainKey("entries");
        summary["entries"].ToString().Should().NotBe("[]");
    }

    [Fact]
    public async Task GetNutritionTracking_ReturnsEmpty_WhenNoEntriesForRange()
    {
        var userId = Guid.NewGuid();
        await _apiFixture.SeedUserAsync(userId, "empty-range@example.com", emailVerified: true);
        var token = await CreateMcpTokenAsync(userId);

        var startDate = DateTime.UtcNow.AddDays(-30).ToString("yyyy-MM-dd");
        var endDate = DateTime.UtcNow.AddDays(-15).ToString("yyyy-MM-dd");

        _mcpClient.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

        var args = new
        {
            startDate = startDate,
            endDate = endDate
        };

        var request = CreateJsonRpcCallRequest("tools/call", "get_nutrition_tracking", args);

        var response = await _mcpClient.PostAsJsonAsync("/mcp/messages?sessionId=test", request);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var jsonResponse = await response.Content.ReadFromJsonAsync<JsonRpcResponse>();
        var result = System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, object>>(jsonResponse.Result.ToString());
        result.Should().ContainKey("content");

        var entries = System.Text.Json.JsonSerializer.Deserialize<object>(result["content"].ToString());
        entries.Should().BeNull();
    }

    #endregion

    #region list_recipes Tool Tests

    [Fact]
    public async Task ListRecipes_SearchesByName()
    {
        var userId = Guid.NewGuid();
        await _apiFixture.SeedUserAsync(userId, "recipe@example.com", emailVerified: true);
        var token = await CreateMcpTokenAsync(userId);

        await _apiFixture.SeedRecipeAsync(userId, "Chicken Soup", "Delicious chicken soup", 4, 60);
        await _apiFixture.SeedRecipeAsync(userId, "Beef Stew", "Hearty beef stew", 6, 90);

        _mcpClient.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

        var args = new
        {
            search = "Chicken"
        };

        var request = CreateJsonRpcCallRequest("tools/call", "list_recipes", args);

        var response = await _mcpClient.PostAsJsonAsync("/mcp/messages?sessionId=test", request);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var jsonResponse = await response.Content.ReadFromJsonAsync<JsonRpcResponse>();
        var result = System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, object>>(jsonResponse.Result.ToString());
        result.Should().ContainKey("content");

        var recipes = System.Text.Json.JsonSerializer.Deserialize<List<Dictionary<string, object>>>(result["content"].ToString());
        recipes.Should().HaveCount(2);
        recipes.Should().OnlyContain(r => r["title"].ToString().Contains("Chicken"));
    }

    [Fact]
    public async Task ListRecipes_RespectsLimitParameter()
    {
        var userId = Guid.NewGuid();
        await _apiFixture.SeedUserAsync(userId, "recipe-limit@example.com", emailVerified: true);
        var token = await CreateMcpTokenAsync(userId);

        for (int i = 0; i < 10; i++)
        {
            await _apiFixture.SeedRecipeAsync(userId, $"Recipe {i}", "Test recipe", 4, 30);
        }

        _mcpClient.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

        var args = new
        {
            limit = 3
        };

        var request = CreateJsonRpcCallRequest(" recipes", "list_recipes", args);

        var response = await _mcpClient.PostAsJsonAsync("/mcp/messages?sessionId=test", request);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var jsonResponse = await response.Content.ReadFromJsonAsync<JsonRpcResponse>();
        var result = System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, object>>(jsonResponse.Result.ToString());
        result.Should().ContainKey("content");

        var recipes = System.Text.Json.JsonSerializer.Deserialize<List<Dictionary<string, object>>>(result["content"].ToString());
        recipes.Should().HaveCount(3);
    }

    [Fact]
    public async Task ListRecipes_SupportsSorting()
    {
        var userId = Guid.NewGuid();
        await _apiFixture.SeedUserAsync(userId, "recipe-sort@example.com", emailVerified: true);
        var token = await CreateMcpTokenAsync(userId);

        await _apiFixture.SeedRecipeAsync(userId, "Pancakes", "Fluffy pancakes", 2, 20);
        await _apiFixture.SeedRecipeAsync(userId, "Waffles", "Crispy waffles", 1, 15);

        _mcpClient.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

        var args = new
        {
            sortBy = "prepTimeMinutes",
            sortOrder = "desc"
        };

        var request = CreateJsonRpcCallRequest("tools/call", "list_recipes", args);

        var response = await _mcpClient.PostAsJsonAsync("/mcp/messages?sessionId=test", request);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var jsonResponse = await response.Content.ReadFromJsonAsync<JsonRpcResponse>();
        var result = System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, object>>(jsonResponse.Result.ToString());
        result.Should().ContainKey("content");

        var recipes = System.Text.Json.JsonSerializer.Deserialize<List<Dictionary<string, object>>>(result["content"].ToString());
        recipes.Should().NotBeNull();
        recipes.First()["title"].ToString().Should().Be("Waffles");
    }

    [Fact]
    public async Task ListRecipes_ReturnsEmpty_WhenNoRecipesMatch()
    {
        var userId = Guid.NewGuid();
        await _apiFixture.SeedUserAsync(userId, "empty@example.com", emailVerified: true);
        var token = await CreateMcpTokenAsync(userId);

        _mcpClient.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

        var args = new
        {
            search = "NonExistentRecipe"
        };

        var request = CreateJsonRpcCallRequest("tools/call", "list_recipes", args);

        var response = await _mcpClient.PostAsJsonAsync("/mcp/messages?sessionId=test", request);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var jsonResponse = await response.Content.ReadFromJsonAsync<JsonRpcResponse>();
        var result = System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, object>>(jsonResponse.Result.ToString());
        result.Should().ContainKey("content");

        var recipes = System.Text.Json.JsonSerializer.Deserialize<List<object>>(result["content"].ToString());
        recipes.Should().BeEmpty();
    }

    #endregion

    #region add_recipe Tool Tests

    [Fact]
    public async Task AddRecipe_CreatesNewRecipe()
    {
        var userId = Guid.NewGuid();
        await _apiFixture.SeedUserAsync(userId, "add-recipe@example.com", emailVerified: true);
        var token = await CreateMcpTokenAsync(userId);

        _mcpClient.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

        var args = new
        {
            title = "New Recipe",
            description = "Test description",
            servings = 4,
            prepTimeMinutes = 30,
            cookTimeMinutes = 45,
            isPublic = false
        };

        var request = CreateJsonRpcCallRequest("tools/call", "add_recipe", args);

        var response = await _mcpClient.PostAsJsonAsync("/mcp/messages?sessionId=test", request);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var jsonResponse = await response.Content.ReadFromJsonAsync<JsonRpcResponse>();
        var result = System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, object>>(jsonResponse.Result.ToString());
        result.Should().ContainKey("content");
        result.Should().ContainKey("success");
        result["success"].ToString().Should().Be("true");

        await _apiFixture.ResetDatabaseAsync();
        var recipes = await _apiFixture.GetRecipesByUserId(userId);
        recipes.Should().Contain(r => r.Title == "New Recipe");
    }

    [Fact]
    public async Task AddRecipe_ValidatesRequiredFields()
    {
        var userId = Guid.NewGuid();
        await _apiFixture.SeedUserAsync(userId, "validation@example.com", emailVerified: true);
        var token = await CreateMcpTokenAsync(userId);

        _mcpClient.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

        var args = new
        {
            servings = 4
        };

        var request = CreateJsonRpcCallRequest("tools/call", "add_recipe", args);

        var response = await _mcpClient.PostAsJsonAsync("/mcp/messages?sessionId=test", request);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var jsonResponse = await response.Content.ReadFromJsonAsync<JsonRpcResponse>();
        var error = jsonResponse.Error;
        error.Should().NotBeNull();
        error.Code.Should().Be(-32602);
        error.Message.Should().Contain("required");
    }

    [Fact]
    public async Task AddRecipe_ValidatesTimeFields()
    {
        var userId = Guid.NewGuid();
        await _apiFixture.SeedUserAsync(userId, "validation-time@example.com", emailVerified: true);
        var token = await CreateMcpTokenAsync(userId);

        _mcpClient.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

        var args = new
        {
            title = "Test Recipe",
            description = "Test description",
            servings = 4,
            prepTimeMinutes = -30,
            cookTimeMinutes = 45
        };

        var request = CreateJsonRpcCallRequest("tools/call", "add_recipe", args);

        var response = await _mcpClient.PostAsJsonAsync("/mcp/messages?sessionId=test", request);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var jsonResponse = await response.Content.ReadFromJsonAsync<JsonRpcResponse>();
        var error = jsonResponse.Error;
        error.Should().NotBeNull();
        error.Code.Should().Be(-32602);
        error.Message.Should().Contain("positive");
    }

    [Fact]
    public async Task AddRecipe_SetsPublicByDefault()
    {
        var userId = Guid.NewGuid();
        await _apiFixture.SeedUserAsync(userId, "public-recipe@example.com", emailVerified: true);
        var token = await CreateMcpTokenAsync(userId);

        _mcpClient.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

        var args = new
        {
            title = "Default Public Recipe",
            description = "Default public recipe",
            servings = 2,
            prepTimeMinutes = 15,
            cookTimeMinutes = 20
        };

        var request = CreateJsonRpcCallRequest("tools/call", "add_recipe", args);

        var response = await _mcpClient.PostAsJsonAsync("/mcp/messages?sessionId=test", request);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var jsonResponse = await response.Content.ReadFromJsonAsync<JsonRpcResponse>();
        var result = System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, object>>(jsonResponse.Result.ToString());
        result.Should().ContainKey("content");
        result.Should().ContainKey("success");
        result["success"].ToString().Should().Be("true");

        await _apiFixture.ResetDatabaseAsync();
        var recipes = await _apiFixture.GetRecipesByUserId(userId);
        recipes.Should().Contain(r => r.IsPublic);
    }

    [Fact]
    public async Task AddRecipe_CanCreatePrivateRecipe()
    {
        var userId = Guid.NewGuid();
        await _apiFixture.SeedUserAsync(userId, "private@example.com", emailVerified: true);
        var token = await CreateMcpTokenAsync(userId);

        _mcpClient.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

        var args = new
        {
            title = "Private Recipe",
            description = "This is a private recipe",
            servings = 2,
            prepTimeMinutes = 15,
            cookTimeMinutes = 20,
            isPublic = false
        };

        var request = CreateJsonRpcCallRequest("tools/call", "add_recipe", args);

        var response = await _mcpClient.PostAsJsonAsync("/mcp/messages?sessionId=test", request);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var jsonResponse = await response.Content.ReadFromJsonAsync<JsonRpcResponse>();
        var result = System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, object>>(jsonResponse.Result.ToString());
        result.Should().ContainKey("content");
        result.Should().ContainKey("success");
        result["success"].ToString().Should().Be("true");

        await _apiFixture.ResetDatabaseAsync();
        var recipes = await _apiFixture.GetRecipesByUserId(userId);
        recipes.Should().Contain(r => r.Title == "Private Recipe" && !r.IsPublic);
    }

    #endregion

    #region log_meal Tool Tests

    [Fact]
    public async Task LogMeal_CreatesFoodDiaryEntry()
    {
        var userId = Guid.NewGuid();
        await _apiFixture.SeedUserAsync(userId, "meal@example.com", emailVerified: true);
        var token = await CreateMcpTokenAsync(userId);

        var food = await _apiFixture.SeedFoodAsync("Apple", 52, 0.3m, 14, 0.2m);
        await _apiFixture.SeedFoodAsync("Banana", 89, 1.1m, 23, 0.3m);

        _mcpClient.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

        var args = new
        {
            date = DateTime.UtcNow.ToString("yyyy-MM-dd"),
            mealType = "Breakfast",
            foodId = food.Id,
            servings = 1
        };

        var request = CreateJsonRpcCallRequest("tools/call", "log_meal", args);

        var response = await _mcpClient.PostAsJsonAsync("/mcp/messages?sessionId=test", request);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var jsonResponse = await response.Content.ReadFromJsonAsync<JsonRpcResponse>();
        var result = System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, object>>(jsonResponse.Result.ToString());
        result.Should().ContainKey("content");
        result.Should().ContainKey("success");
        result["success"].ToString().Should().Be("true");
    }

    [Fact]
    public async Task LogMeal_CreatesRecipeMealEntry()
    {
        var userId = Guid.NewGuid();
        await _apiFixture.SeedUserAsync(userId, "meal-recipe@example.com", emailVerified: true);
        var token = await CreateMcpTokenAsync(userId);

        var recipe = await _apiFixture.SeedRecipeAsync(userId, "Pasta", "Simple pasta", 4, 20, true);
        var ingredients = new[]
        {
            new { FoodId = Guid.Empty, Amount = 200, Unit = "g" }
        };

        var args = new
        {
            date = DateTime.UtcNow.ToString("yyyy-MM-dd"),
            mealType = "Lunch",
            recipeId = recipe.Id,
            servings = 2,
            ingredients = ingredients
        };

        var request = CreateJsonRpcCallRequest("tools/call", "log_meal", args);

        var response = await _mcpClient.PostAsJsonAsync("/mcp/messages?sessionId=test", request);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var jsonResponse = await response.Content.ReadFromJsonAsync<JsonRpcResponse>();
        var result = System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, object>>(jsonResponse.Result.ToString());
        result.Should().ContainKey("content");
        result.Should().ContainKey("success");
        result["success"].ToString().Should().Be("true");
    }

    [Fact]
    public async Task LogMeal_ValidatesMealType()
    {
        var userId = Guid.NewGuid();
        await _apiFixture.SeedUserAsync(userId, "validation@example.com", emailVerified: true);
        var token = await CreateMcpTokenAsync(userId);

        _mcpClient.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

        var args = new
        {
            date = DateTime.UtcNow.ToString("yyyy-MM-dd"),
            servings = 1,
            recipeId = Guid.NewGuid().ToString()
        };

        var request = CreateJsonRpcCallRequest("tools/call", "log_meal", args);

        var response = await _mcpClient.PostAsJsonAsync("/mcp/messages?sessionId=test", request);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var jsonResponse = await response.Content.ReadFromJsonAsync<JsonRpcResponse>();
        var error = jsonResponse.Error;
        error.Should().NotBeNull();
        error.Code.Should().Be(-32602);
        error.Message.Should().Contain("mealType");
    }

    [Fact]
    public async Task LogMeal_ValidatesServings()
    {
        var userId = Guid.NewGuid();
        await _apiFixture.SeedUserAsync(userId, "validation@example.com", emailVerified: true);
        var token = await CreateMcpTokenAsync(userId);

        _mcpClient.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

        var args = new
        {
            date = DateTime.UtcNow.ToString("yyyy-MM-dd"),
            recipeId = Guid.NewGuid().ToString()
        };

        var request = CreateJsonRpcCallRequest("tools/call", "log_meal", args);

        var response = await _mcpClient.PostAsJsonAsync("/mcp/messages?sessionId=test", request);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var jsonResponse = await response.Content.ReadFromJsonAsync<JsonRpcResponse>();
        var error = jsonResponse.Error;
        error.Should().NotBeNull();
        error.Code.Should().Be(-32602);
        error.Message.Should().Contain("servings");
    }

    [Fact]
    public async Task LogMeal_ReturnsDailyMealBreakdown()
    {
        var userId = Guid.NewGuid();
        await _apiFixture.SeedUserAsync(userId, "breakdown@example.com", emailVerified: true);
        var token = await CreateMcpTokenAsync(userId);

        var food = await _apiFixture.SeedFoodAsync("Eggs", 78, 6, 0.6m, 12);
        await _apiFixture.SeedFoodAsync("Toast", 75, 3, 8, 1);

        var args = new
        {
            date = DateTime.UtcNow.ToString("yyyy-MM-dd"),
            includeBreakdown = true
        };

        var request = CreateJsonRpcCallRequest("tools/call", "log_meal", args);

        var response = await _mcpClient.PostAsJsonAsync("/mcp/messages?sessionId=test", request);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var jsonResponse = await response.Content.ReadFromJsonAsync<JsonRpcResponse>();
        var result = System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, object>>(jsonResponse.Result.ToString());
        result.Should().ContainKey("content");

        var breakdown = System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, object>>(result["content"].ToString());
        breakdown.Should().ContainKey("Breakfast");
        breakdown.Should().ContainKey("Lunch");
        breakdown.Should().ContainKey("Dinner");
    }

    [Fact]
    public async Task LogMeal_RejectsInvalidMealType()
    {
        var userId = Guid.NewGuid();
        await _apiFixture.SeedUserAsync(userId, "invalid-meal@example.com", emailVerified: true);
        var token = await CreateMcpTokenAsync(userId);

        _mcpClient.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

        var args = new
        {
            date = DateTime.UtcNow.ToString("yyyy-MM-dd"),
            mealType = "InvalidType"
        };

        var request = CreateJsonRpcCallRequest("tools/call", "log_meal", args);

        var response = await _mcpClient.PostAsJsonAsync("/mcp/messages?sessionId=test", request);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var jsonResponse = await response.Content.ReadFromJsonAsync<JsonRpcResponse>();
        var error = jsonResponse.Error;
        error.Should().NotBeNull();
        error.Code.Should().Be(-32602);
    }

    [Fact]
    public async Task LogMeal_RequiresFoodOrRecipe()
    {
        var userId = Guid.NewGuid();
        await _apiFixture.SeedUserAsync(userId, "required@example.com", emailVerified: true);
        var token = await CreateMcpTokenAsync(userId);

        _mcpClient.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

        var args = new
        {
            date = DateTime.UtcNow.ToString("yyyy-MM-dd"),
            servings = 1
        };

        var request = CreateJsonRpcCallRequest("tools/call", "log_meal", args);

        var response = await _mcpClient.PostAsJsonAsync("/mcp/messages?sessionId=test", request);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var jsonResponse = await response.Content.ReadFromJsonAsync<JsonRpcResponse>();
        var error = jsonResponse.Error;
        error.Should().NotBeNull();
        error.Code.Should().Be(-32602);
        error.Message.Should().Contain("food");
    }

    #endregion

    #region Error Handling Tests

    [Fact]
    public async Task InvalidMethod_ReturnsError()
    {
        var userId = Guid.NewGuid();
        await _apiFixture.SeedUserAsync(userId, "invalid@example.com", emailVerified: true);
        var token = await CreateMcpTokenAsync(userId);

        _mcpClient.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

        var request = new
        {
            jsonrpc = "2.0",
            id = 1,
            method = "invalid_method"
        };

        var response = await _mcpClient.PostAsJsonAsync("/mcp/messages?sessionId=test", request);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var jsonResponse = await response.Content.ReadFromJsonAsync<JsonRpcResponse>();
        var error = jsonResponse.Error;
        error.Should().NotBeNull();
        error.Code.Should().Be(-32601);
        error.Message.Should().Contain("Method not found");
    }

    [Fact]
    public async Task MissingParams_ReturnsError()
    {
        var userId = Guid.NewGuid();
        await _apiFixture.SeedUserAsync(userId, "missing@example.com", emailVerified: true);
        var token = await CreateMcpTokenAsync(userId);

        _mcpClient.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

        var request = new
        {
            jsonrpc = "2.0",
            id = 1,
            method = "tools/call"
        };

        var response = await _mcpClient.PostAsJsonAsync("/mcp/messages?sessionId=test", request);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var jsonResponse = await response.Content.ReadFromJsonAsync<JsonRpcResponse>();
        var error = jsonResponse.Error;
        error.Should().NotBeNull();
        error.Code.Should().Be(-32602);
        error.Message.Should().Contain("Params missing");
    }

    [Fact]
    public async Task BackendError_ReturnsJsonRpcError()
    {
        var userId = Guid.NewGuid();
        await _apiFixture.SeedUserAsync(userId, "backend-error@example.com", emailVerified: true);
        var token = await CreateMcpTokenAsync(userId);

        _mcpClient.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

        var request = CreateJsonRpcCallRequest("tools/call", "list_ingredients", new { search = "NonExistent" });

        // Simulate backend error by mocking or invalid request?
        // Actually, list_ingredients with empty result is SUCCESS, not error.
        // To force error, we'd need to cause backend exception or 400/500.
        // Let's assume sending garbage arguments might cause backend error if validation fails?
        // Or if backend is down (not easy to simulate here).
        
        // Actually, `list_ingredients` just returns empty list if not found.
        
        // Let's try log_meal with invalid foodId (invalid UUID format) which should cause 400 from backend
        var requestError = CreateJsonRpcCallRequest("tools/call", "log_meal", new 
        { 
            date = "2023-01-01", 
            mealType = "Breakfast", 
            foodId = "invalid-uuid", 
            servings = 1 
        });

        var response = await _mcpClient.PostAsJsonAsync("/mcp/messages?sessionId=test", requestError);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var jsonResponse = await response.Content.ReadFromJsonAsync<JsonRpcResponse>();
        
        jsonResponse.Should().NotBeNull();
        jsonResponse!.Error.Should().NotBeNull();
        jsonResponse.Error!.Message.Should().Contain("Backend API error");
    }

    #endregion

    #region Performance Tests

    [Fact]
    public async Task ToolExecution_LogsExecutionTime()
    {
        var userId = Guid.NewGuid();
        await _apiFixture.SeedUserAsync(userId, "timing@example.com", emailVerified: true);
        var token = await CreateMcpTokenAsync(userId);

        await _apiFixture.SeedFoodAsync("Test Food", 100, 25, 5, 2.0m);

        _mcpClient.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

        var args = new
        {
            search = "Test"
        };

        var request = CreateJsonRpcCallRequest("tools/call", "list_ingredients", args);

        var startTime = DateTime.UtcNow;
        var response = await _mcpClient.PostAsJsonAsync("/mcp/messages?sessionId=test", request);
        var elapsed = DateTime.UtcNow - startTime;

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var jsonResponse = await response.Content.ReadFromJsonAsync<JsonRpcResponse>();
        var result = System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, object>>(jsonResponse.Result.ToString());
        result.Should().ContainKey("content");

        var items = System.Text.Json.JsonSerializer.Deserialize<List<Dictionary<string, object>>>(result["content"].ToString());
        items.Should().NotBeNull();

        elapsed.Should().BeLessThan(TimeSpan.FromSeconds(5));
    }

    #endregion

    #region Backend Integration Tests

    [Fact]
    public async Task BackendIntegration_LogsMcpUsage()
    {
        var userId = Guid.NewGuid();
        await _apiFixture.SeedUserAsync(userId, "integration@example.com", emailVerified: true);
        var token = await CreateMcpTokenAsync(userId);

        _mcpClient.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

        var request = CreateJsonRpcCallRequest("tools/call", "log_meal", new { servings = 1, foodId = Guid.NewGuid().ToString() });

        var response = await _mcpClient.PostAsJsonAsync("/mcp/messages?sessionId=test", request);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var jsonResponse = await response.Content.ReadFromJsonAsync<JsonRpcResponse>();
        var result = System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, object>>(jsonResponse.Result.ToString());
        result.Should().ContainKey("content");
        result.Should().ContainKey("success");
        result["success"].ToString().Should().Be("true");

        await _apiFixture.ResetDatabaseAsync();
        var logs = await _apiFixture.GetMcpUsageLogsByUserId(userId);
        logs.Should().HaveCount(1);
        logs.Should().OnlyContain(l => l.ToolName == "log_meal");
    }

    #endregion

    #region Helper Methods

    private async Task<string> CreateMcpTokenAsync(Guid userId)
    {
        // Need to create an authenticated client to create an MCP token
        var email = "test-mcp-user@example.com"; 
        // User should already be seeded by the test method calling this
        
        var client = _apiFixture.CreateAuthenticatedClient(userId, email);

        var createResponse = await client.PostAsJsonAsync("/api/McpTokens", new { Name = "Test Token" });
        
        if (createResponse.StatusCode != HttpStatusCode.Created)
        {
            var error = await createResponse.Content.ReadAsStringAsync();
            throw new Exception($"Failed to create MCP token. Status: {createResponse.StatusCode}, Error: {error}");
        }

        var createResult = await createResponse.Content.ReadFromJsonAsync<CreateMcpTokenResult>();
        createResult.Should().NotBeNull();
        return createResult!.PlaintextToken;
    }

    private async Task<Guid> CreateShoppingListAsync(Guid userId, string name)
    {
        var client = _apiFixture.CreateAuthenticatedClient(userId, "test@example.com");

        var createResponse = await client.PostAsJsonAsync("/api/ShoppingLists", new { Name = name });
        createResponse.StatusCode.Should().Be(HttpStatusCode.Created);

        var id = await createResponse.Content.ReadFromJsonAsync<Guid>();
        return id;
    }

    private object CreateJsonRpcCallRequest(string method, string toolName, object args)
    {
        return new
        {
            jsonrpc = "2.0",
            id = Guid.NewGuid().ToString("N"),
            method = method,
            @params = new
            {
                name = toolName,
                arguments = args
            }
        };
    }

    private object CreateJsonRpcRequest(string method, object? args = null)
    {
        return new
        {
            jsonrpc = "2.0",
            id = Guid.NewGuid().ToString("N"),
            method = method,
            @params = args
        };
    }

    private class JsonRpcResponse
    {
        public object? Result { get; set; }
        public JsonRpcError? Error { get; set; }
    }

    private class JsonRpcError
    {
        public int Code { get; set; }
        public string Message { get; set; } = string.Empty;
    }

    #endregion
}
