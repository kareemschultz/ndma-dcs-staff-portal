import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { useState } from "react";
import {
  ArrowLeft,
  Building2,
  Calendar,
  Mail,
  Pencil,
  ShieldCheck,
  Users,
} from "lucide-react";
import { Button } from "@ndma-dcs-staff-portal/ui/components/button";
import { Input } from "@ndma-dcs-staff-portal/ui/components/input";
import { Label } from "@ndma-dcs-staff-portal/ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@ndma-dcs-staff-portal/ui/components/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@ndma-dcs-staff-portal/ui/components/dialog";
import { Skeleton } from "@ndma-dcs-staff-portal/ui/components/skeleton";
import { Separator } from "@ndma-dcs-staff-portal/ui/components/separator";
import { Header } from "@/components/layout/header";
import { Main } from "@/components/layout/main";
import { orpc } from "@/utils/orpc";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/staff/$staffId")({
  component: StaffProfilePage,
});

type EditProfileForm = {
  jobTitle: string;
  employmentType: "full_time" | "part_time" | "contract" | "temporary";
  status: "active" | "inactive" | "on_leave" | "terminated";
};

function StaffStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string }> = {
    active: { label: "Active", className: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300" },
    inactive: { label: "Inactive", className: "bg-muted text-muted-foreground" },
    on_leave: { label: "On Leave", className: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300" },
    terminated: { label: "Terminated", className: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300" },
  };
  const cfg = map[status] ?? { label: status, className: "bg-muted text-muted-foreground" };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${cfg.className}`}>
      {cfg.label}
    </span>
  );
}

function EmploymentTypeBadge({ type }: { type: string }) {
  const labels: Record<string, string> = {
    full_time: "Full Time",
    part_time: "Part Time",
    contract: "Contract",
    temporary: "Temporary",
  };
  return (
    <span className="inline-flex items-center rounded-lg px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
      {labels[type] ?? type}
    </span>
  );
}

function EditProfileDialog({
  open,
  onOpenChange,
  staffId,
  initial,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staffId: string;
  initial: EditProfileForm;
}) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<EditProfileForm>(initial);

  const mutation = useMutation(
    orpc.staff.update.mutationOptions({
      onSuccess: () => {
        toast.success("Profile updated");
        queryClient.invalidateQueries({ queryKey: orpc.staff.get.key() });
        onOpenChange(false);
      },
      onError: (err: Error) => {
        toast.error(err.message ?? "Failed to update profile");
      },
    })
  );

  function handleSave() {
    mutation.mutate({
      id: staffId,
      jobTitle: form.jobTitle || undefined,
      employmentType: form.employmentType || undefined,
      status: form.status || undefined,
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="ep-jobTitle">Job Title</Label>
            <Input
              id="ep-jobTitle"
              value={form.jobTitle}
              onChange={(e) => setForm((f) => ({ ...f, jobTitle: e.target.value }))}
              placeholder="e.g. Systems Engineer"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ep-employmentType">Employment Type</Label>
            <Select
              value={form.employmentType}
              onValueChange={(v) =>
                setForm((f) => ({ ...f, employmentType: v as EditProfileForm["employmentType"] }))
              }
            >
              <SelectTrigger id="ep-employmentType">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="full_time">Full Time</SelectItem>
                <SelectItem value="part_time">Part Time</SelectItem>
                <SelectItem value="contract">Contract</SelectItem>
                <SelectItem value="temporary">Temporary</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ep-status">Status</Label>
            <Select
              value={form.status}
              onValueChange={(v) =>
                setForm((f) => ({ ...f, status: v as EditProfileForm["status"] }))
              }
            >
              <SelectTrigger id="ep-status">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="on_leave">On Leave</SelectItem>
                <SelectItem value="terminated">Terminated</SelectItem>
              </SelectContent>
            </Select>
          </div>

        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={mutation.isPending}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={mutation.isPending}>
            {mutation.isPending ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function StaffProfilePage() {
  const { staffId } = Route.useParams();
  const [editOpen, setEditOpen] = useState(false);

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
                <StaffStatusBadge status={profile.status} />
                <Button
                  variant="outline"
                  size="sm"
                  className="ml-1 h-7 gap-1.5 px-2 text-xs"
                  onClick={() => setEditOpen(true)}
                >
                  <Pencil className="size-3" />
                  Edit
                </Button>
              </div>
              <p className="text-muted-foreground">{profile.jobTitle}</p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main info */}
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-xl border p-5 space-y-4">
              <h2 className="font-semibold">Employment Details</h2>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs mb-1">Employee ID</p>
                  <p className="font-mono font-medium">{profile.employeeId}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs mb-1">Employment Type</p>
                  <EmploymentTypeBadge type={profile.employmentType} />
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
            <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
              Additional tabs for Leave, Contracts, Training, PPE, and Appraisals coming in a later phase.
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="rounded-xl border p-4 space-y-3 text-sm">
              <h3 className="font-semibold">Account</h3>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail className="size-3.5 shrink-0" />
                <span>{profile.user?.email ?? "—"}</span>
              </div>
              <div className="text-xs text-muted-foreground">
                Role: <span className="capitalize">{(profile.user as Record<string, unknown>)?.role as string ?? "—"}</span>
              </div>
            </div>

            <div className="rounded-xl border p-4 text-sm">
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

      <EditProfileDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        staffId={staffId}
        initial={{
          jobTitle: profile.jobTitle ?? "",
          employmentType: (profile.employmentType as EditProfileForm["employmentType"]) ?? "full_time",
          status: (profile.status as EditProfileForm["status"]) ?? "active",
        }}
      />
    </>
  );
}
