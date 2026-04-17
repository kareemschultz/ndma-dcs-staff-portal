import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CalendarClock } from "lucide-react";

import { Button } from "@ndma-dcs-staff-portal/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@ndma-dcs-staff-portal/ui/components/card";
import { Header } from "@/components/layout/header";
import { Main } from "@/components/layout/main";
import { ThemeSwitch } from "@/components/theme-switch";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/_authenticated/roster/today")({
  component: RosterTodayPage,
});

function RosterTodayPage() {
  const { data: today } = useQuery(orpc.roster.today.queryOptions());

  return (
    <>
      <Header fixed>
        <div className="flex items-center gap-2">
          <CalendarClock className="size-4 text-muted-foreground" />
          <span className="text-sm font-medium">Roster Today</span>
        </div>
        <div className="ms-auto flex items-center gap-2">
          <ThemeSwitch />
        </div>
      </Header>

      <Main className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Today</h1>
          <p className="text-sm text-muted-foreground">Live view of current shift coverage.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Current Coverage</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {today?.assignments?.length ? (
              today.assignments.map((assignment) => (
                <div key={assignment.id} className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
                  <span className="font-medium">{assignment.shiftType}</span>
                  <span>{assignment.staffProfile?.user?.name ?? "Unassigned"}</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No published shift today.</p>
            )}
          </CardContent>
        </Card>

        <Link to="/roster/planner">
          <Button variant="outline">Open Planner</Button>
        </Link>
      </Main>
    </>
  );
}
