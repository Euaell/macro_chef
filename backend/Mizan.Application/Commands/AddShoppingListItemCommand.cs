using MediatR;
using Microsoft.EntityFrameworkCore;
using Mizan.Application.Interfaces;
using Mizan.Domain.Entities;

namespace Mizan.Application.Commands;

public record AddShoppingListItemCommand(Guid ShoppingListId, string ItemName, decimal? Amount, string? Unit, string? Category) : IRequest<Guid?>;

public class AddShoppingListItemCommandHandler : IRequestHandler<AddShoppingListItemCommand, Guid?>
{
    private readonly IMizanDbContext _context;

    public AddShoppingListItemCommandHandler(IMizanDbContext context)
    {
        _context = context;
    }

    public async Task<Guid?> Handle(AddShoppingListItemCommand request, CancellationToken cancellationToken)
    {
        var shoppingList = await _context.ShoppingLists.FindAsync(new object[] { request.ShoppingListId }, cancellationToken);
        if (shoppingList == null)
        {
            return null;
        }

        var item = new ShoppingListItem
        {
            Id = Guid.NewGuid(),
            ShoppingListId = request.ShoppingListId,
            ItemName = request.ItemName,
            Amount = request.Amount,
            Unit = request.Unit,
            Category = request.Category,
            IsChecked = false
        };

        _context.ShoppingListItems.Add(item);
        
        shoppingList.UpdatedAt = DateTime.UtcNow;
        
        await _context.SaveChangesAsync(cancellationToken);

        return item.Id;
    }
}
