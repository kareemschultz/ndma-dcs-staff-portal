import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  format,
  parseISO,
  startOfMonth,
  endOfMonth,
  addMonths,
  isWithinInterval,
  startOfDay,
} from "date-fns";
import { CalendarClock } from "lucide-react";
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

export const Route = createFileRoute("/_authenticated/rota/calendar/")({
  component: CalendarPage,
});

type OnCallRole = "lead_engineer" | "asn_support" | "core_support" | "enterprise_support";

const REQUIRED_ROLES: OnCallRole[] = [
  "lead_engineer",
  "asn_support",
  "core_support",
  "enterprise_support",
];

const ROLE_LABELS: Record<OnCallRole, string> = {
  lead_engineer: "Lead",
  asn_support: "ASN",
  core_support: "Core",
  enterprise_support: "Enterprise",
};

const ROLE_COLORS: Record<OnCallRole, string> = {
  lead_engineer:
    "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300",
  asn_support:
    "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  core_support:
    "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  enterprise_support:
    "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
};

type ScheduleEntry = {
  id: string;
  weekStart: string;
  weekEnd: string;
  status: string;
  assignments: Array<{
    role: string;
    staffProfile?: {
      user?: { name?: string };
    } | null;
  }>;
};

function getFirstName(fullName: string | null | undefined): string {
  if (!fullName) return "—";
  return fullName.split(" ")[0] ?? fullName;
}

function WeekRow({
  schedule,
  isThisWeek,
}: {
  schedule: ScheduleEntry;
  isThisWeek: boolean;
}) {
  const weekStartDate = parseISO(schedule.weekStart);
  const weekEndDate = parseISO(schedule.weekEnd);

  return (
    <tr
      className={`border-b transition-colors ${
        isThisWeek
          ? "bg-blue-50 dark:bg-blue-950/20 ring-1 ring-inset ring-blue-200 dark:ring-blue-800"
          : "hover:bg-muted/30"
      }`}
    >
      <td className="py-2.5 px-3 text-sm whitespace-nowrap">
        <span className="font-medium tabular-nums">
          {format(weekStartDate, "d MMM")}
        </span>
        <span className="text-muted-foreground mx-1">–</span>
        <span className="font-medium tabular-nums">
          {format(weekEndDate, "d MMM")}
        </span>
        {isThisWeek && (
          <span className="ml-2 inline-flex items-center rounded-full bg-blue-500 px-2 py-0.5 text-[10px] font-semibold text-white">
            Now
          </span>
        )}
      </td>
      {REQUIRED_ROLES.map((role) => {
        const assignment = schedule.assignments.find((a) => a.role === role);
        const name = assignment?.staffProfile?.user?.name ?? null;
        return (
          <td key={role} className="py-2.5 px-3">
            {assignment ? (
              <span
                className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${ROLE_COLORS[role]}`}
                title={name ?? undefined}
              >
                {getFirstName(name)}
              </span>
            ) : (
              <span className="text-xs text-muted-foreground italic">—</span>
            )}
          </td>
        );
      })}
    </tr>
  );
}

function MonthGroup({
  monthLabel,
  schedules,
  thisWeekId,
}: {
  monthLabel: string;
  schedules: ScheduleEntry[];
  thisWeekId: string | null;
}) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="px-4 py-3 border-b bg-muted/30">
        <CardTitle className="text-sm font-semibold">{monthLabel}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px]">
            <thead>
              <tr className="border-b bg-muted/20">
                <th className="py-2 px-3 text-left text-xs font-medium text-muted-foreground">
                  Week
                </th>
                {REQUIRED_ROLES.map((role) => (
                  <th
                    key={role}
                    className="py-2 px-3 text-left text-xs font-medium text-muted-foreground whitespace-nowrap"
                  >
                    <span
                      className={`inline-flex items-center rounded px-1.5 py-0.5 ${ROLE_COLORS[role]}`}
                    >
                      {ROLE_LABELS[role]}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {schedules.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="py-6 text-center text-sm text-muted-foreground italic"
                  >
                    No published schedules for this month.
                  </td>
                </tr>
              ) : (
                schedules.map((s) => (
                  <WeekRow
                    key={s.id}
                    schedule={s}
                    isThisWeek={s.id === thisWeekId}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

function CalendarPage() {
  const today = startOfDay(new Date());

  // Build the three months we want to display: current + next 2
  const months = [
    startOfMonth(today),
    startOfMonth(addMonths(today, 1)),
    startOfMonth(addMonths(today, 2)),
  ];

  const { data: schedules, isLoading } = useQuery(
    orpc.rota.list.queryOptions()
  );

  // Identify "this week" schedule — the one that contains today
  const thisWeekSchedule = schedules?.find((s) => {
    const entry = s as unknown as ScheduleEntry;
    return isWithinInterval(today, {
      start: parseISO(entry.weekStart),
      end: parseISO(entry.weekEnd),
    });
  });

  const thisWeekId = thisWeekSchedule
    ? (thisWeekSchedule as unknown as ScheduleEntry).id
    : null;

  // Group schedules by month (by their weekStart date)
  const grouped = months.map((monthStart) => {
    const monthEnd = endOfMonth(monthStart);
    const monthSchedules = (schedules ?? [])
      .map((s) => s as unknown as ScheduleEntry)
      .filter((s) => {
        const ws = parseISO(s.weekStart);
        return ws >= monthStart && ws <= monthEnd;
      })
      .sort((a, b) => a.weekStart.localeCompare(b.weekStart));
    return {
      label: format(monthStart, "MMMM yyyy"),
      schedules: monthSchedules,
    };
  });

  return (
    <>
      <Header fixed>
        <div className="flex items-center gap-2">
          <CalendarClock className="size-4 text-muted-foreground" />
          <span className="text-sm font-medium">Monthly Calendar</span>
        </div>
        <div className="ms-auto flex items-center gap-2">
          <ThemeSwitch />
        </div>
      </Header>

      <Main>
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">Monthly Calendar</h1>
          <p className="text-sm text-muted-foreground mt-1">
            3-month view of on-call roster assignments by week.
          </p>
        </div>

        {/* Role legend */}
        <div className="mb-5 flex flex-wrap gap-2">
          {REQUIRED_ROLES.map((role) => (
            <span
              key={role}
              className={`inline-flex items-center rounded px-2 py-1 text-xs font-medium ${ROLE_COLORS[role]}`}
            >
              {ROLE_LABELS[role]} Engineer
            </span>
          ))}
        </div>

        {isLoading ? (
          <div className="space-y-5">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <CardHeader className="px-4 py-3 border-b">
                  <Skeleton className="h-4 w-32" />
                </CardHeader>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    {Array.from({ length: 4 }).map((_, j) => (
                      <Skeleton key={j} className="h-8 w-full" />
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-5">
            {grouped.map(({ label, schedules: monthSchedules }) => (
              <MonthGroup
                key={label}
                monthLabel={label}
                schedules={monthSchedules}
                thisWeekId={thisWeekId}
              />
            ))}
          </div>
        )}
      </Main>
    </>
  );
}
