using FluentValidation;
using MediatR;
using Mizan.Application.Interfaces;
using Mizan.Domain.Entities;

namespace Mizan.Application.Commands;

public record CreateFoodCommand : IRequest<CreateFoodResult>
{
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
}

public record CreateFoodResult
{
    public Guid Id { get; init; }
    public string Name { get; init; } = string.Empty;
    public bool Success { get; init; }
    public string? Message { get; init; }
}

public class CreateFoodCommandValidator : AbstractValidator<CreateFoodCommand>
{
    public CreateFoodCommandValidator()
    {
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

public class CreateFoodCommandHandler : IRequestHandler<CreateFoodCommand, CreateFoodResult>
{
    private readonly IMizanDbContext _context;

    public CreateFoodCommandHandler(IMizanDbContext context)
    {
        _context = context;
    }

    public async Task<CreateFoodResult> Handle(CreateFoodCommand request, CancellationToken cancellationToken)
    {
        var food = new Food
        {
            Id = Guid.NewGuid(),
            Name = request.Name,
            Brand = request.Brand,
            Barcode = request.Barcode,
            ServingSize = request.ServingSize,
            ServingUnit = request.ServingUnit,
            CaloriesPer100g = request.CaloriesPer100g,
            ProteinPer100g = request.ProteinPer100g,
            CarbsPer100g = request.CarbsPer100g,
            FatPer100g = request.FatPer100g,
            FiberPer100g = request.FiberPer100g,
            SugarPer100g = request.SugarPer100g,
            SodiumPer100g = request.SodiumPer100g,
            IsVerified = false,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Foods.Add(food);
        await _context.SaveChangesAsync(cancellationToken);

        return new CreateFoodResult
        {
            Id = food.Id,
            Name = food.Name,
            Success = true,
            Message = "Food created successfully"
        };
    }
}
