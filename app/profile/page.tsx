import { getUserServer } from "@/helper/session";


export default async function Page() {
    const user = await getUserServer();
	
	return (
		<section className="max-w-xl mx-auto bg-white/90 rounded-2xl shadow-xl p-8 mt-8 animate-fade-in-up">
			<h1 className="text-2xl font-bold mb-4 text-emerald-800">Profile</h1>
			<p className="text-gray-700">{user.email}</p>
		</section>
	)
}
