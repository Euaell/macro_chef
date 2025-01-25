
import Link from "next/link";
import logoTransparent from "@/public/logo_transparent.png";
import Image from "next/image";
import { getUserOptionalServer } from "@/helper/session";

export default async function Navbar() {
    const user = await getUserOptionalServer();

	return (
		<nav className="bg-emerald-700 p-4">
			<div className="container mx-auto flex justify-between items-center">
                <Link href="/" className="flex flex-row items-center gap-2">
                    <Image src={logoTransparent} alt="MacroChef" width={50} height={50} />
				    <span className="text-white text-2xl font-bold">MacroChef</span>
                </Link>
				<div>
					{/* <Link href="/about" className="text-white">About</Link> */}
					<Link href="/ingredients" className="text-white ml-4">Ingredients</Link>
                    <Link href="/recipes" className="text-white ml-4">Recipes</Link>

                    {user ? (
                        <div>
                            <Link href="/meals" className="text-white ml-4">Meals</Link>
                            <div className="text-white ml-4">|</div>
                            <Link href="/profile" className="text-white ml-4">Profile</Link>
                            <Link href="/api/auth/logout?callbackUrl=/" className="text-white ml-4">Sign Out</Link>
                        </div>
                    ) : (
                        <Link href="/login" className="text-white ml-4">Sign In</Link>
                    )}
				</div>
			</div>
		</nav>
	)
}
