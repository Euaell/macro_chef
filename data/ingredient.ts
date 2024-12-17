"use server";

import { FormState, fromErrorToFormState } from "@/helper/FormErrorHandler";
import { toFormState } from "@/helper/toFormState";
import MongoDBClient from "@/mongo/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import Ingredient from "@/model/ingredient";

export async function getAllIngredient() {
	await MongoDBClient();
	
	const ingredients = await Ingredient.find({});
	return ingredients;
}

const createIngredientSchema = z.object({
	name: z.string().min(1).max(100),
	calories: z.number().min(0),
	protein: z.number().min(0),
	fat: z.number().min(0),
	carbs: z.number().min(0),
	fiber: z.number().min(0),
})

export async function addIngredient(formState: FormState, ingredient: FormData): Promise<FormState> {
	try {
		const ingredientData = {
			name: ingredient.get("name"),
			calories: Number(ingredient.get("calories")!),
			protein: Number(ingredient.get("protein")!),
			fat: Number(ingredient.get("fat")!),
			carbs: Number(ingredient.get("carbs")!),
			fiber: Number(ingredient.get("fiber")!),
		};

		const validatedData = createIngredientSchema.parse(ingredientData);

		await MongoDBClient();

		const newIngredient = await Ingredient.create({
			name: validatedData.name,
			macros: {
				calories: validatedData.calories,
				protein: validatedData.protein,
				fat: validatedData.fat,
				carbs: validatedData.carbs,
				fiber: validatedData.fiber,
			},			
		});

		if (!newIngredient) {
			throw new Error("Failed to add ingredient");
		}

	} catch (error) {
		return fromErrorToFormState(error);
	}

	revalidatePath("/ingredients");

	return toFormState("SUCCESS", "Ingredient added successfully");
}