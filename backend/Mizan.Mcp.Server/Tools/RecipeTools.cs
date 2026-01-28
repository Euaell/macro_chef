using System.ComponentModel;
using System.Diagnostics;
using MediatR;
using ModelContextProtocol.Server;
using Mizan.Application.Commands;
using Mizan.Application.Queries;
using Mizan.Mcp.Server.Services;

namespace Mizan.Mcp.Server.Tools;

public record IngredientInput(
    [property: Description("Ingredient food ID")] Guid FoodId,
    [property: Description("Amount for this ingredient")] decimal Quantity,
    [property: Description("Unit (g, ml, cup, etc.)")] string Unit);

public record InstructionInput(
    [property: Description("Step number")] int StepNumber,
    [property: Description("Instruction text")] string Instruction);

[McpServerToolType]
public static class RecipeTools
{
    [McpServerTool, Description("Search and list recipes (public or owned).")]
    public static async Task<string> list_recipes(
        IMediator mediator,
        IMcpUsageLogger usageLogger,
        [Description("Optional search term")] string? searchTerm = null,
        [Description("Comma separated tags to filter")] string? tags = null,
        [Description("Include public recipes")] bool includePublic = true,
        [Description("Only show favorites")] bool favoritesOnly = false,
        CancellationToken cancellationToken = default)
    {
        var sw = Stopwatch.StartNew();
        var tagList = string.IsNullOrWhiteSpace(tags)
            ? new List<string>()
            : tags.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries).ToList();

        try
        {
            var result = await mediator.Send(new GetRecipesQuery
            {
                SearchTerm = searchTerm,
                Tags = tagList,
                IncludePublic = includePublic,
                FavoritesOnly = favoritesOnly,
                Page = 1,
                PageSize = 10
            }, cancellationToken);

            var lines = result.Recipes.Select(r =>
            {
                var nutrition = r.Nutrition != null
                    ? $" | {r.Nutrition.CaloriesPerServing?.ToString("0")} kcal/serving, P {r.Nutrition.ProteinGrams?.ToString("0.#")}g"
                    : string.Empty;
                var tagText = r.Tags.Any() ? $" [{string.Join(", ", r.Tags)}]" : string.Empty;
                return $"- {r.Title} ({(r.IsOwner ? "mine" : r.IsPublic ? "public" : "shared")}){nutrition}{tagText}";
            });

            var body = lines.Any() ? string.Join("\n", lines) : "No recipes found.";
            await usageLogger.LogAsync(nameof(list_recipes), new { searchTerm, tags, includePublic, favoritesOnly }, true, null, (int)sw.ElapsedMilliseconds, cancellationToken);
            return body;
        }
        catch (Exception ex)
        {
            await usageLogger.LogAsync(nameof(list_recipes), new { searchTerm, tags, includePublic, favoritesOnly }, false, ex.Message, (int)sw.ElapsedMilliseconds, cancellationToken);
            throw;
        }
    }

    [McpServerTool, Description("Create a recipe from ingredients and instructions.")]
    public static async Task<string> add_recipe(
        IMediator mediator,
        IMcpUsageLogger usageLogger,
        [Description("Recipe title")] string title,
        [Description("Optional description")] string? description,
        [Description("Number of servings")] int servings,
        [Description("Prep time in minutes")] int? prepTimeMinutes = null,
        [Description("Cook time in minutes")] int? cookTimeMinutes = null,
        [Description("Ingredient list")] List<IngredientInput>? ingredients = null,
        [Description("Instructions list")] List<InstructionInput>? instructions = null,
        [Description("Publish recipe to public library")] bool isPublic = false,
        [Description("Tags to apply")] List<string>? tags = null,
        CancellationToken cancellationToken = default)
    {
        var sw = Stopwatch.StartNew();
        try
        {
            var ingredientDtos = (ingredients ?? new())
                .Select(i => new CreateRecipeIngredientDto
                {
                    FoodId = i.FoodId,
                    IngredientText = $"{i.Quantity} {i.Unit}".Trim(),
                    Amount = i.Quantity,
                    Unit = i.Unit
                })
                .ToList();

            var instructionList = (instructions ?? new())
                .OrderBy(i => i.StepNumber)
                .Select(i => i.Instruction)
                .ToList();

            var command = new CreateRecipeCommand
            {
                Title = title,
                Description = description,
                Servings = servings,
                PrepTimeMinutes = prepTimeMinutes,
                CookTimeMinutes = cookTimeMinutes,
                Ingredients = ingredientDtos,
                Instructions = instructionList,
                IsPublic = isPublic,
                Tags = tags ?? new List<string>()
            };

            var result = await mediator.Send(command, cancellationToken);

            await usageLogger.LogAsync(nameof(add_recipe), new { title, servings, ingredientCount = ingredientDtos.Count }, true, null, (int)sw.ElapsedMilliseconds, cancellationToken);
            return $"Recipe '{title}' created (id: {result.Id}).";
        }
        catch (Exception ex)
        {
            await usageLogger.LogAsync(nameof(add_recipe), new { title, servings }, false, ex.Message, (int)sw.ElapsedMilliseconds, cancellationToken);
            throw;
        }
    }
}
