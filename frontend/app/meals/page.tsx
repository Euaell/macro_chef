import { getTodayMeal } from "@/data/meal";
import MealMacrosChart from "@/components/MealMacrosChart";
import Link from "next/link";
import { getUserServer } from "@/helper/session";

export const dynamic = 'force-dynamic';

export default async function Page() {
	await getUserServer(); // Verify user is authenticated
	const todayMeals = await getTodayMeal();

	const totalCalories = todayMeals.reduce((sum, meal) => sum + (meal.calories || 0), 0);
	const totalProtein = todayMeals.reduce((sum, meal) => sum + (meal.proteinGrams || 0), 0);
	const totalCarbs = todayMeals.reduce((sum, meal) => sum + (meal.carbsGrams || 0), 0);
	const totalFat = todayMeals.reduce((sum, meal) => sum + (meal.fatGrams || 0), 0);

	return (
		<div className="space-y-6">
			{/* Page Header */}
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
				<div>
					<h1 className="text-2xl font-bold text-slate-900">Food Diary</h1>
					<p className="text-slate-500 mt-1">Track your daily nutrition intake</p>
				</div>
				<Link href="/meals/add" className="btn-primary">
					<i className="ri-add-line" />
					Log Meal
				</Link>
			</div>

			{/* Today's Intake Summary */}
			<div className="card p-6 bg-gradient-to-br from-brand-50 to-accent-50">
				<div className="flex items-center justify-between mb-4">
					<h2 className="font-semibold text-slate-900">Today&apos;s Intake</h2>
					<span className="text-sm text-slate-500 bg-white px-3 py-1 rounded-full">
						{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
					</span>
				</div>
				<div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
					<div className="text-center p-4 bg-white rounded-xl">
						<div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-2">
							<i className="ri-fire-line text-orange-600" />
						</div>
						<p className="text-2xl font-bold text-slate-900">{totalCalories.toFixed(0)}</p>
						<p className="text-xs text-slate-500">Calories</p>
					</div>
					<div className="text-center p-4 bg-white rounded-xl">
						<div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-2">
							<i className="ri-heart-pulse-line text-red-600" />
						</div>
						<p className="text-2xl font-bold text-slate-900">{totalProtein.toFixed(1)}g</p>
						<p className="text-xs text-slate-500">Protein</p>
					</div>
					<div className="text-center p-4 bg-white rounded-xl">
						<div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-2">
							<i className="ri-bread-line text-amber-600" />
						</div>
						<p className="text-2xl font-bold text-slate-900">{totalCarbs.toFixed(1)}g</p>
						<p className="text-xs text-slate-500">Carbs</p>
					</div>
					<div className="text-center p-4 bg-white rounded-xl">
						<div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center mx-auto mb-2">
							<i className="ri-drop-line text-yellow-600" />
						</div>
						<p className="text-2xl font-bold text-slate-900">{totalFat.toFixed(1)}g</p>
						<p className="text-xs text-slate-500">Fat</p>
					</div>
				</div>
			</div>

			{/* Today's Meals */}
			<div className="card p-6">
				<div className="flex items-center justify-between mb-4">
					<h2 className="font-semibold text-slate-900 flex items-center gap-2">
						<i className="ri-restaurant-2-line text-brand-500" />
						Today&apos;s Meals
					</h2>
					<span className="text-sm text-slate-500">{todayMeals.length} meals logged</span>
				</div>

				{todayMeals.length > 0 ? (
					<div className="space-y-3">
						{todayMeals.map((meal) => (
							<div key={meal.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
								<div>
									<h3 className="font-medium text-slate-900">{meal.name || meal.mealType}</h3>
									<p className="text-sm text-slate-500">{meal.mealType}</p>
								</div>
								<div className="text-right">
									<p className="font-semibold text-orange-600">{meal.calories || 0} kcal</p>
									<p className="text-xs text-slate-500">{meal.servings} serving(s)</p>
								</div>
							</div>
						))}
					</div>
				) : (
					<div className="text-center py-12">
						<div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
							<i className="ri-restaurant-line text-3xl text-slate-400" />
						</div>
						<h3 className="text-lg font-semibold text-slate-900 mb-2">No meals logged today</h3>
						<p className="text-slate-500 mb-4">Start tracking your nutrition by logging a meal</p>
						<Link href="/meals/add" className="btn-primary">
							<i className="ri-add-line" />
							Log Your First Meal
						</Link>
					</div>
				)}
			</div>
		</div>
	);
}
