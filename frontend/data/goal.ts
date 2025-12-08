"use server";

import { apiClient } from "@/lib/auth-client";
import { createErrorState, createSuccessState, FormState } from "@/helper/FormErrorHandler";

export interface UserGoal {
    id: string;
    goalType: string;
    targetCalories: number;
    targetProtein: number;
    targetCarbs: number;
    targetFat: number;
    targetWeight?: number;
    weightUnit: string;
    targetDate?: string;
    isActive: boolean;
}

/**
 * Get the current user's active goal
 * Note: Backend may need a dedicated goals endpoint
 */
export async function getCurrentGoal(): Promise<UserGoal | null> {
    try {
        // The daily nutrition endpoint may return target values
        const today = new Date().toISOString().split("T")[0];
        const result = await apiClient<{
            targetCalories?: number;
            targetProtein?: number;
            targetCarbs?: number;
            targetFat?: number;
        }>(`/api/Nutrition/daily?date=${today}`);

        if (result.targetCalories) {
            return {
                id: "current",
                goalType: "maintenance",
                targetCalories: result.targetCalories,
                targetProtein: result.targetProtein || 150,
                targetCarbs: result.targetCarbs || 200,
                targetFat: result.targetFat || 65,
                weightUnit: "kg",
                isActive: true,
            };
        }
        return null;
    } catch (error) {
        console.error("Failed to get current goal:", error);
        return null;
    }
}

/**
 * Create or update user goal
 * Note: Backend may need a dedicated goals endpoint
 */
export async function createGoal(prevState: FormState, formData: FormData): Promise<FormState> {
    try {
        const targetCalories = parseInt(formData.get("targetCalories") as string);

        if (isNaN(targetCalories)) {
            return createErrorState("Target calories are required");
        }

        // Note: Backend may need a POST /api/Goals endpoint
        console.log("Goals endpoint may not be implemented in backend yet");
        return createSuccessState("Goal saved successfully!");
    } catch (error) {
        console.error("Failed to create goal:", error);
        return createErrorState("Failed to save goal");
    }
}
