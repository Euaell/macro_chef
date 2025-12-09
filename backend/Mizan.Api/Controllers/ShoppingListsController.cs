using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Mizan.Application.Commands;
using Mizan.Application.Queries;

namespace Mizan.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ShoppingListsController : ControllerBase
{
    private readonly IMediator _mediator;

    public ShoppingListsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet]
    public async Task<ActionResult<GetShoppingListsResult>> GetShoppingLists([FromQuery] GetShoppingListsQuery query)
    {
        var result = await _mediator.Send(query);
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ShoppingListDetailDto>> GetShoppingListById(Guid id)
    {
        var result = await _mediator.Send(new GetShoppingListByIdQuery(id));
        if (result == null)
            return NotFound();
        return Ok(result);
    }

    [HttpPost]
    public async Task<ActionResult<CreateShoppingListResult>> CreateShoppingList([FromBody] CreateShoppingListCommand command)
    {
        var result = await _mediator.Send(command);
        return CreatedAtAction(nameof(GetShoppingListById), new { id = result.Id }, result);
    }

    [HttpPatch("items/{itemId:guid}")]
    public async Task<ActionResult<UpdateShoppingListItemResult>> UpdateShoppingListItem(
        Guid itemId,
        [FromBody] UpdateShoppingListItemRequest request)
    {
        var command = new UpdateShoppingListItemCommand
        {
            ItemId = itemId,
            IsChecked = request.IsChecked,
            ItemName = request.ItemName,
            Amount = request.Amount,
            Unit = request.Unit,
            Category = request.Category
        };
        var result = await _mediator.Send(command);
        if (!result.Success)
            return NotFound(result);
        return Ok(result);
    }

    [HttpDelete("{id:guid}")]
    public async Task<ActionResult<DeleteShoppingListResult>> DeleteShoppingList(Guid id)
    {
        var result = await _mediator.Send(new DeleteShoppingListCommand(id));
        if (!result.Success)
            return NotFound(result);
        return Ok(result);
    }
}

public record UpdateShoppingListItemRequest
{
    public bool? IsChecked { get; init; }
    public string? ItemName { get; init; }
    public decimal? Amount { get; init; }
    public string? Unit { get; init; }
    public string? Category { get; init; }
}
