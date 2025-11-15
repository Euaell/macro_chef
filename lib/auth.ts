import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { prisma } from '@/lib/prisma';
import {
  twoFactor,
  magicLink,
  organization,
  admin,
  multiSession,
  bearer,
  anonymous,
} from 'better-auth/plugins';
import { sendVerificationEmail, sendMagicLinkEmail, sendPasswordResetEmail } from '@/lib/email';

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    sendResetPassword: async ({ user, url }) => {
      await sendPasswordResetEmail(user.email, url);
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    sendVerificationEmail: async ({ user, url }) => {
      await sendVerificationEmail(user.email, url);
    },
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      enabled: !!process.env.GOOGLE_CLIENT_ID,
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      enabled: !!process.env.GITHUB_CLIENT_ID,
    },
  },
  plugins: [
    twoFactor({
      issuer: 'MacroChef',
    }),
    magicLink({
      sendMagicLink: async ({ email, url }) => {
        await sendMagicLinkEmail(email, url);
      },
    }),
    organization({
      allowUserToCreateOrganization: true,
      organizationLimit: 5,
    }),
    admin({
      defaultRole: 'user',
      impersonationSessionDuration: 60 * 60, // 1 hour
    }),
    multiSession(),
    bearer(),
    anonymous(),
  ],
  advanced: {
    generateId: () => {
      // Use cuid for ID generation to match Prisma
      return crypto.randomUUID();
    },
    cookieOptions: {
      sameSite: 'lax',
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
    },
  },
  rateLimit: {
    enabled: true,
    window: 60, // 1 minute
    max: 100, // 100 requests per window
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // Cache in cookie for 5 minutes
    },
  },
  user: {
    additionalFields: {
      username: {
        type: 'string',
        required: false,
        unique: true,
      },
      bio: {
        type: 'string',
        required: false,
      },
      isPublic: {
        type: 'boolean',
        required: false,
        defaultValue: true,
      },
      isAdmin: {
        type: 'boolean',
        required: false,
        defaultValue: false,
      },
      role: {
        type: 'string',
        required: false,
        defaultValue: 'user',
      },
    },
  },
  trustedOrigins: [
    process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    ...(process.env.TRUSTED_ORIGINS?.split(',') || []),
  ],
});

export type Session = typeof auth.$Infer.Session.session;
export type User = typeof auth.$Infer.Session.user;
