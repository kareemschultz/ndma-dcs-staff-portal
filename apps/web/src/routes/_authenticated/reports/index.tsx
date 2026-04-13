import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BarChart3, AlertTriangle, Clock, Printer } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@ndma-dcs-staff-portal/ui/components/card";
import { Skeleton } from "@ndma-dcs-staff-portal/ui/components/skeleton";
import { Button } from "@ndma-dcs-staff-portal/ui/components/button";
import { Header } from "@/components/layout/header";
import { Main } from "@/components/layout/main";
import { ThemeSwitch } from "@/components/theme-switch";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/_authenticated/reports/")({
  component: ReportsPage,
});

// ── Color palette ──────────────────────────────────────────────────────────

const BLUE = "#3b82f6";
const GREEN = "#22c55e";
const AMBER = "#f59e0b";
const RED = "#ef4444";
const PURPLE = "#8b5cf6";
const INDIGO = "#6366f1";
const PINK = "#ec4899";
const TEAL = "#14b8a6";
const ROSE = "#f43f5e";
const ORANGE = "#f97316";
const YELLOW = "#eab308";

// ── Helpers ────────────────────────────────────────────────────────────────

function labelCase(s: string) {
  return s
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

// ── Section skeleton ───────────────────────────────────────────────────────

function ChartSkeleton({ height = 220 }: { height?: number }) {
  return <Skeleton className="w-full rounded-xl" style={{ height }} />;
}

// ── KPI pill ──────────────────────────────────────────────────────────────

function KpiPill({
  label,
  value,
  color = "bg-blue-500/10 text-blue-700 dark:text-blue-300",
}: {
  label: string;
  value: number | string;
  color?: string;
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-xl px-5 py-3 ${color}`}
    >
      <span className="text-2xl font-bold tabular-nums">{value}</span>
      <span className="mt-0.5 text-xs font-medium opacity-80">{label}</span>
    </div>
  );
}

// ── No data placeholder ────────────────────────────────────────────────────

function NoData({ height = 220 }: { height?: number }) {
  return (
    <div
      className="flex items-center justify-center text-sm text-muted-foreground"
      style={{ height }}
    >
      No data available
    </div>
  );
}

// ── 1. Work Overview ───────────────────────────────────────────────────────

const WORK_STATUS_ORDER = [
  "backlog",
  "todo",
  "in_progress",
  "blocked",
  "review",
  "done",
  "cancelled",
] as const;

const WORK_STATUS_COLORS: Record<string, string> = {
  backlog: INDIGO,
  todo: BLUE,
  in_progress: TEAL,
  blocked: RED,
  review: PURPLE,
  done: GREEN,
  cancelled: "#94a3b8",
};

function WorkOverviewSection() {
  const { data, isLoading } = useQuery(orpc.work.stats.queryOptions());

  const chartData = WORK_STATUS_ORDER.map((status) => ({
    name: labelCase(status),
    count: data?.byStatus?.[status] ?? 0,
    fill: WORK_STATUS_COLORS[status],
  }));

  const hasData = chartData.some((d) => d.count > 0);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <BarChart3 className="size-4 text-blue-500" />
          Work Overview
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Work items by status across all teams
        </p>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <ChartSkeleton />
        ) : !hasData ? (
          <NoData />
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={chartData}
              margin={{ top: 4, right: 8, left: -16, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11 }}
                className="fill-muted-foreground"
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 11 }}
                className="fill-muted-foreground"
              />
              <Tooltip
                contentStyle={{
                  fontSize: 12,
                  borderRadius: 6,
                  border: "1px solid hsl(var(--border))",
                  background: "hsl(var(--card))",
                  color: "hsl(var(--foreground))",
                }}
                cursor={{ fill: "hsl(var(--muted))", opacity: 0.5 }}
              />
              <Bar dataKey="count" name="Items" radius={[4, 4, 0, 0]}>
                {chartData.map((entry) => (
                  <Cell key={entry.name} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}

        {/* KPI summary pills */}
        {!isLoading && data && (
          <div className="mt-4 flex flex-wrap gap-3">
            <KpiPill
              label="Total Items"
              value={data.total ?? 0}
              color="bg-muted text-foreground"
            />
            <KpiPill
              label="In Progress"
              value={data.byStatus?.in_progress ?? 0}
              color="bg-teal-500/10 text-teal-700 dark:text-teal-300"
            />
            <KpiPill
              label="Overdue"
              value={data.overdue ?? 0}
              color="bg-red-500/10 text-red-700 dark:text-red-300"
            />
            <KpiPill
              label="Done"
              value={data.byStatus?.done ?? 0}
              color="bg-green-500/10 text-green-700 dark:text-green-300"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── 2. Procurement Pipeline ────────────────────────────────────────────────

const PR_STATUS_ORDER = [
  "draft",
  "submitted",
  "under_review",
  "approved",
  "ordered",
  "received",
  "rejected",
  "cancelled",
] as const;

const PR_STATUS_COLORS: Record<string, string> = {
  draft: "#94a3b8",
  submitted: BLUE,
  under_review: AMBER,
  approved: GREEN,
  ordered: INDIGO,
  received: TEAL,
  rejected: RED,
  cancelled: "#cbd5e1",
};

function ProcurementPipelineSection() {
  const { data, isLoading } = useQuery(orpc.procurement.stats.queryOptions());

  const chartData = PR_STATUS_ORDER.map((status) => ({
    name: labelCase(status),
    count: data?.byStatus?.[status] ?? 0,
    fill: PR_STATUS_COLORS[status],
  })).filter((d) => d.count > 0);

  const hasData = chartData.some((d) => d.count > 0);
  const totalValue = data?.totalValue ? parseFloat(String(data.totalValue)) : 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Procurement Pipeline</CardTitle>
        <p className="text-xs text-muted-foreground">
          Purchase requisitions by approval stage
        </p>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <ChartSkeleton />
        ) : !hasData ? (
          <NoData />
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 4, right: 16, left: 16, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                horizontal={false}
                className="stroke-border"
              />
              <XAxis
                type="number"
                allowDecimals={false}
                tick={{ fontSize: 11 }}
                className="fill-muted-foreground"
              />
              <YAxis
                type="category"
                dataKey="name"
                width={80}
                tick={{ fontSize: 11 }}
                className="fill-muted-foreground"
              />
              <Tooltip
                contentStyle={{
                  fontSize: 12,
                  borderRadius: 6,
                  border: "1px solid hsl(var(--border))",
                  background: "hsl(var(--card))",
                  color: "hsl(var(--foreground))",
                }}
                cursor={{ fill: "hsl(var(--muted))", opacity: 0.5 }}
              />
              <Bar dataKey="count" name="PRs" radius={[0, 4, 4, 0]}>
                {chartData.map((entry) => (
                  <Cell key={entry.name} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}

        {/* Total value KPI */}
        {!isLoading && data && (
          <div className="mt-4 flex flex-wrap gap-3">
            <KpiPill
              label="Total PRs"
              value={data.total ?? 0}
              color="bg-muted text-foreground"
            />
            <div className="flex flex-col items-start justify-center rounded-xl border px-5 py-3">
              <span className="text-xs text-muted-foreground">
                Total Estimated Value
              </span>
              <span className="mt-0.5 text-lg font-bold tabular-nums">
                GHS{" "}
                {totalValue > 0
                  ? totalValue.toLocaleString("en-GH", {
                      minimumFractionDigits: 2,
                    })
                  : "0.00"}
              </span>
            </div>
            <KpiPill
              label="Pending Approval"
              value={
                (data.byStatus?.submitted ?? 0) +
                (data.byStatus?.under_review ?? 0)
              }
              color="bg-amber-500/10 text-amber-700 dark:text-amber-300"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── 3. Compliance Expiry ───────────────────────────────────────────────────

function ComplianceExpirySection() {
  const { data, isLoading } = useQuery(
    orpc.compliance.getExpiringItems.queryOptions({
      input: { withinDays: 90 },
    })
  );

  const trainingCount = data?.training?.length ?? 0;
  const ppeCount = data?.ppe?.length ?? 0;

  // Items expiring within 30 days — merge and sort
  const urgentItems: Array<{
    id: string;
    staffName: string;
    itemName: string;
    daysLeft: number;
    type: "training" | "ppe";
  }> = [];

  const today = new Date();

  if (data?.training) {
    for (const t of data.training) {
      if (!t.expiryDate) continue;
      const expiry = new Date(t.expiryDate);
      const daysLeft = Math.ceil(
        (expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysLeft < 30) {
        urgentItems.push({
          id: t.id,
          staffName: t.staffProfile?.user?.name ?? "Unknown",
          itemName: t.trainingName,
          daysLeft,
          type: "training",
        });
      }
    }
  }

  if (data?.ppe) {
    for (const p of data.ppe) {
      if (!p.expiryDate) continue;
      const expiry = new Date(p.expiryDate);
      const daysLeft = Math.ceil(
        (expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysLeft < 30) {
        urgentItems.push({
          id: p.id,
          staffName: p.staffProfile?.user?.name ?? "Unknown",
          itemName: p.itemName,
          daysLeft,
          type: "ppe",
        });
      }
    }
  }

  urgentItems.sort((a, b) => a.daysLeft - b.daysLeft);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <AlertTriangle className="size-4 text-amber-500" />
          Compliance Expiry
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Items expiring within 90 days
        </p>
      </CardHeader>
      <CardContent>
        {/* KPI cards */}
        {isLoading ? (
          <div className="flex gap-3 mb-4">
            <Skeleton className="h-16 flex-1 rounded-xl" />
            <Skeleton className="h-16 flex-1 rounded-xl" />
          </div>
        ) : (
          <div className="mb-4 flex flex-wrap gap-3">
            <KpiPill
              label="Training Expiring"
              value={trainingCount}
              color="bg-purple-500/10 text-purple-700 dark:text-purple-300"
            />
            <KpiPill
              label="PPE Expiring"
              value={ppeCount}
              color="bg-amber-500/10 text-amber-700 dark:text-amber-300"
            />
          </div>
        )}

        {/* Urgent list */}
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
          Expiring within 30 days
        </div>
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-full rounded-xl" />
            ))}
          </div>
        ) : urgentItems.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            No items expiring within 30 days.
          </p>
        ) : (
          <div className="divide-y rounded-xl border">
            {urgentItems.slice(0, 8).map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between px-3 py-2.5 gap-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{item.itemName}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.staffName}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`inline-flex items-center rounded-lg px-2 py-0.5 text-xs font-medium ${
                      item.type === "training"
                        ? "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300"
                        : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
                    }`}
                  >
                    {item.type}
                  </span>
                  <span
                    className={`inline-flex items-center rounded-lg px-2 py-0.5 text-xs font-bold tabular-nums ${
                      item.daysLeft <= 7
                        ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
                        : "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300"
                    }`}
                  >
                    {item.daysLeft <= 0 ? "Today" : `${item.daysLeft}d`}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── 4. Incident Summary ────────────────────────────────────────────────────

const SEVERITY_COLORS: Record<string, string> = {
  sev1: ROSE,
  sev2: ORANGE,
  sev3: YELLOW,
  sev4: BLUE,
};

const SEVERITY_LABELS: Record<string, string> = {
  sev1: "SEV 1",
  sev2: "SEV 2",
  sev3: "SEV 3",
  sev4: "SEV 4",
};

function IncidentSummarySection() {
  const { data, isLoading } = useQuery(orpc.incidents.stats.queryOptions());

  const pieData = Object.entries(data?.bySeverity ?? {})
    .filter(([, v]) => v > 0)
    .map(([key, value]) => ({
      name: SEVERITY_LABELS[key] ?? key.toUpperCase(),
      value,
      fill: SEVERITY_COLORS[key] ?? BLUE,
    }));

  const hasData = pieData.length > 0;

  // MTTR in hours and minutes
  const mttrMinutes = data?.mttrMinutes ?? null;
  const mttrDisplay =
    mttrMinutes !== null
      ? mttrMinutes >= 60
        ? `${Math.floor(mttrMinutes / 60)}h ${mttrMinutes % 60}m`
        : `${mttrMinutes}m`
      : "N/A";

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Incident Summary</CardTitle>
        <p className="text-xs text-muted-foreground">
          All-time incidents by severity
        </p>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <ChartSkeleton height={240} />
        ) : !hasData ? (
          <NoData height={240} />
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={95}
                paddingAngle={3}
                dataKey="value"
              >
                {pieData.map((entry) => (
                  <Cell key={entry.name} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  fontSize: 12,
                  borderRadius: 6,
                  border: "1px solid hsl(var(--border))",
                  background: "hsl(var(--card))",
                  color: "hsl(var(--foreground))",
                }}
              />
              <Legend
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: 12 }}
              />
            </PieChart>
          </ResponsiveContainer>
        )}

        {/* MTTR + total KPIs */}
        {!isLoading && (
          <div className="mt-4 flex flex-wrap gap-3">
            <KpiPill
              label="Total Incidents"
              value={data?.total ?? 0}
              color="bg-muted text-foreground"
            />
            <div className="flex flex-col items-start justify-center rounded-xl border px-5 py-3">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="size-3.5" />
                Mean Time to Resolve
              </div>
              <span className="mt-0.5 text-lg font-bold tabular-nums">
                {mttrDisplay}
              </span>
            </div>
            {Object.entries(data?.byStatus ?? {}).map(([status, count]) =>
              count > 0 ? (
                <KpiPill
                  key={status}
                  label={labelCase(status)}
                  value={count}
                  color={
                    status === "resolved" || status === "closed"
                      ? "bg-green-500/10 text-green-700 dark:text-green-300"
                      : "bg-rose-500/10 text-rose-700 dark:text-rose-300"
                  }
                />
              ) : null
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── 5. Staff by Status ─────────────────────────────────────────────────────

const STAFF_STATUS_CONFIG: Record<
  string,
  { label: string; color: string }
> = {
  active: {
    label: "Active",
    color: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  },
  on_leave: {
    label: "On Leave",
    color: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  },
  training: {
    label: "Training",
    color: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  },
  on_call: {
    label: "On Call",
    color: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  },
  inactive: {
    label: "Inactive",
    color: "bg-muted text-muted-foreground",
  },
};

function StaffByStatusSection() {
  const { data, isLoading } = useQuery(
    orpc.staff.list.queryOptions({ input: { limit: 200, offset: 0 } })
  );

  const staffArray = Array.isArray(data) ? data : [];
  const statusCounts: Record<string, number> = {};
  for (const s of staffArray) {
    const st = s.status ?? "unknown";
    statusCounts[st] = (statusCounts[st] ?? 0) + 1;
  }

  const total = staffArray.length;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Staff by Status</CardTitle>
        <p className="text-xs text-muted-foreground">
          Current headcount distribution across all statuses
        </p>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-xl" />
            ))}
          </div>
        ) : total === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No staff records found.
          </p>
        ) : (
          <>
            <div className="mb-4 flex flex-wrap gap-3">
              {Object.entries(statusCounts).map(([status, count]) => {
                const cfg = STAFF_STATUS_CONFIG[status];
                return (
                  <div
                    key={status}
                    className={`flex items-center gap-2 rounded-xl px-4 py-2.5 ${cfg?.color ?? "bg-muted text-muted-foreground"}`}
                  >
                    <span className="text-2xl font-bold tabular-nums">
                      {count}
                    </span>
                    <span className="text-xs font-medium opacity-80">
                      {cfg?.label ?? labelCase(status)}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Progress bars */}
            <div className="space-y-2.5 mt-4">
              {Object.entries(statusCounts).map(([status, count]) => {
                const cfg = STAFF_STATUS_CONFIG[status];
                const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                // Extract a bg color for the bar from the config color
                const barColors: Record<string, string> = {
                  active: "bg-green-500",
                  on_leave: "bg-red-500",
                  training: "bg-purple-500",
                  on_call: "bg-blue-500",
                  inactive: "bg-slate-400",
                };
                return (
                  <div key={status}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">
                        {cfg?.label ?? labelCase(status)}
                      </span>
                      <span className="font-medium tabular-nums">
                        {pct}%
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${barColors[status] ?? "bg-primary"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <p className="mt-3 text-xs text-muted-foreground text-right">
              {total} total staff records
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ── Main reports page ──────────────────────────────────────────────────────

function ReportsPage() {
  return (
    <>
      <Header fixed>
        <div className="flex items-center gap-2">
          <BarChart3 className="size-4 text-muted-foreground" />
          <span className="text-sm font-medium">Reports</span>
        </div>
        <div className="ms-auto flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => window.print()} className="print-hidden">
            <Printer className="size-3.5 mr-1.5" />
            Export PDF
          </Button>
          <ThemeSwitch />
        </div>
      </Header>

      <Main>
        <div className="print-header hidden mb-4">
          <h1 className="text-xl font-bold">DCS Ops Center — Reports</h1>
          <p className="text-sm text-muted-foreground">NDMA Data Centre Services · Printed {new Date().toLocaleDateString()}</p>
        </div>

        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Operational data summary across all modules.
          </p>
        </div>

        <div className="space-y-6">
          {/* Row 1: Work + Procurement side by side */}
          <div className="grid gap-6 lg:grid-cols-2">
            <WorkOverviewSection />
            <ProcurementPipelineSection />
          </div>

          {/* Row 2: Compliance full width */}
          <ComplianceExpirySection />

          {/* Row 3: Incidents + Staff side by side */}
          <div className="grid gap-6 lg:grid-cols-2">
            <IncidentSummarySection />
            <StaffByStatusSection />
          </div>
        </div>
      </Main>
    </>
  );
}
