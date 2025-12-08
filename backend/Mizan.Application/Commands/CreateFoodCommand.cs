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
