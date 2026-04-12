// Exact replica from shadcn-admin/src/hooks/use-dialog-state.ts
import * as React from "react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function useDialogState<T = true>(defaultValue?: T): [T | null, React.Dispatch<React.SetStateAction<T | null>>] {
  const [open, setOpen] = React.useState<T | null>(defaultValue ?? null);
  return [open, setOpen];
}
