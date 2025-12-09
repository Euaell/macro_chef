using MediatR;
using Microsoft.EntityFrameworkCore;
using Mizan.Application.Interfaces;

namespace Mizan.Application.Commands;

public record DeleteMealPlanCommand(Guid Id) : IRequest<DeleteMealPlanResult>;

public record DeleteMealPlanResult
{
    public bool Success { get; init; }
    public string? Message { get; init; }
}

public class DeleteMealPlanCommandHandler : IRequestHandler<DeleteMealPlanCommand, DeleteMealPlanResult>
{
    private readonly IMizanDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public DeleteMealPlanCommandHandler(IMizanDbContext context, ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task<DeleteMealPlanResult> Handle(DeleteMealPlanCommand request, CancellationToken cancellationToken)
    {
        if (!_currentUser.UserId.HasValue)
        {
            throw new UnauthorizedAccessException("User must be authenticated");
        }

        var mealPlan = await _context.MealPlans
            .Include(mp => mp.MealPlanRecipes)
            .FirstOrDefaultAsync(mp => mp.Id == request.Id && mp.UserId == _currentUser.UserId, cancellationToken);

        if (mealPlan == null)
        {
            return new DeleteMealPlanResult
            {
                Success = false,
                Message = "Meal plan not found or access denied"
            };
        }

        _context.MealPlanRecipes.RemoveRange(mealPlan.MealPlanRecipes);
        _context.MealPlans.Remove(mealPlan);
        await _context.SaveChangesAsync(cancellationToken);

        return new DeleteMealPlanResult
        {
            Success = true,
            Message = "Meal plan deleted successfully"
        };
    }
}
