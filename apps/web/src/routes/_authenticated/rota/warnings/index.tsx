import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { AlertTriangle, CheckCircle2, XCircle, CheckCircle } from "lucide-react";
import { Badge } from "@ndma-dcs-staff-portal/ui/components/badge";
import { Button } from "@ndma-dcs-staff-portal/ui/components/button";
import { Skeleton } from "@ndma-dcs-staff-portal/ui/components/skeleton";
import { Header } from "@/components/layout/header";
import { Main } from "@/components/layout/main";
import { ThemeSwitch } from "@/components/theme-switch";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/_authenticated/rota/warnings/")({
  component: WarningsPage,
});

const ROLE_LABELS: Record<string, string> = {
  lead_engineer: "Lead Engineer",
  asn_support: "ASN Support",
  core_support: "Core Support",
  enterprise_support: "Enterprise Support",
};

type ImportWarning = {
  id: string;
  role: string;
  rawValue: string;
  weekStart: string;
  weekEnd: string;
  status: string;
  schedule?: {
    weekStart?: string;
    weekEnd?: string;
  } | null;
};

function WarningCard({
  warning,
  onResolve,
  onDismiss,
  isInFlight,
}: {
  warning: ImportWarning;
  onResolve: (id: string) => void;
  onDismiss: (id: string) => void;
  isInFlight: boolean;
}) {
  const weekStart = warning.weekStart ?? warning.schedule?.weekStart;
  const weekEnd = warning.weekEnd ?? warning.schedule?.weekEnd;

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 px-4 py-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="size-3.5 text-amber-500 shrink-0" />
            <span className="text-sm font-semibold text-foreground">
              {ROLE_LABELS[warning.role] ?? warning.role}
            </span>
            <Badge
              variant="outline"
              className="text-amber-600 border-amber-300 dark:text-amber-400 dark:border-amber-700 text-[10px] px-1.5 py-0"
            >
              Needs Review
            </Badge>
          </div>

          <p className="text-sm text-muted-foreground mb-1">
            Ambiguous entry:{" "}
            <span className="font-mono text-amber-700 dark:text-amber-300 font-medium">
              &ldquo;{warning.rawValue}&rdquo;
            </span>
          </p>

          {weekStart && weekEnd && (
            <p className="text-xs text-muted-foreground">
              Week:{" "}
              <span className="font-medium">
                {format(parseISO(weekStart), "d MMM yyyy")}
              </span>
              <span className="mx-1">–</span>
              <span className="font-medium">
                {format(parseISO(weekEnd), "d MMM yyyy")}
              </span>
            </p>
          )}
        </div>

        <div className="flex gap-2 shrink-0 pt-0.5">
          <Button
            size="sm"
            variant="outline"
            className="h-8 gap-1.5 border-green-300 text-green-700 hover:bg-green-50 hover:text-green-800 dark:border-green-700 dark:text-green-400 dark:hover:bg-green-950/40"
            disabled={isInFlight}
            onClick={() => onResolve(warning.id)}
          >
            <CheckCircle2 className="size-3.5" />
            Mark Resolved
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 gap-1.5 text-muted-foreground hover:text-foreground"
            disabled={isInFlight}
            onClick={() => onDismiss(warning.id)}
          >
            <XCircle className="size-3.5" />
            Dismiss
          </Button>
        </div>
      </div>
    </div>
  );
}

function WarningsPage() {
  const queryClient = useQueryClient();
  const [inFlightIds, setInFlightIds] = useState<Set<string>>(new Set());

  const { data: warnings, isLoading } = useQuery(
    orpc.rota.listImportWarnings.queryOptions({ input: { status: "pending" } })
  );

  const resolveMutation = useMutation(
    orpc.rota.resolveImportWarning.mutationOptions({
      onSettled: (_data, _error, vars) => {
        const id = (vars as { warningId: string }).warningId;
        setInFlightIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      },
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: orpc.rota.listImportWarnings.key(),
        });
      },
    })
  );

  function handleAction(warningId: string, action: "resolved" | "dismissed") {
    setInFlightIds((prev) => new Set(prev).add(warningId));
    resolveMutation.mutate({ warningId, action });
  }

  const pendingCount = warnings?.length ?? 0;

  return (
    <>
      <Header fixed>
        <div className="flex items-center gap-2">
          <AlertTriangle className="size-4 text-amber-500" />
          <span className="text-sm font-medium">Import Warnings</span>
          {!isLoading && pendingCount > 0 && (
            <span className="inline-flex size-5 items-center justify-center rounded-full bg-amber-500 text-[10px] font-semibold text-white">
              {pendingCount}
            </span>
          )}
        </div>
        <div className="ms-auto flex items-center gap-2">
          <ThemeSwitch />
        </div>
      </Header>

      <Main>
        <div className="mb-6">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">Import Warnings</h1>
            {!isLoading && pendingCount > 0 && (
              <Badge
                variant="outline"
                className="text-amber-600 border-amber-300 dark:text-amber-400 dark:border-amber-700"
              >
                {pendingCount} pending
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Ambiguous entries from the roster spreadsheet import that require manual review.
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="rounded-lg border border-amber-200 bg-amber-50/50 dark:bg-amber-950/10 p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-72" />
                    <Skeleton className="h-3 w-40" />
                  </div>
                  <div className="flex gap-2">
                    <Skeleton className="h-8 w-28" />
                    <Skeleton className="h-8 w-20" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : pendingCount === 0 ? (
          <div className="rounded-lg border border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-800 p-12 text-center">
            <CheckCircle className="size-10 text-green-500 mx-auto mb-3" />
            <p className="text-base font-semibold text-green-700 dark:text-green-400">
              No pending import warnings
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              All ambiguous roster entries have been reviewed.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {(warnings as unknown as ImportWarning[]).map((warning) => (
              <WarningCard
                key={warning.id}
                warning={warning}
                isInFlight={inFlightIds.has(warning.id)}
                onResolve={(id) => handleAction(id, "resolved")}
                onDismiss={(id) => handleAction(id, "dismissed")}
              />
            ))}
          </div>
        )}
      </Main>
    </>
  );
}
