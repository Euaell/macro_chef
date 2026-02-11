"use server";

import { serverApi } from "@/lib/api.server";
import { logger } from "@/lib/logger";

const achievementLogger = logger.createModuleLogger("achievement-data");

export interface Achievement {
    id: string;
    name?: string;
    description?: string;
    iconUrl?: string;
    points: number;
    category?: string;
    isEarned: boolean;
    earnedAt?: string | null;
}

export interface StreakInfo {
    currentStreak: number;
    longestStreak: number;
    lastLogDate?: string;
}

export async function getAchievements(): Promise<Achievement[]> {
    try {
        const result = await serverApi<{ achievements: Achievement[] }>("/api/Achievements");
        return result.achievements || [];
    } catch (error) {
        achievementLogger.error("Failed to get achievements", { error });
        return [];
    }
}

export async function getStreak(): Promise<StreakInfo | null> {
    try {
        return await serverApi<StreakInfo>("/api/Achievements/streak");
    } catch (error) {
        achievementLogger.error("Failed to get streak", { error });
        return null;
    }
}

export async function updateStreak(): Promise<boolean> {
    try {
        await serverApi("/api/Achievements/streak", { method: "POST" });
        return true;
    } catch (error) {
        achievementLogger.error("Failed to update streak", { error });
        return false;
    }
}
