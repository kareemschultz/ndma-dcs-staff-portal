import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CalendarClock, CalendarRange, ArrowLeftRight } from "lucide-react";

import { Badge } from "@ndma-dcs-staff-portal/ui/components/badge";
import { Button } from "@ndma-dcs-staff-portal/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@ndma-dcs-staff-portal/ui/components/card";
import { Skeleton } from "@ndma-dcs-staff-portal/ui/components/skeleton";

import { Header } from "@/components/layout/header";
import { Main } from "@/components/layout/main";
import { ThemeSwitch } from "@/components/theme-switch";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/_authenticated/roster/")({
  component: RosterHomePage,
});

type RosterSchedule = {
  id: string;
  monthKey: string;
  status: string;
  department?: { name?: string | null } | null;
  assignments: Array<{
    id: string;
    shiftDate: string;
    shiftType: string;
    staffProfile?: { user?: { name?: string | null } | null } | null;
  }>;
};

function ScheduleCard({ schedule }: { schedule: RosterSchedule }) {
  const byDate = new Map<string, any[]>();
  for (const assignment of schedule.assignments as Array<{
    id: string;
    shiftDate: string;
    shiftType: string;
    staffProfile?: { user?: { name?: string | null } | null } | null;
  }>) {
    const list = byDate.get(assignment.shiftDate) ?? [];
    list.push(assignment);
    byDate.set(assignment.shiftDate, list);
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">
          {schedule.monthKey}
          <span className="ml-2 text-xs font-normal text-muted-foreground">
            {schedule.status}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {Array.from(byDate.entries()).slice(0, 4).map(([date, assignments]) => (
          <div key={date} className="rounded-lg border px-3 py-2 text-sm">
            <div className="mb-1 font-medium">{date}</div>
            <div className="flex flex-wrap gap-2">
              {assignments.map((assignment) => (
                <Badge key={assignment.shiftType} variant="outline">
                  {assignment.shiftType}: {assignment.staffProfile?.user?.name ?? "Unassigned"}
                </Badge>
              ))}
            </div>
          </div>
        ))}
        {(!schedule.assignments || schedule.assignments.length === 0) && (
          <p className="text-sm text-muted-foreground">No assignments yet.</p>
        )}
      </CardContent>
    </Card>
  );
}

function RosterHomePage() {
  const { data: current, isLoading: loadingCurrent } = useQuery(orpc.roster.getCurrent.queryOptions());
  const { data: upcoming } = useQuery(orpc.roster.getUpcoming.queryOptions());
  const { data: today } = useQuery(orpc.roster.today.queryOptions());
  const { data: maintenance } = useQuery(orpc.roster.maintenance.list.queryOptions({ input: {} }));

  return (
    <>
      <Header fixed>
        <div className="flex items-center gap-2">
          <CalendarClock className="size-4 text-muted-foreground" />
          <span className="text-sm font-medium">Roster</span>
        </div>
        <div className="ms-auto flex items-center gap-2">
          <ThemeSwitch />
        </div>
      </Header>

      <Main className="space-y-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Roster</h1>
            <p className="text-sm text-muted-foreground">
              Month-level shift coverage, swaps, and maintenance assignments.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to="/roster/planner">
              <Button variant="outline" size="sm">
                <CalendarRange className="mr-1.5 size-3.5" />
                Planner
              </Button>
            </Link>
            <Link to="/roster/swaps">
              <Button variant="outline" size="sm">
                <ArrowLeftRight className="mr-1.5 size-3.5" />
                Swaps
              </Button>
            </Link>
          </div>
        </div>

        <section className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Today</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {today ? (
                today.assignments.length ? (
                  today.assignments.map((assignment) => (
                    <div key={assignment.id} className="flex items-center justify-between rounded-lg border px-3 py-2">
                      <span>{assignment.shiftType}</span>
                      <span className="font-medium">{assignment.staffProfile?.user?.name ?? "Unassigned"}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground">No shifts today.</p>
                )
              ) : (
                <p className="text-muted-foreground">No published schedule for this month.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Current Month</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {loadingCurrent ? (
                <Skeleton className="h-24 w-full" />
              ) : current ? (
                <>
                  <p className="text-muted-foreground">
                    {current.department?.name ?? "All departments"}
                  </p>
                  <p className="font-medium">{current.monthKey}</p>
                  <p className="text-muted-foreground">
                    {current.assignments.length} assignments
                  </p>
                  <Link to="/roster/calendar">
                    <Button variant="outline" size="sm" className="mt-2">
                      Open Calendar
                    </Button>
                  </Link>
                </>
              ) : (
                <p className="text-muted-foreground">No current schedule found.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Maintenance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {(maintenance ?? []).slice(0, 3).map((item) => (
                <div key={item.id} className="rounded-lg border px-3 py-2">
                  <div className="font-medium">{item.maintenanceType}</div>
                  <div className="text-xs text-muted-foreground">
                    {item.quarter} {item.year} {item.staffProfile?.user?.name ? `• ${item.staffProfile.user.name}` : ""}
                  </div>
                </div>
              ))}
              {(!maintenance || maintenance.length === 0) && (
                <p className="text-muted-foreground">No maintenance assignments.</p>
              )}
              <Link to="/roster/maintenance">
                <Button variant="outline" size="sm">
                  Open Maintenance
                </Button>
              </Link>
            </CardContent>
          </Card>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Upcoming Roster
            </h2>
            <Link to="/roster/planner" className="text-sm text-muted-foreground hover:text-foreground">
              Open planner
            </Link>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            {(upcoming ?? []).slice(0, 4).map((schedule) => (
              <ScheduleCard key={schedule.id} schedule={schedule} />
            ))}
            {(upcoming ?? []).length === 0 && (
              <Card className="lg:col-span-2">
                <CardContent className="py-10 text-center text-sm text-muted-foreground">
                  No upcoming published schedules.
                </CardContent>
              </Card>
            )}
          </div>
        </section>
      </Main>
    </>
  );
}
