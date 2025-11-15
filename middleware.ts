import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';

export async function middleware(request: NextRequest) {
  const { nextUrl } = request;

  // Public routes that don't require authentication
  const publicRoutes = [
    '/',
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
  ];

  const isPublicRoute =
    publicRoutes.includes(nextUrl.pathname) ||
    nextUrl.pathname.startsWith('/api/auth') ||
    nextUrl.pathname.startsWith('/verify') ||
    nextUrl.pathname.startsWith('/_next') ||
    nextUrl.pathname.startsWith('/static');

  // Allow access to public routes
  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Check authentication using BetterAuth
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      const callbackUrl = encodeURIComponent(nextUrl.pathname + nextUrl.search);
      return NextResponse.redirect(new URL(`/login?callbackUrl=${callbackUrl}`, nextUrl));
    }

    // Check if user is banned
    if (session.user.banned) {
      return NextResponse.redirect(new URL('/banned', nextUrl));
    }

    return NextResponse.next();
  } catch (error) {
    // If there's an error checking the session, redirect to login
    const callbackUrl = encodeURIComponent(nextUrl.pathname + nextUrl.search);
    return NextResponse.redirect(new URL(`/login?callbackUrl=${callbackUrl}`, nextUrl));
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|public).*)'],
};
