import { callBackendApi } from "@/lib/backend-api-client";
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
export async function getAllIngredient(searchTerm?: string, sortBy?: string, limit?: number): Promise<Ingredient[]> {
    try {
        const params = new URLSearchParams();
        params.set("Limit", String(limit || 100));
        if (searchTerm) params.set("SearchTerm", searchTerm);

        const result = await callBackendApi<{ foods: Ingredient[] }>(`/api/Foods/search?${params.toString()}`);
        let foods = result.foods || [];

        // Sort if requested
        if (sortBy) {
            const sortField = sortBy as keyof Ingredient;
            foods = [...foods].sort((a, b) => {
                const aVal = a[sortField];
                const bVal = b[sortField];
                if (typeof aVal === "number" && typeof bVal === "number") {
                    return bVal - aVal;
                }
                return String(aVal).localeCompare(String(bVal));
            });
        }

        return foods;
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
        const result = await callBackendApi<Ingredient>(`/api/Foods/${id}`);
        return result;
    } catch (error) {
        console.error("Failed to get ingredient:", error);
        return null;
    }
}

/**
 * Add a new ingredient (food) via the backend API - Client-side version
 * This must run on the client to access JWT tokens for authentication
 */
export async function addIngredient(data: {
    name: string;
    brand?: string;
    barcode?: string;
    servingSize: number;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
}): Promise<Ingredient> {
    const result = await callBackendApi<{ id: string }>("/api/Foods", {
        method: "POST",
        body: JSON.stringify({
            name: data.name,
            brand: data.brand || null,
            barcode: data.barcode || null,
            servingSize: data.servingSize,
            servingUnit: "g",
            caloriesPer100g: data.calories,
            proteinPer100g: data.protein || 0,
            carbsPer100g: data.carbs || 0,
            fatPer100g: data.fat || 0,
            fiberPer100g: data.fiber || null,
        }),
    });

    return {
        id: result.id,
        name: data.name,
        brand: data.brand,
        barcode: data.barcode,
        servingSize: data.servingSize,
        servingUnit: "g",
        caloriesPer100g: data.calories,
        proteinPer100g: data.protein || 0,
        carbsPer100g: data.carbs || 0,
        fatPer100g: data.fat || 0,
        fiberPer100g: data.fiber,
        isVerified: false,
    };
}
