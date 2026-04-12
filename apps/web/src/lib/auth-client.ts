import { env } from "@ndma-dcs-staff-portal/env/web";
import { adminClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: env.VITE_SERVER_URL,
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
