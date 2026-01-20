using System.ComponentModel;
using System.Diagnostics;
using MediatR;
using ModelContextProtocol.Server;
using Mizan.Application.Commands;
using Mizan.Mcp.Server.Services;

namespace Mizan.Mcp.Server.Tools;

[McpServerToolType]
public static class MealTools
{
    [McpServerTool, Description("Log a food diary entry for a meal or snack.")]
    public static async Task<string> log_meal(
        IMediator mediator,
        IMcpUsageLogger usageLogger,
        [Description("Meal type: breakfast, lunch, dinner, snack")] string mealType,
        [Description("Number of servings")] decimal servings,
        [Description("Food ingredient ID (optional)")] Guid? foodId = null,
        [Description("Recipe ID (optional)")] Guid? recipeId = null,
        [Description("Date (YYYY-MM-DD). Defaults to today.")] string? entryDate = null,
        [Description("Custom name when no food/recipe id is supplied")] string? name = null,
        CancellationToken cancellationToken = default)
    {
        var sw = Stopwatch.StartNew();
        var date = string.IsNullOrWhiteSpace(entryDate)
            ? DateOnly.FromDateTime(DateTime.UtcNow)
            : DateOnly.Parse(entryDate);

        try
        {
            string message;

            if (foodId.HasValue || recipeId.HasValue)
            {
                var result = await mediator.Send(new LogFoodCommand
                {
                    FoodId = foodId,
                    RecipeId = recipeId,
                    MealType = mealType.ToLowerInvariant(),
                    Servings = servings,
                    EntryDate = date
                }, cancellationToken);

                message = result.Message;
            }
            else
            {
                var result = await mediator.Send(new CreateFoodDiaryEntryCommand
                {
                    EntryDate = date,
                    MealType = mealType.ToUpperInvariant(),
                    Servings = servings,
                    Name = name ?? "Custom entry"
                }, cancellationToken);

                message = result.Message ?? "Meal logged.";
            }

            await usageLogger.LogAsync(nameof(log_meal), new { mealType, servings, foodId, recipeId, entryDate }, true, null, (int)sw.ElapsedMilliseconds, cancellationToken);
            return message;
        }
        catch (Exception ex)
        {
            await usageLogger.LogAsync(nameof(log_meal), new { mealType, servings, foodId, recipeId, entryDate }, false, ex.Message, (int)sw.ElapsedMilliseconds, cancellationToken);
            throw;
        }
    }
}
