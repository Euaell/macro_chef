import { ObjectId } from "mongoose";

export default interface User {
    _id: string | ObjectId;
	email: string;
	image?: string;
	password: string;
}

export interface UserInput {
    email: string;
    image?: string;
    password: string;
}

  