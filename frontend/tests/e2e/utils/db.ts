import postgres from "postgres";
import { loadEnv } from "./env";

loadEnv();

const connectionString = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL or TEST_DATABASE_URL must be set for E2E tests.");
}

const sql = postgres(connectionString, { max: 1 });

export async function getUserByEmail(email: string) {
  const [row] = await sql<{
    id: string;
    email: string;
    email_verified: boolean;
    banned: boolean;
  }[]>`
    select id, email, email_verified, banned
    from users
    where email = ${email}
    limit 1
  `;

  return row ?? null;
}

export async function setUserVerified(email: string, verified: boolean) {
  await sql`
    update users
    set email_verified = ${verified}
    where email = ${email}
  `;
}

export async function setUserBanned(email: string, banned: boolean) {
  await sql`
    update users
    set banned = ${banned}, ban_expires = null
    where email = ${email}
  `;
}

export async function deleteUserByEmail(email: string) {
  await sql`
    delete from users
    where email = ${email}
  `;
}

export async function closeDb() {
  await sql.end({ timeout: 5 });
}
