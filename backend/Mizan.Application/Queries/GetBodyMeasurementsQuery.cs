using MediatR;
using Microsoft.EntityFrameworkCore;
using Mizan.Application.Interfaces;

namespace Mizan.Application.Queries;

public record GetBodyMeasurementsQuery : IRequest<GetBodyMeasurementsResult>
{
    public DateOnly? StartDate { get; init; }
    public DateOnly? EndDate { get; init; }
    public int Page { get; init; } = 1;
    public int PageSize { get; init; } = 50;
}

public record GetBodyMeasurementsResult
{
    public List<BodyMeasurementDto> Measurements { get; init; } = new();
    public BodyMeasurementProgressDto? Progress { get; init; }
    public int TotalCount { get; init; }
    public int Page { get; init; }
    public int PageSize { get; init; }
}

public record BodyMeasurementDto
{
    public Guid Id { get; init; }
    public DateOnly MeasurementDate { get; init; }
    public decimal? WeightKg { get; init; }
    public decimal? BodyFatPercentage { get; init; }
    public decimal? MuscleMassKg { get; init; }
    public decimal? WaistCm { get; init; }
    public decimal? HipsCm { get; init; }
    public decimal? ChestCm { get; init; }
    public decimal? ArmsCm { get; init; }
    public decimal? ThighsCm { get; init; }
    public string? Notes { get; init; }
    public DateTime CreatedAt { get; init; }
}

public record BodyMeasurementProgressDto
{
    public decimal? WeightChange { get; init; }
    public decimal? BodyFatChange { get; init; }
    public decimal? MuscleMassChange { get; init; }
    public decimal? WaistChange { get; init; }
    public DateOnly? FirstMeasurementDate { get; init; }
    public DateOnly? LastMeasurementDate { get; init; }
}

public class GetBodyMeasurementsQueryHandler : IRequestHandler<GetBodyMeasurementsQuery, GetBodyMeasurementsResult>
{
    private readonly IMizanDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public GetBodyMeasurementsQueryHandler(IMizanDbContext context, ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task<GetBodyMeasurementsResult> Handle(GetBodyMeasurementsQuery request, CancellationToken cancellationToken)
    {
        if (!_currentUser.UserId.HasValue)
        {
            throw new UnauthorizedAccessException("User must be authenticated");
        }

        var query = _context.BodyMeasurements
            .Where(m => m.UserId == _currentUser.UserId);

        if (request.StartDate.HasValue)
        {
            query = query.Where(m => m.MeasurementDate >= request.StartDate);
        }

        if (request.EndDate.HasValue)
        {
            query = query.Where(m => m.MeasurementDate <= request.EndDate);
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var measurements = await query
            .OrderByDescending(m => m.MeasurementDate)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(m => new BodyMeasurementDto
            {
                Id = m.Id,
                MeasurementDate = m.MeasurementDate,
                WeightKg = m.WeightKg,
                BodyFatPercentage = m.BodyFatPercentage,
                MuscleMassKg = m.MuscleMassKg,
                WaistCm = m.WaistCm,
                HipsCm = m.HipsCm,
                ChestCm = m.ChestCm,
                ArmsCm = m.ArmsCm,
                ThighsCm = m.ThighsCm,
                Notes = m.Notes,
                CreatedAt = m.CreatedAt
            })
            .ToListAsync(cancellationToken);

        // Calculate progress
        BodyMeasurementProgressDto? progress = null;
        if (measurements.Count >= 2)
        {
            var oldest = measurements.Last();
            var newest = measurements.First();

            progress = new BodyMeasurementProgressDto
            {
                WeightChange = newest.WeightKg.HasValue && oldest.WeightKg.HasValue
                    ? newest.WeightKg - oldest.WeightKg
                    : null,
                BodyFatChange = newest.BodyFatPercentage.HasValue && oldest.BodyFatPercentage.HasValue
                    ? newest.BodyFatPercentage - oldest.BodyFatPercentage
                    : null,
                MuscleMassChange = newest.MuscleMassKg.HasValue && oldest.MuscleMassKg.HasValue
                    ? newest.MuscleMassKg - oldest.MuscleMassKg
                    : null,
                WaistChange = newest.WaistCm.HasValue && oldest.WaistCm.HasValue
                    ? newest.WaistCm - oldest.WaistCm
                    : null,
                FirstMeasurementDate = oldest.MeasurementDate,
                LastMeasurementDate = newest.MeasurementDate
            };
        }

        return new GetBodyMeasurementsResult
        {
            Measurements = measurements,
            Progress = progress,
            TotalCount = totalCount,
            Page = request.Page,
            PageSize = request.PageSize
        };
    }
}
