import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import Link from "next/link";

export const metadata = {
  title: "Trainer-Client Relationships | Admin",
  description: "Manage trainer-client relationships",
};

export default async function RelationshipsPage() {
  const session = await auth.api.getSession({
    headers: await import("next/headers").then((mod) => mod.headers()),
  });

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "admin") {
    redirect("/");
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">
            Trainer-Client Relationships
          </h1>
          <p className="text-muted-foreground">
            Monitor and manage trainer-client connections
          </p>
        </div>
        <Link
          href="/admin"
          className="px-4 py-2 text-sm border rounded-lg hover:bg-accent"
        >
          ← Back to Dashboard
        </Link>
      </div>

      <div className="bg-card rounded-lg border p-12 text-center">
        <div className="text-6xl mb-4">🚧</div>
        <h2 className="text-2xl font-semibold mb-2">Coming Soon</h2>
        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
          Trainer-Client relationship management will be implemented in Phase 3.
          This feature will allow you to:
        </p>
        <ul className="text-left max-w-md mx-auto space-y-2 text-muted-foreground mb-8">
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>View all trainer-client relationships</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>Filter by status (pending, active, revoked)</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>Review and manage permissions</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>Access audit logs</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>Force-revoke relationships in abuse cases</span>
          </li>
        </ul>
        <Link
          href="/admin"
          className="inline-flex px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
        >
          Back to Dashboard
        </Link>
      </div>

      <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-2 text-blue-900 dark:text-blue-100">
          Implementation Notes
        </h3>
        <p className="text-sm text-blue-800 dark:text-blue-200 mb-4">
          Before this feature can be implemented, the following prerequisites
          need to be completed:
        </p>
        <ol className="text-sm text-blue-800 dark:text-blue-200 space-y-2">
          <li className="flex items-start">
            <span className="font-semibold mr-2">1.</span>
            <span>
              Database migration for{" "}
              <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">
                trainer_client_relationships
              </code>{" "}
              table
            </span>
          </li>
          <li className="flex items-start">
            <span className="font-semibold mr-2">2.</span>
            <span>
              Database migration for{" "}
              <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">
                access_audit_log
              </code>{" "}
              table
            </span>
          </li>
          <li className="flex items-start">
            <span className="font-semibold mr-2">3.</span>
            <span>
              Access control middleware implementation (see{" "}
              <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">
                .context/access-control-design.md
              </code>
              )
            </span>
          </li>
          <li className="flex items-start">
            <span className="font-semibold mr-2">4.</span>
            <span>Trainer and client UI flows for requesting/accepting</span>
          </li>
        </ol>
      </div>
    </div>
  );
}
