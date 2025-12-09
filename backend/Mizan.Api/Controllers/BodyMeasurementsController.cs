using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Mizan.Application.Commands;
using Mizan.Application.Queries;

namespace Mizan.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class BodyMeasurementsController : ControllerBase
{
    private readonly IMediator _mediator;

    public BodyMeasurementsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet]
    public async Task<ActionResult<GetBodyMeasurementsResult>> GetBodyMeasurements([FromQuery] GetBodyMeasurementsQuery query)
    {
        var result = await _mediator.Send(query);
        return Ok(result);
    }

    [HttpPost]
    public async Task<ActionResult<CreateBodyMeasurementResult>> CreateBodyMeasurement([FromBody] CreateBodyMeasurementCommand command)
    {
        var result = await _mediator.Send(command);
        return CreatedAtAction(nameof(GetBodyMeasurements), result);
    }

    [HttpDelete("{id:guid}")]
    public async Task<ActionResult<DeleteBodyMeasurementResult>> DeleteBodyMeasurement(Guid id)
    {
        var result = await _mediator.Send(new DeleteBodyMeasurementCommand(id));
        if (!result.Success)
            return NotFound(result);
        return Ok(result);
    }
}
