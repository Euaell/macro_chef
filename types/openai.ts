
import { z } from 'zod';
import Ingredient from './ingredient';
import { GoalVersion } from './goal';
import MealType from './meal';


export const RecipeSchema = z.object({
    name: z.string(),
    description: z.string(),
    ingredients: z.array(
        z.object({
            id: z.string(),
            name: z.string(),
            amount: z.number(),
        })
    ),
    instructions: z.array(z.string()),
});
export const RecipesSchema = z.object({
    recipes: z.array(
        RecipeSchema
    ),
});

export type OpenAIRecipesResponseSchema = z.infer<typeof RecipesSchema>;

export interface OpenAIChatInput {
    ingredients: Ingredient[];
    currentGoal: GoalVersion;
    mealsConsumedToday: MealType[];
}
