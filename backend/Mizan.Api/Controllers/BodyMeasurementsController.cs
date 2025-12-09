using MediatR;
using Microsoft.AspNetCore.Mvc;
using Mizan.Application.Commands;
using Mizan.Application.Queries;

namespace Mizan.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class BodyMeasurementsController : ControllerBase
{
    private readonly IMediator _mediator;

    public BodyMeasurementsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet]
    public async Task<ActionResult<List<BodyMeasurementDto>>> GetMyMeasurements()
    {
        // Mock User ID
        if (!Request.Headers.TryGetValue("X-User-Id", out var userIdString) || !Guid.TryParse(userIdString, out var userId))
        {
            return Unauthorized("User ID not found in headers (X-User-Id)");
        }

        var result = await _mediator.Send(new GetBodyMeasurementsQuery(userId));
        return Ok(result);
    }

    [HttpPost]
    public async Task<ActionResult<Guid>> LogMeasurement([FromBody] LogMeasurementRequest request)
    {
        if (!Request.Headers.TryGetValue("X-User-Id", out var userIdString) || !Guid.TryParse(userIdString, out var userId))
        {
            return Unauthorized("User ID not found in headers (X-User-Id)");
        }

        var command = new LogBodyMeasurementCommand(
            userId,
            request.Date ?? DateTime.UtcNow,
            request.WeightKg,
            request.BodyFatPercentage,
            request.MuscleMassKg,
            request.WaistCm,
            request.HipsCm,
            request.ChestCm,
            request.ArmsCm,
            request.ThighsCm,
            request.Notes
        );

        var id = await _mediator.Send(command);
        return Ok(id);
    }
}

public record LogMeasurementRequest(
    DateTime? Date,
    decimal? WeightKg,
    decimal? BodyFatPercentage,
    decimal? MuscleMassKg,
    decimal? WaistCm,
    decimal? HipsCm,
    decimal? ChestCm,
    decimal? ArmsCm,
    decimal? ThighsCm,
    string? Notes
);
