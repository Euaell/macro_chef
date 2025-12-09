import { db } from "@/db/client";
import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { users } from "@/db/schema";

export async function GET() {
    const healthStatus = {
        status: "Healthy",
        timestamp: new Date().toISOString(),
        services: {
            database: {
                status: "Unknown",
                latencyMs: 0,
            },
        },
        system: {
            memoryUsage: process.memoryUsage(),
            uptime: process.uptime(),
            nodeVersion: process.version,
        },
    };

    const start = performance.now();
    try {
        // Simple query to check DB connection
        await db.select({ id: users.id }).from(users).limit(1);
        const end = performance.now();

        healthStatus.services.database.status = "Healthy";
        healthStatus.services.database.latencyMs = Math.round(end - start);
    } catch (error) {
        console.error("Health check failed:", error);
        healthStatus.status = "Unhealthy";
        healthStatus.services.database.status = "Unhealthy";
        return NextResponse.json(healthStatus, { status: 503 });
    }

    return NextResponse.json(healthStatus);
}
