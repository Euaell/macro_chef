using MediatR;
using Microsoft.EntityFrameworkCore;
using Mizan.Application.Interfaces;

namespace Mizan.Application.Commands;

public record RespondToTrainerRequestCommand(Guid RelationshipId, bool Accept) : IRequest<bool>;

public class RespondToTrainerRequestCommandHandler : IRequestHandler<RespondToTrainerRequestCommand, bool>
{
    private readonly IMizanDbContext _context;

    public RespondToTrainerRequestCommandHandler(IMizanDbContext context)
    {
        _context = context;
    }

    public async Task<bool> Handle(RespondToTrainerRequestCommand request, CancellationToken cancellationToken)
    {
        var relationship = await _context.TrainerClientRelationships.FindAsync(new object[] { request.RelationshipId }, cancellationToken);
        
        if (relationship == null)
        {
            return false;
        }

        if (request.Accept)
        {
            relationship.Status = "active";
            relationship.StartedAt = DateTime.UtcNow;

            // Create a chat conversation for them if not exists (though typically created on first message, but good to have)
            var existingConv = await _context.ChatConversations
                .FirstOrDefaultAsync(c => c.TrainerClientRelationshipId == relationship.Id, cancellationToken);
            
            if (existingConv == null)
            {
                _context.ChatConversations.Add(new Domain.Entities.ChatConversation
                {
                    Id = Guid.NewGuid(),
                    TrainerClientRelationshipId = relationship.Id,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                });
            }
        }
        else
        {
            relationship.Status = "rejected";
            relationship.EndedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }
}
