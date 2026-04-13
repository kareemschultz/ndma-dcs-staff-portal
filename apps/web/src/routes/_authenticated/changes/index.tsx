import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { format, parseISO, isPast } from "date-fns";
import { Wrench, Plus, AlertCircle } from "lucide-react";
import { Button } from "@ndma-dcs-staff-portal/ui/components/button";
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
import { orpc, queryClient } from "@/utils/orpc";

export const Route = createFileRoute("/_authenticated/changes/")({
  component: TempChangesPage,
});

type ChangeStatus =
  | "planned"
  | "implemented"
  | "active"
  | "overdue"
  | "removed"
  | "cancelled";

const STATUS_COLORS: Record<ChangeStatus, string> = {
  planned: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  implemented: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300",
  active: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  overdue: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  removed: "bg-muted text-muted-foreground",
  cancelled: "bg-muted text-muted-foreground",
};

function TempChangesPage() {
  const [showOverdueOnly, setShowOverdueOnly] = useState(false);
  const [status, setStatus] = useState<ChangeStatus | "">("");

  const effectiveStatus = showOverdueOnly ? "overdue" : status || undefined;

  const { data, isLoading } = useQuery(
    orpc.tempChanges.list.queryOptions({
      input: { status: effectiveStatus, limit: 100, offset: 0 },
    })
  );

  const { data: stats } = useQuery(orpc.tempChanges.stats.queryOptions());
  const { data: overdueItems } = useQuery(orpc.tempChanges.getOverdue.queryOptions());

  const markRemovedMutation = useMutation(
    orpc.tempChanges.markRemoved.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: orpc.tempChanges.list.key() });
        queryClient.invalidateQueries({ queryKey: orpc.tempChanges.stats.key() });
        queryClient.invalidateQueries({ queryKey: orpc.tempChanges.getOverdue.key() });
        toast.success("Change marked as removed");
      },
      onError: (err) => toast.error(err.message),
    })
  );

  return (
    <>
      <Header fixed>
        <div className="flex items-center gap-2">
          <Wrench className="size-4 text-muted-foreground" />
          <span className="text-sm font-medium">Temporary Changes</span>
        </div>
        <div className="ms-auto flex items-center gap-2">
          <ThemeSwitch />
          <Link to="/changes/new">
            <Button size="sm">
              <Plus className="size-4 mr-1" />
              Log Change
            </Button>
          </Link>
        </div>
      </Header>

      <Main>
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">Temporary Changes</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track temporary technical changes with remove-by dates.
          </p>
        </div>

        {/* Overdue alert */}
        {overdueItems && overdueItems.length > 0 && (
          <div className="mb-4 flex items-center gap-2 rounded-md border border-red-200 bg-red-50 dark:bg-red-900/20 p-3 text-sm text-red-700 dark:text-red-300">
            <AlertCircle className="size-4 shrink-0" />
            <strong>{overdueItems.length}</strong> change{overdueItems.length > 1 ? "s" : ""} are past their remove-by date and need attention.
          </div>
        )}

        {/* Stats */}
        {stats && (
          <div className="mb-4 flex flex-wrap gap-4 text-sm">
            <span className="text-muted-foreground">
              <strong className="text-foreground">{stats.total}</strong> total
            </span>
            <span className="text-green-600">
              <strong>{stats.byStatus?.active ?? 0}</strong> active
            </span>
            <span className="text-red-600">
              <strong>{stats.byStatus?.overdue ?? 0}</strong> overdue
            </span>
            <span className="text-indigo-600">
              <strong>{stats.byStatus?.implemented ?? 0}</strong> implemented
            </span>
          </div>
        )}

        {/* Filters */}
        <div className="mb-4 flex flex-wrap gap-3">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as ChangeStatus | "")}
            className="rounded-md border bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">All Statuses</option>
            <option value="planned">Planned</option>
            <option value="implemented">Implemented</option>
            <option value="active">Active</option>
            <option value="overdue">Overdue</option>
            <option value="removed">Removed</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={showOverdueOnly}
              onChange={(e) => setShowOverdueOnly(e.target.checked)}
              className="rounded border"
            />
            Overdue only
          </label>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Implemented</TableHead>
                <TableHead>Remove By</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : !data?.length ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                    No temporary changes found.{" "}
                    <Link to="/changes/new" className="underline">Log one</Link>
                  </TableCell>
                </TableRow>
              ) : (
                data.map((change) => {
                  const isOverdue =
                    change.removeByDate &&
                    isPast(parseISO(change.removeByDate)) &&
                    change.status !== "removed" &&
                    change.status !== "cancelled";

                  return (
                    <TableRow key={change.id}>
                      <TableCell>
                        <p className="font-medium">{change.title}</p>
                        {change.justification && (
                          <p className="text-xs text-muted-foreground truncate max-w-xs mt-0.5">
                            {change.justification}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        {change.owner?.user?.name ?? "—"}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${
                            STATUS_COLORS[change.status as ChangeStatus] ?? ""
                          }`}
                        >
                          {change.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        {change.implementationDate
                          ? format(parseISO(change.implementationDate), "dd MMM yyyy")
                          : "—"}
                      </TableCell>
                      <TableCell>
                        {change.removeByDate ? (
                          <span className={isOverdue ? "text-red-600 font-medium" : "text-muted-foreground text-xs"}>
                            {format(parseISO(change.removeByDate), "dd MMM yyyy")}
                            {isOverdue && " ⚠️"}
                          </span>
                        ) : "—"}
                      </TableCell>
                      <TableCell>
                        {change.status !== "removed" && change.status !== "cancelled" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs"
                            onClick={() => markRemovedMutation.mutate({ id: change.id })}
                          >
                            Mark Removed
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </Main>
    </>
  );
}
