import { auth } from "@/lib/auth";
import { db } from "@/db/client";
import { users, accounts } from "@/db/schema";
import { eq } from "drizzle-orm";
import { hash } from "bcryptjs";

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session?.user || session.user.role !== "admin") {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { userId, password } = await request.json();

    // Validate inputs
    if (!userId || !password) {
      return Response.json(
        { error: "User ID and password are required" },
        { status: 400 }
      );
    }

    // Validate UUID format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId)) {
      return Response.json(
        { error: "Invalid user ID format" },
        { status: 400 }
      );
    }

    // Validate password strength
    if (password.length < 8) {
      return Response.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    // Check if user exists
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    // Hash the new password
    const hashedPassword = await hash(password, 10);

    // Update password in accounts table (BetterAuth stores passwords here)
    const [account] = await db
      .select()
      .from(accounts)
      .where(eq(accounts.userId, userId))
      .limit(1);

    if (!account) {
      return Response.json(
        { error: "No account found for this user" },
        { status: 404 }
      );
    }

    await db
      .update(accounts)
      .set({
        password: hashedPassword,
        updatedAt: new Date(),
      })
      .where(eq(accounts.userId, userId));

    return Response.json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (error) {
    console.error("Failed to set password");
    return Response.json(
      { error: "Failed to set password" },
      { status: 500 }
    );
  }
}
