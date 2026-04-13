import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  Legend,
  Cell,
} from "recharts";
import { BarChart3, AlertTriangle, TrendingUp, TrendingDown } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@ndma-dcs-staff-portal/ui/components/card";
import { Skeleton } from "@ndma-dcs-staff-portal/ui/components/skeleton";
import { Header } from "@/components/layout/header";
import { Main } from "@/components/layout/main";
import { ThemeSwitch } from "@/components/theme-switch";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/_authenticated/rota/fairness/")({
  component: FairnessPage,
});

// Raw shape returned by getAssignmentCounts
type AssignmentCountRaw = {
  staffProfileId: string;
  name: string;
  total: number;
  byRole: Record<string, number>;
};

// Normalized shape used internally
type EngineerStats = {
  staffProfileId: string;
  name: string;
  leadCount: number;
  asnCount: number;
  coreCount: number;
  enterpriseCount: number;
  total: number;
};

const ROLE_COLORS = {
  lead: "#6366f1",    // indigo
  asn: "#3b82f6",     // blue
  core: "#22c55e",    // green
  enterprise: "#a855f7", // purple
};

const THRESHOLD_SIGMA = 1.5; // flag engineers more than 1.5× mean above or below

function normalize(raw: AssignmentCountRaw[]): EngineerStats[] {
  return raw.map((r) => ({
    staffProfileId: r.staffProfileId,
    name: r.name,
    leadCount: r.byRole["lead_engineer"] ?? 0,
    asnCount: r.byRole["asn_support"] ?? 0,
    coreCount: r.byRole["core_support"] ?? 0,
    enterpriseCount: r.byRole["enterprise_support"] ?? 0,
    total: r.total,
  }));
}

function computeMean(stats: EngineerStats[]): number {
  if (stats.length === 0) return 0;
  return stats.reduce((s, e) => s + e.total, 0) / stats.length;
}

function BalanceBadge({ delta }: { delta: number }) {
  if (Math.abs(delta) < 0.5) {
    return (
      <span className="text-xs text-muted-foreground">±0</span>
    );
  }
  if (delta > 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-xs font-medium text-amber-600 dark:text-amber-400">
        <TrendingUp className="size-3" />
        +{delta.toFixed(1)}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-0.5 text-xs font-medium text-blue-600 dark:text-blue-400">
      <TrendingDown className="size-3" />
      {delta.toFixed(1)}
    </span>
  );
}

function StackedChart({ data }: { data: EngineerStats[] }) {
  const chartData = data.map((e) => ({
    name: e.name.split(" ")[0] ?? e.name, // first name only on axis
    fullName: e.name,
    leadCount: e.leadCount,
    asnCount: e.asnCount,
    coreCount: e.coreCount,
    enterpriseCount: e.enterpriseCount,
  }));

  const barHeight = 36;
  const chartHeight = Math.max(200, chartData.length * barHeight + 60);

  return (
    <ResponsiveContainer width="100%" height={chartHeight}>
      <BarChart
        layout="vertical"
        data={chartData}
        margin={{ top: 8, right: 24, left: 0, bottom: 8 }}
      >
        <XAxis
          type="number"
          tick={{ fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
        />
        <YAxis
          type="category"
          dataKey="name"
          width={72}
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          formatter={(value, name) => {
            const labelMap: Record<string, string> = {
              leadCount: "Lead Engineer",
              asnCount: "ASN Support",
              coreCount: "Core Support",
              enterpriseCount: "Enterprise Support",
            };
            const key = String(name ?? "");
            return [value ?? 0, labelMap[key] ?? key] as [typeof value, string];
          }}
          contentStyle={{
            borderRadius: "6px",
            border: "1px solid hsl(var(--border))",
            backgroundColor: "hsl(var(--card))",
            color: "hsl(var(--card-foreground))",
            fontSize: 12,
          }}
        />
        <Legend
          formatter={(value: string) => {
            const labelMap: Record<string, string> = {
              leadCount: "Lead",
              asnCount: "ASN",
              coreCount: "Core",
              enterpriseCount: "Enterprise",
            };
            return labelMap[value] ?? value;
          }}
          wrapperStyle={{ fontSize: 12, paddingTop: 4 }}
        />
        <Bar dataKey="leadCount" stackId="a" fill={ROLE_COLORS.lead} radius={[0, 0, 0, 0]} />
        <Bar dataKey="asnCount" stackId="a" fill={ROLE_COLORS.asn} />
        <Bar dataKey="coreCount" stackId="a" fill={ROLE_COLORS.core} />
        <Bar
          dataKey="enterpriseCount"
          stackId="a"
          fill={ROLE_COLORS.enterprise}
          radius={[0, 3, 3, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

function SummaryTable({
  data,
  mean,
}: {
  data: EngineerStats[];
  mean: number;
}) {
  const sorted = [...data].sort((a, b) => b.total - a.total);

  return (
    <div className="overflow-x-auto rounded-md border">
      <table className="w-full min-w-[600px] text-sm">
        <thead>
          <tr className="border-b bg-muted/30">
            <th className="py-2.5 px-4 text-left font-medium text-muted-foreground">
              Engineer
            </th>
            <th className="py-2.5 px-3 text-center font-medium">
              <span className="inline-flex items-center rounded px-1.5 py-0.5 text-xs bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
                Lead
              </span>
            </th>
            <th className="py-2.5 px-3 text-center font-medium">
              <span className="inline-flex items-center rounded px-1.5 py-0.5 text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                ASN
              </span>
            </th>
            <th className="py-2.5 px-3 text-center font-medium">
              <span className="inline-flex items-center rounded px-1.5 py-0.5 text-xs bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300">
                Core
              </span>
            </th>
            <th className="py-2.5 px-3 text-center font-medium">
              <span className="inline-flex items-center rounded px-1.5 py-0.5 text-xs bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
                Enterprise
              </span>
            </th>
            <th className="py-2.5 px-3 text-center font-medium text-muted-foreground">
              Total
            </th>
            <th className="py-2.5 px-4 text-center font-medium text-muted-foreground">
              vs. Mean
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((e) => {
            const delta = e.total - mean;
            return (
              <tr key={e.staffProfileId} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                <td className="py-2.5 px-4 font-medium">{e.name}</td>
                <td className="py-2.5 px-3 text-center tabular-nums">
                  {e.leadCount > 0 ? e.leadCount : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
                <td className="py-2.5 px-3 text-center tabular-nums">
                  {e.asnCount > 0 ? e.asnCount : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
                <td className="py-2.5 px-3 text-center tabular-nums">
                  {e.coreCount > 0 ? e.coreCount : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
                <td className="py-2.5 px-3 text-center tabular-nums">
                  {e.enterpriseCount > 0 ? e.enterpriseCount : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
                <td className="py-2.5 px-3 text-center font-semibold tabular-nums">
                  {e.total}
                </td>
                <td className="py-2.5 px-4 text-center">
                  <BalanceBadge delta={delta} />
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="border-t bg-muted/20">
            <td className="py-2 px-4 text-xs text-muted-foreground">
              Mean: {mean.toFixed(1)} shifts / engineer
            </td>
            <td colSpan={6} />
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

function FairnessPage() {
  const { data: rawData, isLoading } = useQuery(
    orpc.rota.getAssignmentCounts.queryOptions()
  );

  const stats =
    rawData != null
      ? normalize(rawData as unknown as AssignmentCountRaw[])
      : [];

  const mean = computeMean(stats);
  const threshold = mean * THRESHOLD_SIGMA;

  const overloaded = stats.filter((e) => e.total > mean + threshold);
  const underloaded = stats.filter(
    (e) => stats.length > 1 && e.total < mean - threshold && mean > threshold
  );
  const hasWarnings = overloaded.length > 0 || underloaded.length > 0;

  return (
    <>
      <Header fixed>
        <div className="flex items-center gap-2">
          <BarChart3 className="size-4 text-muted-foreground" />
          <span className="text-sm font-medium">Fairness Report</span>
        </div>
        <div className="ms-auto flex items-center gap-2">
          <ThemeSwitch />
        </div>
      </Header>

      <Main>
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">Fairness Report</h1>
          <p className="text-sm text-muted-foreground mt-1">
            On-call assignment distribution across engineers.
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-5">
            <Card>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-40" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-7 flex-1" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-32" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        ) : stats.length === 0 ? (
          <div className="rounded-md border border-dashed p-12 text-center text-muted-foreground text-sm">
            No assignment data available yet. Publish schedules to see fairness metrics.
          </div>
        ) : (
          <div className="space-y-6">
            {/* Summary stat cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Card className="p-4">
                <p className="text-xs text-muted-foreground mb-1">Engineers tracked</p>
                <p className="text-2xl font-bold">{stats.length}</p>
              </Card>
              <Card className="p-4">
                <p className="text-xs text-muted-foreground mb-1">Avg shifts</p>
                <p className="text-2xl font-bold">{mean.toFixed(1)}</p>
              </Card>
              <Card className="p-4">
                <p className="text-xs text-muted-foreground mb-1">Most shifts</p>
                <p className="text-2xl font-bold">
                  {stats.length > 0 ? Math.max(...stats.map((e) => e.total)) : 0}
                </p>
              </Card>
              <Card className="p-4">
                <p className="text-xs text-muted-foreground mb-1">Fewest shifts</p>
                <p className="text-2xl font-bold">
                  {stats.length > 0 ? Math.min(...stats.map((e) => e.total)) : 0}
                </p>
              </Card>
            </div>

            {/* Stacked bar chart */}
            <Card>
              <CardHeader className="pb-2 pt-5 px-5">
                <CardTitle className="text-sm font-semibold">
                  Assignment Breakdown by Role
                </CardTitle>
              </CardHeader>
              <CardContent className="px-2 pb-4">
                <StackedChart data={stats} />
              </CardContent>
            </Card>

            {/* Balance warnings */}
            {hasWarnings && (
              <Card className="border-amber-200 dark:border-amber-800">
                <CardHeader className="pb-2 pt-4 px-4">
                  <CardTitle className="flex items-center gap-2 text-sm font-semibold text-amber-700 dark:text-amber-400">
                    <AlertTriangle className="size-4" />
                    Balance Warnings
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4 space-y-2">
                  {overloaded.map((e) => (
                    <div
                      key={e.staffProfileId}
                      className="flex items-center justify-between rounded-md bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 px-3 py-2"
                    >
                      <div>
                        <p className="text-sm font-medium">{e.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {e.total} shifts — {(e.total - mean).toFixed(1)} above average
                        </p>
                      </div>
                      <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
                        High load
                      </span>
                    </div>
                  ))}
                  {underloaded.map((e) => (
                    <div
                      key={e.staffProfileId}
                      className="flex items-center justify-between rounded-md bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 px-3 py-2"
                    >
                      <div>
                        <p className="text-sm font-medium">{e.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {e.total} shifts — {(mean - e.total).toFixed(1)} below average
                        </p>
                      </div>
                      <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                        Under-utilised
                      </span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Summary table */}
            <Card>
              <CardHeader className="pb-2 pt-5 px-5">
                <CardTitle className="text-sm font-semibold">
                  Detailed Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <SummaryTable data={stats} mean={mean} />
              </CardContent>
            </Card>
          </div>
        )}
      </Main>
    </>
  );
}
