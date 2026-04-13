import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  ClipboardCheck,
  Plus,
  RefreshCw,
} from "lucide-react";
import { format, isPast, parseISO } from "date-fns";
import { Button } from "@ndma-dcs-staff-portal/ui/components/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@ndma-dcs-staff-portal/ui/components/table";
import { Skeleton } from "@ndma-dcs-staff-portal/ui/components/skeleton";
import { Header } from "@/components/layout/header";
import { Main } from "@/components/layout/main";
import { ThemeSwitch } from "@/components/theme-switch";
import { orpc } from "@/utils/orpc";
import { StatusBadge, PriorityBadge, TypeBadge } from "@/features/work/components/badges";
import type { WorkStatus, WorkType, WorkPriority } from "@/features/work/components/badges";

export const Route = createFileRoute("/_authenticated/work/")({
  component: WorkPage,
});

const STATUS_OPTIONS: { value: WorkStatus | ""; label: string }[] = [
  { value: "", label: "All Statuses" },
  { value: "backlog", label: "Backlog" },
  { value: "todo", label: "To Do" },
  { value: "in_progress", label: "In Progress" },
  { value: "blocked", label: "Blocked" },
  { value: "review", label: "Review" },
  { value: "done", label: "Done" },
  { value: "cancelled", label: "Cancelled" },
];

const TYPE_OPTIONS: { value: WorkType | ""; label: string }[] = [
  { value: "", label: "All Types" },
  { value: "routine", label: "Routine" },
  { value: "project", label: "Project" },
  { value: "external_request", label: "External Request" },
  { value: "ad_hoc", label: "Ad Hoc" },
];

const PRIORITY_OPTIONS: { value: WorkPriority | ""; label: string }[] = [
  { value: "", label: "All Priorities" },
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "critical", label: "Critical" },
];

function WorkPage() {
  const [status, setStatus] = useState<WorkStatus | "">("");
  const [type, setType] = useState<WorkType | "">("");
  const [priority, setPriority] = useState<WorkPriority | "">("");
  const [overdueOnly, setOverdueOnly] = useState(false);

  const { data, isLoading, error, refetch } = useQuery(
    orpc.work.list.queryOptions({
      input: {
        status: status || undefined,
        type: type || undefined,
        priority: priority || undefined,
        overdueOnly: overdueOnly || undefined,
        limit: 100,
        offset: 0,
      },
    })
  );

  const { data: stats } = useQuery(orpc.work.stats.queryOptions());

  return (
    <>
      <Header fixed>
        <div className="flex items-center gap-2">
          <ClipboardCheck className="size-4 text-muted-foreground" />
          <span className="text-sm font-medium">Work Register</span>
        </div>
        <div className="ms-auto flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => refetch()} title="Refresh">
            <RefreshCw className="size-4" />
          </Button>
          <ThemeSwitch />
          <Link to="/work/new">
            <Button size="sm">
              <Plus className="size-4 mr-1" />
              New Work Item
            </Button>
          </Link>
        </div>
      </Header>

      <Main>
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">Work Register</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track operational work items, projects, and external requests.
          </p>
        </div>

        {/* Stats bar */}
        {stats && (
          <div className="mb-4 flex flex-wrap gap-4 text-sm">
            <span className="text-muted-foreground">
              <strong className="text-foreground">{stats.total}</strong> total
            </span>
            <span className="text-muted-foreground">
              <strong className="text-indigo-600">{stats.byStatus["in_progress"] ?? 0}</strong> in progress
            </span>
            <span className="text-muted-foreground">
              <strong className="text-amber-600">{stats.byStatus["review"] ?? 0}</strong> in review
            </span>
            {stats.overdue > 0 && (
              <span className="flex items-center gap-1 text-red-600">
                <AlertCircle className="size-3.5" />
                <strong>{stats.overdue}</strong> overdue
              </span>
            )}
          </div>
        )}

        {/* Filters */}
        <div className="mb-4 flex flex-wrap gap-3">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as WorkStatus | "")}
            className="rounded-md border bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>

          <select
            value={type}
            onChange={(e) => setType(e.target.value as WorkType | "")}
            className="rounded-md border bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {TYPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>

          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as WorkPriority | "")}
            className="rounded-md border bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {PRIORITY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>

          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={overdueOnly}
              onChange={(e) => setOverdueOnly(e.target.checked)}
              className="rounded border"
            />
            Overdue only
          </label>
        </div>

        {/* Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40%]">Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Assignee</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Due Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                    Failed to load work items.{" "}
                    <button onClick={() => refetch()} className="underline">
                      Retry
                    </button>
                  </TableCell>
                </TableRow>
              ) : !data?.length ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-12 text-center text-muted-foreground">
                    No work items found.{" "}
                    <Link to="/work/new" className="underline">
                      Create one
                    </Link>
                  </TableCell>
                </TableRow>
              ) : (
                data.map((item) => {
                  const isOverdue =
                    item.dueDate &&
                    isPast(parseISO(item.dueDate)) &&
                    item.status !== "done" &&
                    item.status !== "cancelled";

                  return (
                    <TableRow key={item.id} className="cursor-pointer">
                      <TableCell>
                        <Link
                          to="/work/$workItemId"
                          params={{ workItemId: item.id }}
                          className="font-medium hover:underline"
                        >
                          {item.title}
                        </Link>
                        {item.description && (
                          <p className="truncate max-w-xs text-xs text-muted-foreground mt-0.5">
                            {item.description}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        <TypeBadge type={item.type as WorkType} />
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={item.status as WorkStatus} />
                      </TableCell>
                      <TableCell>
                        <PriorityBadge priority={item.priority as WorkPriority} />
                      </TableCell>
                      <TableCell>
                        {item.assignedTo?.user?.name ?? (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {item.department?.name ?? (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {item.dueDate ? (
                          <span className={isOverdue ? "text-red-600 font-medium" : ""}>
                            {format(parseISO(item.dueDate), "dd MMM yyyy")}
                            {isOverdue && " ⚠️"}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
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
