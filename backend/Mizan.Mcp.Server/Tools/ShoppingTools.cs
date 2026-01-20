using System.ComponentModel;
using System.Diagnostics;
using MediatR;
using ModelContextProtocol.Server;
using Mizan.Application.Queries;
using Mizan.Mcp.Server.Services;

namespace Mizan.Mcp.Server.Tools;

[McpServerToolType]
public static class ShoppingTools
{
    [McpServerTool, Description("Retrieve the latest shopping list with items and status.")]
    public static async Task<string> get_shopping_list(
        IMediator mediator,
        IMcpUsageLogger usageLogger,
        [Description("Include completed/checked-off items")] bool includeCompleted = false,
        CancellationToken cancellationToken = default)
    {
        var sw = Stopwatch.StartNew();
        try
        {
            var lists = await mediator.Send(new GetShoppingListsQuery { Page = 1, PageSize = 1 }, cancellationToken);
            if (!lists.ShoppingLists.Any())
            {
                await usageLogger.LogAsync(nameof(get_shopping_list), new { includeCompleted }, true, null, (int)sw.ElapsedMilliseconds, cancellationToken);
                return "You have no shopping lists yet.";
            }

            var latest = lists.ShoppingLists.First();
            var detail = await mediator.Send(new GetShoppingListQuery(latest.Id), cancellationToken);
            if (detail == null)
            {
                await usageLogger.LogAsync(nameof(get_shopping_list), new { includeCompleted }, false, "List not found", (int)sw.ElapsedMilliseconds, cancellationToken);
                return "Unable to load shopping list.";
            }

            var items = detail.Items
                .Where(i => includeCompleted || !i.IsChecked)
                .Select(i => $"- {(i.IsChecked ? "[x]" : "[ ]")} {i.ItemName}{(i.Amount.HasValue ? $" ({i.Amount} {i.Unit})" : "")}");

            var body = $"Shopping List: {detail.Name ?? "My List"}\n" +
                       (items.Any() ? string.Join("\n", items) : "No items yet.");

            await usageLogger.LogAsync(nameof(get_shopping_list), new { includeCompleted }, true, null, (int)sw.ElapsedMilliseconds, cancellationToken);
            return body;
        }
        catch (Exception ex)
        {
            await usageLogger.LogAsync(nameof(get_shopping_list), new { includeCompleted }, false, ex.Message, (int)sw.ElapsedMilliseconds, cancellationToken);
            throw;
        }
    }
}
