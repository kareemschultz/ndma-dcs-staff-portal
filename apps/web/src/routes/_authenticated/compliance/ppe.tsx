import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { format, parseISO, isPast } from "date-fns";
import { HardHat } from "lucide-react";
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

export const Route = createFileRoute("/_authenticated/compliance/ppe")({
  component: PPEPage,
});

const CONDITION_COLORS: Record<string, string> = {
  good: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  fair: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  poor: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  damaged: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  replaced: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
};

function ComplianceStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    current: { label: "Current", cls: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300" },
    expiring_soon: { label: "Expiring Soon", cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300" },
    expired: { label: "Expired", cls: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 font-semibold" },
    not_started: { label: "Not Started", cls: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300" },
  };
  const cfg = map[status] ?? { label: status, cls: "bg-muted text-muted-foreground" };
  return <span className={`inline-flex items-center rounded-lg px-2 py-0.5 text-xs font-medium ${cfg.cls}`}>{cfg.label}</span>;
}

function PPEPage() {
  const { data, isLoading } = useQuery(
    orpc.compliance.ppe.list.queryOptions({ input: {} })
  );

  return (
    <>
      <Header fixed>
        <div className="flex items-center gap-2">
          <HardHat className="size-4 text-muted-foreground" />
          <span className="text-sm font-medium">PPE Management</span>
        </div>
        <div className="ms-auto flex items-center gap-2">
          <ThemeSwitch />
        </div>
      </Header>

      <Main>
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">PPE Management</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Monitor personal protective equipment issuance and compliance.
          </p>
        </div>

        {data && (
          <div className="mb-4 flex flex-wrap gap-4 text-sm">
            <span className="text-muted-foreground">
              <strong className="text-foreground">{data.length}</strong> PPE records
            </span>
            <span className="text-red-600">
              <strong>
                {data.filter((r) => r.expiryDate && isPast(parseISO(r.expiryDate))).length}
              </strong>{" "}
              expired
            </span>
          </div>
        )}

        <div className="rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Staff Member</TableHead>
                <TableHead>Item</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Issued</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead>Condition</TableHead>
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
                    No PPE records found.
                  </TableCell>
                </TableRow>
              ) : (
                data.map((record) => {
                  const isExpired =
                    record.expiryDate && isPast(parseISO(record.expiryDate));
                  return (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">
                        {record.staffProfile?.user?.name ?? "—"}
                      </TableCell>
                      <TableCell className="text-sm">{record.itemName}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {record.size ?? "—"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {record.issuedDate
                          ? format(parseISO(record.issuedDate), "dd MMM yyyy")
                          : "—"}
                      </TableCell>
                      <TableCell
                        className={`text-xs ${isExpired ? "text-red-600 font-medium" : "text-muted-foreground"}`}
                      >
                        {record.expiryDate
                          ? format(parseISO(record.expiryDate), "dd MMM yyyy")
                          : "—"}
                        {isExpired && " ⚠️"}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center rounded-lg px-2 py-0.5 text-xs font-medium ${
                            CONDITION_COLORS[record.condition ?? "good"] ?? "bg-muted text-muted-foreground"
                          }`}
                        >
                          {record.condition ?? "good"}
                        </span>
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
