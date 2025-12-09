using MediatR;
using Microsoft.AspNetCore.Mvc;
using Mizan.Application.Commands;
using Mizan.Application.Queries;

namespace Mizan.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ChatController : ControllerBase
{
    private readonly IMediator _mediator;

    public ChatController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet("{relationshipId}")]
    public async Task<ActionResult<ChatConversationDto>> GetConversation(Guid relationshipId)
    {
        var result = await _mediator.Send(new GetChatConversationQuery(relationshipId));
        if (result == null)
        {
            return NotFound("Conversation not found");
        }
        return Ok(result);
    }

    [HttpPost("send")]
    public async Task<IActionResult> SendMessage([FromBody] SendMessageRequest request)
    {
        if (!Request.Headers.TryGetValue("X-User-Id", out var userIdString) || !Guid.TryParse(userIdString, out var userId))
        {
            return Unauthorized("User ID not found in headers (X-User-Id)");
        }

        var command = new SendChatMessageCommand(request.ConversationId, userId, request.Content);
        var result = await _mediator.Send(command);

        return Ok(new { MessageId = result.Id });
    }
}

public record SendMessageRequest(Guid ConversationId, string Content);
