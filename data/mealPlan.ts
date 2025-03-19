"use server";

import MealPlan from "@/model/mealPlan";
import MongoDBClient from "@/mongo/client";
import { ID } from "@/types/id";
import Macros from "@/types/macro";
import MealPlanType, { MealPlanInput, ShoppingListItem } from "@/types/mealPlan";
import { format, startOfWeek, endOfWeek, addDays } from "date-fns";
import RecipeType from "@/types/recipe";

export async function getUserMealPlans(userId: ID): Promise<MealPlanType[]> {
  await MongoDBClient();
  
  const mealPlans = await MealPlan.find({ user: userId })
    .populate({
      path: "recipes.recipe",
      model: "Recipe"
    });
  
  return mealPlans;
}

export async function getWeeklyMealPlans(userId: ID, date = new Date()): Promise<MealPlanType[]> {
  await MongoDBClient();
  
  const startDate = startOfWeek(date, { weekStartsOn: 1 });
  const endDate = endOfWeek(date, { weekStartsOn: 1 });
  
  const mealPlans = await MealPlan.find({
    user: userId,
    date: {
      $gte: startDate,
      $lte: endDate
    }
  }).populate({
    path: "recipes.recipe",
    model: "Recipe"
  });
  
  return mealPlans;
}

export async function addMealPlan(mealPlanInput: MealPlanInput, userId: ID): Promise<MealPlanType> {
  await MongoDBClient();
  
  // Calculate total macros
  const totalMacros: Macros = {
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    fiber: 0
  };
  
  for (const recipeItem of mealPlanInput.recipes) {
    const recipe = recipeItem.recipe as RecipeType;
    const servingRatio = recipeItem.servings / recipe.servings;
    
    totalMacros.calories += recipe.totalMacros.calories * servingRatio;
    totalMacros.protein += recipe.totalMacros.protein * servingRatio;
    totalMacros.carbs += recipe.totalMacros.carbs * servingRatio;
    totalMacros.fat += recipe.totalMacros.fat * servingRatio;
    totalMacros.fiber += recipe.totalMacros.fiber * servingRatio;
  }
  
  const mealPlan = await MealPlan.create({
    date: mealPlanInput.date,
    recipes: mealPlanInput.recipes.map(item => ({
      recipe: item.recipe._id,
      servings: item.servings,
      mealTime: item.mealTime
    })),
    totalMacros,
    user: userId
  });
  
  return mealPlan;
}

export async function generateShoppingList(userId: ID, date = new Date()): Promise<ShoppingListItem[]> {
  await MongoDBClient();
  
  const startDate = startOfWeek(date, { weekStartsOn: 1 });
  const endDate = endOfWeek(date, { weekStartsOn: 1 });
  
  // Get all meal plans for the week
  const mealPlans = await MealPlan.find({
    user: userId,
    date: {
      $gte: startDate,
      $lte: endDate
    }
  }).populate({
    path: "recipes.recipe",
    model: "Recipe",
    populate: {
      path: "ingredients.ingredient",
      model: "Ingredient"
    }
  });
  
  // Aggregate ingredients needed
  const ingredientsMap = new Map<string, ShoppingListItem>();
  
  for (const mealPlan of mealPlans) {
    for (const recipeItem of mealPlan.recipes) {
      const recipe = recipeItem.recipe as RecipeType;
      const servingRatio = recipeItem.servings / recipe.servings;
      
      for (const ingredientItem of recipe.ingredients) {
        // Skip if it's a sub-recipe (String comparison instead of boolean)
        if (ingredientItem.isRecipe === 'Recipe') continue;
        
        const ingredient = ingredientItem.ingredient;
        // Safely handle the case where ingredient might be a Recipe or an Ingredient
        const ingredientName = 'name' in ingredient ? ingredient.name : 'Unknown';
        const ingredientId = ingredient._id.toString();
        const amount = ingredientItem.amount * servingRatio;
        const category = 'category' in ingredient ? ingredient.category || 'Other' : 'Other';
        
        if (ingredientsMap.has(ingredientId)) {
          const existingItem = ingredientsMap.get(ingredientId)!;
          existingItem.amount += amount;
        } else {
          ingredientsMap.set(ingredientId, {
            ingredient: ingredientName,
            amount,
            unit: ingredientItem.unit,
            category
          });
        }
      }
    }
  }
  
  return Array.from(ingredientsMap.values());
} 