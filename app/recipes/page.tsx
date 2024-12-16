
import { getServerSession } from "next-auth";
import { options } from "../api/auth/[...nextauth]/options";
import { redirect } from "next/navigation";
import TableHeaderCell from "@/components/RecipesTable/TableHeaderCell";

export default async function Page() {
	const session = await getServerSession(options);
	
	if (!session) {
		redirect("/api/auth/signin?callbackUrl=/about");
		return (
			<div>
				<h1>Not Allowed</h1>
			</div>
		)
	}
	const user = session.user;
	// Fetch recipes

	return (
		<div className="flex flex-col">
			<div className="flex flex-row justify-between">
				<div>
					{/* Search bar */}
				</div>
				<div>
					{/* Add Button */}
				</div>
			</div>
			<div className="py-4 px-16">
				<table className="w-full border-b-2">
					<thead>
						<tr>
							<TableHeaderCell>Name</TableHeaderCell>
							<TableHeaderCell>Calories</TableHeaderCell>
							<TableHeaderCell>Protein</TableHeaderCell>
							<TableHeaderCell>Fat</TableHeaderCell>
							<TableHeaderCell>Carbs</TableHeaderCell>
                            <TableHeaderCell>Fiber</TableHeaderCell>
						</tr>
					</thead>
					<tbody>
						{/* Recipe rows */}
					</tbody>
					<tfoot>
						<tr>
							<td colSpan={5}>
								{/* Pagination */}
							</td>
						</tr>
					</tfoot>
				</table>
			</div>
		</div>
	)
}
