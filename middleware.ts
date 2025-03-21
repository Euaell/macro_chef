
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const publicPaths = ['/', '/recipes', '/login', '/signup', '/verifyemail']

export function middleware(request: NextRequest) {
	const path = request.nextUrl.pathname
	const callbackUrl = request.nextUrl.searchParams.get('callbackUrl')

	// Define paths that are considered public (accessible without a token)
	const isPublicPath = publicPaths.includes(path)

	// Get the token from the cookies
	const token = request.cookies.get('auth_token')?.value || ''

	// Redirect logic based on the path and token presence
	// if(isPublicPath && token) {

	// 	// If trying to access a public path with a token, redirect to the home page
	// 	return NextResponse.redirect(new URL('/', request.nextUrl))
	// }

	// If trying to access a protected path without a token, redirect to the login page
	if (!isPublicPath && !token) {
		return NextResponse.redirect(new URL('/login?callbackUrl=' + path + (callbackUrl ? '&callbackUrl=' + callbackUrl : ''), request.nextUrl))
	}

	// TODO: Add logic to check if the token is valid and not expired
		
}

// It specifies the paths for which this middleware should be executed. 
export const config = {
	matcher: [
		'/',
		'/recipes/:path*',
		'/profile',
		'/login',
		'/signup',
		'/verifyemail',
		'/meals/:path*',
		'/ingredients/add',
		'/meal-plan',
		'/meal-plan/:path*',
		'/meal-plan/add',
		'/meal-plan/add/:path*',
		'/meal-plan/edit/:path*',
		'/meal-plan/delete/:path*',
		
	]
}
