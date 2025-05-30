import MongoDBClient from "@/mongo/client";
import { RecipeSchema } from "@/types/openai";
import Recipe from "@/types/recipe";
import { z } from "zod";

type recipeFromIngredients = z.infer<typeof RecipeSchema>;
export async function recipesFromIngredients(data: recipeFromIngredients): Promise<Recipe> {
    await MongoDBClient();
    throw new Error("This function is not implemented yet. Please implement the logic to convert OpenAIRecipesResponseSchema to Recipe.");
}