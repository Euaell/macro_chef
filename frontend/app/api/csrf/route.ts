// import { generateCsrfToken } from "@/lib/utils/csrf-protection";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";


export async function GET(request: NextRequest) {
	const cookieStore = await cookies();
	const secret = process.env.CSRF_SECRET || "your-csrf-secret-change-in-production";

	// const token = generateCsrfToken(secret);
	const token = secret; // Placeholder for the actual token generation

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
		// await doubleCsrfProtection(request as any);
		return NextResponse.json({ valid: true });
	} catch (error) {
		return NextResponse.json({ valid: false, error: "Invalid CSRF token" }, { status: 403 });
	}
}
