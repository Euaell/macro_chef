import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";

// Define protected routes that require authentication
const AUTHENTICATED_ROUTES = [
  "/profile",
  "/meals",
  "/recipes",
  "/ingredients",
  "/meal-plan",
  "/goal",
  "/suggestions",
  "/trainer",
];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if route requires authentication
  const requiresAuth =
    pathname.startsWith("/admin") ||
    AUTHENTICATED_ROUTES.some((route) => pathname.startsWith(route));

  if (requiresAuth) {
    const session = await auth.api.getSession({ headers: request.headers });

    // Not authenticated - redirect to login
    if (!session?.user) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Admin-only route protection
    if (pathname.startsWith("/admin") && session.user.role !== "admin") {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/profile/:path*",
    "/meals/:path*",
    "/recipes/:path*",
    "/ingredients/:path*",
    "/meal-plan/:path*",
    "/goal/:path*",
    "/suggestions/:path*",
    "/trainer/:path*",
  ],
};
