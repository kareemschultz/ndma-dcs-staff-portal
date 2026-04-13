import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { CalendarOff, Plus, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@ndma-dcs-staff-portal/ui/components/button";
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
import { orpc, queryClient } from "@/utils/orpc";

export const Route = createFileRoute("/_authenticated/leave/")({
  component: LeavePage,
});

type LeaveStatus = "pending" | "approved" | "rejected" | "cancelled";

const STATUS_COLORS: Record<LeaveStatus, string> = {
  pending: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  approved: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  rejected: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  cancelled: "bg-muted text-muted-foreground",
};

const STATUS_LABELS: Record<LeaveStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
  cancelled: "Cancelled",
};

function LeaveStatusBadge({ status }: { status: string }) {
  const cls = STATUS_COLORS[status as LeaveStatus] ?? "bg-muted text-muted-foreground";
  const label = STATUS_LABELS[status as LeaveStatus] ?? status;
  return (
    <span className={`inline-flex items-center rounded-lg px-2 py-0.5 text-xs font-medium ${cls}`}>
      {label}
    </span>
  );
}

function LeavePage() {
  const [activeTab, setActiveTab] = useState<"all" | "pending">("all");
  const [status, setStatus] = useState<LeaveStatus | "">("");

  const { data, isLoading } = useQuery(
    orpc.leave.requests.list.queryOptions({
      input: {
        status: activeTab === "pending" ? "pending" : (status as LeaveStatus) || undefined,
        limit: 100,
        offset: 0,
      },
    })
  );

  const { data: leaveTypes } = useQuery(orpc.leave.types.list.queryOptions());

  const approveMutation = useMutation(
    orpc.leave.requests.approve.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: orpc.leave.requests.list.key() });
        toast.success("Leave request approved");
      },
      onError: (err) => toast.error(err.message),
    })
  );

  const rejectMutation = useMutation(
    orpc.leave.requests.reject.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: orpc.leave.requests.list.key() });
        toast.success("Leave request rejected");
      },
      onError: (err) => toast.error(err.message),
    })
  );

  return (
    <>
      <Header fixed>
        <div className="flex items-center gap-2">
          <CalendarOff className="size-4 text-muted-foreground" />
          <span className="text-sm font-medium">Leave Management</span>
        </div>
        <div className="ms-auto flex items-center gap-2">
          <ThemeSwitch />
          <Link to="/leave/new">
            <Button size="sm">
              <Plus className="size-4 mr-1" />
              Request Leave
            </Button>
          </Link>
        </div>
      </Header>

      <Main>
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">Leave Management</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Submit leave requests and manage team leave.
          </p>
        </div>

        {/* Leave types summary */}
        {leaveTypes && leaveTypes.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-2">
            {leaveTypes.map((lt) => (
              <span key={lt.id} className="rounded-full border px-3 py-1 text-xs font-medium">
                {lt.name} ({lt.defaultAnnualAllowance} days/yr)
              </span>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div className="mb-4 flex gap-1 border-b">
          {(["all", "pending"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === tab
                  ? "border-b-2 border-primary text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab === "all" ? "All Requests" : "Pending Approval"}
            </button>
          ))}
        </div>

        {/* Status filter */}
        <div className="mb-4">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as LeaveStatus | "")}
            className="rounded-xl border bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <div className="rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Staff Member</TableHead>
                <TableHead>Leave Type</TableHead>
                <TableHead>From</TableHead>
                <TableHead>To</TableHead>
                <TableHead>Days</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 8 }).map((_, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : !data?.length ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-12 text-center text-muted-foreground">
                    No leave requests found.{" "}
                    <Link to="/leave/new" className="underline">
                      Submit a request
                    </Link>
                  </TableCell>
                </TableRow>
              ) : (
                data.map((req) => (
                  <TableRow key={req.id}>
                    <TableCell className="font-medium">
                      {req.staffProfile?.user?.name ?? "—"}
                    </TableCell>
                    <TableCell>{req.leaveType?.name ?? "—"}</TableCell>
                    <TableCell>
                      {format(parseISO(req.startDate), "dd MMM yyyy")}
                    </TableCell>
                    <TableCell>
                      {format(parseISO(req.endDate), "dd MMM yyyy")}
                    </TableCell>
                    <TableCell>{req.totalDays}</TableCell>
                    <TableCell>
                      <LeaveStatusBadge status={req.status} />
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs max-w-xs truncate">
                      {req.reason ?? "—"}
                    </TableCell>
                    <TableCell>
                        {req.status === "pending" && (
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-green-600 hover:text-green-700 h-7"
                              onClick={() => approveMutation.mutate({ id: req.id })}
                            >
                              <CheckCircle className="size-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-red-600 hover:text-red-700 h-7"
                              onClick={() =>
                                rejectMutation.mutate({ id: req.id, rejectionReason: "Not approved" })
                              }
                            >
                              <XCircle className="size-4" />
                            </Button>
                          </div>
                        )}
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
