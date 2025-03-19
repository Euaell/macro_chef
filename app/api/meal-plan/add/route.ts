import { NextRequest, NextResponse } from "next/server";
import MealPlan from "@/model/mealPlan";
import MongoDBClient from "@/mongo/client";
import { getUserServer } from "@/helper/session";
import Recipe from "@/model/recipe";
import { Schema } from "mongoose";

// Define types for the request body
interface MealPlanRecipeItem {
  recipeId: string;
  servings: number;
  mealTime: string;
}

interface MealPlanRequestBody {
  date: string;
  recipes: MealPlanRecipeItem[];
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserServer();
    const body = await request.json() as MealPlanRequestBody;
    
    const { date, recipes } = body;

    // Connect to MongoDB
    await MongoDBClient();

    // Calculate total macros
    const totalMacros = {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: 0
    };

    // Get recipe details from database to calculate macros
    for (const item of recipes) {
      try {
        const recipe = await Recipe.findById(item.recipeId);
        if (recipe) {
          const servingRatio = item.servings / recipe.servings;
          totalMacros.calories += recipe.totalMacros.calories * servingRatio;
          totalMacros.protein += recipe.totalMacros.protein * servingRatio;
          totalMacros.carbs += recipe.totalMacros.carbs * servingRatio;
          totalMacros.fat += recipe.totalMacros.fat * servingRatio;
          totalMacros.fiber += recipe.totalMacros.fiber * servingRatio;
        }
      } catch (error) {
        console.error(`Error processing recipe ${item.recipeId}:`, error);
      }
    }

    // Create meal plan
    const recipeData = recipes.map(item => ({
      recipe: item.recipeId,
      servings: item.servings,
      mealTime: item.mealTime
    }));

    const mealPlan = await MealPlan.create({
      date: new Date(date),
      recipes: recipeData,
      totalMacros,
      user: user._id
    });

    return NextResponse.json({ 
      success: true, 
      message: "Meal plan created successfully",
      mealPlanId: mealPlan._id 
    });
  } catch (error: any) {
    console.error('Error creating meal plan:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Failed to create meal plan'
    }, { status: 500 });
  }
} 