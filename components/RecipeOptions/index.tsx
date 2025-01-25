
"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface RecipeOptionsProps {
	recipeId: string;
	isCreator: boolean;
}

export default function RecipeOptions({ recipeId, isCreator }: RecipeOptionsProps) {
	const router = useRouter();
	const [showConfirm, setShowConfirm] = useState(false);

	const handleDelete = async () => {
		const res = await fetch(`/api/recipes/${recipeId}`, {
			method: 'DELETE',
		});

		if (res.ok) {
			router.push('/recipes');
		} else {
			alert('Failed to delete the recipe');
		}
	};

	const confirmDelete = () => {
		setShowConfirm(true);
	};

	const cancelDelete = () => {
		setShowConfirm(false);
	};

	return (
		<div className="relative inline-block text-left">
			<button type="button" className="btn btn-secondary">
				Options
			</button>
			{/* Options dropdown */}
			<div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white">
				<div className="py-1">
					<Link href={`/meals/add/${recipeId}`} className="block px-4 py-2 text-gray-700 hover:bg-gray-100">
						Add to Meal
					</Link>
					<div className="border-t border-gray-200"></div>
					
					{isCreator && (
						<div>
							<Link href={`/recipes/${recipeId}/edit`} className="block px-4 py-2 text-gray-700 hover:bg-gray-100">
								Edit
							</Link>
							<button onClick={confirmDelete} className="block w-full text-left px-4 py-2 text-red-700 hover:bg-gray-100">
								Delete
							</button>
						</div>
					)}					
				</div>
			</div>

			{/* Confirmation popup */}
			{showConfirm && (
				<div className="fixed inset-0 flex items-center justify-center bg-gray-500 bg-opacity-75 z-50">
					<div className="bg-white p-4 rounded shadow-lg">
						<p>Are you sure you want to delete this recipe?</p>
						<div className="mt-4 flex justify-end space-x-2 text-white text-sm">
							<button className="bg-slate-500 px-5 py-2 rounded hover:bg-slate-700" onClick={cancelDelete}>
								Cancel
							</button>
							<button className="bg-red-600 px-5 py-2 rounded hover:bg-amber-800" onClick={handleDelete}>
								Delete
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	)
}
