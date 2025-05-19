import Goal from "@/types/goal";
import Ingredient from "@/types/ingredient";
import Meal from "@/types/meal";
import Recipe from "@/types/recipe";

export async function OpenAIRecipeSuggester(
    ingredients: Ingredient[],
    recipes: Recipe[],
    goal: Goal,
    meal: Meal[]
): Promise<Recipe[]> {

    // query OpenAI API to get recipe suggestions based on the ingredients, recipes and goal
    // should return a list of recipes from the list of recipes or new recipes with the ingredients provided
    // the recipes should be tailored to the goal and meal(consumed so far today) provided
    // if the returned recipes are not in the list of recipes, they should be added to the list of recipes (and to the database)

    return [];
}
