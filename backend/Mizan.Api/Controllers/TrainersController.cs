using MediatR;
using Microsoft.AspNetCore.Mvc;
using Mizan.Application.Commands;

namespace Mizan.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TrainersController : ControllerBase
{
    private readonly IMediator _mediator;

    public TrainersController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpPost("request")]
    public async Task<IActionResult> SendRequest([FromBody] SendTrainerRequestRequest request)
    {
        if (!Request.Headers.TryGetValue("X-User-Id", out var userIdString) || !Guid.TryParse(userIdString, out var userId))
        {
            return Unauthorized("User ID not found in headers (X-User-Id)");
        }

        var command = new SendTrainerRequestCommand(userId, request.TrainerId);
        var id = await _mediator.Send(command);

        return Ok(new { RelationshipId = id });
    }

    [HttpPost("respond")]
    public async Task<IActionResult> Respond([FromBody] RespondRequest request)
    {
        var command = new RespondToTrainerRequestCommand(request.RelationshipId, request.Accept);
        var success = await _mediator.Send(command);

        if (!success)
        {
            return NotFound("Relationship not found");
        }

        return NoContent();
    }
}

public record SendTrainerRequestRequest(Guid TrainerId);
public record RespondRequest(Guid RelationshipId, bool Accept);
