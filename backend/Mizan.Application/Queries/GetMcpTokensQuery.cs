using MediatR;
using Microsoft.EntityFrameworkCore;
using Mizan.Application.Interfaces;

namespace Mizan.Application.Queries;

public record GetMcpTokensQuery : IRequest<GetMcpTokensResult>
{
}

public record GetMcpTokensResult
{
    public List<McpTokenDto> Tokens { get; init; } = new();
}

public record McpTokenDto
{
    public Guid Id { get; init; }
    public string Name { get; init; } = string.Empty;
    public DateTime CreatedAt { get; init; }
    public DateTime? ExpiresAt { get; init; }
    public DateTime? LastUsedAt { get; init; }
    public bool IsActive { get; init; }
}

public class GetMcpTokensQueryHandler : IRequestHandler<GetMcpTokensQuery, GetMcpTokensResult>
{
    private readonly IMizanDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public GetMcpTokensQueryHandler(IMizanDbContext context, ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task<GetMcpTokensResult> Handle(GetMcpTokensQuery request, CancellationToken cancellationToken)
    {
        if (!_currentUser.UserId.HasValue)
        {
            return new GetMcpTokensResult();
        }

        var tokens = await _context.McpTokens
            .Where(t => t.UserId == _currentUser.UserId)
            .OrderByDescending(t => t.CreatedAt)
            .Select(t => new McpTokenDto
            {
                Id = t.Id,
                Name = t.Name,
                CreatedAt = t.CreatedAt,
                ExpiresAt = t.ExpiresAt,
                LastUsedAt = t.LastUsedAt,
                IsActive = t.IsActive
            })
            .ToListAsync(cancellationToken);

        return new GetMcpTokensResult
        {
            Tokens = tokens
        };
    }
}
