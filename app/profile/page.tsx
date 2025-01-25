"use client";

import Loading from "@/components/Loading";
import getUser from "@/helper/getUserClient";


export default function Page() {

	const { user, loading } = getUser();

	if (loading) {
		return <Loading	/>
	}

	if (!user) {
		return (
			<div>
				<h1>User not found</h1>
			</div>
		)
	}
	
	return (
		<div>
			<h1>Profile</h1>
			<p>{user.email}</p>
		</div>
	)
}
