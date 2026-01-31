"use server";

import { createErrorState, createSuccessState, FormState } from "@/helper/FormErrorHandler";
import { auth } from "@/lib/auth";
import { logger } from "@/lib/logger";

const userLogger = logger.createModuleLogger("user-data");

/**
 * Register a new user with email and password via BetterAuth
 */
export async function addUser(prevState: FormState, formData: FormData): Promise<FormState> {
    try {
        const email = formData.get("email") as string;
        const password = formData.get("password") as string;
        const name = formData.get("name") as string;

        if (!email || !password) {
            return createErrorState("Email and password are required", [
                { field: "email", message: !email ? "Email is required" : "" },
                { field: "password", message: !password ? "Password is required" : "" },
            ]);
        }

        // Use BetterAuth's server-side signUpEmail API
        const result = await auth.api.signUpEmail({
            body: {
                email: email.toLowerCase(),
                password,
                name: name || email.split("@")[0],
            },
        });

        if (!result || !result.user) {
            return createErrorState("Failed to create account");
        }

        return createSuccessState("Account created! Please check your email to verify your account.");
    } catch (error) {
        userLogger.error("Failed to create user account", {
            error: error instanceof Error ? error.message : String(error),
        });
        return createErrorState("Failed to create account. Please try again.");
    }
}

/**
 * Resend verification email
 * Uses BetterAuth's verification API to send a new verification email
 */
export async function resendUserVerificationEmail(
    prevState: FormState,
    formData: FormData
): Promise<FormState> {
    try {
        const email = formData.get("email") as string;

        if (!email) {
            return createErrorState("Email is required", [
                { field: "email", message: "Please enter your email address" }
            ]);
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return createErrorState("Invalid email format", [
                { field: "email", message: "Please enter a valid email address" }
            ]);
        }

        // Use BetterAuth's sendVerificationEmail API
        await auth.api.sendVerificationEmail({
            body: {
                email: email.toLowerCase(),
            },
        });

        userLogger.info("Verification email resent successfully", { email });

        return createSuccessState(
            "If an account exists with this email, a verification link has been sent. Please check your inbox and spam folder."
        );
    } catch (error) {
        userLogger.error("Failed to resend verification email", {
            error: error instanceof Error ? error.message : String(error),
        });
        
        // Return generic success to prevent email enumeration
        return createSuccessState(
            "If an account exists with this email, a verification link has been sent. Please check your inbox and spam folder."
        );
    }
}
