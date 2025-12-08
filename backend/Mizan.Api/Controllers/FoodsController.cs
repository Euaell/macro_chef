using MediatR;
using Microsoft.AspNetCore.Mvc;
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

    [HttpGet("search")]
    public async Task<ActionResult<SearchFoodsResult>> SearchFoods([FromQuery] SearchFoodsQuery query)
    {
        var result = await _mediator.Send(query);
        return Ok(result);
    }
}
