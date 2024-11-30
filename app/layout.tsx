import type { Metadata } from "next";
import "./globals.css";
import Navbar from "./components/Navbar";

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
				className={`antialiased`}
			>
				{/* navbar */}
				<Navbar />
				{children}
			</body>
		</html>
	);
}
