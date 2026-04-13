import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { ClipboardCheck, AlertCircle } from "lucide-react";
import { Skeleton } from "@ndma-dcs-staff-portal/ui/components/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@ndma-dcs-staff-portal/ui/components/table";
import { Header } from "@/components/layout/header";
import { Main } from "@/components/layout/main";
import { ThemeSwitch } from "@/components/theme-switch";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/_authenticated/appraisals/")({
  component: AppraisalsPage,
});

type AppraisalStatus = "scheduled" | "in_progress" | "completed" | "overdue";

const STATUS_COLORS: Record<AppraisalStatus, string> = {
  scheduled: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  in_progress: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300",
  completed: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  overdue: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
};

function StarRating({ rating }: { rating: number | null }) {
  if (!rating) return <span className="text-muted-foreground">—</span>;
  return (
    <span className="text-amber-500 text-sm">
      {"★".repeat(rating)}{"☆".repeat(5 - rating)}
    </span>
  );
}

function AppraisalsPage() {
  const [status, setStatus] = useState<AppraisalStatus | "">("");

  const { data, isLoading } = useQuery(
    orpc.appraisals.list.queryOptions({
      input: { status: status || undefined, limit: 100, offset: 0 },
    })
  );

  const { data: overdue } = useQuery(orpc.appraisals.getOverdue.queryOptions());

  return (
    <>
      <Header fixed>
        <div className="flex items-center gap-2">
          <ClipboardCheck className="size-4 text-muted-foreground" />
          <span className="text-sm font-medium">Appraisals</span>
        </div>
        <div className="ms-auto flex items-center gap-2">
          <ThemeSwitch />
        </div>
      </Header>

      <Main>
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">Performance Appraisals</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Schedule, track, and complete staff performance reviews.
          </p>
        </div>

        {overdue && overdue.length > 0 && (
          <div className="mb-4 flex items-center gap-2 rounded-md border border-red-200 bg-red-50 dark:bg-red-900/20 p-3 text-sm text-red-700 dark:text-red-300">
            <AlertCircle className="size-4 shrink-0" />
            <strong>{overdue.length}</strong> appraisal{overdue.length > 1 ? "s" : ""} are
            overdue and not yet completed.
          </div>
        )}

        {data && (
          <div className="mb-4 flex flex-wrap gap-4 text-sm">
            <span className="text-muted-foreground">
              <strong className="text-foreground">{data.length}</strong> total
            </span>
            <span className="text-green-600">
              <strong>{data.filter((a) => a.status === "completed").length}</strong> completed
            </span>
            <span className="text-blue-600">
              <strong>{data.filter((a) => a.status === "scheduled").length}</strong> scheduled
            </span>
            <span className="text-red-600">
              <strong>{data.filter((a) => a.status === "overdue").length}</strong> overdue
            </span>
          </div>
        )}

        <div className="mb-4 flex flex-wrap gap-3">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as AppraisalStatus | "")}
            className="rounded-md border bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">All Statuses</option>
            <option value="scheduled">Scheduled</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="overdue">Overdue</option>
          </select>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Staff Member</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Reviewer</TableHead>
                <TableHead>Scheduled Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Rating</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : !data?.length ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                    No appraisals found.
                  </TableCell>
                </TableRow>
              ) : (
                data.map((appraisal) => (
                  <TableRow key={appraisal.id}>
                    <TableCell className="font-medium">
                      {appraisal.staffProfile?.user?.name ?? "—"}
                      {appraisal.staffProfile?.department && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {appraisal.staffProfile.department.name}
                        </p>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {appraisal.periodStart && format(parseISO(appraisal.periodStart), "MMM yyyy")}
                      {" – "}
                      {appraisal.periodEnd && format(parseISO(appraisal.periodEnd), "MMM yyyy")}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {appraisal.reviewer?.user?.name ?? "—"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {appraisal.scheduledDate
                        ? format(parseISO(appraisal.scheduledDate), "dd MMM yyyy")
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${
                          STATUS_COLORS[appraisal.status as AppraisalStatus] ?? ""
                        }`}
                      >
                        {appraisal.status.replace("_", " ")}
                      </span>
                    </TableCell>
                    <TableCell>
                      <StarRating rating={appraisal.overallRating} />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Main>
    </>
  );
}
