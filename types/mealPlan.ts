import { ID } from "./id";
import Macros from "./macro";
import Recipe from "./recipe";
import User from "./user";

export default interface MealPlan {
  _id: ID;
  date: Date;
  recipes: {
    recipe: Recipe;
    servings: number;
    mealTime: string; // breakfast, lunch, dinner, snack
  }[];
  totalMacros: Macros;
  user: User;
  createdAt: Date;
  updatedAt: Date;
}

export interface MealPlanInput {
  date: Date;
  recipes: {
    recipe: Recipe;
    servings: number;
    mealTime: string;
  }[];
}

export interface ShoppingListItem {
  ingredient: string;
  amount: number;
  unit: string;
  category: string; // protein, vegetables, dairy, etc.
}

export interface ShoppingList {
  startDate: Date;
  endDate: Date;
  items: ShoppingListItem[];
  user: User;
} 