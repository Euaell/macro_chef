import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import 'remixicon/fonts/remixicon.css';

export const metadata: Metadata = {
	title: "MacroChef - Recipe Manager",
	description: "A simple recipe manager to help you track your macros.",
};

export default function RootLayout(
	{ children }: Readonly<{ children: React.ReactNode }>
) {
	return (
		<html lang="en">
			<body
				className={`antialiased bg-gray-100 flex flex-col min-h-screen`}
			>
				{/* navbar */}
				<Navbar />
				<main className="p-3 sm:p-5 md:p-8 max-w-full overflow-x-hidden overflow-y-auto flex-grow">
					{children}
				</main>

				<footer className="bg-gradient-to-t from-emerald-800 to-emerald-600 text-white py-6 mt-auto shadow-inner animate-fade-in-up">
					<div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-4 px-4">
						<div className="flex items-center gap-2">
							<span className="font-bold text-lg tracking-wide">&copy; {new Date().getFullYear()} MacroChef</span>
							<span className="hidden md:inline text-emerald-200">|</span>
							<a
								href="/privacy-policy"
								className="text-emerald-200 hover:text-white underline underline-offset-4 transition-colors duration-200 animate-fade-in"
							>
								Privacy Policy
							</a>
						</div>
						<div className="flex gap-3 text-2xl">
							<a href="https://github.com/" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-300 transition-colors animate-fade-in-up"><i className="ri-github-fill"></i></a>
							<a href="mailto:support@macrochef.com" className="hover:text-emerald-300 transition-colors animate-fade-in-up"><i className="ri-mail-fill"></i></a>
						</div>
					</div>
				</footer>
			</body>
		</html>
	)
}
