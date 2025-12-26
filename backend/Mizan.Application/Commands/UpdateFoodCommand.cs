using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Mizan.Application.Interfaces;

namespace Mizan.Application.Commands;

public record UpdateFoodCommand : IRequest<UpdateFoodResult>
{
    public Guid Id { get; init; }
    public string Name { get; init; } = string.Empty;
    public string? Brand { get; init; }
    public string? Barcode { get; init; }
    public decimal ServingSize { get; init; } = 100;
    public string ServingUnit { get; init; } = "g";
    public int CaloriesPer100g { get; init; }
    public decimal ProteinPer100g { get; init; }
    public decimal CarbsPer100g { get; init; }
    public decimal FatPer100g { get; init; }
    public decimal? FiberPer100g { get; init; }
    public decimal? SugarPer100g { get; init; }
    public decimal? SodiumPer100g { get; init; }
    public bool IsVerified { get; init; }
}

public record UpdateFoodResult
{
    public Guid Id { get; init; }
    public string Name { get; init; } = string.Empty;
    public bool Success { get; init; }
    public string? Message { get; init; }
}

public class UpdateFoodCommandValidator : AbstractValidator<UpdateFoodCommand>
{
    public UpdateFoodCommandValidator()
    {
        RuleFor(x => x.Id).NotEmpty();
        RuleFor(x => x.Name).NotEmpty().MaximumLength(255);
        RuleFor(x => x.Brand).MaximumLength(255);
        RuleFor(x => x.Barcode).MaximumLength(100);
        RuleFor(x => x.ServingSize).GreaterThan(0);
        RuleFor(x => x.ServingUnit).NotEmpty().MaximumLength(50);
        RuleFor(x => x.CaloriesPer100g).GreaterThanOrEqualTo(0);
        RuleFor(x => x.ProteinPer100g).GreaterThanOrEqualTo(0);
        RuleFor(x => x.CarbsPer100g).GreaterThanOrEqualTo(0);
        RuleFor(x => x.FatPer100g).GreaterThanOrEqualTo(0);
        RuleFor(x => x.FiberPer100g).GreaterThanOrEqualTo(0).When(x => x.FiberPer100g.HasValue);
        RuleFor(x => x.SugarPer100g).GreaterThanOrEqualTo(0).When(x => x.SugarPer100g.HasValue);
        RuleFor(x => x.SodiumPer100g).GreaterThanOrEqualTo(0).When(x => x.SodiumPer100g.HasValue);
    }
}

public class UpdateFoodCommandHandler : IRequestHandler<UpdateFoodCommand, UpdateFoodResult>
{
    private readonly IMizanDbContext _context;
    private readonly IRedisCacheService _cache;

    public UpdateFoodCommandHandler(IMizanDbContext context, IRedisCacheService cache)
    {
        _context = context;
        _cache = cache;
    }

    public async Task<UpdateFoodResult> Handle(UpdateFoodCommand request, CancellationToken cancellationToken)
    {
        var food = await _context.Foods
            .FirstOrDefaultAsync(f => f.Id == request.Id, cancellationToken);

        if (food == null)
        {
            return new UpdateFoodResult
            {
                Id = request.Id,
                Name = request.Name,
                Success = false,
                Message = "Food not found"
            };
        }

        food.Name = request.Name;
        food.Brand = request.Brand;
        food.Barcode = request.Barcode;
        food.ServingSize = request.ServingSize;
        food.ServingUnit = request.ServingUnit;
        food.CaloriesPer100g = request.CaloriesPer100g;
        food.ProteinPer100g = request.ProteinPer100g;
        food.CarbsPer100g = request.CarbsPer100g;
        food.FatPer100g = request.FatPer100g;
        food.FiberPer100g = request.FiberPer100g;
        food.SugarPer100g = request.SugarPer100g;
        food.SodiumPer100g = request.SodiumPer100g;
        food.IsVerified = request.IsVerified;
        food.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        // Invalidate all food search caches
        await _cache.RemoveByPrefixAsync("foods:search:", cancellationToken);

        return new UpdateFoodResult
        {
            Id = food.Id,
            Name = food.Name,
            Success = true,
            Message = "Food updated successfully"
        };
    }
}
