"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/auth-client";
import Link from "next/link";

interface Client {
	id: string;
	name: string;
	email: string;
	image?: string;
	status: "active" | "pending" | "paused";
	lastActive: string;
	goalProgress: number;
	canViewNutrition: boolean;
	canViewWorkouts: boolean;
}

export function ClientList() {
	const [clients, setClients] = useState<Client[]>([]);
	const [loading, setLoading] = useState(true);
	const [filter, setFilter] = useState<"all" | "active" | "pending">("all");

	useEffect(() => {
		async function fetchClients() {
			try {
				const data = await apiClient<{ clients: Client[] }>(
					"/api/trainer/clients"
				);
				setClients(data.clients);
			} catch (error) {
				console.error("Failed to fetch clients:", error);
				// Demo data
				setClients([
					{
						id: "1",
						name: "Abebe Kebede",
						email: "abebe@example.com",
						status: "active",
						lastActive: "2 hours ago",
						goalProgress: 85,
						canViewNutrition: true,
						canViewWorkouts: true,
					},
					{
						id: "2",
						name: "Tigist Haile",
						email: "tigist@example.com",
						status: "active",
						lastActive: "1 day ago",
						goalProgress: 62,
						canViewNutrition: true,
						canViewWorkouts: false,
					},
					{
						id: "3",
						name: "Dawit Yohannes",
						email: "dawit@example.com",
						status: "pending",
						lastActive: "Never",
						goalProgress: 0,
						canViewNutrition: true,
						canViewWorkouts: true,
					},
				]);
			} finally {
				setLoading(false);
			}
		}

		fetchClients();
	}, []);

	const filteredClients = clients.filter((client) => {
		if (filter === "all") return true;
		return client.status === filter;
	});

	if (loading) {
		return (
			<div className="space-y-4">
				{[1, 2, 3].map((i) => (
					<div key={i} className="animate-pulse flex items-center space-x-4">
						<div className="w-12 h-12 bg-gray-200 rounded-full"></div>
						<div className="flex-1">
							<div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
							<div className="h-3 bg-gray-200 rounded w-1/3"></div>
						</div>
					</div>
				))}
			</div>
		);
	}

	return (
		<div>
			<div className="flex space-x-2 mb-4">
				{(["all", "active", "pending"] as const).map((f) => (
					<button
						key={f}
						onClick={() => setFilter(f)}
						className={`px-3 py-1 rounded-full text-sm capitalize ${
							filter === f
								? "bg-green-600 text-white"
								: "bg-gray-100 text-gray-600 hover:bg-gray-200"
						}`}
					>
						{f}
					</button>
				))}
			</div>

			<div className="space-y-4">
				{filteredClients.map((client) => (
					<div
						key={client.id}
						className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
					>
						<div className="flex items-center space-x-3">
							<div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
								{client.image ? (
									<img
										src={client.image}
										alt={client.name}
										className="w-10 h-10 rounded-full"
									/>
								) : (
									<span className="text-green-600 font-semibold">
										{client.name.charAt(0)}
									</span>
								)}
							</div>
							<div>
								<p className="font-medium">{client.name}</p>
								<p className="text-sm text-gray-500">
									Last active: {client.lastActive}
								</p>
							</div>
						</div>

						<div className="flex items-center space-x-4">
							{client.status === "pending" ? (
								<span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full">
									Pending
								</span>
							) : (
								<div className="text-right">
									<div className="w-24 bg-gray-200 rounded-full h-2">
										<div
											className="bg-green-600 rounded-full h-2"
											style={{ width: `${client.goalProgress}%` }}
										></div>
									</div>
									<span className="text-xs text-gray-500">
										{client.goalProgress}% goal
									</span>
								</div>
							)}

							<Link
								href={`/trainer/clients/${client.id}`}
								className="p-2 hover:bg-gray-200 rounded-full"
							>
								<i className="ri-arrow-right-line text-gray-600"></i>
							</Link>
						</div>
					</div>
				))}

				{filteredClients.length === 0 && (
					<p className="text-center text-gray-500 py-8">
						No clients found matching the filter.
					</p>
				)}
			</div>
		</div>
	);
}
