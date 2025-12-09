using FluentValidation;
using MediatR;
using Mizan.Application.Interfaces;
using Mizan.Domain.Entities;

namespace Mizan.Application.Commands;

public record CreateShoppingListCommand : IRequest<CreateShoppingListResult>
{
    public string? Name { get; init; }
    public Guid? HouseholdId { get; init; }
    public List<ShoppingListItemDto> Items { get; init; } = new();
}

public record ShoppingListItemDto
{
    public Guid? FoodId { get; init; }
    public string ItemName { get; init; } = string.Empty;
    public decimal? Amount { get; init; }
    public string? Unit { get; init; }
    public string? Category { get; init; }
}

public record CreateShoppingListResult
{
    public Guid Id { get; init; }
    public string? Name { get; init; }
    public int ItemCount { get; init; }
}

public class CreateShoppingListCommandValidator : AbstractValidator<CreateShoppingListCommand>
{
    public CreateShoppingListCommandValidator()
    {
        RuleFor(x => x.Name).MaximumLength(255);
        RuleForEach(x => x.Items).ChildRules(item =>
        {
            item.RuleFor(i => i.ItemName).NotEmpty().MaximumLength(255);
        });
    }
}

public class CreateShoppingListCommandHandler : IRequestHandler<CreateShoppingListCommand, CreateShoppingListResult>
{
    private readonly IMizanDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public CreateShoppingListCommandHandler(IMizanDbContext context, ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task<CreateShoppingListResult> Handle(CreateShoppingListCommand request, CancellationToken cancellationToken)
    {
        if (!_currentUser.UserId.HasValue)
        {
            throw new UnauthorizedAccessException("User must be authenticated");
        }

        var shoppingList = new ShoppingList
        {
            Id = Guid.NewGuid(),
            UserId = _currentUser.UserId.Value,
            HouseholdId = request.HouseholdId,
            Name = request.Name,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        foreach (var itemDto in request.Items)
        {
            shoppingList.Items.Add(new ShoppingListItem
            {
                Id = Guid.NewGuid(),
                ShoppingListId = shoppingList.Id,
                FoodId = itemDto.FoodId,
                ItemName = itemDto.ItemName,
                Amount = itemDto.Amount,
                Unit = itemDto.Unit,
                Category = itemDto.Category,
                IsChecked = false
            });
        }

        _context.ShoppingLists.Add(shoppingList);
        await _context.SaveChangesAsync(cancellationToken);

        return new CreateShoppingListResult
        {
            Id = shoppingList.Id,
            Name = shoppingList.Name,
            ItemCount = shoppingList.Items.Count
        };
    }
}
