import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { CalendarClock, ArrowLeftRight } from "lucide-react";
import { Card, CardContent } from "@ndma-dcs-staff-portal/ui/components/card";
import { Skeleton } from "@ndma-dcs-staff-portal/ui/components/skeleton";
import { Header } from "@/components/layout/header";
import { Main } from "@/components/layout/main";
import { ThemeSwitch } from "@/components/theme-switch";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/_authenticated/rota/")({
  component: RotaPage,
});

const ROLE_LABELS: Record<string, string> = {
  lead_engineer: "Lead Engineer",
  asn_support: "ASN Support",
  core_support: "Core Support",
  enterprise_support: "Enterprise Support",
};

const ROLE_COLORS: Record<string, string> = {
  lead_engineer: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300",
  asn_support: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  core_support: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  enterprise_support: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
};

const REQUIRED_ROLES = ["lead_engineer", "asn_support", "core_support", "enterprise_support"] as const;

function RotaPage() {
  const { data: current, isLoading: loadingCurrent } = useQuery(
    orpc.rota.getCurrent.queryOptions()
  );
  const { data: upcoming } = useQuery(orpc.rota.getUpcoming.queryOptions());
  const { data: pendingSwaps } = useQuery(
    orpc.rota.swap.list.queryOptions({ input: { status: "pending" as const } })
  );

  return (
    <>
      <Header fixed>
        <div className="flex items-center gap-2">
          <CalendarClock className="size-4 text-muted-foreground" />
          <span className="text-sm font-medium">On-Call Roster</span>
        </div>
        <div className="ms-auto flex items-center gap-2">
          <ThemeSwitch />
        </div>
      </Header>

      <Main>
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">On-Call Roster</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Current and upcoming on-call assignments.
          </p>
        </div>

        {/* Current Week */}
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            This Week
          </h2>

          {loadingCurrent ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full rounded-lg" />
              ))}
            </div>
          ) : !current ? (
            <div className="rounded-md border border-dashed p-8 text-center text-muted-foreground text-sm">
              No published schedule for this week.
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {REQUIRED_ROLES.map((role) => {
                  const assignment = current.assignments.find((a) => a.role === role);
                  return (
                    <Card key={role} className="p-3">
                      <CardContent className="p-0">
                        <span
                          className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium mb-2 ${ROLE_COLORS[role]}`}
                        >
                          {ROLE_LABELS[role]}
                        </span>
                        <p className="font-semibold text-sm">
                          {assignment?.staffProfile?.user?.name ?? (
                            <span className="text-muted-foreground italic">Unassigned</span>
                          )}
                        </p>
                        {assignment?.staffProfile?.department && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {assignment.staffProfile.department.name}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {format(parseISO(current.weekStart), "dd MMM")} –{" "}
                {format(parseISO(current.weekEnd), "dd MMM yyyy")}
              </p>
            </>
          )}
        </div>

        {/* Upcoming Schedules */}
        {upcoming && upcoming.length > 0 && (
          <div className="mb-8">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Upcoming Weeks
            </h2>
            <div className="space-y-2">
              {upcoming.map((schedule) => (
                <div
                  key={schedule.id}
                  className="rounded-md border px-4 py-3 flex items-center justify-between"
                >
                  <div>
                    <p className="text-sm font-medium">
                      Week of {format(parseISO(schedule.weekStart), "dd MMM yyyy")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {schedule.assignments.length} / 4 roles filled
                    </p>
                  </div>
                  <span className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 rounded px-2 py-0.5">
                    Published
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pending Swaps */}
        {pendingSwaps && pendingSwaps.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
              <ArrowLeftRight className="size-3.5" />
              Pending Swap Requests ({pendingSwaps.length})
            </h2>
            <div className="space-y-2">
              {pendingSwaps.map((swap) => (
                <div key={swap.id} className="rounded-md border px-4 py-3">
                  <p className="text-sm">
                    <span className="font-medium">{swap.requester?.user?.name}</span>
                    {" → "}
                    <span className="font-medium">{swap.target?.user?.name}</span>
                  </p>
                  {swap.assignment && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {swap.assignment.schedule?.weekStart &&
                        format(parseISO(swap.assignment.schedule.weekStart), "dd MMM")}
                      {" — "}
                      {ROLE_LABELS[swap.assignment.role] ?? swap.assignment.role}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </Main>
    </>
  );
}
