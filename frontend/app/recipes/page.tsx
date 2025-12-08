import Link from "next/link";
import Image from "next/image";
import placeHolderImage from "@/public/placeholder-recipe.jpg";
import RecipeMoreButton from "@/components/Recipes/RecipeMoreButton";
import { getAllRecipes } from "@/data/recipe";
import { getUserOptionalServer } from "@/helper/session";

export default async function Page() {
	const recipes = await getAllRecipes();
	const user = await getUserOptionalServer();

	return (
		<div className="space-y-8">
			{/* Page Header */}
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
				<div>
					<h1 className="text-2xl font-bold text-slate-900">Recipes</h1>
					<p className="text-slate-500 mt-1">Discover and create delicious healthy meals</p>
				</div>
				<Link href="/recipes/add" className="btn-primary">
					<i className="ri-add-line" />
					Create Recipe
				</Link>
			</div>

			{/* Quick Collections */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
				{[
					{ name: "Favorites", icon: "ri-heart-3-line", count: 12, color: "from-rose-400 to-rose-600" },
					{ name: "My Recipes", icon: "ri-restaurant-line", count: 8, color: "from-brand-400 to-brand-600" },
					{ name: "Recent", icon: "ri-history-line", count: 5, color: "from-violet-400 to-violet-600" },
				].map((collection) => (
					<div key={collection.name} className="card-hover p-5 group cursor-pointer">
						<div className="flex items-center gap-4">
							<div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${collection.color} flex items-center justify-center shadow-lg`}>
								<i className={`${collection.icon} text-xl text-white`} />
							</div>
							<div className="flex-1">
								<h3 className="font-semibold text-slate-900">{collection.name}</h3>
								<p className="text-sm text-slate-500">{collection.count} recipes</p>
							</div>
							<i className="ri-arrow-right-s-line text-xl text-slate-400 group-hover:text-brand-500 transition-colors" />
						</div>
					</div>
				))}
			</div>

			{/* Create Recipe CTA */}
			<div className="card overflow-hidden">
				<div className="relative p-8 bg-gradient-to-br from-accent-50 to-brand-50">
					<div className="absolute top-0 right-0 w-64 h-64 bg-brand-200/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
					<div className="relative flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
						<div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent-400 to-accent-600 flex items-center justify-center shadow-lg shadow-accent-500/30">
							<i className="ri-restaurant-2-line text-3xl text-white" />
						</div>
						<div className="flex-1">
							<h3 className="text-xl font-bold text-slate-900 mb-1">Create Your Own Recipe</h3>
							<p className="text-slate-600">Share your favorite healthy meals with the community</p>
						</div>
						<Link href="/recipes/add" className="btn-secondary whitespace-nowrap">
							<i className="ri-add-line" />
							Add Recipe
						</Link>
					</div>
				</div>
			</div>

			{/* All Recipes */}
			<div className="card p-6">
				<div className="flex items-center justify-between mb-6">
					<h2 className="section-title">All Recipes</h2>
					<div className="flex items-center gap-2">
						<button className="btn-secondary text-sm px-3 py-1.5">
							<i className="ri-filter-3-line" />
							Filter
						</button>
						<button className="btn-secondary text-sm px-3 py-1.5">
							<i className="ri-sort-desc" />
							Sort
						</button>
					</div>
				</div>

				{recipes.length > 0 ? (
					<div className="space-y-4">
						{recipes.map((recipe) => (
							<Link
								key={recipe._id.toString()}
								href={`/recipes/${recipe._id}`}
								className="group flex flex-col sm:flex-row bg-slate-50 hover:bg-slate-100 rounded-2xl overflow-hidden transition-all duration-300"
							>
								<div className="sm:w-48 h-48 sm:h-auto relative bg-slate-200">
									<Image
										src={recipe.images[0] || placeHolderImage}
										alt={recipe.name}
										fill
										className="object-cover group-hover:scale-105 transition-transform duration-300"
									/>
								</div>
								<div className="flex-1 p-5">
									<div className="flex justify-between items-start gap-4">
										<div className="flex-1">
											<h3 className="text-lg font-semibold text-slate-900 group-hover:text-brand-600 transition-colors mb-2">
												{recipe.name}
											</h3>
											<p className="text-slate-600 text-sm line-clamp-2 mb-4">
												{recipe.description}
											</p>
										</div>
										{user && recipe.creator && recipe.creator._id.toString() === user._id.toString() && (
											<RecipeMoreButton recipeId={recipe._id} />
										)}
									</div>

									{/* Macro Pills */}
									<div className="flex flex-wrap gap-2">
										<span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-100 text-orange-700 text-sm font-medium">
											<i className="ri-fire-line" />
											{recipe.totalMacros.calories.toFixed(0)} kcal
										</span>
										<span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-100 text-red-700 text-sm font-medium">
											<i className="ri-heart-pulse-line" />
											{recipe.totalMacros.protein.toFixed(1)}g protein
										</span>
										<span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-100 text-amber-700 text-sm font-medium">
											<i className="ri-bread-line" />
											{recipe.totalMacros.carbs.toFixed(1)}g carbs
										</span>
										<span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-yellow-100 text-yellow-700 text-sm font-medium">
											<i className="ri-drop-line" />
											{recipe.totalMacros.fat.toFixed(1)}g fat
										</span>
									</div>
								</div>
							</Link>
						))}
					</div>
				) : (
					<div className="text-center py-16">
						<div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
							<i className="ri-restaurant-line text-3xl text-slate-400" />
						</div>
						<h3 className="text-lg font-semibold text-slate-900 mb-2">No recipes yet</h3>
						<p className="text-slate-500 mb-6">Be the first to add a delicious recipe!</p>
						<Link href="/recipes/add" className="btn-primary">
							<i className="ri-add-line" />
							Create Recipe
						</Link>
					</div>
				)}
			</div>
		</div>
	);
}


