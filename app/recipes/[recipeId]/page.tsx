import RecipeOptions from "@/components/RecipeOptions";
import { getRecipeById } from "@/data/recipe";
import { getUserServer } from "@/helper/session";

export default async function Page({ params }: { params: Promise<{ recipeId: string }> }) {
	const { recipeId } = await params;
	
	const user = await getUserServer();
	const recipe = await getRecipeById(recipeId);

	if (!recipe) {
		return <div>Recipe not found</div>;
	}

	const isCreator = recipe.creator && recipe.creator._id.toString() === user._id.toString();
	
	return (
		<div>
			<div className="flex justify-between items-center">
				<h1 className="text-2xl font-bold">{recipe.name}</h1>
				{isCreator && <RecipeOptions recipeId={recipe.id.toString()} />}
			</div>

			{recipe.creator && <p>Created by {recipe.creator.email}</p>}

			{/* Images */}
			{recipe.images && recipe.images.length > 0 && (
				<div className="recipe-images flex space-x-2">
					{recipe.images.map((image, index) => (
						<img key={index} src={image} alt={`${recipe.name} image`} className="w-32 h-32 object-cover" />
					))}
				</div>
			)}

			{/* Description */}
			{recipe.description && <p className="mt-4">{recipe.description}</p>}

			{/* Ingredients */}
			<h2 className="text-xl font-bold mt-4">Ingredients</h2>
			<ul className="list-disc list-inside">
				{recipe.ingredients.map((item, index) => (
					<li key={index}>
						{item.amount} {item.unit} {item.ingredient.name}
					</li>
				))}
			</ul>

			{/* Macros per Serving */}
			<h2 className="text-xl font-bold mt-4">Macros per Serving</h2>
			<ul>
				<li>
					Calories:{" "}
					{Math.round((recipe.totalMacros.calories / recipe.servings) * 100) / 100}
				</li>
				<li>
					Protein:{" "}
					{Math.round((recipe.totalMacros.protein / recipe.servings) * 100) / 100}g
				</li>
				<li>
					Carbs: {Math.round((recipe.totalMacros.carbs / recipe.servings) * 100) / 100}g
				</li>
				<li>
					Fat: {Math.round((recipe.totalMacros.fat / recipe.servings) * 100) / 100}g
				</li>
				<li>
					Fiber: {Math.round((recipe.totalMacros.fiber / recipe.servings) * 100) / 100}g
				</li>
			</ul>

			{/* Instructions */}
			<h2 className="text-xl font-bold mt-4">Instructions</h2>
			<ol className="list-decimal list-inside">
				{recipe.instructions.map((instruction, index) => (
					<li key={index}>{instruction}</li>
				))}
			</ol>

			{/* Tags */}
			{recipe.tags && recipe.tags.length > 0 && (
				<div className="tags mt-4 space-x-2">
					{recipe.tags.map((tag, index) => (
						<span key={index} className="inline-block bg-gray-200 rounded-full px-3 py-1 text-sm font-medium text-gray-700">
							{tag}
						</span>
					))}
				</div>
			)}
		</div>
	)
}
