import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Paths that don't require authentication
const publicPaths = [
	"/",
	"/login",
	"/signup",
	"/register",
	"/verify-email",
	"/forgot-password",
	"/reset-password",
	"/privacy",
	"/terms",
	"/api/auth",
];

// Paths that are always public (recipes can be viewed but not created without auth)
const publicReadPaths = ["/recipes"];

export function proxy(request: NextRequest) {
	const path = request.nextUrl.pathname;

	// Check if the path is public
	const isPublicPath = publicPaths.some(
		(p) => path === p || path.startsWith(p + "/")
	);

	// Check if it's a public read path (like viewing recipes)
	const isPublicReadPath = publicReadPaths.some(
		(p) => path === p || (path.startsWith(p + "/") && !path.includes("/create") && !path.includes("/edit"))
	);

	// Allow all API routes through (BetterAuth handles its own auth)
	if (path.startsWith("/api/")) {
		return NextResponse.next();
	}

	// Get session token from BetterAuth cookie
	const sessionToken =
		request.cookies.get("better-auth.session_token")?.value ||
		request.cookies.get("__Secure-better-auth.session_token")?.value;

	// Redirect logged-in users away from auth pages
	if ((path === "/login" || path === "/signup" || path === "/register") && sessionToken) {
		return NextResponse.redirect(new URL("/", request.nextUrl));
	}

	// If trying to access a protected path without a session, redirect to login
	if (!isPublicPath && !isPublicReadPath && !sessionToken) {
		const callbackUrl = encodeURIComponent(path);
		return NextResponse.redirect(
			new URL(`/login?callbackUrl=${callbackUrl}`, request.nextUrl)
		);
	}

	return NextResponse.next();
}

// Configure which paths the proxy runs on
export const config = {
	matcher: [
		/*
		 * Match all request paths except:
		 * - _next/static (static files)
		 * - _next/image (image optimization files)
		 * - favicon.ico (favicon file)
		 * - public files (public directory)
		 */
		"/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
	],
};
