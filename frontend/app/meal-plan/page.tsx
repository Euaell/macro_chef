import { getUserServer } from "@/helper/session";
import Link from "next/link";
import { getWeeklyMealPlans } from "@/data/mealPlan";
import { getMeal } from "@/data/meal";
import MealPlanningCalendarWrapper from "@/components/MealPlanningCalendarWrapper";

export default async function MealPlanPage() {
	const user = await getUserServer();
	const mealsAggregate = await getMeal(user._id);

	try {
		const mealPlans = await getWeeklyMealPlans(user._id);

		const plannedMeals = mealPlans.map(mealPlan => {
			const sanitizedRecipes = mealPlan.recipes.map(item => ({
				recipe: {
					_id: item.recipe._id.toString(),
					name: item.recipe.name
				},
				servings: item.servings,
				mealTime: item.mealTime
			}));

			return {
				_id: mealPlan._id.toString(),
				date: mealPlan.date,
				recipes: sanitizedRecipes,
				totalCalories: mealPlan.totalMacros?.calories || 0
			};
		});

		return (
			<div className="space-y-6">
				{/* Page Header */}
				<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
					<div>
						<h1 className="text-2xl font-bold text-slate-900">Meal Planning</h1>
						<p className="text-slate-500 mt-1">Plan your meals for the week ahead</p>
					</div>
					<div className="flex gap-3">
						<Link href="/meal-plan/shopping-list" className="btn-secondary">
							<i className="ri-shopping-cart-line" />
							Shopping List
						</Link>
						<Link href="/meal-plan/add" className="btn-primary">
							<i className="ri-add-line" />
							Add Meal
						</Link>
					</div>
				</div>

				{/* Quick Stats */}
				<div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
					{[
						{ label: "Meals Planned", value: plannedMeals.length, icon: "ri-calendar-check-line", color: "from-brand-400 to-brand-600" },
						{ label: "This Week", value: plannedMeals.filter(m => new Date(m.date) >= new Date()).length, icon: "ri-calendar-line", color: "from-accent-400 to-accent-600" },
						{ label: "Recipes Used", value: new Set(plannedMeals.flatMap(m => m.recipes.map(r => r.recipe._id))).size, icon: "ri-restaurant-line", color: "from-violet-400 to-violet-600" },
						{ label: "Avg. Calories", value: Math.round(plannedMeals.reduce((a, b) => a + b.totalCalories, 0) / (plannedMeals.length || 1)), icon: "ri-fire-line", color: "from-orange-400 to-orange-600" },
					].map((stat) => (
						<div key={stat.label} className="card p-4">
							<div className="flex items-center gap-3">
								<div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
									<i className={`${stat.icon} text-white`} />
								</div>
								<div>
									<p className="text-2xl font-bold text-slate-900">{stat.value}</p>
									<p className="text-xs text-slate-500">{stat.label}</p>
								</div>
							</div>
						</div>
					))}
				</div>

				{/* Calendar */}
				<div className="card p-6">
					<MealPlanningCalendarWrapper
						initialMeals={mealsAggregate}
						initialPlannedMeals={plannedMeals}
					/>
				</div>
			</div>
		);
	} catch (error) {
		console.error("Error loading meal plans:", error);

		return (
			<div className="space-y-6">
				<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
					<div>
						<h1 className="text-2xl font-bold text-slate-900">Meal Planning</h1>
						<p className="text-slate-500 mt-1">Plan your meals for the week ahead</p>
					</div>
					<Link href="/meal-plan/add" className="btn-primary">
						<i className="ri-add-line" />
						Add Meal
					</Link>
				</div>

				<div className="card p-6">
					<div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 text-red-600">
						<i className="ri-error-warning-line text-xl" />
						<p>An error occurred loading your meal plans. Please try again later.</p>
					</div>
				</div>
			</div>
		);
	}
}
