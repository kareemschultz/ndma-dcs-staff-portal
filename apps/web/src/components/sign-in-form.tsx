// DCS Ops Center login form
// Shows both local email/password AND Active Directory (LDAP) options — CLAUDE.md mandate
import { useNavigate } from "@tanstack/react-router";
import { useForm } from "@tanstack/react-form";
import { toast } from "sonner";
import { Shield, Loader2, Building2 } from "lucide-react";
import z from "zod";

import { Button } from "@ndma-dcs-staff-portal/ui/components/button";
import { Input } from "@ndma-dcs-staff-portal/ui/components/input";
import { Label } from "@ndma-dcs-staff-portal/ui/components/label";
import { Separator } from "@ndma-dcs-staff-portal/ui/components/separator";
import { authClient } from "@/lib/auth-client";

export default function SignInForm() {
  const navigate = useNavigate();

  const form = useForm({
    defaultValues: {
      email: "",
      password: "",
    },
    onSubmit: async ({ value }) => {
      await authClient.signIn.email(
        { email: value.email, password: value.password },
        {
          onSuccess: () => {
            toast.success("Signed in successfully");
            navigate({ to: "/" });
          },
          onError: (ctx) => {
            toast.error(ctx.error.message || "Invalid credentials");
          },
        },
      );
    },
    validators: {
      onSubmit: z.object({
        email: z.email("Enter a valid email address"),
        password: z.string().min(1, "Password is required"),
      }),
    },
  });

  return (
    <div className="rounded-lg border bg-card p-8 shadow-sm">
      {/* Branding */}
      <div className="mb-8 flex flex-col items-center gap-2">
        <div className="flex size-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Shield className="size-6" />
        </div>
        <h1 className="text-xl font-semibold">DCS Ops Center</h1>
        <p className="text-sm text-muted-foreground">NDMA Data Centre Services</p>
      </div>

      {/* Email + Password form — always enabled (CLAUDE.md: emergency fallback) */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
        className="space-y-4"
      >
        <form.Field name="email">
          {(field) => (
            <div className="space-y-1.5">
              <Label htmlFor={field.name}>Email address</Label>
              <Input
                id={field.name}
                name={field.name}
                type="email"
                autoComplete="email"
                placeholder="you@ndma.gov"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                aria-invalid={field.state.meta.errors.length > 0}
              />
              {field.state.meta.errors.map((err) => (
                <p key={err?.message} className="text-xs text-destructive">
                  {err?.message}
                </p>
              ))}
            </div>
          )}
        </form.Field>

        <form.Field name="password">
          {(field) => (
            <div className="space-y-1.5">
              <Label htmlFor={field.name}>Password</Label>
              <Input
                id={field.name}
                name={field.name}
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                aria-invalid={field.state.meta.errors.length > 0}
              />
              {field.state.meta.errors.map((err) => (
                <p key={err?.message} className="text-xs text-destructive">
                  {err?.message}
                </p>
              ))}
            </div>
          )}
        </form.Field>

        <form.Subscribe
          selector={(state) => ({ canSubmit: state.canSubmit, isSubmitting: state.isSubmitting })}
        >
          {({ canSubmit, isSubmitting }) => (
            <Button
              type="submit"
              className="w-full"
              disabled={!canSubmit || isSubmitting}
            >
              {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
              Sign in
            </Button>
          )}
        </form.Subscribe>
      </form>

      {/* Active Directory SSO — feature flag placeholder */}
      <div className="my-6 flex items-center gap-3">
        <Separator className="flex-1" />
        <span className="text-xs text-muted-foreground">or</span>
        <Separator className="flex-1" />
      </div>

      <Button
        type="button"
        variant="outline"
        className="w-full"
        disabled
        title="Active Directory integration — coming soon"
      >
        <Building2 className="mr-2 size-4" />
        Sign in with Active Directory
        <span className="ms-auto text-xs text-muted-foreground">(Coming soon)</span>
      </Button>
    </div>
  );
}
