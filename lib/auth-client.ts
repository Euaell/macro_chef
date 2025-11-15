import { createAuthClient } from 'better-auth/react';
import {
  twoFactorClient,
  magicLinkClient,
  organizationClient,
  adminClient,
  multiSessionClient,
  anonymousClient,
} from 'better-auth/client/plugins';

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  plugins: [
    twoFactorClient(),
    magicLinkClient(),
    organizationClient(),
    adminClient(),
    multiSessionClient(),
    anonymousClient(),
  ],
});

export const {
  signIn,
  signUp,
  signOut,
  useSession,
  useUser,
  // Two Factor
  enableTwoFactor,
  disableTwoFactor,
  verifyTwoFactor,
  // Magic Link
  sendMagicLink,
  // Organization
  createOrganization,
  updateOrganization,
  deleteOrganization,
  inviteMember,
  removeMember,
  updateMemberRole,
  acceptInvitation,
  rejectInvitation,
  leaveOrganization,
  useActiveOrganization,
  // Admin
  impersonateUser,
  stopImpersonation,
  // Multi Session
  listSessions,
  revokeSession,
  revokeOtherSessions,
  // Anonymous
  linkAnonymousAccount,
} = authClient;

// Custom hooks
export function useAuth() {
  const session = useSession();
  const user = useUser();

  return {
    session: session.data,
    user: user.data,
    isLoading: session.isPending || user.isPending,
    isAuthenticated: !!session.data,
  };
}
