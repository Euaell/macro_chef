"use server";

import { serverApi } from "@/lib/api";
import { logger } from "@/lib/logger";

const exerciseLogger = logger.createModuleLogger("exercise-data");

export interface Exercise {
    id: string;
    name: string;
    description?: string;
    category: string;
    muscleGroup?: string;
    equipment?: string;
    videoUrl?: string;
    imageUrl?: string;
}

export interface ExerciseListResult {
    exercises: Exercise[];
    totalCount: number;
}

export async function getExercises(searchTerm?: string, category?: string, page: number = 1, pageSize: number = 20): Promise<ExerciseListResult> {
    try {
        const params = new URLSearchParams();
        if (searchTerm) params.append("SearchTerm", searchTerm);
        if (category) params.append("Category", category);
        params.append("Page", page.toString());
        params.append("PageSize", pageSize.toString());
        return await serverApi<ExerciseListResult>(`/api/Exercises?${params}`);
    } catch (error) {
        exerciseLogger.error("Failed to get exercises", { error });
        return { exercises: [], totalCount: 0 };
    }
}

export async function createExercise(data: Omit<Exercise, "id">): Promise<{ id: string; success: boolean } | null> {
    try {
        return await serverApi<{ id: string; name: string; success: boolean }>("/api/Exercises", {
            method: "POST",
            body: data,
        });
    } catch (error) {
        exerciseLogger.error("Failed to create exercise", { error });
        return null;
    }
}
