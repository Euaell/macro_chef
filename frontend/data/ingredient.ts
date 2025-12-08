"use server";

import { apiClient } from "@/lib/auth-client";
import { createErrorState, createSuccessState, FormState } from "@/helper/FormErrorHandler";

export interface Ingredient {
    id: string;
    name: string;
    brand?: string;
    barcode?: string;
    servingSize: number;
    servingUnit: string;
    caloriesPer100g: number;
    proteinPer100g: number;
    carbsPer100g: number;
    fatPer100g: number;
    fiberPer100g?: number;
    isVerified: boolean;
}

/**
 * Get all ingredients (foods) from the backend API
 */
export async function getAllIngredient(): Promise<Ingredient[]> {
    try {
        const result = await apiClient<{ Foods: Ingredient[] }>("/api/Foods/search?Limit=100");
        return result.Foods || [];
    } catch (error) {
        console.error("Failed to get ingredients:", error);
        return [];
    }
}

/**
 * Get ingredient by ID from the backend API
 */
export async function getIngredientById(id: string): Promise<Ingredient | null> {
    try {
        const result = await apiClient<{ Foods: Ingredient[] }>(`/api/Foods/search?SearchTerm=&Limit=100`);
        return result.Foods?.find(f => f.id === id) || null;
    } catch (error) {
        console.error("Failed to get ingredient:", error);
        return null;
    }
}

/**
 * Add a new ingredient (food) via the backend API
 */
export async function addIngredient(prevState: FormState, formData: FormData): Promise<FormState> {
    try {
        const name = formData.get("name") as string;
        const brand = formData.get("brand") as string;
        const barcode = formData.get("barcode") as string;
        const servingSize = parseFloat(formData.get("servingSize") as string) || 100;
        const calories = parseInt(formData.get("calories") as string);
        const protein = parseFloat(formData.get("protein") as string);
        const carbs = parseFloat(formData.get("carbs") as string);
        const fat = parseFloat(formData.get("fat") as string);
        const fiber = parseFloat(formData.get("fiber") as string);

        if (!name || isNaN(calories)) {
            return createErrorState("Name and calories are required", [
                { field: "name", message: !name ? "Name is required" : "" },
                { field: "calories", message: isNaN(calories) ? "Valid calories required" : "" },
            ]);
        }

        await apiClient("/api/Foods", {
            method: "POST",
            body: JSON.stringify({
                name,
                brand: brand || null,
                barcode: barcode || null,
                servingSize,
                servingUnit: "g",
                caloriesPer100g: calories,
                proteinPer100g: isNaN(protein) ? 0 : protein,
                carbsPer100g: isNaN(carbs) ? 0 : carbs,
                fatPer100g: isNaN(fat) ? 0 : fat,
                fiberPer100g: isNaN(fiber) ? null : fiber,
            }),
        });

        return createSuccessState("Ingredient added successfully!");
    } catch (error) {
        console.error("Failed to add ingredient:", error);
        return createErrorState("Failed to add ingredient");
    }
}
