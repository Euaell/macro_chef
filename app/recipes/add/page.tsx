'use client';

import Ingredient from "@/types/ingredient";
import { Schema } from "mongoose";
// import Ingredient from "@/types/ingredient";
import { useState, useEffect } from "react";

type SelectedIngredient = {
	id: string | Schema.Types.ObjectId;
	name: string;
	amount: number | null;
	unit: "gram" | "ml";
}


export default function Page() {
	const [name, setName] = useState('');
	const [description, setDescription] = useState('');
	const [instructions, setInstructions] = useState('');
	const [selectedIngredients, setSelectedIngredients] = useState<SelectedIngredient[]>([]);
	const [servings, setServings] = useState(1);

	const [tags, setTags] = useState<Set<string>>(new Set<string>());
	const [currentTag, setCurrentTag] = useState('');

	const [ingredientSearch, setIngredientSearch] = useState<Ingredient[]>([]);

	function handleAddIngredient() {
		setSelectedIngredients([...selectedIngredients, { id: '', name: '', amount: null, unit: 'gram' }]);
	}

	function handleRemoveIngredient(index: number) {
		const newIngredients = selectedIngredients.filter((_, i) => i !== index);
		setSelectedIngredients(newIngredients);
	}

	// function handleIngredientChange(index: number, field: keyof SelectedIngredient, value: string | number) {
	// 	const newIngredients = [...ingredients];
	// 	newIngredients[index] = { ...newIngredients[index], [field]: value };
	// 	setIngredients(newIngredients);
	// }

	function handleIngredientNameChange(index: number, value: string) {
		const newIngredients = [...selectedIngredients];
		newIngredients[index] = { ...newIngredients[index], name: value };
		setSelectedIngredients(newIngredients);

		fetch(`/api/ingredients/${value}`)
		.then(res => res.json())
		.then(data => {
			const ingredients = data.ingredients;
			setIngredientSearch(ingredients);
		})
	}

	function handleAddTag(e: React.KeyboardEvent<HTMLInputElement>) {
		if (e.key === 'Enter' && currentTag.trim()) {
			e.preventDefault();
			// setTags([...tags, currentTag.trim()]);
			setTags(new Set([...tags, currentTag.trim().toUpperCase()]));
			setCurrentTag('');
		}
	}

	function handleRemoveTag(tagToRemove: string) {
		// setTags(tags.filter(tag => tag !== tagToRemove));
		const newTags = new Set(tags);
		newTags.delete(tagToRemove);
		setTags(newTags);
	}

	function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		const recipeData = {
			name,
			description,
			selectedIngredients,
			instructions: instructions.split('\n').filter(line => line.trim()),
			servings,
			tags,
		}
		// Add your API call here
		console.log(recipeData);
	}

	return (
		<div className="max-w-4xl mx-auto p-6">
			<h1 className="text-3xl font-bold mb-6">Add New Recipe</h1>
			<form onSubmit={handleSubmit} className="space-y-6">
				{/* Basic Information */}
				<div className="space-y-4">
					<div>
						<label className="block text-sm font-medium mb-1" htmlFor="recipe_name">Recipe Name</label>
						<input
							id="recipe_name"
							name="recipe_name"
							type="text"
							value={name}
							onChange={(e) => setName(e.target.value)}
							className="w-full p-2 border rounded-md"
							required
						/>
					</div>
					<div>
						<label className="block text-sm font-medium mb-1" htmlFor="description">Description</label>
						<textarea
							id="description"
							name="description"
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							className="w-full p-2 border rounded-md"
							rows={3}
							required
						/>
					</div>
				</div>

				{/* Ingredients */}
				<div>
					<label className="block text-sm font-medium mb-2">Ingredients</label>
					<div className="space-y-2">
						{selectedIngredients.map((ing, index) => (
							<div key={index} className="flex gap-2 items-center">
								<input
									type="text"
									placeholder="Ingredient name"
									value={ing.name}
									onChange={(e) => handleIngredientNameChange(index, e.target.value)}
									className="flex-grow p-2 border rounded-md"
								/>
								<input
									type="number"
									placeholder="Amount"
									value={ing.amount?.toString() || ''}
									// onChange={(e) => handleIngredientChange(index, 'amount', parseFloat(e.target.value))}
									className="w-24 p-2 border rounded-md"
								/>
								<input
									type="text"
									placeholder="Unit"
									defaultValue={ing.unit}
									disabled
									className="w-24 p-2 rounded-md"
								/>
								<button
									type="button"
									onClick={() => handleRemoveIngredient(index)}
									className="p-2 text-red-500"
								>
									<i className="ri-close-large-line"></i>
								</button>
							</div>
						))}
						<button
							type="button"
							onClick={handleAddIngredient}
							className="flex items-center gap-2 text-emerald-700"
						>
							<i className="ri-add-line"></i>
							Add Ingredient
						</button>
					</div>
				</div>

				{/* Instructions */}
				<div>
					<label className="block text-sm font-medium mb-1" htmlFor="instructions">Instructions</label>
					<textarea
						id="instructions"
						name="instructions"
						value={instructions}
						onChange={(e) => setInstructions(e.target.value)}
						className="w-full p-2 border rounded-md"
						rows={6}
						placeholder="Enter each instruction on a new line"
					/>
				</div>

				{/* Servings */}
				<div>
					<label className="block text-sm font-medium mb-1" htmlFor="servings">Servings</label>
					<input
						id="servings"
						name="servings"
						type="number"
						value={servings}
						onChange={(e) => setServings(parseInt(e.target.value))}
						className="w-24 p-2 border rounded-md"
						min="1"
					/>
				</div>

				{/* Tags */}
				<div>
					<label className="block text-sm font-medium mb-1" htmlFor="tag">Tags</label>
					<div className="flex flex-wrap gap-2 mb-2">
						{/* {tags.map((tag, index) => ( */}
						{Array.from(tags).map((tag, index) => (
							<span
								key={index}
								className="bg-orange-100 text-sm px-2 py-1 rounded-md flex items-center gap-1"
							>
								{tag}
								<button
									type="button"
									onClick={() => handleRemoveTag(tag)}
									className="text-orange-500"
								>
									{/* <X size={16} /> */}
									<i className="ri-close-large-line"></i>
								</button>
							</span>
						))}
					</div>
					<input
						id="tag"
						name="tag"
						type="text"
						value={currentTag}
						onChange={(e) => setCurrentTag(e.target.value)}
						onKeyDown={handleAddTag}
						className="w-full p-2 border rounded-md"
						placeholder="Type tag and press Enter"
					/>
				</div>

				<button
					type="submit"
					className="w-full bg-emerald-700 text-white py-2 px-4 rounded-md hover:bg-emerald-600"
				>
					Add Recipe
				</button>
			</form>
		</div>
	)
}
