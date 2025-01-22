
import { ObjectId } from "mongoose";

export default interface User {
	_id: string | ObjectId;
	email: string;
	image?: string;
	password: string;

	isVerified: Boolean;
	isAdmin: Boolean;

	forgotPasswordToken: String | null;
	forgotPasswordTokenExpiry: Date | null;
	verifyToken: String | null;
	verifyTokenExpiry: Date | null;

	// timestamps
	createdAt: Date;
	updatedAt: Date;
}

export interface UserInput {
	email: string;
	image?: string;
	password: string;
}

export interface UserOutput {
	email: string;
	image?: string;
}
  