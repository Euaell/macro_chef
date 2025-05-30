
import { OpenAIRecipesResponseSchema, OpenAIChatInput, RecipesSchema } from "@/types/openai";
import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";

const openai = new OpenAI();

export async function openAIChatRecipeSuggestions(input: OpenAIChatInput): Promise<OpenAIRecipesResponseSchema> {
    console.log("openAIChatRecipeSuggestions called with input:", input);
    console.log("================= JSON ====================")
    console.log(zodResponseFormat(RecipesSchema, "recipes"));
    console.log("===========================================");
    
    const completion = await openai.chat.completions.parse({
        model: "gpt-4.1-mini",
        messages: [
            {
                role: "developer",
                content: `
    You are a helpful assistant that provides recipes based on ingredients.
    Please suggest recipes that can be made with the provided ingredients.
    The response should be in the following format:
    ${JSON.stringify(RecipesSchema.shape, null, 2)}
    Ensure that the response is structured correctly and includes all necessary fields.
    If no recipes can be made with the provided ingredients, respond with an empty array.
    This is the Current goal: ${JSON.stringify(input.currentGoal, null, 2)}
    Make sure the provided recipes help achieve the goal mentioned above.
                `.trim(),
            },
            {
                role: "user",
                content: `I have the following ingredients: ${JSON.stringify(input.ingredients, null, 2)}. Can you suggest some recipes?
                I have consumed the following meals today: ${JSON.stringify(input.mealsConsumedToday, null, 2)}.`,
            },
        ],
        response_format: zodResponseFormat(RecipesSchema, "recipes"),
    });

    if (completion.choices.length > 0 && completion.choices[0].message?.parsed) {
        const response = completion.choices[0].message.content;
        return RecipesSchema.parse(response);
    }
    
    throw new Error("No valid response from OpenAI");
}
