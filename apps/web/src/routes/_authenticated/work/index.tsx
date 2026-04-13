import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  CheckCircle2,
  ClipboardCheck,
  Columns3,
  LayoutGrid,
  LayoutList,
  Loader2,
  Plus,
  RefreshCw,
  Timer,
} from "lucide-react";
import { format, isPast, parseISO } from "date-fns";
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Button } from "@ndma-dcs-staff-portal/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@ndma-dcs-staff-portal/ui/components/card";
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
import {
  StatusBadge,
  PriorityBadge,
  TypeBadge,
} from "@/features/work/components/badges";
import type {
  WorkStatus,
  WorkType,
  WorkPriority,
} from "@/features/work/components/badges";

export const Route = createFileRoute("/_authenticated/work/")({
  component: WorkPage,
});

// ── Types ───────────────────────────────────────────────────────────────────

type ViewMode = "list" | "kanban" | "grid";

// ── Constants ──────────────────────────────────────────────────────────────

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

// Status columns ordered for Kanban view
const KANBAN_STATUSES: WorkStatus[] = [
  "backlog",
  "todo",
  "in_progress",
  "blocked",
  "review",
  "done",
  "cancelled",
];

const STATUS_LABELS: Record<WorkStatus, string> = {
  backlog: "Backlog",
  todo: "To Do",
  in_progress: "In Progress",
  blocked: "Blocked",
  review: "Review",
  done: "Done",
  cancelled: "Cancelled",
};

// Bar chart colors keyed by status
const STATUS_COLORS: Record<string, string> = {
  backlog: "#94a3b8",
  todo: "#64748b",
  in_progress: "#3b82f6",
  blocked: "#ef4444",
  review: "#f59e0b",
  done: "#22c55e",
  cancelled: "#d1d5db",
};

// ── Shared item type (inferred from API) ───────────────────────────────────

type WorkItem = {
  id: string;
  title: string;
  description?: string | null;
  type: string;
  status: string;
  priority: string;
  dueDate?: string | null;
  estimatedHours?: string | null;
  sourceSystem?: string | null;
  sourceReference?: string | null;
  assignedTo?: { user?: { name?: string | null } | null } | null;
  department?: { name?: string | null } | null;
};

// ── Helper ─────────────────────────────────────────────────────────────────

function isOverdue(item: WorkItem) {
  return (
    item.dueDate &&
    isPast(parseISO(item.dueDate)) &&
    item.status !== "done" &&
    item.status !== "cancelled"
  );
}

// ── Sub-views ─────────────────────────────────────────────────────────────

function WorkListView({ items }: { items: WorkItem[] }) {
  if (!items.length) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[38%]">Title</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Assignee</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Due Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell colSpan={7} className="py-12 text-center text-muted-foreground">
                No work items found.{" "}
                <Link to="/work/new" className="underline">
                  Create one
                </Link>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[38%]">Title</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Assignee</TableHead>
            <TableHead>Department</TableHead>
            <TableHead>Due Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => {
            const overdue = isOverdue(item);
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
                  {item.sourceSystem && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {item.sourceSystem}
                      {item.sourceReference ? ` · #${item.sourceReference}` : ""}
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
                    <span className={overdue ? "text-red-600 font-medium" : ""}>
                      {format(parseISO(item.dueDate), "dd MMM yyyy")}
                      {overdue && (
                        <AlertCircle className="inline ml-1 size-3.5 text-red-500" />
                      )}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

function WorkKanbanView({ items }: { items: WorkItem[] }) {
  const grouped = KANBAN_STATUSES.reduce<Record<WorkStatus, WorkItem[]>>(
    (acc, s) => {
      acc[s] = items.filter((i) => i.status === s);
      return acc;
    },
    {} as Record<WorkStatus, WorkItem[]>,
  );

  // Only show columns that have items OR are core statuses (exclude cancelled if empty)
  const visibleStatuses = KANBAN_STATUSES.filter(
    (s) => s !== "cancelled" || (grouped[s]?.length ?? 0) > 0,
  );

  return (
    <div className="flex gap-3 overflow-x-auto pb-4">
      {visibleStatuses.map((status) => {
        const columnItems = grouped[status] ?? [];
        const colColor = STATUS_COLORS[status] ?? "#94a3b8";
        return (
          <div key={status} className="flex-shrink-0 w-60">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <div
                  className="size-2 rounded-full"
                  style={{ backgroundColor: colColor }}
                />
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {STATUS_LABELS[status]}
                </span>
              </div>
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                {columnItems.length}
              </span>
            </div>

            <div className="space-y-2">
              {columnItems.length === 0 ? (
                <div className="rounded-md border border-dashed p-4 text-center text-xs text-muted-foreground">
                  Empty
                </div>
              ) : (
                columnItems.map((item) => {
                  const overdue = isOverdue(item);
                  return (
                    <Link
                      key={item.id}
                      to="/work/$workItemId"
                      params={{ workItemId: item.id }}
                      className="block"
                    >
                      <Card className="hover:border-primary/50 transition-colors cursor-pointer">
                        <CardContent className="p-3">
                          <p className="text-sm font-medium leading-snug mb-2 line-clamp-2">
                            {item.title}
                          </p>
                          <div className="flex flex-wrap gap-1 mb-2">
                            <PriorityBadge priority={item.priority as WorkPriority} />
                            <TypeBadge type={item.type as WorkType} />
                          </div>
                          {item.assignedTo?.user?.name && (
                            <p className="text-xs text-muted-foreground truncate">
                              {item.assignedTo.user.name}
                            </p>
                          )}
                          {item.dueDate && (
                            <p
                              className={`text-xs mt-1 ${overdue ? "text-red-600 font-medium" : "text-muted-foreground"}`}
                            >
                              {overdue && (
                                <AlertCircle className="inline mr-0.5 size-3" />
                              )}
                              {format(parseISO(item.dueDate), "dd MMM")}
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function WorkGridView({ items }: { items: WorkItem[] }) {
  if (!items.length) {
    return (
      <p className="py-12 text-center text-sm text-muted-foreground">
        No work items found.{" "}
        <Link to="/work/new" className="underline">
          Create one
        </Link>
      </p>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {items.map((item) => {
        const overdue = isOverdue(item);
        return (
          <Link
            key={item.id}
            to="/work/$workItemId"
            params={{ workItemId: item.id }}
          >
            <Card className="h-full hover:border-primary/50 transition-colors cursor-pointer">
              <CardHeader className="pb-2 pt-3 px-4">
                <div className="flex items-start justify-between gap-2">
                  <StatusBadge status={item.status as WorkStatus} />
                  <PriorityBadge priority={item.priority as WorkPriority} />
                </div>
                <CardTitle className="text-sm font-semibold leading-snug mt-2 line-clamp-2">
                  {item.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-3 space-y-1.5">
                {item.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {item.description}
                  </p>
                )}
                <TypeBadge type={item.type as WorkType} />
                {item.assignedTo?.user?.name && (
                  <p className="text-xs text-muted-foreground">
                    {item.assignedTo.user.name}
                  </p>
                )}
                {item.department?.name && (
                  <p className="text-xs text-muted-foreground">
                    {item.department.name}
                  </p>
                )}
                {item.dueDate && (
                  <p
                    className={`text-xs ${overdue ? "text-red-600 font-medium" : "text-muted-foreground"}`}
                  >
                    {overdue && (
                      <AlertCircle className="inline mr-0.5 size-3" />
                    )}
                    Due {format(parseISO(item.dueDate), "dd MMM yyyy")}
                  </p>
                )}
                {item.estimatedHours && (
                  <p className="text-xs text-muted-foreground">
                    ~{item.estimatedHours}h
                  </p>
                )}
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}

// ── Loading skeleton ───────────────────────────────────────────────────────

function LoadingSkeleton({ view }: { view: ViewMode }) {
  if (view === "kanban") {
    return (
      <div className="flex gap-3 overflow-x-auto pb-4">
        {KANBAN_STATUSES.slice(0, 5).map((s) => (
          <div key={s} className="flex-shrink-0 w-60 space-y-2">
            <Skeleton className="h-5 w-24" />
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full rounded-md" />
            ))}
          </div>
        ))}
      </div>
    );
  }
  if (view === "grid") {
    return (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-40 w-full rounded-md" />
        ))}
      </div>
    );
  }
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            {Array.from({ length: 7 }).map((_, j) => (
              <TableHead key={j}>
                <Skeleton className="h-4 w-16" />
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 5 }).map((_, i) => (
            <TableRow key={i}>
              {Array.from({ length: 7 }).map((_, j) => (
                <TableCell key={j}>
                  <Skeleton className="h-4 w-full" />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────

function WorkPage() {
  const [view, setView] = useState<ViewMode>("list");
  const [status, setStatus] = useState<WorkStatus | "">("");
  const [type, setType] = useState<WorkType | "">("");
  const [priority, setPriority] = useState<WorkPriority | "">("");
  const [departmentId, setDepartmentId] = useState("");
  const [overdueOnly, setOverdueOnly] = useState(false);

  const { data, isLoading, error, refetch } = useQuery(
    orpc.work.list.queryOptions({
      input: {
        status: status || undefined,
        type: type || undefined,
        priority: priority || undefined,
        departmentId: departmentId || undefined,
        overdueOnly: overdueOnly || undefined,
        limit: 200,
        offset: 0,
      },
    }),
  );

  const { data: stats } = useQuery(orpc.work.stats.queryOptions());
  const { data: departments } = useQuery(
    orpc.staff.getDepartments.queryOptions(),
  );

  const chartData = stats
    ? Object.entries(stats.byStatus)
        .filter(([, count]) => count > 0)
        .map(([s, count]) => ({
          status: s.replace("_", " "),
          count,
          fill: STATUS_COLORS[s] ?? "#94a3b8",
        }))
        .sort((a, b) => b.count - a.count)
    : [];

  const hasFilter = !!(status || type || priority || departmentId || overdueOnly);

  return (
    <>
      <Header fixed>
        <div className="flex items-center gap-2">
          <ClipboardCheck className="size-4 text-muted-foreground" />
          <span className="text-sm font-medium">Work Register</span>
        </div>
        <div className="ms-auto flex items-center gap-2">
          {/* View switcher */}
          <div className="flex items-center rounded-md border p-0.5 gap-0.5">
            <button
              onClick={() => setView("list")}
              title="List view"
              className={`rounded p-1 transition-colors ${view === "list" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              <LayoutList className="size-4" />
            </button>
            <button
              onClick={() => setView("kanban")}
              title="Kanban view"
              className={`rounded p-1 transition-colors ${view === "kanban" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              <Columns3 className="size-4" />
            </button>
            <button
              onClick={() => setView("grid")}
              title="Grid view"
              className={`rounded p-1 transition-colors ${view === "grid" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              <LayoutGrid className="size-4" />
            </button>
          </div>

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

        {/* ── Stat cards ── */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Card>
            <CardHeader className="pb-1 pt-3 px-4">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Total
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-3 px-4">
              <p className="text-2xl font-bold">{stats?.total ?? "—"}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-1 pt-3 px-4">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                <Loader2 className="size-3 text-blue-500" />
                In Progress
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-3 px-4">
              <p className="text-2xl font-bold text-blue-600">
                {stats?.byStatus["in_progress"] ?? "—"}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-1 pt-3 px-4">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                <AlertCircle className="size-3 text-red-500" />
                Overdue
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-3 px-4">
              <p
                className={`text-2xl font-bold ${(stats?.overdue ?? 0) > 0 ? "text-red-600" : ""}`}
              >
                {stats?.overdue ?? "—"}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-1 pt-3 px-4">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                <CheckCircle2 className="size-3 text-green-500" />
                Done
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-3 px-4">
              <p className="text-2xl font-bold text-green-600">
                {stats?.byStatus["done"] ?? "—"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* ── Status distribution chart ── */}
        {chartData.length > 0 && (
          <Card className="mb-6">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Work Items by Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart
                  data={chartData}
                  margin={{ top: 4, right: 8, left: -16, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="status"
                    tick={{ fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{ fontSize: 12 }}
                    cursor={{ fill: "hsl(var(--muted))" }}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* ── Filters ── */}
        <div className="mb-4 flex flex-wrap gap-3">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as WorkStatus | "")}
            className="rounded-md border bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>

          <select
            value={type}
            onChange={(e) => setType(e.target.value as WorkType | "")}
            className="rounded-md border bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {TYPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>

          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as WorkPriority | "")}
            className="rounded-md border bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {PRIORITY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>

          {departments && departments.length > 0 && (
            <select
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
              className="rounded-md border bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          )}

          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={overdueOnly}
              onChange={(e) => setOverdueOnly(e.target.checked)}
              className="rounded border"
            />
            <Timer className="size-3.5 text-red-500" />
            Overdue only
          </label>

          {hasFilter && (
            <button
              onClick={() => {
                setStatus("");
                setType("");
                setPriority("");
                setDepartmentId("");
                setOverdueOnly(false);
              }}
              className="text-xs text-muted-foreground underline"
            >
              Clear filters
            </button>
          )}
        </div>

        {/* ── Content area ── */}
        {isLoading ? (
          <LoadingSkeleton view={view} />
        ) : error ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            Failed to load work items.{" "}
            <button onClick={() => refetch()} className="underline">
              Retry
            </button>
          </div>
        ) : view === "kanban" ? (
          <WorkKanbanView items={data ?? []} />
        ) : view === "grid" ? (
          <WorkGridView items={data ?? []} />
        ) : (
          <WorkListView items={data ?? []} />
        )}

        {data && data.length > 0 && (
          <p className="mt-2 text-xs text-muted-foreground text-right">
            Showing {data.length} item{data.length !== 1 ? "s" : ""}
          </p>
        )}
      </Main>
    </>
  );
}
