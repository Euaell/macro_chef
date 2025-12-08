import TableHeaderCell from "@/components/IngredientTable/TableHeaderCell";
import { getAllIngredient } from "@/data/ingredient";
import Link from "next/link";
import SearchBar from "@/components/IngredientTable/SearchInputField";
import { getUserOptionalServer } from "@/helper/session";

export default async function Page(
	{ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }>}
) {
	const user = await getUserOptionalServer();
	const { sortBy, searchIngredient } = await searchParams;
	const ingredients = await getAllIngredient(searchIngredient as string, sortBy as string);

	return (
		<div className="space-y-6">
			{/* Page Header */}
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
				<div>
					<h1 className="text-2xl font-bold text-slate-900">Ingredients</h1>
					<p className="text-slate-500 mt-1">Browse and manage nutritional ingredients</p>
				</div>
				<div className="flex items-center gap-3">
					<SearchBar />
					{user && user.isAdmin && (
						<Link href="/ingredients/add" className="btn-primary">
							<i className="ri-add-line" />
							Add
						</Link>
					)}
				</div>
			</div>

			{/* Ingredients Table */}
			<div className="card overflow-hidden">
				<div className="overflow-x-auto">
					<table className="w-full">
						<thead>
							<tr className="bg-slate-50 border-b border-slate-200">
								<TableHeaderCell className="w-52 text-left px-6 py-4 text-sm font-semibold text-slate-600">Name</TableHeaderCell>
								<TableHeaderCell className="text-center px-4 py-4 text-sm font-semibold text-slate-600">Calories</TableHeaderCell>
								<TableHeaderCell className="text-center px-4 py-4 text-sm font-semibold text-slate-600">Protein</TableHeaderCell>
								<TableHeaderCell className="text-center px-4 py-4 text-sm font-semibold text-slate-600">Fat</TableHeaderCell>
								<TableHeaderCell className="text-center px-4 py-4 text-sm font-semibold text-slate-600">Carbs</TableHeaderCell>
								<TableHeaderCell className="text-center px-4 py-4 text-sm font-semibold text-slate-600">Fiber</TableHeaderCell>
							</tr>
						</thead>
						<tbody className="divide-y divide-slate-100">
							{!ingredients || ingredients.length === 0 ? (
								<tr>
									<td colSpan={6} className="px-6 py-16 text-center">
										<div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
											<i className="ri-leaf-line text-3xl text-slate-400" />
										</div>
										<h3 className="text-lg font-semibold text-slate-900 mb-2">No ingredients found</h3>
										<p className="text-slate-500 mb-4">Try adjusting your search or add a new ingredient</p>
									</td>
								</tr>
							) : (
								ingredients.map((ingredient) => (
									<tr
										key={ingredient._id.toString()}
										className="hover:bg-slate-50 transition-colors group"
									>
										<td className="px-6 py-4">
											<Link
												href={`/ingredients/${ingredient._id}`}
												className="font-medium text-slate-900 capitalize group-hover:text-brand-600 transition-colors"
											>
												{ingredient.name}
											</Link>
										</td>
										<td className="px-4 py-4 text-center">
											<span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-orange-50 text-orange-700 text-sm font-medium">
												{ingredient.macros.calories}
											</span>
										</td>
										<td className="px-4 py-4 text-center">
											<span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-red-50 text-red-700 text-sm font-medium">
												{ingredient.macros.protein}g
											</span>
										</td>
										<td className="px-4 py-4 text-center">
											<span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-yellow-50 text-yellow-700 text-sm font-medium">
												{ingredient.macros.fat}g
											</span>
										</td>
										<td className="px-4 py-4 text-center">
											<span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 text-sm font-medium">
												{ingredient.macros.carbs}g
											</span>
										</td>
										<td className="px-4 py-4 text-center">
											<span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-green-50 text-green-700 text-sm font-medium">
												{ingredient.macros.fiber}g
											</span>
										</td>
									</tr>
								))
							)}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	);
}
