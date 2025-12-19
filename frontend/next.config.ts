import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	// Enable standalone output for Docker
	output: "standalone",

	// Image configuration
	images: {
		remotePatterns: [
			{
				hostname: "res.cloudinary.com",
			},
			{
				hostname: "lh3.googleusercontent.com", // Google OAuth avatars
			},
			{
				hostname: "avatars.githubusercontent.com", // GitHub avatars
			},
		],
	},

	// Environment variables exposed to browser
	env: {
		NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
		NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
	},
	// Headers for security
	async headers() {
		return [
			{
				source: "/(.*)",
				headers: [
					{
						key: "X-Frame-Options",
						value: "DENY",
					},
					{
						key: "X-Content-Type-Options",
						value: "nosniff",
					},
					{
						key: "Referrer-Policy",
						value: "strict-origin-when-cross-origin",
					},
				],
			},
		];
	},

	// Proxy backend API requests (explicitly list backend endpoints)
	async rewrites() {
		const backendUrl = process.env.API_URL || "http://localhost:5000";

		return {
			afterFiles: [
				// Proxy specific backend API endpoints
				// /api/auth/* and /api/health are handled by Next.js routes
				{
					source: "/api/Users/:path*",
					destination: `${backendUrl}/api/Users/:path*`,
				},
				{
					source: "/api/Foods/:path*",
					destination: `${backendUrl}/api/Foods/:path*`,
				},
				{
					source: "/api/Goals/:path*",
					destination: `${backendUrl}/api/Goals/:path*`,
				},
				{
					source: "/api/Meals/:path*",
					destination: `${backendUrl}/api/Meals/:path*`,
				},
				{
					source: "/api/Recipes/:path*",
					destination: `${backendUrl}/api/Recipes/:path*`,
				},
				{
					source: "/api/MealPlans/:path*",
					destination: `${backendUrl}/api/MealPlans/:path*`,
				},
				{
					source: "/api/ShoppingLists/:path*",
					destination: `${backendUrl}/api/ShoppingLists/:path*`,
				},
				{
					source: "/api/Workouts/:path*",
					destination: `${backendUrl}/api/Workouts/:path*`,
				},
				{
					source: "/api/Exercises/:path*",
					destination: `${backendUrl}/api/Exercises/:path*`,
				},
				{
					source: "/api/BodyMeasurements/:path*",
					destination: `${backendUrl}/api/BodyMeasurements/:path*`,
				},
				{
					source: "/api/Achievements/:path*",
					destination: `${backendUrl}/api/Achievements/:path*`,
				},
				{
					source: "/api/Nutrition/:path*",
					destination: `${backendUrl}/api/Nutrition/:path*`,
				},
				{
					source: "/api/Households/:path*",
					destination: `${backendUrl}/api/Households/:path*`,
				},
				{
					source: "/api/Trainers/:path*",
					destination: `${backendUrl}/api/Trainers/:path*`,
				},
				{
					source: "/api/Chat/:path*",
					destination: `${backendUrl}/api/Chat/:path*`,
				},
				{
					source: "/hubs/:path*",
					destination: `${backendUrl}/hubs/:path*`,
				},
			],
		};
	},
};

export default nextConfig;
