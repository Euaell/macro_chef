import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import 'remixicon/fonts/remixicon.css';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
	title: "Mizan - Balanced Nutrition & Fitness",
	description: "Your personal nutrition and fitness companion. Track meals, plan diets, and achieve your health goals with AI-powered coaching.",
};

export default function RootLayout(
	{ children }: Readonly<{ children: React.ReactNode }>
) {
	return (
		<html lang="en">
			<body className="antialiased min-h-screen flex flex-col">
				<Navbar />
				<main className="flex-grow">
					<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
						{children}
					</div>
				</main>

				<footer className="border-t border-slate-200 bg-white/50 backdrop-blur-sm">
					<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
						<div className="flex flex-col sm:flex-row justify-between items-center gap-4">
							<div className="flex items-center gap-2">
								<span className="text-lg font-bold bg-gradient-to-r from-brand-600 to-brand-700 bg-clip-text text-transparent">
									Mizan
								</span>
								<span className="text-slate-400">•</span>
								<span className="text-sm text-slate-500">ሚዛን</span>
							</div>
							<p className="text-sm text-slate-500">
								&copy; {new Date().getFullYear()} Mizan. All rights reserved.
							</p>
							<div className="flex items-center gap-4">
								<a href="#" className="text-slate-400 hover:text-slate-600 transition-colors">
									<i className="ri-github-fill text-xl" />
								</a>
								<a href="#" className="text-slate-400 hover:text-slate-600 transition-colors">
									<i className="ri-twitter-x-fill text-xl" />
								</a>
							</div>
						</div>
					</div>
				</footer>
			</body>
		</html>
	);
}
