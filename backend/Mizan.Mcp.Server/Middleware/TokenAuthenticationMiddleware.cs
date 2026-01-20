using System.Security.Claims;
using MediatR;
using Mizan.Application.Commands;
using Serilog;

namespace Mizan.Mcp.Server.Middleware;

/// <summary>
/// Validates incoming MCP requests using the Bearer token supplied in the Authorization header.
/// The token is validated via the existing ValidateTokenCommand so we reuse all hashing and expiry rules.
/// When valid, the middleware stamps the HttpContext with the user's claims and token metadata.
/// </summary>
public class TokenAuthenticationMiddleware
{
    private readonly RequestDelegate _next;

    public TokenAuthenticationMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context, IMediator mediator)
    {
        // Allow unauthenticated health checks
        if (context.Request.Path.StartsWithSegments("/health", StringComparison.OrdinalIgnoreCase))
        {
            await _next(context);
            return;
        }

        var authHeader = context.Request.Headers.Authorization.ToString();
        if (string.IsNullOrWhiteSpace(authHeader) ||
            !authHeader.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
        {
            await WriteUnauthorizedAsync(context, "Missing Authorization header");
            return;
        }

        var token = authHeader["Bearer ".Length..].Trim();
        if (string.IsNullOrWhiteSpace(token))
        {
            await WriteUnauthorizedAsync(context, "Bearer token is empty");
            return;
        }

        var validation = await mediator.Send(new ValidateTokenCommand { Token = token }, context.RequestAborted);
        if (!validation.IsValid || validation.UserId == Guid.Empty || validation.TokenId is null)
        {
            await WriteUnauthorizedAsync(context, "Invalid or expired token");
            return;
        }

        // Stamp claims principal so ICurrentUserService works everywhere
        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, validation.UserId.ToString())
        };
        var identity = new ClaimsIdentity(claims, "McpToken");
        context.User = new ClaimsPrincipal(identity);

        context.Items["McpUserId"] = validation.UserId;
        context.Items["McpTokenId"] = validation.TokenId.Value;

        await _next(context);
    }

    private static Task WriteUnauthorizedAsync(HttpContext context, string message)
    {
        context.Response.StatusCode = StatusCodes.Status401Unauthorized;
        return context.Response.WriteAsJsonAsync(new { error = message });
    }
}
