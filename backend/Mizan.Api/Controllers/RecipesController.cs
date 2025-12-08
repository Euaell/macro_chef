using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Mizan.Application.Commands;
using Mizan.Application.Queries;

namespace Mizan.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class RecipesController : ControllerBase
{
    private readonly IMediator _mediator;

    public RecipesController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet]
    public async Task<ActionResult<GetRecipesResult>> GetRecipes([FromQuery] GetRecipesQuery query)
    {
        var result = await _mediator.Send(query);
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<RecipeDetailDto>> GetRecipeById(Guid id)
    {
        var result = await _mediator.Send(new GetRecipeByIdQuery(id));
        if (result == null)
            return NotFound();
        return Ok(result);
    }

    [HttpPost]
    [Authorize]
    public async Task<ActionResult<CreateRecipeResult>> CreateRecipe([FromBody] CreateRecipeCommand command)
    {
        var result = await _mediator.Send(command);
        return CreatedAtAction(nameof(GetRecipeById), new { id = result.Id }, result);
    }
}
