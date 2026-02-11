"use server";

import { serverApi } from "@/lib/api";
import { logger } from "@/lib/logger";

const mealPlanLogger = logger.createModuleLogger("meal-plan-data");

export interface MealPlanRecipe {
    id: string;
    recipeId: string;
    recipeTitle?: string;
    date: string;
    mealType: string;
    servings: number;
}

export interface MealPlan {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
    recipes: MealPlanRecipe[];
}

export interface MealPlanListResult {
    mealPlans: MealPlan[];
    totalCount: number;
}

export async function getMealPlans(): Promise<MealPlan[]> {
    try {
        const result = await serverApi<MealPlanListResult>("/api/MealPlans");
        return result.mealPlans || [];
    } catch (error) {
        mealPlanLogger.error("Failed to get meal plans", { error });
        return [];
    }
}

export async function getMealPlanById(id: string): Promise<MealPlan | null> {
    try {
        return await serverApi<MealPlan>(`/api/MealPlans/${id}`);
    } catch (error) {
        mealPlanLogger.error("Failed to get meal plan", { error, id });
        return null;
    }
}

export async function createMealPlan(data: {
    name: string;
    startDate: string;
    endDate: string;
    recipes?: { recipeId: string; date: string; mealType: string; servings: number }[];
}): Promise<{ id: string; success: boolean } | null> {
    try {
        const result = await serverApi<{ id: string; name: string; recipeCount: number }>("/api/MealPlans", {
            method: "POST",
            body: data,
        });
        return { id: result.id, success: true };
    } catch (error) {
        mealPlanLogger.error("Failed to create meal plan", { error });
        return null;
    }
}

export async function addRecipeToMealPlan(
    mealPlanId: string,
    data: { recipeId: string; date: string; mealType: string; servings: number }
): Promise<boolean> {
    try {
        await serverApi(`/api/MealPlans/${mealPlanId}/recipes`, {
            method: "POST",
            body: data,
        });
        return true;
    } catch (error) {
        mealPlanLogger.error("Failed to add recipe to meal plan", { error, mealPlanId });
        return false;
    }
}

export async function deleteMealPlan(id: string): Promise<boolean> {
    try {
        await serverApi(`/api/MealPlans/${id}`, { method: "DELETE" });
        return true;
    } catch (error) {
        mealPlanLogger.error("Failed to delete meal plan", { error, id });
        return false;
    }
}
