"use server";

import { apiClient } from "@/lib/auth-client";
import { createErrorState, createSuccessState, FormState } from "@/helper/FormErrorHandler";

export interface MealEntry {
    id: string;
    foodId?: string;
    recipeId?: string;
    name: string;
    mealType: string;
    servings: number;
    calories?: number;
    proteinGrams?: number;
    carbsGrams?: number;
    fatGrams?: number;
    loggedAt: Date;
}

export interface FoodDiaryResult {
    date: string;
    entries: MealEntry[];
    totals: {
        calories: number;
        protein: number;
        carbs: number;
        fat: number;
    };
}

/**
 * Get today's meals from the backend API
 */
export async function getTodayMeal(): Promise<MealEntry[]> {
    try {
        const today = new Date().toISOString().split("T")[0];
        const result = await apiClient<FoodDiaryResult>(`/api/Meals?date=${today}`);
        return result.entries || [];
    } catch (error) {
        console.error("Failed to get today's meals:", error);
        return [];
    }
}

/**
 * Get meals for a specific date
 */
export async function getMeal(date: string): Promise<MealEntry[]> {
    try {
        const result = await apiClient<FoodDiaryResult>(`/api/Meals?date=${date}`);
        return result.entries || [];
    } catch (error) {
        console.error("Failed to get meals:", error);
        return [];
    }
}

/**
 * Get daily totals
 */
export async function getDailyTotals(date?: string): Promise<FoodDiaryResult["totals"] | null> {
    try {
        const queryDate = date || new Date().toISOString().split("T")[0];
        const result = await apiClient<FoodDiaryResult>(`/api/Meals?date=${queryDate}`);
        return result.totals;
    } catch (error) {
        console.error("Failed to get daily totals:", error);
        return null;
    }
}

/**
 * Add a meal entry via the backend API
 */
export async function addMeal(prevState: FormState, formData: FormData): Promise<FormState> {
    try {
        const recipeId = formData.get("recipeId") as string;
        const foodId = formData.get("foodId") as string;
        const mealType = formData.get("mealType") as string || "snack";
        const servings = parseFloat(formData.get("servings") as string) || 1;
        const date = (formData.get("date") as string) || new Date().toISOString().split("T")[0];
        const calories = parseInt(formData.get("calories") as string);
        const protein = parseFloat(formData.get("protein") as string);
        const carbs = parseFloat(formData.get("carbs") as string);
        const fat = parseFloat(formData.get("fat") as string);

        await apiClient("/api/Meals", {
            method: "POST",
            body: JSON.stringify({
                recipeId: recipeId || null,
                foodId: foodId || null,
                entryDate: date,
                mealType,
                servings,
                calories: isNaN(calories) ? null : calories,
                proteinGrams: isNaN(protein) ? null : protein,
                carbsGrams: isNaN(carbs) ? null : carbs,
                fatGrams: isNaN(fat) ? null : fat,
            }),
        });

        return createSuccessState("Meal logged successfully!");
    } catch (error) {
        console.error("Failed to add meal:", error);
        return createErrorState("Failed to log meal");
    }
}
