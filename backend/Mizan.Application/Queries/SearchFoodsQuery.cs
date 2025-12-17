using MediatR;
using Microsoft.EntityFrameworkCore;
using Mizan.Application.Interfaces;

namespace Mizan.Application.Queries;

public record SearchFoodsQuery : IRequest<SearchFoodsResult>
{
    public string SearchTerm { get; init; } = string.Empty;
    public string? Barcode { get; init; }
    public int Limit { get; init; } = 20;
}

public record SearchFoodsResult
{
    public List<FoodDto> Foods { get; init; } = new();
}

public record FoodDto
{
    public Guid Id { get; init; }
    public string Name { get; init; } = string.Empty;
    public string? Brand { get; init; }
    public string? Barcode { get; init; }
    public decimal ServingSize { get; init; }
    public string ServingUnit { get; init; } = string.Empty;
    public int CaloriesPer100g { get; init; }
    public decimal ProteinPer100g { get; init; }
    public decimal CarbsPer100g { get; init; }
    public decimal FatPer100g { get; init; }
    public decimal? FiberPer100g { get; init; }
    public bool IsVerified { get; init; }
}

public class SearchFoodsQueryHandler : IRequestHandler<SearchFoodsQuery, SearchFoodsResult>
{
    private readonly IMizanDbContext _context;

    public SearchFoodsQueryHandler(IMizanDbContext context)
    {
        _context = context;
    }

    public async Task<SearchFoodsResult> Handle(SearchFoodsQuery request, CancellationToken cancellationToken)
    {
        IQueryable<Domain.Entities.Food> query = _context.Foods;

        // Search by barcode if provided
        if (!string.IsNullOrWhiteSpace(request.Barcode))
        {
            query = query.Where(f => f.Barcode == request.Barcode);
        }
        else if (!string.IsNullOrWhiteSpace(request.SearchTerm))
        {
            var searchTerm = request.SearchTerm.ToLower();
            query = query.Where(f =>
                f.Name.ToLower().Contains(searchTerm) ||
                (f.Brand != null && f.Brand.ToLower().Contains(searchTerm)));
        }

        var foods = await query
            .OrderByDescending(f => f.IsVerified)
            .ThenBy(f => f.Name)
            .Take(request.Limit)
            .Select(f => new FoodDto
            {
                Id = f.Id,
                Name = f.Name,
                Brand = f.Brand,
                Barcode = f.Barcode,
                ServingSize = f.ServingSize,
                ServingUnit = f.ServingUnit,
                CaloriesPer100g = f.CaloriesPer100g,
                ProteinPer100g = f.ProteinPer100g,
                CarbsPer100g = f.CarbsPer100g,
                FatPer100g = f.FatPer100g,
                FiberPer100g = f.FiberPer100g,
                IsVerified = f.IsVerified
            })
            .ToListAsync(cancellationToken);

        return new SearchFoodsResult { Foods = foods };
    }
}
