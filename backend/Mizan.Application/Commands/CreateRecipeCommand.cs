using FluentValidation;
using MediatR;
using Mizan.Application.Interfaces;
using Mizan.Domain.Entities;

namespace Mizan.Application.Commands;

public record CreateRecipeCommand : IRequest<CreateRecipeResult>
{
    public string Title { get; init; } = string.Empty;
    public string? Description { get; init; }
    public int Servings { get; init; } = 1;
    public int? PrepTimeMinutes { get; init; }
    public int? CookTimeMinutes { get; init; }
    public string? ImageUrl { get; init; }
    public bool IsPublic { get; init; }
    public Guid? HouseholdId { get; init; }
    public List<CreateRecipeIngredientDto> Ingredients { get; init; } = new();
    public List<string> Instructions { get; init; } = new();
    public List<string> Tags { get; init; } = new();
    public CreateRecipeNutritionDto? Nutrition { get; init; }
}

public record CreateRecipeIngredientDto
{
    public Guid? FoodId { get; init; }
    public string IngredientText { get; init; } = string.Empty;
    public decimal? Amount { get; init; }
    public string? Unit { get; init; }
}

public record CreateRecipeNutritionDto
{
    public int? CaloriesPerServing { get; init; }
    public decimal? ProteinGrams { get; init; }
    public decimal? CarbsGrams { get; init; }
    public decimal? FatGrams { get; init; }
    public decimal? FiberGrams { get; init; }
}

public record CreateRecipeResult
{
    public Guid Id { get; init; }
    public string Title { get; init; } = string.Empty;
}

public class CreateRecipeCommandValidator : AbstractValidator<CreateRecipeCommand>
{
    public CreateRecipeCommandValidator()
    {
        RuleFor(x => x.Title).NotEmpty().MaximumLength(255);
        RuleFor(x => x.Servings).GreaterThan(0);
        RuleFor(x => x.Ingredients).NotEmpty().WithMessage("At least one ingredient is required");
        RuleForEach(x => x.Ingredients).ChildRules(ingredient =>
        {
            ingredient.RuleFor(i => i.IngredientText).NotEmpty();
        });
    }
}

public class CreateRecipeCommandHandler : IRequestHandler<CreateRecipeCommand, CreateRecipeResult>
{
    private readonly IMizanDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public CreateRecipeCommandHandler(IMizanDbContext context, ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task<CreateRecipeResult> Handle(CreateRecipeCommand request, CancellationToken cancellationToken)
    {
        if (!_currentUser.UserId.HasValue)
        {
            throw new UnauthorizedAccessException("User must be authenticated");
        }

        var recipe = new Recipe
        {
            Id = Guid.NewGuid(),
            UserId = _currentUser.UserId.Value,
            HouseholdId = request.HouseholdId,
            Title = request.Title,
            Description = request.Description,
            Servings = request.Servings,
            PrepTimeMinutes = request.PrepTimeMinutes,
            CookTimeMinutes = request.CookTimeMinutes,
            ImageUrl = request.ImageUrl,
            IsPublic = request.IsPublic,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        // Add ingredients
        for (int i = 0; i < request.Ingredients.Count; i++)
        {
            var ingredientDto = request.Ingredients[i];
            recipe.Ingredients.Add(new RecipeIngredient
            {
                Id = Guid.NewGuid(),
                RecipeId = recipe.Id,
                FoodId = ingredientDto.FoodId,
                IngredientText = ingredientDto.IngredientText,
                Amount = ingredientDto.Amount,
                Unit = ingredientDto.Unit,
                SortOrder = i
            });
        }

        // Add instructions
        for (int i = 0; i < request.Instructions.Count; i++)
        {
            recipe.Instructions.Add(new RecipeInstruction
            {
                Id = Guid.NewGuid(),
                RecipeId = recipe.Id,
                StepNumber = i + 1,
                Instruction = request.Instructions[i]
            });
        }

        // Add tags
        foreach (var tag in request.Tags)
        {
            recipe.Tags.Add(new RecipeTag
            {
                Id = Guid.NewGuid(),
                RecipeId = recipe.Id,
                Tag = tag
            });
        }

        // Add nutrition
        if (request.Nutrition != null)
        {
            recipe.Nutrition = new RecipeNutrition
            {
                RecipeId = recipe.Id,
                CaloriesPerServing = request.Nutrition.CaloriesPerServing,
                ProteinGrams = request.Nutrition.ProteinGrams,
                CarbsGrams = request.Nutrition.CarbsGrams,
                FatGrams = request.Nutrition.FatGrams,
                FiberGrams = request.Nutrition.FiberGrams
            };
        }

        _context.Recipes.Add(recipe);
        await _context.SaveChangesAsync(cancellationToken);

        return new CreateRecipeResult
        {
            Id = recipe.Id,
            Title = recipe.Title
        };
    }
}
