import { getUserOptionalServer } from "@/helper/session";
import { redirect } from "next/navigation";

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const user = await getUserOptionalServer();

    if (!user) {
        redirect("/login");
    }

    // Optionally add admin role check here
    // if (user.role !== "admin") {
    // 	redirect("/");
    // }

    return <>{children}</>;
}
