import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { FileText, AlertCircle } from "lucide-react";
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

export const Route = createFileRoute("/_authenticated/contracts/")({
  component: ContractsPage,
});

type ContractStatus = "active" | "expiring_soon" | "expired" | "renewed" | "terminated";

const STATUS_COLORS: Record<ContractStatus, string> = {
  active: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  expiring_soon: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  expired: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  renewed: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  terminated: "bg-muted text-muted-foreground",
};

function ContractsPage() {
  const [status, setStatus] = useState<ContractStatus | "">("");

  const { data, isLoading } = useQuery(
    orpc.contracts.list.queryOptions({
      input: { status: status || undefined, limit: 100, offset: 0 },
    })
  );

  const { data: expiring } = useQuery(
    orpc.contracts.getExpiringSoon.queryOptions({ input: { withinDays: 60 } })
  );

  return (
    <>
      <Header fixed>
        <div className="flex items-center gap-2">
          <FileText className="size-4 text-muted-foreground" />
          <span className="text-sm font-medium">Contracts</span>
        </div>
        <div className="ms-auto flex items-center gap-2">
          <ThemeSwitch />
        </div>
      </Header>

      <Main>
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">Staff Contracts</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Employment contract register with renewal tracking.
          </p>
        </div>

        {expiring && expiring.length > 0 && (
          <div className="mb-4 flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 dark:bg-amber-900/20 p-3 text-sm text-amber-700 dark:text-amber-300">
            <AlertCircle className="size-4 shrink-0" />
            <strong>{expiring.length}</strong> contract{expiring.length > 1 ? "s" : ""} expiring
            within 60 days — renewal action required.
          </div>
        )}

        <div className="mb-4 flex flex-wrap gap-3">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as ContractStatus | "")}
            className="rounded-md border bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="expiring_soon">Expiring Soon</option>
            <option value="expired">Expired</option>
            <option value="renewed">Renewed</option>
            <option value="terminated">Terminated</option>
          </select>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Staff Member</TableHead>
                <TableHead>Contract Type</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 5 }).map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : !data?.length ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-12 text-center text-muted-foreground">
                    No contracts found.
                  </TableCell>
                </TableRow>
              ) : (
                data.map((contract) => (
                  <TableRow key={contract.id}>
                    <TableCell className="font-medium">
                      {contract.staffProfile?.user?.name ?? "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {contract.contractType}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {contract.startDate
                        ? format(parseISO(contract.startDate), "dd MMM yyyy")
                        : "—"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {contract.endDate
                        ? format(parseISO(contract.endDate), "dd MMM yyyy")
                        : "Open-ended"}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${
                          STATUS_COLORS[contract.status as ContractStatus] ?? ""
                        }`}
                      >
                        {contract.status.replace("_", " ")}
                      </span>
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
