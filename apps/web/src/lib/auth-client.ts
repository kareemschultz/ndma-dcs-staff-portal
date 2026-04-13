import { env } from "@ndma-dcs-staff-portal/env/web";
import { adminClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  // Empty string → Better Auth auto-detects current window.location.origin.
  // Set VITE_SERVER_URL in .env.local for dev (http://localhost:3000).
  baseURL: env.VITE_SERVER_URL || undefined,
  plugins: [
    adminClient(),
  ],
});

export type { Session, User } from "better-auth/types";
export const {
  useSession,
  signIn,
  signOut,
  signUp,
} = authClient;
