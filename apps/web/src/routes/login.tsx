import { createFileRoute, redirect } from "@tanstack/react-router";
import { authClient } from "@/lib/auth-client";
import SignInForm from "@/components/sign-in-form";

export const Route = createFileRoute("/login")({
  // If already authenticated, redirect to dashboard
  beforeLoad: async () => {
    const { data } = await authClient.getSession();
    if (data?.session) {
      throw redirect({ to: "/" });
    }
  },
  component: LoginPage,
});

function LoginPage() {
  return (
    <div className="min-h-svh flex items-center justify-center bg-muted/30">
      <div className="w-full max-w-sm">
        <SignInForm />
      </div>
    </div>
  );
}
