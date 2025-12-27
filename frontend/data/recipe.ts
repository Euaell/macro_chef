"use server";

import { callBackendApi } from "@/lib/backend-api-client";
import { createErrorState, createSuccessState, FormState } from "@/helper/FormErrorHandler";

export interface PopularRecipe {
    _id: string;
    name: string;
    totalMacros: {
        calories: number;
        protein: number;
        carbs: number;
        fat: number;
    };
}

export interface Recipe {
    id: string;
    title: string;
    description?: string;
    servings: number;
    prepTimeMinutes?: number;
    cookTimeMinutes?: number;
    imageUrl?: string;
    isPublic: boolean;
    isOwner?: boolean;
    isFavorited?: boolean;
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
    fiber?: number;
    tags?: string[];
    ingredients?: RecipeIngredient[];
    instructions?: string[];
    createdAt: Date;
}

export interface RecipeIngredient {
    ingredientText: string;
    foodName?: string;
    amount?: number;
    unit?: string;
}

/**
 * Get popular recipes for the homepage from the backend API.
 */
export async function getPopularRecipes(): Promise<PopularRecipe[]> {
    try {
        const result = await callBackendApi<{ recipes: Recipe[] }>("/api/Recipes?IncludePublic=true&PageSize=6");

        return (result.recipes || []).map((r) => ({
            _id: r.id,
            name: r.title,
            totalMacros: {
                calories: r.calories || 0,
                protein: r.protein || 0,
                carbs: r.carbs || 0,
                fat: r.fat || 0,
            },
        }));
    } catch (error) {
        // If not authenticated, return empty array (public recipes require auth in BFF)
        console.error("Failed to get popular recipes:", error);
        return [];
    }
}

/**
 * Get all recipes with optional search term
 */
export async function getAllRecipes(searchTerm?: string, page: number = 1, limit: number = 20): Promise<{ recipes: Recipe[], totalCount: number, totalPages: number }> {
    try {
        const params = new URLSearchParams();
        if (searchTerm) params.append("SearchTerm", searchTerm);
        params.append("IncludePublic", "true");
        params.append("Page", page.toString());
        params.append("PageSize", limit.toString());

        const result = await callBackendApi<{ recipes: Recipe[], totalCount: number, page: number, pageSize: number }>(`/api/Recipes?${params.toString()}`);

        const totalPages = Math.ceil((result.totalCount || 0) / limit);

        return {
            recipes: result.recipes || [],
            totalCount: result.totalCount || 0,
            totalPages
        };
    } catch (error) {
        console.error("Failed to get all recipes:", error);
        return { recipes: [], totalCount: 0, totalPages: 0 };
    }
}

/**
 * Get a recipe by ID from the backend API.
 */
export async function getRecipeById(recipeId: string): Promise<Recipe | null> {
    try {
        const result = await callBackendApi<Recipe>(`/api/Recipes/${recipeId}`);
        return result;
    } catch (error) {
        console.error("Failed to get recipe:", error);
        return null;
    }
}
