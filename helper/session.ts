import 'server-only';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import jwt from "jsonwebtoken";
import { getFullUserById } from '@/data/user';
import User from '@/types/user';
import { cache } from 'react';

export async function encrypt(payload: any) {
	const token = jwt.sign(payload, process.env.TOKEN_SECRET!, { expiresIn: "1d" });
	return token;
}

export async function decrypt(token: string) {
	const decoded = jwt.verify(token, process.env.TOKEN_SECRET!);
	return decoded;
}

export const getUserServer = cache(async () => {
	try {
		const cookie = (await cookies()).get('auth_token');
		const token = cookie?.value || '';
		const payload: any = await decrypt(token);

		const user = await getFullUserById(payload.id);
		if (!user) {
			redirect('/login');
		}
		return user;
	} catch (error: any) {
		redirect('/login')
	}
});
