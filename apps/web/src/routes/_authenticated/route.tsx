import { createFileRoute, redirect } from "@tanstack/react-router";
import { authClient } from "@/lib/auth-client";
import { AuthenticatedLayout } from "@/components/layout/authenticated-layout";

export const Route = createFileRoute("/_authenticated")({
  // Server-side auth guard: redirects to /login before any layout renders
  beforeLoad: async () => {
    try {
      const { data } = await authClient.getSession();
      if (!data?.session) {
        throw redirect({ to: "/login" });
      }
      // Pass session to route context so child routes can access user info
      return { user: data.user, session: data.session };
    } catch (err) {
      // If it's already a redirect, re-throw it
      if (err && typeof err === "object" && "to" in err) throw err;
      // Network/server unreachable — send to login rather than crashing
      throw redirect({ to: "/login" });
    }
  },
  component: AuthenticatedLayout,
});
