import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { jwt, organization } from "better-auth/plugins";
import { db } from "@/db/client";

import * as schema from "@/db/schema";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      ...schema,
      user: schema.users,
      session: schema.sessions,
      account: schema.accounts,
      jwks: schema.jwks,
      verification: schema.verification,
    },
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    sendResetPassword: async ({ user, url }) => {
      // TODO: Replace with actual email service for production
      // Options: Resend, SendGrid, Nodemailer, AWS SES, etc.
      // Example with Resend:
      // await resend.emails.send({
      //   from: 'Mizan <noreply@mizan.app>',
      //   to: user.email,
      //   subject: 'Reset your password',
      //   html: `Click here to reset your password: <a href="${url}">${url}</a>`
      // });
      console.log(`\n🔐 Password Reset for ${user.email}`);
      console.log(`🔗 Reset URL: ${url}`);
      console.log(`\nDEV MODE: Click the link above to reset your password\n`);
    },
  },
  emailVerification: {
    sendVerificationEmail: async ({ user, url, token }) => {
      // TODO: Replace with actual email service for production
      // Options: Resend, SendGrid, Nodemailer, AWS SES, etc.
      // Example with Resend:
      // await resend.emails.send({
      //   from: 'Mizan <noreply@mizan.app>',
      //   to: user.email,
      //   subject: 'Verify your email address',
      //   html: `Click here to verify your email: <a href="${url}">${url}</a>`
      // });
      console.log(`\n📧 Email Verification for ${user.email}`);
      console.log(`🔗 Verification URL: ${url}`);
      console.log(`🎫 Token: ${token}`);
      console.log(`\nDEV MODE: Click the link above to verify your email\n`);
    },
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    },
  },
  plugins: [
    jwt({
      jwt: {
        issuer: process.env.BETTER_AUTH_URL || "http://localhost:3000",
        audience: "mizan-api",
        expirationTime: "15m",
      },
    }),
    organization({
      // Maps to household concept
      allowUserToCreateOrganization: true,
      organizationLimit: 5,
    }),
  ],
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutes
    },
  },
  rateLimit: {
    window: 60,
    max: 100,
  },
  advanced: {
    database: {
      generateId: () => crypto.randomUUID(),
    },
  },
  trustedOrigins: [
    process.env.BETTER_AUTH_URL || "http://localhost:3000",
    process.env.API_URL || "http://localhost:5000",
  ],
});

export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.Session.user;
