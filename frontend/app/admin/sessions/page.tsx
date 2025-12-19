import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/db/client";
import { sessions, users } from "@/db/schema";
import { sql, desc } from "drizzle-orm";
import Link from "next/link";

export const metadata = {
  title: "Session Management | Admin",
  description: "Manage user sessions",
};

interface SearchParams {
  page?: string;
  userId?: string;
}

const SESSIONS_PER_PAGE = 50;

async function getSessions(searchParams: SearchParams) {
  const page = parseInt(searchParams.page || "1");
  const userIdFilter = searchParams.userId;

  const conditions = [sql`${sessions.expiresAt} > NOW()`];

  if (userIdFilter) {
    conditions.push(sql`${sessions.userId} = ${userIdFilter}`);
  }

  const whereClause = sql`${sql.join(conditions, sql` AND `)}`;

  const [sessionList, totalCount] = await Promise.all([
    db
      .select({
        id: sessions.id,
        userId: sessions.userId,
        userName: users.name,
        userEmail: users.email,
        userRole: users.role,
        ipAddress: sessions.ipAddress,
        userAgent: sessions.userAgent,
        createdAt: sessions.createdAt,
        expiresAt: sessions.expiresAt,
        impersonatedBy: sessions.impersonatedBy,
      })
      .from(sessions)
      .leftJoin(users, sql`${sessions.userId} = ${users.id}`)
      .where(whereClause)
      .orderBy(desc(sessions.createdAt))
      .limit(SESSIONS_PER_PAGE)
      .offset((page - 1) * SESSIONS_PER_PAGE),

    db
      .select({ count: sql<number>`count(*)::int` })
      .from(sessions)
      .where(whereClause)
      .then((res) => res[0]?.count || 0),
  ]);

  return {
    sessions: sessionList,
    totalCount,
    totalPages: Math.ceil(totalCount / SESSIONS_PER_PAGE),
    currentPage: page,
  };
}

export default async function SessionsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await auth.api.getSession({
    headers: await import("next/headers").then((mod) => mod.headers()),
  });

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "admin") {
    redirect("/");
  }

  const {
    sessions: sessionList,
    totalCount,
    totalPages,
    currentPage,
  } = await getSessions(searchParams);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Session Management</h1>
          <p className="text-muted-foreground">
            {totalCount} active sessions
          </p>
        </div>
        <Link
          href="/admin"
          className="px-4 py-2 text-sm border rounded-lg hover:bg-accent"
        >
          ← Back to Dashboard
        </Link>
      </div>

      <div className="bg-card rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  IP Address
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Device
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Expires
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {sessionList.map((session) => (
                <tr key={session.id} className="hover:bg-muted/50">
                  <td className="px-6 py-4">
                    <div>
                      <Link
                        href={`/admin/users/${session.userId}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {session.userName || "Unnamed"}
                      </Link>
                      <p className="text-sm text-muted-foreground">
                        {session.userEmail}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        session.userRole === "admin"
                          ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                          : session.userRole === "trainer"
                          ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                          : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
                      }`}
                    >
                      {session.userRole}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    {session.ipAddress || "—"}
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground max-w-xs truncate">
                    {session.userAgent || "—"}
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    {session.createdAt
                      ? new Date(session.createdAt).toLocaleString()
                      : "—"}
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    {session.expiresAt
                      ? new Date(session.expiresAt).toLocaleString()
                      : "—"}
                  </td>
                  <td className="px-6 py-4">
                    {session.impersonatedBy ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                        Impersonated
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                        Active
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </p>
          <div className="flex gap-2">
            {currentPage > 1 && (
              <Link
                href={`/admin/sessions?${new URLSearchParams({
                  ...searchParams,
                  page: (currentPage - 1).toString(),
                }).toString()}`}
                className="px-4 py-2 border rounded-lg hover:bg-accent"
              >
                ← Previous
              </Link>
            )}
            {currentPage < totalPages && (
              <Link
                href={`/admin/sessions?${new URLSearchParams({
                  ...searchParams,
                  page: (currentPage + 1).toString(),
                }).toString()}`}
                className="px-4 py-2 border rounded-lg hover:bg-accent"
              >
                Next →
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
