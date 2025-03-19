import { getMeal } from "@/data/meal";
import { getUserServer } from "@/helper/session";
import MealPlanningCalendar from "@/components/MealPlanningCalendar";
import Link from "next/link";

export default async function MealPlanPage() {
  const user = await getUserServer();
  const mealsAggregate = await getMeal(user._id);
  
  // For now, we're using dummy data for planned meals
  // This would be replaced with actual data from a meal plan service
  const plannedMeals = [
    {
      date: new Date(), // Today
      recipes: [
        {
          _id: "1",
          name: "Chicken Stir Fry",
          totalMacros: { calories: 450, protein: 35, carbs: 30, fat: 15, fiber: 5 }
        },
        {
          _id: "2",
          name: "Protein Smoothie",
          totalMacros: { calories: 300, protein: 25, carbs: 35, fat: 5, fiber: 8 }
        }
      ],
      totalCalories: 750
    }
  ];

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
          plannedMeals={plannedMeals as any}
        />
      </div>
    </div>
  );
} 