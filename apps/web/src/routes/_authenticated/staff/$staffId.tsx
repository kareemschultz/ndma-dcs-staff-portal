import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  ArrowLeft,
  Building2,
  Calendar,
  Mail,
  ShieldCheck,
  Users,
} from "lucide-react";
import { Button } from "@ndma-dcs-staff-portal/ui/components/button";
import { Skeleton } from "@ndma-dcs-staff-portal/ui/components/skeleton";
import { Separator } from "@ndma-dcs-staff-portal/ui/components/separator";
import { Header } from "@/components/layout/header";
import { Main } from "@/components/layout/main";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/_authenticated/staff/$staffId")({
  component: StaffProfilePage,
});

const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  inactive: "bg-muted text-muted-foreground",
  on_leave: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  terminated: "bg-muted text-muted-foreground",
};

function StaffProfilePage() {
  const { staffId } = Route.useParams();

  const { data: profile, isLoading, error } = useQuery(
    orpc.staff.get.queryOptions({ input: { id: staffId } })
  );

  if (isLoading) {
    return (
      <>
        <Header fixed>
          <div className="flex items-center gap-2">
            <Users className="size-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Staff Directory</span>
          </div>
        </Header>
        <Main>
          <Skeleton className="h-8 w-48 mb-4" />
          <Skeleton className="h-4 w-64 mb-2" />
          <Skeleton className="h-4 w-48" />
        </Main>
      </>
    );
  }

  if (error || !profile) {
    return (
      <Main>
        <p className="text-muted-foreground">Staff profile not found.</p>
        <Link to="/staff">
          <Button variant="outline" className="mt-4">Back to Directory</Button>
        </Link>
      </Main>
    );
  }

  return (
    <>
      <Header fixed>
        <div className="flex items-center gap-2">
          <Users className="size-4 text-muted-foreground" />
          <Link to="/staff" className="text-sm text-muted-foreground hover:text-foreground">
            Staff Directory
          </Link>
          <span className="text-muted-foreground">/</span>
          <span className="text-sm font-medium">{profile.user?.name}</span>
        </div>
      </Header>

      <Main>
        <div className="mb-6 flex items-center gap-3">
          <Link to="/staff">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="size-4" />
            </Button>
          </Link>
          <div className="flex items-center gap-4">
            <div className="size-16 rounded-full bg-muted flex items-center justify-center text-2xl font-bold">
              {profile.user?.name?.[0] ?? "?"}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold">{profile.user?.name}</h1>
                <span
                  className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${
                    STATUS_COLORS[profile.status] ?? "bg-muted text-muted-foreground"
                  }`}
                >
                  {profile.status?.replace("_", " ")}
                </span>
              </div>
              <p className="text-muted-foreground">{profile.jobTitle}</p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main info */}
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-md border p-5 space-y-4">
              <h2 className="font-semibold">Employment Details</h2>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs mb-1">Employee ID</p>
                  <p className="font-mono font-medium">{profile.employeeId}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs mb-1">Employment Type</p>
                  <p className="capitalize">{profile.employmentType?.replace("_", " ")}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs mb-1">Start Date</p>
                  <p>
                    {profile.startDate
                      ? format(new Date(profile.startDate), "dd MMM yyyy")
                      : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs mb-1">Department</p>
                  <p className="flex items-center gap-1">
                    <Building2 className="size-3.5 text-muted-foreground" />
                    {profile.department?.name ?? "—"}
                  </p>
                </div>
              </div>

              <Separator />

              <div className="flex flex-wrap gap-3 text-sm">
                {profile.isTeamLead && (
                  <span className="flex items-center gap-1 rounded-full border px-3 py-1 text-xs">
                    <ShieldCheck className="size-3.5 text-amber-500" />
                    Team Lead
                  </span>
                )}
                {profile.isLeadEngineerEligible && (
                  <span className="flex items-center gap-1 rounded-full border px-3 py-1 text-xs">
                    <ShieldCheck className="size-3.5 text-indigo-500" />
                    Lead Engineer Eligible
                  </span>
                )}
                {profile.isOnCallEligible && (
                  <span className="flex items-center gap-1 rounded-full border px-3 py-1 text-xs">
                    <Calendar className="size-3.5 text-green-500" />
                    On-Call Eligible
                  </span>
                )}
              </div>
            </div>

            {/* Placeholder for future tabs */}
            <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
              Additional tabs for Leave, Contracts, Training, PPE, and Appraisals coming in a later phase.
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="rounded-md border p-4 space-y-3 text-sm">
              <h3 className="font-semibold">Account</h3>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail className="size-3.5 shrink-0" />
                <span>{profile.user?.email ?? "—"}</span>
              </div>
              <div className="text-xs text-muted-foreground">
                Role: <span className="capitalize">{(profile.user as Record<string, unknown>)?.role as string ?? "—"}</span>
              </div>
            </div>

            <div className="rounded-md border p-4 text-sm">
              <h3 className="font-semibold mb-2">Quick Links</h3>
              <div className="space-y-1.5">
                <Link to="/rota" className="block text-muted-foreground hover:text-foreground">
                  → On-Call Schedule
                </Link>
                <Link to="/leave" className="block text-muted-foreground hover:text-foreground">
                  → Leave Records
                </Link>
                <Link to="/access" className="block text-muted-foreground hover:text-foreground">
                  → Platform Accounts
                </Link>
              </div>
            </div>
          </div>
        </div>
      </Main>
    </>
  );
}
