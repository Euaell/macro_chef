
import { createUser, getUserByEmail } from "@/data/user";
import { NextRequest, NextResponse } from "next/server";
import bcryptjs from "bcryptjs";


export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { image, email, password } = body;

        const existingUser = await getUserByEmail(email);

        if(existingUser) {
            return NextResponse.json({error: "Email already taken"}, {status: 400})
        }

        const salt = await bcryptjs.genSalt(10)
        const hashedPassword = await bcryptjs.hash(password, salt)


        const user = await createUser({
            image,
            email,
            password: hashedPassword,
        });

        return NextResponse.json({
            message: "User created successfully",
            success: true,
            user_id: user._id,
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
