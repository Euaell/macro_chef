using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Mizan.Application.Commands;
using Mizan.Application.Queries;

namespace Mizan.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class FoodsController : ControllerBase
{
    private readonly IMediator _mediator;

    public FoodsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<FoodDto>> GetFood(Guid id)
    {
        var result = await _mediator.Send(new GetFoodByIdQuery(id));

        if (result == null)
            return NotFound();

        return Ok(result);
    }

    [HttpGet("search")]
    public async Task<ActionResult<SearchFoodsResult>> SearchFoods([FromQuery] SearchFoodsQuery query)
    {
        var result = await _mediator.Send(query);
        return Ok(result);
    }

    [HttpPost]
    [Authorize]
    public async Task<ActionResult<CreateFoodResult>> CreateFood([FromBody] CreateFoodCommand command)
    {
        var result = await _mediator.Send(command);
        return CreatedAtAction(nameof(GetFood), new { id = result.Id }, result);
    }
}
