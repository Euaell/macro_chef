using MediatR;
using Microsoft.AspNetCore.Mvc;
using Mizan.Application.Commands;
using Mizan.Application.Queries;

namespace Mizan.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UsersController : ControllerBase
{
    private readonly IMediator _mediator;

    public UsersController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet("me")]
    public async Task<ActionResult<UserDto>> GetMe()
    {
        // TODO: Get UserId from claims. For now, we'll assume a header or query param for testing until Auth is fully integrated
        // In a real scenario: var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));
        
        if (!Request.Headers.TryGetValue("X-User-Id", out var userIdString) || !Guid.TryParse(userIdString, out var userId))
        {
            return Unauthorized("User ID not found in headers (X-User-Id)");
        }

        var result = await _mediator.Send(new GetUserQuery(userId));
        if (result == null)
        {
            return NotFound();
        }

        return Ok(result);
    }

    [HttpPut("me")]
    public async Task<IActionResult> UpdateMe([FromBody] UpdateUserRequest request)
    {
        if (!Request.Headers.TryGetValue("X-User-Id", out var userIdString) || !Guid.TryParse(userIdString, out var userId))
        {
            return Unauthorized("User ID not found in headers (X-User-Id)");
        }

        var command = new UpdateUserCommand(userId, request.Name, request.Image);
        var success = await _mediator.Send(command);

        if (!success)
        {
            return NotFound("User not found");
        }

        return NoContent();
    }
}

public record UpdateUserRequest(string? Name, string? Image);
