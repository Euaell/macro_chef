import SuggestedRecipes from '@/components/SuggestedRecipes';
import { getTodaySuggestions, regenerateSuggestions } from '@/data/suggestion';
import { getUserServer } from '@/helper/session';
import { redirect } from 'next/navigation';

export default async function Page({ searchParams }: { searchParams?: Promise<{ [key: string]: string | string[] | undefined }> }) {
	const user = await getUserServer();
	const queryParams = await searchParams;

	if (queryParams?.regenerate === 'true' && user.isAdmin) {
		await regenerateSuggestions(user);
		return redirect('/suggestions');
	}
	const recipes = await getTodaySuggestions(user._id);
	return <SuggestedRecipes user={user} suggestions={recipes} />;
}
