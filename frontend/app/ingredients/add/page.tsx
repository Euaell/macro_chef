"use client";

import { FieldError } from "@/components/FieldError";
import { addIngredient } from "@/data/ingredient";
import { EMPTY_FORM_STATE } from "@/helper/FormErrorHandler";
import Link from "next/link";
import { useActionState } from "react";

export default function Page() {
	const [formState, action, isPending] = useActionState(addIngredient, EMPTY_FORM_STATE);

	return (
		<div className="max-w-3xl mx-auto space-y-6">
			{/* Header */}
			<div className="flex items-center gap-4">
				<Link href="/ingredients" className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors">
					<i className="ri-arrow-left-line text-xl text-slate-600" />
				</Link>
				<div>
					<h1 className="text-2xl font-bold text-slate-900">Add Ingredient</h1>
					<p className="text-slate-500">Add a new ingredient to the database</p>
				</div>
			</div>

			<form action={action} className="space-y-6">
				{/* Basic Info Card */}
				<div className="card p-6 space-y-5">
					<h2 className="font-semibold text-slate-900 flex items-center gap-2">
						<i className="ri-leaf-line text-brand-500" />
						Basic Information
					</h2>
					<div>
						<label htmlFor="name" className="label">Ingredient Name</label>
						<input
							type="text"
							id="name"
							name="name"
							className="input"
							placeholder="e.g., Chicken Breast, Brown Rice"
							required
						/>
						<FieldError formState={formState} name="name" />
					</div>
				</div>

				{/* Nutrition Card */}
				<div className="card p-6 space-y-5">
					<h2 className="font-semibold text-slate-900 flex items-center gap-2">
						<i className="ri-heart-pulse-line text-brand-500" />
						Nutritional Information
					</h2>

					<div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
						<div>
							<label htmlFor="calories" className="label">
								<span className="flex items-center gap-1.5">
									<span className="w-2 h-2 rounded-full bg-orange-500" />
									Calories (kcal)
								</span>
							</label>
							<input
								type="number"
								id="calories"
								name="calories"
								min={0}
								defaultValue={0}
								className="input"
							/>
							<FieldError formState={formState} name="calories" />
						</div>
						<div>
							<label htmlFor="protein" className="label">
								<span className="flex items-center gap-1.5">
									<span className="w-2 h-2 rounded-full bg-red-500" />
									Protein (g)
								</span>
							</label>
							<input
								type="number"
								id="protein"
								name="protein"
								min={0}
								step="0.1"
								defaultValue={0}
								className="input"
							/>
							<FieldError formState={formState} name="protein" />
						</div>
						<div>
							<label htmlFor="carbs" className="label">
								<span className="flex items-center gap-1.5">
									<span className="w-2 h-2 rounded-full bg-amber-500" />
									Carbs (g)
								</span>
							</label>
							<input
								type="number"
								id="carbs"
								name="carbs"
								min={0}
								step="0.1"
								defaultValue={0}
								className="input"
							/>
							<FieldError formState={formState} name="carbs" />
						</div>
						<div>
							<label htmlFor="fat" className="label">
								<span className="flex items-center gap-1.5">
									<span className="w-2 h-2 rounded-full bg-yellow-500" />
									Fat (g)
								</span>
							</label>
							<input
								type="number"
								id="fat"
								name="fat"
								min={0}
								step="0.1"
								defaultValue={0}
								className="input"
							/>
							<FieldError formState={formState} name="fat" />
						</div>
						<div>
							<label htmlFor="fiber" className="label">
								<span className="flex items-center gap-1.5">
									<span className="w-2 h-2 rounded-full bg-green-500" />
									Fiber (g)
								</span>
							</label>
							<input
								type="number"
								id="fiber"
								name="fiber"
								min={0}
								step="0.1"
								defaultValue={0}
								className="input"
							/>
							<FieldError formState={formState} name="fiber" />
						</div>
						<div>
							<label htmlFor="servingSize" className="label">
								<span className="flex items-center gap-1.5">
									<span className="w-2 h-2 rounded-full bg-slate-400" />
									Serving Size (g)
								</span>
							</label>
							<input
								type="number"
								id="servingSize"
								name="servingSize"
								min={1}
								defaultValue={100}
								className="input"
							/>
							<FieldError formState={formState} name="servingSize" />
						</div>
					</div>
				</div>

				{/* Status Messages */}
				{formState.status === "success" && (
					<div className="flex items-center gap-2 p-4 rounded-xl bg-green-50 text-green-600">
						<i className="ri-checkbox-circle-line text-xl" />
						<span>Ingredient added successfully!</span>
					</div>
				)}

				{formState.status === "error" && formState.message && (
					<div className="flex items-center gap-2 p-4 rounded-xl bg-red-50 text-red-600">
						<i className="ri-error-warning-line text-xl" />
						<span>{formState.message}</span>
					</div>
				)}

				{/* Submit Button */}
				<button
					type="submit"
					disabled={isPending}
					className="btn-primary w-full py-3"
				>
					{isPending ? (
						<>
							<svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
								<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
								<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
							</svg>
							Adding Ingredient...
						</>
					) : (
						<>
							<i className="ri-check-line text-xl" />
							Add Ingredient
						</>
					)}
				</button>
			</form>
		</div>
	);
}
