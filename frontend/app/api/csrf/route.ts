import { doubleCsrf } from "csrf-csrf";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const {
	generateToken,
	doubleCsrfProtection,
} = doubleCsrf({
	getSecret: () => process.env.CSRF_SECRET || "your-csrf-secret-change-in-production",
	cookieName: "x-csrf-token",
	cookieOptions: {
		sameSite: "lax",
		path: "/",
		secure: process.env.NODE_ENV === "production",
		httpOnly: true,
	},
	size: 64,
	ignoredMethods: ["GET", "HEAD", "OPTIONS"],
});

export async function GET(request: NextRequest) {
	const cookieStore = await cookies();
	const secret = process.env.CSRF_SECRET || "your-csrf-secret-change-in-production";

	const token = generateToken(secret);

	// Set the CSRF token cookie
	const response = NextResponse.json({ token });
	response.cookies.set("x-csrf-token", token, {
		httpOnly: true,
		sameSite: "lax",
		secure: process.env.NODE_ENV === "production",
		path: "/",
	});

	return response;
}

export async function POST(request: NextRequest) {
	try {
		await doubleCsrfProtection(request as any);
		return NextResponse.json({ valid: true });
	} catch (error) {
		return NextResponse.json({ valid: false, error: "Invalid CSRF token" }, { status: 403 });
	}
}
