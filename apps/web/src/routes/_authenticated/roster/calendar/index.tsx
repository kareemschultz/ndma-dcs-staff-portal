import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { addMonths, endOfMonth, format, parseISO, startOfMonth } from "date-fns";
import { CalendarClock } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@ndma-dcs-staff-portal/ui/components/card";
import { Skeleton } from "@ndma-dcs-staff-portal/ui/components/skeleton";
import { Header } from "@/components/layout/header";
import { Main } from "@/components/layout/main";
import { ThemeSwitch } from "@/components/theme-switch";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/_authenticated/roster/calendar/")({
  component: RosterCalendarPage,
});

function RosterCalendarPage() {
  const { data: schedules, isLoading } = useQuery(orpc.roster.list.queryOptions({ input: { status: "published" } }));
  const today = startOfMonth(new Date());
  const months = [today, addMonths(today, 1), addMonths(today, 2)];

  return (
    <>
      <Header fixed>
        <div className="flex items-center gap-2">
          <CalendarClock className="size-4 text-muted-foreground" />
          <span className="text-sm font-medium">Roster Calendar</span>
        </div>
        <div className="ms-auto flex items-center gap-2">
          <ThemeSwitch />
        </div>
      </Header>

      <Main className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Monthly Calendar</h1>
          <p className="text-sm text-muted-foreground">Three-month view of published roster coverage.</p>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-40 w-full rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {months.map((monthStart) => {
              const label = format(monthStart, "MMMM yyyy");
              const monthEnd = endOfMonth(monthStart);
              const monthSchedules = (schedules ?? []).filter((schedule) => {
                const month = parseISO(`${schedule.monthKey}-01`);
                return month >= monthStart && month <= monthEnd;
              });
              return (
                <Card key={label}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">{label}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {monthSchedules.length ? (
                      monthSchedules.map((schedule) => (
                        <div key={schedule.id} className="rounded-lg border px-3 py-2 text-sm">
                          <div className="font-medium">{schedule.monthKey}</div>
                          <div className="text-xs text-muted-foreground">
                            {schedule.assignments.length} assignments • {schedule.status}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">No published schedule for this month.</p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </Main>
    </>
  );
}
