
import Macros from "./macro";
import { ID } from "./id";
import User from "./user";

export default interface Goal {
	_id: ID;

	name: string;
	targetMacro: Macros;

    user: User;

	// timestamps
	createdAt: Date;
	updatedAt: Date;
}
