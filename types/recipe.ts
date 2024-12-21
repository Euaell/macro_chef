import { ObjectId } from "mongoose";
import Ingredient from "./ingredient";
import Macros from "./macro";

export default interface Recipe {
	id: string | ObjectId;
	userId: string | ObjectId;
	name: string;
	description?: string;
	ingredients: {
		ingredient: Ingredient;
		amount: number;
		unit: string;
	}[];
	totalMacros: Macros;
	servings: number;
	instructions: string[];
	tags: string[];

	// timestamps
	createdAt: Date;
	updatedAt: Date;
}
