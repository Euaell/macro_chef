import { getUserServer } from "@/helper/session";
import Image from "next/image";
import Link from "next/link";

export default async function Page() {
	const user = await getUserServer();

	return (
		<div className="max-w-3xl mx-auto space-y-6">
			{/* Header */}
			<div>
				<h1 className="text-2xl font-bold text-slate-900">Profile</h1>
				<p className="text-slate-500 mt-1">Manage your account settings</p>
			</div>

			{/* Profile Card */}
			<div className="card p-6">
				<div className="flex flex-col sm:flex-row items-center gap-6">
					<div className="relative">
						{user.image ? (
							<Image
								src={user.image}
								alt={user.email}
								width={96}
								height={96}
								className="w-24 h-24 rounded-2xl object-cover border-4 border-white shadow-lg"
							/>
						) : (
							<div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center border-4 border-white shadow-lg">
								<span className="text-3xl font-bold text-white">
									{user.email.charAt(0).toUpperCase()}
								</span>
							</div>
						)}
						<button className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center hover:bg-slate-50 transition-colors">
							<i className="ri-camera-line text-slate-600" />
						</button>
					</div>
					<div className="text-center sm:text-left flex-1">
						<h2 className="text-xl font-bold text-slate-900">{user.name || user.email.split('@')[0]}</h2>
						<p className="text-slate-500">{user.email}</p>
						{user.isAdmin && (
							<span className="inline-flex items-center gap-1 mt-2 px-2.5 py-1 rounded-full bg-violet-100 text-violet-700 text-xs font-medium">
								<i className="ri-shield-star-line" />
								Admin
							</span>
						)}
					</div>
					<button className="btn-secondary">
						<i className="ri-edit-line" />
						Edit Profile
					</button>
				</div>
			</div>

			{/* Quick Links */}
			<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
				<Link href="/goal" className="card-hover p-5 group">
					<div className="flex items-center gap-4">
						<div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center">
							<i className="ri-target-line text-xl text-white" />
						</div>
						<div className="flex-1">
							<h3 className="font-semibold text-slate-900">Nutrition Goals</h3>
							<p className="text-sm text-slate-500">Set your daily targets</p>
						</div>
						<i className="ri-arrow-right-s-line text-xl text-slate-400 group-hover:text-brand-500 transition-colors" />
					</div>
				</Link>

				<Link href="/meals" className="card-hover p-5 group">
					<div className="flex items-center gap-4">
						<div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-accent-400 to-accent-600 flex items-center justify-center">
							<i className="ri-restaurant-2-line text-xl text-white" />
						</div>
						<div className="flex-1">
							<h3 className="font-semibold text-slate-900">Food Diary</h3>
							<p className="text-sm text-slate-500">Track your meals</p>
						</div>
						<i className="ri-arrow-right-s-line text-xl text-slate-400 group-hover:text-brand-500 transition-colors" />
					</div>
				</Link>

				<Link href="/recipes" className="card-hover p-5 group">
					<div className="flex items-center gap-4">
						<div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-400 to-rose-600 flex items-center justify-center">
							<i className="ri-book-3-line text-xl text-white" />
						</div>
						<div className="flex-1">
							<h3 className="font-semibold text-slate-900">My Recipes</h3>
							<p className="text-sm text-slate-500">View your collection</p>
						</div>
						<i className="ri-arrow-right-s-line text-xl text-slate-400 group-hover:text-brand-500 transition-colors" />
					</div>
				</Link>

				<Link href="/suggestions" className="card-hover p-5 group">
					<div className="flex items-center gap-4">
						<div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-400 to-violet-600 flex items-center justify-center">
							<i className="ri-sparkling-2-line text-xl text-white" />
						</div>
						<div className="flex-1">
							<h3 className="font-semibold text-slate-900">AI Coach</h3>
							<p className="text-sm text-slate-500">Get personalized tips</p>
						</div>
						<i className="ri-arrow-right-s-line text-xl text-slate-400 group-hover:text-brand-500 transition-colors" />
					</div>
				</Link>
			</div>

			{/* Account Settings */}
			<div className="card p-6 space-y-4">
				<h2 className="font-semibold text-slate-900 flex items-center gap-2">
					<i className="ri-settings-3-line text-brand-500" />
					Account Settings
				</h2>

				<div className="divide-y divide-slate-100">
					<button className="w-full flex items-center justify-between py-4 hover:bg-slate-50 -mx-6 px-6 transition-colors">
						<div className="flex items-center gap-3">
							<i className="ri-notification-3-line text-slate-400" />
							<span className="text-slate-700">Notifications</span>
						</div>
						<i className="ri-arrow-right-s-line text-slate-400" />
					</button>
					<button className="w-full flex items-center justify-between py-4 hover:bg-slate-50 -mx-6 px-6 transition-colors">
						<div className="flex items-center gap-3">
							<i className="ri-lock-line text-slate-400" />
							<span className="text-slate-700">Privacy & Security</span>
						</div>
						<i className="ri-arrow-right-s-line text-slate-400" />
					</button>
					<button className="w-full flex items-center justify-between py-4 hover:bg-slate-50 -mx-6 px-6 transition-colors">
						<div className="flex items-center gap-3">
							<i className="ri-palette-line text-slate-400" />
							<span className="text-slate-700">Appearance</span>
						</div>
						<i className="ri-arrow-right-s-line text-slate-400" />
					</button>
				</div>
			</div>

			{/* Danger Zone */}
			<div className="card p-6 border-red-200">
				<h2 className="font-semibold text-red-600 flex items-center gap-2 mb-4">
					<i className="ri-error-warning-line" />
					Danger Zone
				</h2>
				<div className="flex items-center justify-between">
					<div>
						<p className="font-medium text-slate-900">Sign Out</p>
						<p className="text-sm text-slate-500">Sign out of your account</p>
					</div>
					<button className="px-4 py-2 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 transition-colors">
						Sign Out
					</button>
				</div>
			</div>
		</div>
	);
}
