import { env } from "@ndma-dcs-staff-portal/env/web";
import { adminClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

// Resolve auth base URL: use VITE_SERVER_URL in dev; fall back to current
// origin in production so Better Auth always has an absolute URL.
const authBase =
  env.VITE_SERVER_URL ||
  (typeof window !== "undefined" ? window.location.origin : "");

export const authClient = createAuthClient({
  baseURL: authBase,
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
