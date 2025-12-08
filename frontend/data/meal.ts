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
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    loggedAt: Date;
}

export interface DailyNutrition {
    date: string;
    totalCalories: number;
    totalProtein: number;
    totalCarbs: number;
    totalFat: number;
    targetCalories?: number;
    targetProtein?: number;
    targetCarbs?: number;
    targetFat?: number;
    mealBreakdown?: MealSummary[];
}

export interface MealSummary {
    mealType: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    itemCount: number;
}

/**
 * Get today's meals from the backend API
 */
export async function getTodayMeal(): Promise<MealEntry[]> {
    try {
        const today = new Date().toISOString().split("T")[0];
        const result = await apiClient<DailyNutrition>(`/api/Nutrition/daily?date=${today}`);

        // The API returns aggregated data, not individual entries
        // Return meal breakdown as entries if available
        return (result.mealBreakdown || []).map((m, idx) => ({
            id: `meal-${idx}`,
            name: m.mealType,
            mealType: m.mealType,
            servings: m.itemCount,
            calories: m.calories,
            protein: m.protein,
            carbs: m.carbs,
            fat: m.fat,
            loggedAt: new Date(),
        }));
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
        const result = await apiClient<DailyNutrition>(`/api/Nutrition/daily?date=${date}`);

        return (result.mealBreakdown || []).map((m, idx) => ({
            id: `meal-${idx}`,
            name: m.mealType,
            mealType: m.mealType,
            servings: m.itemCount,
            calories: m.calories,
            protein: m.protein,
            carbs: m.carbs,
            fat: m.fat,
            loggedAt: new Date(),
        }));
    } catch (error) {
        console.error("Failed to get meals:", error);
        return [];
    }
}

/**
 * Add a meal entry via the backend API
 */
export async function addMeal(prevState: FormState, formData: FormData): Promise<FormState> {
    try {
        const recipeId = formData.get("recipeId") as string;
        const foodId = formData.get("foodId") as string;
        const mealType = formData.get("mealType") as string || "other";
        const servings = parseFloat(formData.get("servings") as string) || 1;
        const date = (formData.get("date") as string) || new Date().toISOString().split("T")[0];

        await apiClient("/api/Nutrition/log", {
            method: "POST",
            body: JSON.stringify({
                recipeId: recipeId || null,
                foodId: foodId || null,
                entryDate: date,
                mealType,
                servings,
            }),
        });

        return createSuccessState("Meal logged successfully!");
    } catch (error) {
        console.error("Failed to add meal:", error);
        return createErrorState("Failed to log meal");
    }
}
