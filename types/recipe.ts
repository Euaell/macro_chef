import Macros from "./macro";

export default interface Recipe {
	id: string;
	userId: string;
	name: string;
	description?: string;
	ingredients: {
		ingredientId: string;
		amount: number;
		unit: string;
	}[];
	totalMacros: Macros;
	servings: number;
	instructions: string[];
}
