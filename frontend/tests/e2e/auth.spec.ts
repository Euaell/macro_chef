import { test, expect, Page } from "@playwright/test";
import { createEmailVerificationToken } from "better-auth/api";
import { loadEnv } from "./utils/env";
import {
  closeDb,
  deleteUserByEmail,
  getUserByEmail,
  getPasswordResetToken,
  setUserBanned,
  setUserVerified,
} from "./utils/db";

loadEnv();

const backendUrl =
  process.env.PLAYWRIGHT_BACKEND_URL ||
  process.env.E2E_BACKEND_URL ||
  "http://localhost:5000";

const authSecret = process.env.BETTER_AUTH_SECRET;
if (!authSecret) {
  throw new Error("BETTER_AUTH_SECRET is required for E2E auth tests.");
}

const password = "Passw0rd!123";

function uniqueEmail(tag: string) {
  return `e2e+${tag}-${Date.now()}@example.com`;
}

async function register(page: Page, email: string, pwd: string) {
  await page.goto("/register");
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', pwd);
  await page.fill('input[name="confirmPassword"]', pwd);
  await page.click('button[type="submit"]');
  await page.waitForURL("**/login");
}

async function login(page: Page, email: string, pwd: string, callbackUrl?: string) {
  const url = callbackUrl
    ? `/login?callbackUrl=${encodeURIComponent(callbackUrl)}`
    : "/login";
  await page.goto(url);
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', pwd);
  await page.click('button[type="submit"]');
}

async function verifyEmail(page: Page, email: string) {
  const token = await createEmailVerificationToken(authSecret, email);
  const verifyUrl = `/api/auth/verify-email?token=${encodeURIComponent(token)}&callbackURL=${encodeURIComponent("/")}`;
  const response = await page.request.get(verifyUrl);
  expect(response.status()).toBeGreaterThanOrEqual(200);
  expect(response.status()).toBeLessThan(400);
}

async function getJwt(page: Page) {
  const tokenResponse = await page.request.get("/api/auth/token");
  expect(tokenResponse.ok()).toBeTruthy();
  const data = await tokenResponse.json();
  expect(data.token).toBeTruthy();
  return data.token as string;
}

async function requestPasswordReset(page: Page, email: string) {
  const response = await page.request.post("/api/auth/request-password-reset", {
    data: { email },
  });
  expect(response.ok()).toBeTruthy();
}

async function resetPassword(page: Page, token: string, newPassword: string) {
  const response = await page.request.post("/api/auth/reset-password", {
    data: { token, newPassword },
  });
  expect(response.ok()).toBeTruthy();
}

test.describe.configure({ mode: "serial" });

test.afterAll(async () => {
  await closeDb();
});

test("signup -> verify -> login -> backend access", async ({ page }) => {
  const email = uniqueEmail("happy");

  try {
    await register(page, email, password);

    await login(page, email, password);
    await expect(
      page.locator("text=Please verify your email address before signing in")
    ).toBeVisible();

    await verifyEmail(page, email);

    await login(page, email, password);

    const jwt = await getJwt(page);
    const meRes = await page.request.get(`${backendUrl}/api/Users/me`, {
      headers: { Authorization: `Bearer ${jwt}` },
    });
    expect(meRes.status()).toBe(200);
    const me = await meRes.json();
    expect(me.email).toBe(email);

    const dbUser = await getUserByEmail(email);
    expect(dbUser).not.toBeNull();
    expect(dbUser?.id).toBe(me.id);
  } finally {
    await deleteUserByEmail(email);
  }
});

test("backend rejects banned user", async ({ page }) => {
  const email = uniqueEmail("banned");

  try {
    await register(page, email, password);
    await verifyEmail(page, email);

    await login(page, email, password, `/verify?email=${email}`);
    await page.waitForURL("**/verify?email=*");

    const jwt = await getJwt(page);

    await setUserBanned(email, true);

    const meRes = await page.request.get(`${backendUrl}/api/Users/me`, {
      headers: { Authorization: `Bearer ${jwt}` },
    });
    expect(meRes.status()).toBe(401);
  } finally {
    await deleteUserByEmail(email);
  }
});

test("backend rejects unverified user", async ({ page }) => {
  const email = uniqueEmail("unverified");

  try {
    await register(page, email, password);
    await verifyEmail(page, email);

    await login(page, email, password, `/verify?email=${email}`);
    await page.waitForURL("**/verify?email=*");

    const jwt = await getJwt(page);

    await setUserVerified(email, false);

    const meRes = await page.request.get(`${backendUrl}/api/Users/me`, {
      headers: { Authorization: `Bearer ${jwt}` },
    });
    expect(meRes.status()).toBe(401);
  } finally {
    await deleteUserByEmail(email);
  }
});

test("password reset updates credentials", async ({ page }) => {
  const email = uniqueEmail("reset");
  const newPassword = "NewPassw0rd!456";

  try {
    await register(page, email, password);
    await verifyEmail(page, email);

    await login(page, email, password);
    await getJwt(page);

    await requestPasswordReset(page, email);
    const token = await getPasswordResetToken(email);
    expect(token).toBeTruthy();

    await resetPassword(page, token!, newPassword);

    await login(page, email, newPassword);
    await getJwt(page);
  } finally {
    await deleteUserByEmail(email);
  }
});

test("sign-out clears session token access", async ({ page }) => {
  const email = uniqueEmail("signout");

  try {
    await register(page, email, password);
    await verifyEmail(page, email);
    await login(page, email, password);
    await getJwt(page);

    const signOutResponse = await page.request.post("/api/auth/sign-out");
    expect(signOutResponse.ok()).toBeTruthy();

    const tokenResponse = await page.request.get("/api/auth/token");
    expect(tokenResponse.status()).toBe(401);
  } finally {
    await deleteUserByEmail(email);
  }
});
