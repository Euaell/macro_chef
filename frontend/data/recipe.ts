"use server";

import { apiClient } from "@/lib/auth-client";
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
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
    tags?: string[];
    createdAt: Date;
}

/**
 * Get popular recipes for the homepage from the backend API.
 */
export async function getPopularRecipes(): Promise<PopularRecipe[]> {
    try {
        const result = await apiClient<{ recipes: Recipe[] }>("/api/Recipes?IncludePublic=true&PageSize=6");

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
        console.error("Failed to get popular recipes:", error);
        return [];
    }
}

/**
 * Get all recipes with optional search term
 */
export async function getAllRecipes(searchTerm?: string): Promise<Recipe[]> {
    try {
        const params = new URLSearchParams();
        if (searchTerm) params.append("SearchTerm", searchTerm);
        params.append("IncludePublic", "true");

        const result = await apiClient<{ recipes: Recipe[] }>(`/api/Recipes?${params.toString()}`);
        return result.recipes || [];
    } catch (error) {
        console.error("Failed to get all recipes:", error);
        return [];
    }
}

/**
 * Get a recipe by ID from the backend API.
 */
export async function getRecipeById(recipeId: string): Promise<Recipe | null> {
    try {
        const result = await apiClient<Recipe>(`/api/Recipes/${recipeId}`);
        return result;
    } catch (error) {
        console.error("Failed to get recipe:", error);
        return null;
    }
}
