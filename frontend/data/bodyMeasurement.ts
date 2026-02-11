"use server";

import { serverApi } from "@/lib/api";
import { logger } from "@/lib/logger";

const bmLogger = logger.createModuleLogger("body-measurement-data");

export interface BodyMeasurement {
    id: string;
    date: string;
    weightKg?: number | null;
    bodyFatPercentage?: number | null;
    muscleMassKg?: number | null;
    waistCm?: number | null;
    hipsCm?: number | null;
    chestCm?: number | null;
    armsCm?: number | null;
    thighsCm?: number | null;
    notes?: string | null;
}

export async function getBodyMeasurements(): Promise<BodyMeasurement[]> {
    try {
        return await serverApi<BodyMeasurement[]>("/api/BodyMeasurements");
    } catch (error) {
        bmLogger.error("Failed to get body measurements", { error });
        return [];
    }
}

export async function addBodyMeasurement(data: Omit<BodyMeasurement, "id">): Promise<boolean> {
    try {
        await serverApi("/api/BodyMeasurements", {
            method: "POST",
            body: data,
        });
        return true;
    } catch (error) {
        bmLogger.error("Failed to add body measurement", { error });
        return false;
    }
}
