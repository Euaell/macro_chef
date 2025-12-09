using MediatR;
using Microsoft.EntityFrameworkCore;
using Mizan.Application.Interfaces;

namespace Mizan.Application.Queries;

public record GetChatConversationQuery(Guid RelationshipId) : IRequest<ChatConversationDto?>;

public record ChatConversationDto(
    Guid Id,
    Guid RelationshipId,
    List<ChatMessageDto> Messages
);

public record ChatMessageDto(
    Guid Id,
    Guid SenderId,
    string Content,
    DateTime SentAt
);

public class GetChatConversationQueryHandler : IRequestHandler<GetChatConversationQuery, ChatConversationDto?>
{
    private readonly IMizanDbContext _context;

    public GetChatConversationQueryHandler(IMizanDbContext context)
    {
        _context = context;
    }

    public async Task<ChatConversationDto?> Handle(GetChatConversationQuery request, CancellationToken cancellationToken)
    {
        var conversation = await _context.ChatConversations
            .Include(c => c.Messages)
            .FirstOrDefaultAsync(c => c.TrainerClientRelationshipId == request.RelationshipId, cancellationToken);

        if (conversation == null)
        {
            return null;
        }

        return new ChatConversationDto(
            conversation.Id,
            conversation.TrainerClientRelationshipId,
            conversation.Messages.OrderBy(m => m.SentAt).Select(m => new ChatMessageDto(
                m.Id,
                m.SenderId,
                m.Content,
                m.SentAt
            )).ToList()
        );
    }
}
