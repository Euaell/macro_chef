using System.Text.Json;
using Mizan.Application.Interfaces;
using Mizan.Domain.Entities;

namespace Mizan.Mcp.Server.Services;

public interface IMcpUsageLogger
{
    Task LogAsync(string toolName, object? parameters, bool success, string? errorMessage, int executionTimeMs, CancellationToken cancellationToken);
}

/// <summary>
/// Persists MCP tool execution to the mcp_usage_logs table using the token + user stamped on HttpContext.
/// </summary>
public class McpUsageLogger : IMcpUsageLogger
{
    private readonly IMizanDbContext _dbContext;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public McpUsageLogger(IMizanDbContext dbContext, IHttpContextAccessor httpContextAccessor)
    {
        _dbContext = dbContext;
        _httpContextAccessor = httpContextAccessor;
    }

    public async Task LogAsync(string toolName, object? parameters, bool success, string? errorMessage, int executionTimeMs, CancellationToken cancellationToken)
    {
        var context = _httpContextAccessor.HttpContext;
        if (context?.Items["McpTokenId"] is not Guid tokenId ||
            context.Items["McpUserId"] is not Guid userId)
        {
            return; // no context, skip logging
        }

        var log = new McpUsageLog
        {
            Id = Guid.NewGuid(),
            McpTokenId = tokenId,
            UserId = userId,
            ToolName = toolName,
            Parameters = parameters == null ? null : JsonSerializer.Serialize(parameters),
            Success = success,
            ErrorMessage = errorMessage,
            ExecutionTimeMs = executionTimeMs,
            Timestamp = DateTime.UtcNow
        };

        _dbContext.McpUsageLogs.Add(log);
        await _dbContext.SaveChangesAsync(cancellationToken);
    }
}
