using System.ComponentModel;
using System.Diagnostics;
using MediatR;
using ModelContextProtocol.Server;
using Mizan.Application.Commands;
using Mizan.Application.Queries;
using Mizan.Mcp.Server.Services;

namespace Mizan.Mcp.Server.Tools;

[McpServerToolType]
public static class IngredientTools
{
    [McpServerTool, Description("Search and list available food ingredients.")]
    public static async Task<string> list_ingredients(
        IMediator mediator,
        IMcpUsageLogger usageLogger,
        [Description("Optional search term for ingredient name or brand")] string? searchTerm = null,
        [Description("Include public ingredients (all items are public in v1)")] bool includePublic = true,
        CancellationToken cancellationToken = default)
    {
        var sw = Stopwatch.StartNew();
        try
        {
            var result = await mediator.Send(new SearchFoodsQuery
            {
                SearchTerm = searchTerm ?? string.Empty,
                Page = 1,
                PageSize = 20
            }, cancellationToken);

            var lines = result.Foods.Select(f =>
                $"- {f.Name}{(string.IsNullOrWhiteSpace(f.Brand) ? "" : $" ({f.Brand})")}: {f.CaloriesPer100g} kcal/100g, P {f.ProteinPer100g}g, C {f.CarbsPer100g}g, F {f.FatPer100g}g");

            var body = lines.Any()
                ? string.Join("\n", lines)
                : "No ingredients found.";

            await usageLogger.LogAsync(nameof(list_ingredients), new { searchTerm, includePublic }, true, null, (int)sw.ElapsedMilliseconds, cancellationToken);
            return body;
        }
        catch (Exception ex)
        {
            await usageLogger.LogAsync(nameof(list_ingredients), new { searchTerm, includePublic }, false, ex.Message, (int)sw.ElapsedMilliseconds, cancellationToken);
            throw;
        }
    }

    [McpServerTool, Description("Create a new food ingredient.")]
    public static async Task<string> add_ingredient(
        IMediator mediator,
        IMcpUsageLogger usageLogger,
        [Description("Ingredient name")] string name,
        [Description("Default serving size amount (e.g., 150)")] decimal servingSize,
        [Description("Serving unit (g, ml, oz, etc.)")] string servingUnit,
        [Description("Calories per 100g")] decimal caloriesPer100g,
        [Description("Protein grams per 100g")] decimal proteinPer100g,
        [Description("Carbs grams per 100g")] decimal carbsPer100g,
        [Description("Fat grams per 100g")] decimal fatPer100g,
        [Description("Optional brand name")] string? brand = null,
        [Description("Optional barcode")] string? barcode = null,
        [Description("Make available to all users (currently all ingredients are shared)")] bool isPublic = false,
        CancellationToken cancellationToken = default)
    {
        var sw = Stopwatch.StartNew();
        try
        {
            var command = new CreateFoodCommand
            {
                Name = name,
                ServingSize = servingSize,
                ServingUnit = servingUnit,
                CaloriesPer100g = caloriesPer100g,
                ProteinPer100g = proteinPer100g,
                CarbsPer100g = carbsPer100g,
                FatPer100g = fatPer100g,
                Brand = brand,
                Barcode = barcode,
                IsVerified = isPublic // best-effort mapping until per-user foods are added
            };

            var result = await mediator.Send(command, cancellationToken);

            await usageLogger.LogAsync(nameof(add_ingredient), command, true, null, (int)sw.ElapsedMilliseconds, cancellationToken);
            return $"Ingredient created with id {result.Id}";
        }
        catch (Exception ex)
        {
            await usageLogger.LogAsync(nameof(add_ingredient), new { name, servingSize, servingUnit }, false, ex.Message, (int)sw.ElapsedMilliseconds, cancellationToken);
            throw;
        }
    }
}
