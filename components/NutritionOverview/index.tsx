'use client';

import DailyOverviewChart from "../DailyOverviewChart";
import Link from "next/link";
import getUser from "@/helper/getUserClient";


export default function NutritionOverview() {
	const { user } = getUser();
	
	return (
		<div className="relative w-full max-w-4xl min-h-fit h-64">
			<div className={`p-6 bg-white rounded-lg shadow-lg ${!user ? 'blur-sm' : ''}`}>
				<div className="flex flex-row justify-between items-center">
					<h2 className="text-2xl font-bold mb-4 text-gray-800">Nutrition Overview</h2>
					{/* <Link href={"/goal"} className="bg-emerald-700 text-white px-4 py-2 rounded-lg">Update Goal</Link> */}
				</div>
				<DailyOverviewChart />
			</div>

			{/* Authentication overlay */}
			{!user && (
				<div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-15 rounded-lg">
					<div className="text-center text-white mb-6">
						<h3 className="text-2xl font-bold mb-2">Track Your Nutrition</h3>
						<p className="mb-6">Sign in to access detailed nutrition tracking</p>
						<div className="space-x-4">
							<Link 
								href="login" 
								className="bg-blue-500 text-white px-6 py-2 rounded-full hover:bg-blue-600 transition-colors"
							>
								Sign In
							</Link>
							<Link 
								href="/register" 
								className="bg-green-500 text-white px-6 py-2 rounded-full hover:bg-green-600 transition-colors"
							>
								Register
							</Link>
						</div>
					</div>
				</div>
			)}
		</div>
	)
}
