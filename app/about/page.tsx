import { getServerSession } from "next-auth";
import { options } from "../api/auth/[...nextauth]/options";
import { redirect } from "next/navigation";

export default async function About() {
	const session = await getServerSession(options);

	if (!session) {
		redirect("/api/auth/signin?callbackUrl=/about");
		return (
			<div>
				<h1>Not Allowed</h1>
			</div>
		)
	}

	return (
		<div>
			<h1>About</h1>
			<p>
				This is a simple recipe manager to help you track your macros.
			</p>
		</div>
	);
}
