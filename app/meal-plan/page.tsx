import { getUserServer } from "@/helper/session";
import MealPlanningCalendar from "@/components/MealPlanningCalendar";
import Link from "next/link";
import { getWeeklyMealPlans } from "@/data/mealPlan";
import { getMeal } from "@/data/meal";
import { format } from "date-fns";

export default async function MealPlanPage() {
  const user = await getUserServer();
  const mealsAggregate = await getMeal(user._id);
  const mealPlans = await getWeeklyMealPlans(user._id);
  
  // Transform meal plans into the format expected by the MealPlanningCalendar component
  const plannedMeals = mealPlans.map(mealPlan => ({
    date: mealPlan.date,
    recipes: mealPlan.recipes.map(item => item.recipe),
    totalCalories: mealPlan.totalMacros.calories
  }));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold">Meal Planning</h1>
        <div className="flex gap-3">
          <Link 
            href="/meal-plan/add" 
            className="bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm sm:text-base"
          >
            Add to Meal Plan
          </Link>
          <Link 
            href="/meal-plan/shopping-list" 
            className="bg-emerald-100 text-emerald-700 px-4 py-2 rounded-lg text-sm sm:text-base"
          >
            Shopping List
          </Link>
        </div>
      </div>

      <div className="w-full">
        <MealPlanningCalendar 
          perDayMeals={mealsAggregate} 
          plannedMeals={plannedMeals}
        />
      </div>
    </div>
  );
} 