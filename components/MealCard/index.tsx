"use client";

import Meal from "@/types/meal";
import MealTypePill from "./MealTypePill";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";

interface MealCardProps {
  meal: Meal;
}

export default function MealCard({ meal }: MealCardProps) {
	const router = useRouter();
	const [showConfirm, setShowConfirm] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const popupRef = useRef<HTMLDivElement>(null);

	// Close confirmation popup when clicking outside
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
				setShowConfirm(false);
			}
		};

		if (showConfirm) {
			document.addEventListener("mousedown", handleClickOutside);
		} else {
			document.removeEventListener("mousedown", handleClickOutside);
		}

		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, [showConfirm]);

	// Handle delete action
	async function handleDelete() {
		setIsLoading(true);
		try {
			const res = await fetch(`/api/meals/${meal._id}`, {
				method: "DELETE",
			});
			if (res.ok) {
				setIsLoading(false);
				setShowConfirm(false);
				router.refresh();
			} else {
				setIsLoading(false);
				console.error("Error deleting meal");
			}
		} catch (error) {
			setIsLoading(false);
			console.error("Error deleting meal: ", error);
		}
	}

	return (
		<div className="bg-white rounded-lg shadow-md p-4 min-w-fit relative">
			<div className="flex flex-row justify-between items-center">
				<h2 className="text-lg font-semibold">{meal.name}</h2>
				<button
					className="text-red-500 hover:text-red-700 transition-colors duration-200 focus:outline-none"
					onClick={() => setShowConfirm(true)}
					disabled={isLoading}
				>
					<i className="ri-delete-bin-6-line"></i>
				</button>
			</div>

			<MealTypePill mealType={meal.mealType} />

			<div className="grid grid-cols-2 gap-4 mt-4 text-sm">
				<div>
					<p className="text-gray-500">Calories</p>
					<p className="font-semibold">{meal.totalMacros.calories}</p>
				</div>
				<div>
					<p className="text-gray-500">Protein</p>
					<p className="font-semibold">{meal.totalMacros.protein}</p>
				</div>
				<div>
					<p className="text-gray-500">Carbs</p>
					<p className="font-semibold">{meal.totalMacros.carbs}</p>
				</div>
				<div>
					<p className="text-gray-500">Fat</p>
					<p className="font-semibold">{meal.totalMacros.fat}</p>
				</div>
			</div>

		{/* Confirmation popup */}
		{showConfirm && (
			<div className="fixed inset-0 flex items-center justify-center bg-gray-500 bg-opacity-75 z-50">
				<div ref={popupRef} className="bg-white p-6 rounded shadow-lg max-w-sm w-full">
					<p className="text-gray-800 text-lg font-semibold">
						Confirm Deletion
					</p>
					<p className="mt-2 text-gray-600">
						Are you sure you want to delete this meal?
					</p>
					<div className="mt-4 flex justify-end space-x-2 text-sm">
						<button
							className="px-4 py-2 rounded bg-gray-500 hover:bg-gray-600 text-white"
							onClick={() => setShowConfirm(false)}
							disabled={isLoading}
						>
							Cancel
						</button>
						<button
							className="px-4 py-2 rounded bg-red-600 hover:bg-red-700 text-white flex items-center"
							onClick={handleDelete}
							disabled={isLoading}
						>
							{isLoading && (
								<svg
									className="w-4 h-4 mr-2 animate-spin"
									fill="none"
									viewBox="0 0 24 24"
								>
									<circle
										className="opacity-25"
										cx="12"
										cy="12"
										r="10"
										stroke="currentColor"
										strokeWidth="4"
									></circle>
									<path
										className="opacity-75"
										fill="currentColor"
										d="M4 12a8 8 0 018-8v8H4z"
									></path>
								</svg>
							)}
							{isLoading ? "Deleting..." : "Delete"}
						</button>
					</div>
				</div>
			</div>
		)}
		</div>
	)
}
