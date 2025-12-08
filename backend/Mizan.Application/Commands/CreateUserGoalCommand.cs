using MediatR;
using Microsoft.EntityFrameworkCore;
using Mizan.Application.Interfaces;
using Mizan.Domain.Entities;

namespace Mizan.Application.Commands;

public record CreateUserGoalCommand : IRequest<CreateUserGoalResult>
{
    public string? GoalType { get; init; }
    public int? TargetCalories { get; init; }
    public decimal? TargetProteinGrams { get; init; }
    public decimal? TargetCarbsGrams { get; init; }
    public decimal? TargetFatGrams { get; init; }
    public decimal? TargetWeight { get; init; }
    public string? WeightUnit { get; init; }
    public DateOnly? TargetDate { get; init; }
}

public record CreateUserGoalResult
{
    public Guid Id { get; init; }
    public bool Success { get; init; }
    public string? Message { get; init; }
}

public class CreateUserGoalCommandHandler : IRequestHandler<CreateUserGoalCommand, CreateUserGoalResult>
{
    private readonly IMizanDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public CreateUserGoalCommandHandler(IMizanDbContext context, ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task<CreateUserGoalResult> Handle(CreateUserGoalCommand request, CancellationToken cancellationToken)
    {
        if (!_currentUser.UserId.HasValue)
        {
            return new CreateUserGoalResult
            {
                Success = false,
                Message = "User not authenticated"
            };
        }

        // Deactivate existing goals
        var existingGoals = await _context.UserGoals
            .Where(g => g.UserId == _currentUser.UserId && g.IsActive)
            .ToListAsync(cancellationToken);

        foreach (var existing in existingGoals)
        {
            existing.IsActive = false;
            existing.UpdatedAt = DateTime.UtcNow;
        }

        // Create new goal
        var goal = new UserGoal
        {
            Id = Guid.NewGuid(),
            UserId = _currentUser.UserId.Value,
            GoalType = request.GoalType,
            TargetCalories = request.TargetCalories,
            TargetProteinGrams = request.TargetProteinGrams,
            TargetCarbsGrams = request.TargetCarbsGrams,
            TargetFatGrams = request.TargetFatGrams,
            TargetWeight = request.TargetWeight,
            WeightUnit = request.WeightUnit ?? "kg",
            TargetDate = request.TargetDate,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.UserGoals.Add(goal);
        await _context.SaveChangesAsync(cancellationToken);

        return new CreateUserGoalResult
        {
            Id = goal.Id,
            Success = true,
            Message = "Goal created successfully"
        };
    }
}
