import AddMealFromRecipe from "@/components/AddMealFromRecipe";
import { getRecipeById } from "@/data/recipe";
import Link from "next/link";

export default async function Page({ params }: { params: Promise<{ recipeId: string }> }) {
	const { recipeId } = await params;
	const recipe = await getRecipeById(recipeId);

	if (!recipe) {
		return (
			<div className="min-h-[50vh] flex flex-col items-center justify-center">
				<div className="w-20 h-20 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
					<i className="ri-restaurant-line text-4xl text-slate-400" />
				</div>
				<h2 className="text-xl font-semibold text-slate-900 mb-2">Recipe not found</h2>
				<p className="text-slate-500 mb-6">The recipe you&apos;re trying to log doesn&apos;t exist.</p>
				<Link href="/recipes" className="btn-primary">
					<i className="ri-arrow-left-line" />
					Browse Recipes
				</Link>
			</div>
		);
	}

	return (
		<div className="max-w-3xl mx-auto space-y-6">
			{/* Header */}
			<div className="flex items-center gap-4">
				<Link href={`/recipes/${recipeId}`} className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors">
					<i className="ri-arrow-left-line text-xl text-slate-600" />
				</Link>
				<div>
					<h1 className="text-2xl font-bold text-slate-900">Log from Recipe</h1>
					<p className="text-slate-500">Add &quot;{recipe.name}&quot; to your food diary</p>
				</div>
			</div>

			{/* Recipe Info Card */}
			<div className="card p-6 bg-gradient-to-br from-brand-50 to-accent-50">
				<div className="flex items-center gap-4 mb-4">
					<div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center">
						<i className="ri-restaurant-2-line text-xl text-brand-600" />
					</div>
					<div>
						<h2 className="font-semibold text-slate-900">{recipe.name}</h2>
						<p className="text-sm text-slate-600">{recipe.servings} servings</p>
					</div>
				</div>
				<div className="grid grid-cols-5 gap-2">
					<div className="text-center p-2 bg-white rounded-lg">
						<p className="text-lg font-bold text-orange-600">{recipe.totalMacros.calories.toFixed(0)}</p>
						<p className="text-xs text-slate-500">cal</p>
					</div>
					<div className="text-center p-2 bg-white rounded-lg">
						<p className="text-lg font-bold text-red-600">{recipe.totalMacros.protein.toFixed(1)}g</p>
						<p className="text-xs text-slate-500">protein</p>
					</div>
					<div className="text-center p-2 bg-white rounded-lg">
						<p className="text-lg font-bold text-amber-600">{recipe.totalMacros.carbs.toFixed(1)}g</p>
						<p className="text-xs text-slate-500">carbs</p>
					</div>
					<div className="text-center p-2 bg-white rounded-lg">
						<p className="text-lg font-bold text-yellow-600">{recipe.totalMacros.fat.toFixed(1)}g</p>
						<p className="text-xs text-slate-500">fat</p>
					</div>
					<div className="text-center p-2 bg-white rounded-lg">
						<p className="text-lg font-bold text-green-600">{recipe.totalMacros.fiber.toFixed(1)}g</p>
						<p className="text-xs text-slate-500">fiber</p>
					</div>
				</div>
			</div>

			{/* Form Component */}
			<AddMealFromRecipe name={recipe.name} macros={recipe.totalMacros} />
		</div>
	);
}
