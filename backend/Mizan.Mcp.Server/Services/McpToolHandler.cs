using System.Text.Json;
using Mizan.Mcp.Server.Models;

namespace Mizan.Mcp.Server.Services;

public class McpToolHandler
{
    private readonly IBackendClient _backend;
    private readonly ILogger<McpToolHandler> _logger;

    public McpToolHandler(IBackendClient backend, ILogger<McpToolHandler> logger)
    {
        _backend = backend;
        _logger = logger;
    }

    public List<McpTool> GetTools()
    {
        return new List<McpTool>
        {
            new McpTool
            {
                Name = "list_ingredients",
                Description = "Search for food ingredients in the database",
                InputSchema = new
                {
                    type = "object",
                    properties = new
                    {
                        search = new { type = "string", description = "Search term" },
                        limit = new { type = "integer", description = "Max results (default 20)" }
                    }
                }
            },
            new McpTool
            {
                Name = "add_ingredient",
                Description = "Add a new food ingredient (Admin only)",
                InputSchema = new
                {
                    type = "object",
                    properties = new
                    {
                        name = new { type = "string" },
                        brand = new { type = "string" },
                        caloriesPer100g = new { type = "integer" },
                        proteinPer100g = new { type = "number" },
                        carbsPer100g = new { type = "number" },
                        fatPer100g = new { type = "number" }
                    },
                    required = new[] { "name", "caloriesPer100g", "proteinPer100g", "carbsPer100g", "fatPer100g" }
                }
            },
            new McpTool
            {
                Name = "get_shopping_list",
                Description = "Get the user's shopping lists",
                InputSchema = new
                {
                    type = "object",
                    properties = new { }
                }
            },
            new McpTool
            {
                Name = "get_nutrition_tracking",
                Description = "Get daily nutrition summary",
                InputSchema = new
                {
                    type = "object",
                    properties = new
                    {
                        date = new { type = "string", description = "Date in YYYY-MM-DD format (optional, defaults to today)" }
                    }
                }
            },
            new McpTool
            {
                Name = "list_recipes",
                Description = "Search for recipes",
                InputSchema = new
                {
                    type = "object",
                    properties = new
                    {
                        search = new { type = "string" }
                    }
                }
            },
            new McpTool
            {
                Name = "add_recipe",
                Description = "Create a new recipe",
                InputSchema = new
                {
                    type = "object",
                    properties = new
                    {
                        title = new { type = "string" },
                        description = new { type = "string" },
                        servings = new { type = "integer" },
                        prepTimeMinutes = new { type = "integer" },
                        cookTimeMinutes = new { type = "integer" }
                    },
                    required = new[] { "title" }
                }
            },
            new McpTool
            {
                Name = "log_meal",
                Description = "Log a food or recipe to the food diary",
                InputSchema = new
                {
                    type = "object",
                    properties = new
                    {
                        date = new { type = "string", description = "YYYY-MM-DD" },
                        mealType = new { type = "string", description = "Breakfast, Lunch, Dinner, Snack" },
                        foodId = new { type = "string", description = "UUID of food (optional)" },
                        recipeId = new { type = "string", description = "UUID of recipe (optional)" },
                        servings = new { type = "number" }
                    },
                    required = new[] { "date", "mealType", "servings" }
                }
            }
        };
    }

    public async Task<object> ExecuteToolAsync(Guid userId, string toolName, JsonElement args)
    {
        _logger.LogInformation("Executing tool {Tool} for user {User}", toolName, userId);

        switch (toolName)
        {
            case "list_ingredients":
                var search = args.TryGetProperty("search", out var s) ? s.GetString() : null;
                var limit = args.TryGetProperty("limit", out var l) ? l.GetInt32() : 20;
                return await _backend.CallApiAsync(userId, "GET", $"/api/Foods/search?searchTerm={search}&pageSize={limit}");
            
            case "add_ingredient":
                var createFoodCmd = JsonSerializer.Deserialize<Dictionary<string, object>>(args.GetRawText());
                return await _backend.CallApiAsync(userId, "POST", "/api/Foods", createFoodCmd);

            case "get_shopping_list":
                return await _backend.CallApiAsync(userId, "GET", "/api/ShoppingLists");

            case "get_nutrition_tracking":
                var date = args.TryGetProperty("date", out var d) ? d.GetString() : DateTime.UtcNow.ToString("yyyy-MM-dd");
                return await _backend.CallApiAsync(userId, "GET", $"/api/Nutrition/daily?date={date}");

            case "list_recipes":
                var rSearch = args.TryGetProperty("search", out var rs) ? rs.GetString() : null;
                return await _backend.CallApiAsync(userId, "GET", $"/api/Recipes?searchTerm={rSearch}");

            case "add_recipe":
                var createRecipeCmd = JsonSerializer.Deserialize<Dictionary<string, object>>(args.GetRawText());
                return await _backend.CallApiAsync(userId, "POST", "/api/Recipes", createRecipeCmd);

            case "log_meal":
                // Map simpler arguments to backend command if needed, or just pass through
                // Backend expects: Date (DateOnly), MealType (string/enum), FoodId?, RecipeId?, Servings
                var logCmd = JsonSerializer.Deserialize<Dictionary<string, object>>(args.GetRawText());
                return await _backend.CallApiAsync(userId, "POST", "/api/Meals", logCmd);

            default:
                throw new Exception($"Tool {toolName} not found");
        }
    }
}
