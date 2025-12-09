using MediatR;
using Mizan.Application.Interfaces;

namespace Mizan.Application.Commands;

public record ToggleShoppingListItemCommand(Guid ItemId, bool IsChecked) : IRequest<bool>;

public class ToggleShoppingListItemCommandHandler : IRequestHandler<ToggleShoppingListItemCommand, bool>
{
    private readonly IMizanDbContext _context;

    public ToggleShoppingListItemCommandHandler(IMizanDbContext context)
    {
        _context = context;
    }

    public async Task<bool> Handle(ToggleShoppingListItemCommand request, CancellationToken cancellationToken)
    {
        var item = await _context.ShoppingListItems.FindAsync(new object[] { request.ItemId }, cancellationToken);
        if (item == null)
        {
            return false;
        }

        item.IsChecked = request.IsChecked;
        await _context.SaveChangesAsync(cancellationToken);

        return true;
    }
}
