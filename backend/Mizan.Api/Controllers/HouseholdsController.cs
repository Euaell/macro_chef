using MediatR;
using Microsoft.AspNetCore.Mvc;
using Mizan.Application.Commands;
using Mizan.Application.Queries;

namespace Mizan.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class HouseholdsController : ControllerBase
{
    private readonly IMediator _mediator;

    public HouseholdsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<HouseholdDto>> GetHousehold(Guid id)
    {
        var result = await _mediator.Send(new GetHouseholdQuery(id));
        if (result == null)
        {
            return NotFound();
        }
        return Ok(result);
    }

    [HttpPost]
    public async Task<ActionResult<Guid>> CreateHousehold([FromBody] CreateHouseholdRequest request)
    {
        // Mock User ID retrieval
        if (!Request.Headers.TryGetValue("X-User-Id", out var userIdString) || !Guid.TryParse(userIdString, out var userId))
        {
            return Unauthorized("User ID not found in headers (X-User-Id)");
        }

        var command = new CreateHouseholdCommand(request.Name, userId);
        var householdId = await _mediator.Send(command);

        return CreatedAtAction(nameof(GetHousehold), new { id = householdId }, householdId);
    }

    [HttpPost("{id}/members")]
    public async Task<IActionResult> AddMember(Guid id, [FromBody] AddMemberRequest request)
    {
        if (!Request.Headers.TryGetValue("X-User-Id", out var userIdString) || !Guid.TryParse(userIdString, out var userId))
        {
            return Unauthorized("User ID not found in headers (X-User-Id)");
        }

        var command = new AddHouseholdMemberCommand(id, request.Email, userId);
        var success = await _mediator.Send(command);

        if (!success)
        {
            return BadRequest("Failed to add member. Check if user exists, is already a member, or if you have permissions.");
        }

        return NoContent();
    }
}

public record CreateHouseholdRequest(string Name);
public record AddMemberRequest(string Email);
