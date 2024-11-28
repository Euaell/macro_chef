import type { Metadata } from "next";
import "./globals.css";

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
				{children}
			</body>
		</html>
	);
}
