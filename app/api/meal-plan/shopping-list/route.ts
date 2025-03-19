import { NextRequest, NextResponse } from "next/server";
import { generateShoppingList } from "@/data/mealPlan";
import { getUserServer } from "@/helper/session";

export async function GET(request: NextRequest) {
  try {
    const user = await getUserServer();
    const dateParam = request.nextUrl.searchParams.get('date');
    const date = dateParam ? new Date(dateParam) : new Date();

    const shoppingList = await generateShoppingList(user._id, date);
    
    return NextResponse.json({ 
      shoppingList,
      startDate: date,
      success: true 
    });
  } catch (error: any) {
    console.error('Error generating shopping list:', error);
    return NextResponse.json({ 
      error: 'Failed to generate shopping list',
      details: error.message
    }, { status: 500 });
  }
} 