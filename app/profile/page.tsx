export const dynamic = 'force-dynamic';

import { getUserServer } from "@/helper/session";


export default async function Page() {
    const user = await getUserServer();
	
	return (
		<div>
			<p>{user.email}</p>
		</div>
	)
}
