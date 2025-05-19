"use client";

import SubmitButton from "@/components/AddIngredient/button";
import { FieldError } from "@/components/FieldError";
import { addIngredient } from "@/data/ingredient";
import { EMPTY_FORM_STATE } from "@/helper/FormErrorHandler";
import { useActionState, useEffect } from "react";

export default function Page() {
	const [formState, action] = useActionState(addIngredient, EMPTY_FORM_STATE);
	

	useEffect(() => {
		if (formState.status === "SUCCESS") {
			// action.reset();
		}
	}, [formState.status]);

	return (
		<section className="max-w-xl mx-auto bg-white/90 rounded-2xl shadow-xl p-8 mt-8 animate-fade-in-up">
			<h1 className="text-2xl font-bold mb-4 text-emerald-800">Add Ingredient</h1>

			<form action={action} className="flex flex-col gap-4">
				<div className="flex flex-row gap-2">
					<div className="flex flex-1 flex-col gap-2">
						<label htmlFor="name">Name</label>
						<input type="text" id="name" name="name" className="border-2 border-gray-300 rounded-lg p-2" placeholder="Ingredient name" />
						<FieldError formState={formState} name="name" />
					</div>
				</div>
				<div className="flex flex-col xl:flex-row gap-2">
					<div className="flex flex-col md:flex-row gap-2">
						<div className="flex flex-1 flex-col gap-2">
							<label htmlFor="calories">Calories [kCal]</label>
							<input type="number" id="calories" name="calories" min={0} defaultValue={0} className="border-2 border-gray-300 rounded-lg p-2" />
							<FieldError formState={formState} name="calories" />
						</div>
						<div className="flex flex-1 flex-col gap-2">
							<label htmlFor="protein">Protein [grams]</label>
							<input type="number" id="protein" name="protein" min={0} defaultValue={0} className="border-2 border-gray-300 rounded-lg p-2" />
							<FieldError formState={formState} name="protein" />
						</div>
						<div className="flex flex-1 flex-col gap-2">
							<label htmlFor="fat">Fat [grams]</label>
							<input type="number" id="fat" name="fat" min={0} defaultValue={0} className="border-2 border-gray-300 rounded-lg p-2" />
							<FieldError formState={formState} name="fat" />
						</div>
					</div>
					<div className="flex flex-col md:flex-row gap-2">
						<div className="flex flex-1 flex-col gap-2">
							<label htmlFor="carbs">Carbs [grams]</label>
							<input type="number" id="carbs" name="carbs" min={0} defaultValue={0} className="border-2 border-gray-300 rounded-lg p-2" />
							<FieldError formState={formState} name="carbs" />
						</div>
						<div className="flex flex-1 flex-col gap-2">
							<label htmlFor="fiber">Fiber [grams]</label>
							<input type="number" id="fiber" name="fiber" min={0} defaultValue={0} className="border-2 border-gray-300 rounded-lg p-2" />
							<FieldError formState={formState} name="fiber" />
						</div>
						<div className="flex flex-1 flex-col gap-2">
							<label htmlFor="servingSize">Serving Size [grams]</label>
							<input defaultValue={100} id="servingSize" name="servingSize" min={0} className="border-2 border-gray-300 rounded-lg p-2" />
							<FieldError formState={formState} name="servingSize" />
						</div>
					</div>
				</div>

				<div>
					<SubmitButton disabled={false} label="Add Ingredient" loading={<>Loading...</>} />
				</div>

				<div>
					{formState.message && <p>{formState.message}</p>}
				</div>
			</form>
		</section>
	)
}
