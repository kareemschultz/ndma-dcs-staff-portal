import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays } from "lucide-react";
import { format, parseISO } from "date-fns";

import { Card, CardContent, CardHeader, CardTitle } from "@ndma-dcs-staff-portal/ui/components/card";

import { Header } from "@/components/layout/header";
import { Main } from "@/components/layout/main";
import { ThemeSwitch } from "@/components/theme-switch";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/_authenticated/roster/my-roster")({
  component: MyRosterPage,
});

function MyRosterPage() {
  const { data } = useQuery(orpc.roster.myRoster.queryOptions());

  return (
    <>
      <Header fixed>
        <div className="flex items-center gap-2">
          <CalendarDays className="size-4 text-muted-foreground" />
          <span className="text-sm font-medium">My Roster</span>
        </div>
        <div className="ms-auto flex items-center gap-2">
          <ThemeSwitch />
        </div>
      </Header>

      <Main className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Roster</h1>
          <p className="text-sm text-muted-foreground">Your assigned shifts and coverage history.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Assignments</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {(data ?? []).map((assignment) => (
              <div key={assignment.id} className="rounded-lg border px-3 py-2 text-sm">
                <div className="font-medium">
                  {assignment.schedule?.monthKey} • {assignment.shiftDate} • {assignment.shiftType}
                </div>
                <div className="text-xs text-muted-foreground">
                  {assignment.staffProfile?.user?.name ?? "Unknown"} • {assignment.schedule?.status}
                </div>
              </div>
            ))}
            {(data ?? []).length === 0 && (
              <p className="text-sm text-muted-foreground">No roster assignments found.</p>
            )}
          </CardContent>
        </Card>
      </Main>
    </>
  );
}
