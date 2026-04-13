import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { History } from "lucide-react";
import { Skeleton } from "@ndma-dcs-staff-portal/ui/components/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@ndma-dcs-staff-portal/ui/components/table";
import { Header } from "@/components/layout/header";
import { Main } from "@/components/layout/main";
import { ThemeSwitch } from "@/components/theme-switch";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/_authenticated/rota/history")({
  component: HistoryPage,
});

type HistoryAction = "created" | "assigned" | "removed" | "swapped" | "published";

const ROLE_LABELS: Record<string, string> = {
  lead_engineer: "Lead Engineer",
  asn_support: "ASN Support",
  core_support: "Core Support",
  enterprise_support: "Enterprise Support",
};

const ACTION_COLORS: Record<HistoryAction, string> = {
  created: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  assigned: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  removed: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  swapped: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  published: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300",
};

function HistoryPage() {
  const { data, isLoading } = useQuery(
    orpc.rota.history.queryOptions({ input: { limit: 50 } })
  );

  return (
    <>
      <Header fixed>
        <div className="flex items-center gap-2">
          <History className="size-4 text-muted-foreground" />
          <span className="text-sm font-medium">Rota History</span>
        </div>
        <div className="ms-auto flex items-center gap-2">
          <ThemeSwitch />
        </div>
      </Header>

      <Main>
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">Assignment History</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Audit trail of all on-call schedule changes — last 50 events.
          </p>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date &amp; Time</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Staff Member</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Week</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 5 }).map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : !data?.length ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-12 text-center text-muted-foreground">
                    No history entries found.
                  </TableCell>
                </TableRow>
              ) : (
                data.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="font-mono text-xs text-muted-foreground whitespace-nowrap">
                      {format(new Date(entry.createdAt), "dd MMM yyyy HH:mm")}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium capitalize ${
                          ACTION_COLORS[entry.action as HistoryAction] ??
                          "bg-muted text-muted-foreground"
                        }`}
                      >
                        {entry.action}
                      </span>
                    </TableCell>
                    <TableCell className="font-medium">
                      {entry.staffProfile?.user?.name ?? (
                        <span className="text-muted-foreground italic">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {entry.role ? (
                        ROLE_LABELS[entry.role] ?? entry.role
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                      {entry.schedule?.weekStart ? (
                        <>
                          {format(parseISO(entry.schedule.weekStart), "dd MMM")}
                          {entry.schedule.weekEnd
                            ? ` – ${format(parseISO(entry.schedule.weekEnd), "dd MMM yyyy")}`
                            : ""}
                        </>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Main>
    </>
  );
}
