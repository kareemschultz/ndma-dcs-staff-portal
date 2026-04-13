import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { format, parseISO, isPast } from "date-fns";
import { Shield, AlertTriangle, GraduationCap, HardHat } from "lucide-react";
import { Skeleton } from "@ndma-dcs-staff-portal/ui/components/skeleton";
import { Header } from "@/components/layout/header";
import { Main } from "@/components/layout/main";
import { ThemeSwitch } from "@/components/theme-switch";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/_authenticated/compliance/items")({
  component: ComplianceItemsPage,
});

function ComplianceItemsPage() {
  const { data, isLoading } = useQuery(
    orpc.compliance.getExpiringItems.queryOptions({ input: { withinDays: 90 } })
  );

  const totalExpiring =
    (data?.training.length ?? 0) + (data?.ppe.length ?? 0);

  return (
    <>
      <Header fixed>
        <div className="flex items-center gap-2">
          <Shield className="size-4 text-muted-foreground" />
          <span className="text-sm font-medium">Compliance Overview</span>
        </div>
        <div className="ms-auto flex items-center gap-2">
          <ThemeSwitch />
        </div>
      </Header>

      <Main>
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">Compliance Overview</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Items expiring or expired across training and PPE — action required.
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : totalExpiring === 0 ? (
          <div className="rounded-md border border-green-200 bg-green-50 dark:bg-green-900/20 p-8 text-center">
            <Shield className="size-8 text-green-600 mx-auto mb-2" />
            <p className="font-medium text-green-700 dark:text-green-300">All compliance items are current</p>
            <p className="text-sm text-green-600 dark:text-green-400 mt-1">
              No training or PPE items expiring within the next 90 days.
            </p>
          </div>
        ) : (
          <>
            {totalExpiring > 0 && (
              <div className="mb-4 flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 dark:bg-amber-900/20 p-3 text-sm text-amber-700 dark:text-amber-300">
                <AlertTriangle className="size-4 shrink-0" />
                <strong>{totalExpiring}</strong> compliance item{totalExpiring > 1 ? "s" : ""} need
                attention within the next 90 days.
              </div>
            )}

            {/* Training expiring */}
            {data?.training && data.training.length > 0 && (
              <div className="mb-6">
                <h2 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  <GraduationCap className="size-3.5" />
                  Training ({data.training.length})
                </h2>
                <div className="rounded-md border divide-y">
                  {data.training.map((record) => {
                    const expired = record.expiryDate && isPast(parseISO(record.expiryDate));
                    return (
                      <div key={record.id} className="px-4 py-3 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">{record.staffProfile?.user?.name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{record.trainingName}</p>
                        </div>
                        <div className="text-right">
                          <p
                            className={`text-xs font-medium ${
                              expired ? "text-red-600" : "text-amber-600"
                            }`}
                          >
                            {expired ? "Expired" : "Expiring"}{" "}
                            {record.expiryDate &&
                              format(parseISO(record.expiryDate), "dd MMM yyyy")}
                          </p>
                          <p className="text-xs text-muted-foreground">{record.provider ?? ""}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* PPE expiring */}
            {data?.ppe && data.ppe.length > 0 && (
              <div>
                <h2 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  <HardHat className="size-3.5" />
                  PPE ({data.ppe.length})
                </h2>
                <div className="rounded-md border divide-y">
                  {data.ppe.map((record) => {
                    const expired = record.expiryDate && isPast(parseISO(record.expiryDate));
                    return (
                      <div key={record.id} className="px-4 py-3 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">{record.staffProfile?.user?.name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{record.itemName}</p>
                        </div>
                        <div className="text-right">
                          <p
                            className={`text-xs font-medium ${
                              expired ? "text-red-600" : "text-amber-600"
                            }`}
                          >
                            {expired ? "Expired" : "Expiring"}{" "}
                            {record.expiryDate &&
                              format(parseISO(record.expiryDate), "dd MMM yyyy")}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Condition: {record.condition ?? "good"}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </Main>
    </>
  );
}
