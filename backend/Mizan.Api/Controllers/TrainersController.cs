using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Mizan.Application.Commands;
using Mizan.Application.Interfaces;

namespace Mizan.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class TrainersController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ICurrentUserService _currentUser;

    public TrainersController(IMediator mediator, ICurrentUserService currentUser)
    {
        _mediator = mediator;
        _currentUser = currentUser;
    }

    [HttpPost("request")]
    public async Task<IActionResult> SendRequest([FromBody] SendTrainerRequestRequest request)
    {
        if (!_currentUser.UserId.HasValue)
        {
            return Unauthorized("User not authenticated");
        }

        var command = new SendTrainerRequestCommand(_currentUser.UserId.Value, request.TrainerId);
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
