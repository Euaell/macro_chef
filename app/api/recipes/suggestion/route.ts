import { getRecipesSuggestion } from "@/data/meal";
import { getUserServer } from "@/helper/session";
import { NextResponse } from "next/server";

export async function GET() {
    const user = await getUserServer();
    const recipes = await getRecipesSuggestion(user._id);
    return NextResponse.json(recipes);
}
