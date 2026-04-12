import { createFileRoute, redirect } from "@tanstack/react-router";
import { authClient } from "@/lib/auth-client";
import { AuthenticatedLayout } from "@/components/layout/authenticated-layout";

export const Route = createFileRoute("/_authenticated")({
  // Server-side auth guard: redirects to /login before any layout renders
  beforeLoad: async () => {
    const { data } = await authClient.getSession();
    if (!data?.session) {
      throw redirect({ to: "/login" });
    }
    // Pass session to route context so child routes can access user info
    return { user: data.user, session: data.session };
  },
  component: AuthenticatedLayout,
});
