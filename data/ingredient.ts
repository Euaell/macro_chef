"use server";

import { FormState, fromErrorToFormState } from "@/helper/FormErrorHandler";
import { toFormState } from "@/helper/toFormState";
import MongoDBClient from "@/mongo/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";

export async function getAllIngredient() {

	const client = await MongoDBClient();
	const db = client?.db(process.env.MONGODB_DB);
	const collection = db?.collection("Ingredients");
	
	const ingredient = await collection?.find().toArray();

	await client?.close();
	return ingredient;
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

		const client = await MongoDBClient();
		const db = client?.db(process.env.MONGODB_DB);
		const collection = db?.collection("Ingredients");

		const result = await collection?.insertOne({
			...validatedData,
			createdAt: new Date(),
			updatedAt: new Date(),
		});

		if (!result || !result.acknowledged) {
			throw new Error("Failed to add ingredient");
		}

		await client?.close();
	} catch (error) {
		return fromErrorToFormState(error);
	}

	revalidatePath("/ingredients");

	return toFormState("SUCCESS", "Ingredient added successfully");
}

