// Adapted from shadcn-admin/src/components/sign-out-dialog.tsx
// Uses Better Auth signOut() instead of Zustand auth store
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { signOut } from "@/lib/auth-client";
import { ConfirmDialog } from "@/components/confirm-dialog";

interface SignOutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SignOutDialog({ open, onOpenChange }: SignOutDialogProps) {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  async function handleConfirm() {
    setIsLoading(true);
    try {
      await signOut({
        fetchOptions: {
          onSuccess: () => {
            navigate({ to: "/login" });
          },
        },
      });
    } finally {
      setIsLoading(false);
      onOpenChange(false);
    }
  }

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      handleConfirm={handleConfirm}
      disabled={isLoading}
      isLoading={isLoading}
      title="Sign out"
      desc="Are you sure you want to sign out?"
      confirmText="Sign out"
      destructive
    />
  );
}
