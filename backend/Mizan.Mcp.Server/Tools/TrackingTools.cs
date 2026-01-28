using System.ComponentModel;
using System.Diagnostics;
using MediatR;
using ModelContextProtocol.Server;
using Mizan.Application.Queries;
using Mizan.Mcp.Server.Services;

namespace Mizan.Mcp.Server.Tools;

[McpServerToolType]
public static class TrackingTools
{
    [McpServerTool, Description("Get nutrition and body measurement data for a date range.")]
    public static async Task<string> get_nutrition_tracking(
        IMediator mediator,
        IMcpUsageLogger usageLogger,
        IHttpContextAccessor httpContextAccessor,
        [Description("Start date YYYY-MM-DD")] string startDate,
        [Description("End date YYYY-MM-DD")] string endDate,
        [Description("Include weight/body metrics in the summary")] bool includeBodyMeasurements = true,
        CancellationToken cancellationToken = default)
    {
        var sw = Stopwatch.StartNew();
        try
        {
            var start = DateOnly.Parse(startDate);
            var end = DateOnly.Parse(endDate);
            if (end < start)
            {
                throw new ArgumentException("endDate must be on or after startDate");
            }

            var lines = new List<string>();
            for (var date = start; date <= end; date = date.AddDays(1))
            {
                var daily = await mediator.Send(new GetDailyNutritionQuery { Date = date }, cancellationToken);
                lines.Add($"{date}: {daily.TotalCalories} kcal (P {daily.TotalProtein}g / C {daily.TotalCarbs}g / F {daily.TotalFat}g)");
            }

            if (includeBodyMeasurements &&
                httpContextAccessor.HttpContext?.Items["McpUserId"] is Guid userId)
            {
                var measurements = await mediator.Send(new GetBodyMeasurementsQuery(userId), cancellationToken);
                var latest = measurements.OrderByDescending(m => m.Date).FirstOrDefault();
                if (latest != null && latest.WeightKg.HasValue)
                {
                    lines.Add($"Latest weight: {latest.WeightKg.Value} kg (measured {latest.Date:yyyy-MM-dd})");
                }
            }

            var body = lines.Any() ? string.Join("\n", lines) : "No nutrition entries found for the selected range.";
            await usageLogger.LogAsync(nameof(get_nutrition_tracking), new { startDate, endDate, includeBodyMeasurements }, true, null, (int)sw.ElapsedMilliseconds, cancellationToken);
            return body;
        }
        catch (Exception ex)
        {
            await usageLogger.LogAsync(nameof(get_nutrition_tracking), new { startDate, endDate, includeBodyMeasurements }, false, ex.Message, (int)sw.ElapsedMilliseconds, cancellationToken);
            throw;
        }
    }
}
