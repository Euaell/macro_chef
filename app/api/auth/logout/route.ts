
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
	try {
		const callbackUrl = request.nextUrl.searchParams.get("callbackUrl");
		console.log(process.env.DOMAIN! + callbackUrl);

		if (!callbackUrl) {
			const url = new URL(process.env.DOMAIN!);
			return NextResponse.redirect(url);
		}
		const url = new URL(process.env.DOMAIN! + callbackUrl);

		const response = NextResponse.redirect(url);		

		response.cookies.set("token", "", { httpOnly: true, expires: new Date(0)})
		return response;
		
	} catch (error : any) {
		return NextResponse.json({ error: error.message},
			{status: 500});
	}
	
}
