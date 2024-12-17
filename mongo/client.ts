
import { MongoClient } from "mongodb";

export default async function MongoDBClient() {
	if (!process.env.MONGODB_URI) {
		throw new Error("Please add your Mongo URI to .env.local");
	}

	const client = new MongoClient(process.env.MONGODB_URI);

	try {
		await client.connect();

		return client;
	} catch (error) {
		// handle the error
	}
}
