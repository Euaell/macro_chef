"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

export default function Page() {
	const [token, setToken] = useState("");
	const [verified, setVerified] = useState(false);
	const [error, setError] = useState(false);
	const searchParams = useSearchParams();

	async function verifyUserEmail() {
		try {
			await fetch("/api/users/verifyemail", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ token }),
			});
			setVerified(true);
		} catch (error: any) {
			setError(true);
			console.log(error.response.data);
		}
	}

	useEffect(() => {
		const token = searchParams.get("token");
		// const urlToken = window.location.search.split("=")[1];
		// setToken(urlToken || "");
		setToken(token || "");
	}, []);

	useEffect(() => {
		if (token.length > 0) {
			verifyUserEmail();
		}
	}, [token]);

	return (
		<div className="flex flex-col items-center justify-center min-h-screen py-2">
			<h1 className="text-4xl">Verify Email</h1>
			<h2 className="p-2 bg-orange-500 text-black">
				{token ? `${token}` : "no token"}
			</h2>

			{verified && (
				<div>
					<h2 className="text-2xl">Email Verified</h2>
					<Link href="/login">Login</Link>
				</div>
			)}

			{error && (
				<div>
					<h2 className="text-2xl bg-red-500">Error</h2>
				</div>
			)}
		</div>
	)
}
