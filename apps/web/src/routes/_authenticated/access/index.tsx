import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { format, parseISO, isPast } from "date-fns";
import { Key, AlertCircle, CheckCircle } from "lucide-react";
import { toast } from "sonner";
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

export const Route = createFileRoute("/_authenticated/access/")({
  component: PlatformAccountsPage,
});

type Platform = "vpn" | "fortigate" | "uportal" | "biometric" | "ad" | "other";
type AccountStatus = "active" | "suspended" | "disabled" | "pending_creation";

const PLATFORM_LABELS: Record<Platform, string> = {
  vpn: "VPN",
  fortigate: "Fortigate",
  uportal: "uPortal",
  biometric: "Biometric",
  ad: "Active Directory",
  other: "Other",
};

const STATUS_COLORS: Record<AccountStatus, string> = {
  active: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  suspended: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  disabled: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  pending_creation: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
};

function PlatformAccountsPage() {
  const [platform, setPlatform] = useState<Platform | "">("");
  const [status, setStatus] = useState<AccountStatus | "">("");

  const { data, isLoading } = useQuery(
    orpc.access.accounts.list.queryOptions({
      input: { platform: platform || undefined, status: status || undefined },
    })
  );

  const { data: expiring } = useQuery(
    orpc.access.accounts.getExpiring.queryOptions({ input: { withinDays: 30 } })
  );

  const markReviewedMutation = useMutation(
    orpc.access.accounts.markReviewed.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: orpc.access.accounts.list.key() });
        toast.success("Account marked as reviewed");
      },
      onError: (err) => toast.error(err.message),
    })
  );

  return (
    <>
      <Header fixed>
        <div className="flex items-center gap-2">
          <Key className="size-4 text-muted-foreground" />
          <span className="text-sm font-medium">Platform Accounts</span>
        </div>
        <div className="ms-auto flex items-center gap-2">
          <ThemeSwitch />
        </div>
      </Header>

      <Main>
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">Platform Accounts</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Cybersecurity compliance — staff account records across VPN, Fortigate,
            uPortal, biometric, and Active Directory.
          </p>
        </div>

        {expiring && expiring.length > 0 && (
          <div className="mb-4 flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 dark:bg-amber-900/20 p-3 text-sm text-amber-700 dark:text-amber-300">
            <AlertCircle className="size-4 shrink-0" />
            <strong>{expiring.length}</strong> account{expiring.length > 1 ? "s" : ""} expiring
            within 30 days — review required.
          </div>
        )}

        {data && (
          <div className="mb-4 flex flex-wrap gap-4 text-sm">
            <span className="text-muted-foreground">
              <strong className="text-foreground">{data.length}</strong> accounts
            </span>
            <span className="text-green-600">
              <strong>{data.filter((a) => a.status === "active").length}</strong> active
            </span>
            <span className="text-red-600">
              <strong>{data.filter((a) => a.status === "disabled").length}</strong> disabled
            </span>
          </div>
        )}

        <div className="mb-4 flex flex-wrap gap-3">
          <select
            value={platform}
            onChange={(e) => setPlatform(e.target.value as Platform | "")}
            className="rounded-md border bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">All Platforms</option>
            {(Object.keys(PLATFORM_LABELS) as Platform[]).map((p) => (
              <option key={p} value={p}>{PLATFORM_LABELS[p]}</option>
            ))}
          </select>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as AccountStatus | "")}
            className="rounded-md border bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="disabled">Disabled</option>
            <option value="pending_creation">Pending Creation</option>
          </select>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Staff Member</TableHead>
                <TableHead>Platform</TableHead>
                <TableHead>Account / ID</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead>Last Reviewed</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : !data?.length ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-12 text-center text-muted-foreground">
                    No platform accounts found.
                  </TableCell>
                </TableRow>
              ) : (
                data.map((account) => {
                  const isExpired =
                    account.expiresAt && isPast(parseISO(account.expiresAt));
                  return (
                    <TableRow key={account.id}>
                      <TableCell className="font-medium">
                        {account.staffProfile?.user?.name ?? "—"}
                      </TableCell>
                      <TableCell className="text-sm">
                        {PLATFORM_LABELS[account.platform as Platform] ?? account.platform}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {account.accountIdentifier}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${
                            STATUS_COLORS[account.status as AccountStatus] ?? ""
                          }`}
                        >
                          {account.status.replace("_", " ")}
                        </span>
                      </TableCell>
                      <TableCell
                        className={`text-xs ${isExpired ? "text-red-600 font-medium" : "text-muted-foreground"}`}
                      >
                        {account.expiresAt
                          ? format(parseISO(account.expiresAt), "dd MMM yyyy")
                          : "—"}
                        {isExpired && " ⚠️"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {account.lastReviewedAt
                          ? format(parseISO(account.lastReviewedAt), "dd MMM yyyy")
                          : <span className="text-amber-600">Never</span>}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs gap-1"
                          onClick={() => markReviewedMutation.mutate({ id: account.id })}
                          disabled={markReviewedMutation.isPending}
                        >
                          <CheckCircle className="size-3" />
                          Mark Reviewed
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </Main>
    </>
  );
}
