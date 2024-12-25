import { getAllIngredient } from "@/data/ingredient";
import type { NextApiRequest } from "next";
import { NextResponse } from "next/server";

export async function GET(_: NextApiRequest, { params }: { params: Promise<{ name: string }> }) {
    const { name } = await params;

    const ingredients = await getAllIngredient(name);
    return NextResponse.json({ message: "Get Ingredients.", ingredients });
}