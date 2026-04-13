import { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { User, KeyRound, Calendar, Briefcase } from "lucide-react";
import { Button } from "@ndma-dcs-staff-portal/ui/components/button";
import { Input } from "@ndma-dcs-staff-portal/ui/components/input";
import { Label } from "@ndma-dcs-staff-portal/ui/components/label";
import { Skeleton } from "@ndma-dcs-staff-portal/ui/components/skeleton";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@ndma-dcs-staff-portal/ui/components/card";
import { Avatar, AvatarFallback } from "@ndma-dcs-staff-portal/ui/components/avatar";
import { Header } from "@/components/layout/header";
import { Main } from "@/components/layout/main";
import { ThemeSwitch } from "@/components/theme-switch";
import { authClient } from "@/lib/auth-client";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/_authenticated/profile")({
  component: ProfilePage,
});

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function labelCase(s: string) {
  return s
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

const LEAVE_STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  approved: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  rejected: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  cancelled: "bg-muted text-muted-foreground",
};

const WORK_STATUS_COLORS: Record<string, string> = {
  backlog: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300",
  todo: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  in_progress: "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300",
  blocked: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  review: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  done: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  cancelled: "bg-muted text-muted-foreground",
};

function ProfilePage() {
  const { data: session } = authClient.useSession();
  const user = session?.user;

  // Find own staff profile by matching auth user ID
  const { data: staffList } = useQuery(
    orpc.staff.list.queryOptions({ input: { limit: 200, offset: 0 } })
  );
  const ownStaff = staffList?.find(
    (s) => s.user?.id === user?.id
  );
  const staffProfileId = ownStaff?.id;

  // Own leave requests (most recent)
  const { data: leaveRequests, isLoading: leaveLoading } = useQuery({
    ...orpc.leave.requests.list.queryOptions({
      input: { staffProfileId, limit: 8 },
    }),
    enabled: !!staffProfileId,
  });

  // Own open work items (assigned to me, not done/cancelled)
  const { data: workItems, isLoading: workLoading } = useQuery({
    ...orpc.work.list.queryOptions({
      input: { assignedToId: staffProfileId, limit: 10 },
    }),
    enabled: !!staffProfileId,
  });

  // ── Profile name update ──────────────────────────────────────────────────
  const [name, setName] = useState("");
  const [nameLoading, setNameLoading] = useState(false);

  useEffect(() => {
    if (user?.name) setName(user.name);
  }, [user?.name]);

  async function handleUpdateName(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setNameLoading(true);
    const { error } = await authClient.updateUser({ name: name.trim() });
    setNameLoading(false);
    if (error) {
      toast.error(error.message ?? "Failed to update name");
    } else {
      toast.success("Name updated successfully");
    }
  }

  // ── Password change ──────────────────────────────────────────────────────
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwLoading, setPwLoading] = useState(false);

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPw !== confirmPw) {
      toast.error("New passwords do not match");
      return;
    }
    if (newPw.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    setPwLoading(true);
    const { error } = await (authClient as unknown as {
      changePassword: (p: {
        currentPassword: string;
        newPassword: string;
        revokeOtherSessions: boolean;
      }) => Promise<{ error?: { message?: string } }>;
    }).changePassword({
      currentPassword: currentPw,
      newPassword: newPw,
      revokeOtherSessions: false,
    });
    setPwLoading(false);
    if (error) {
      toast.error(error.message ?? "Failed to change password");
    } else {
      toast.success("Password updated successfully");
      setCurrentPw("");
      setNewPw("");
      setConfirmPw("");
    }
  }

  const userRole = (user as Record<string, unknown> | undefined)?.role as string | undefined;

  return (
    <>
      <Header fixed>
        <div className="flex items-center gap-2">
          <User className="size-4 text-muted-foreground" />
          <span className="text-sm font-medium">My Profile</span>
        </div>
        <div className="ms-auto flex items-center gap-2">
          <ThemeSwitch />
        </div>
      </Header>

      <Main>
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">My Profile</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your account details and view your activity.
          </p>
        </div>

        <div className="max-w-2xl space-y-6">
          {/* ── Account info + name edit ─────────────────────────────────── */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <User className="size-4 text-blue-500" />
                Account Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Avatar row */}
              <div className="flex items-center gap-4">
                <Avatar className="size-16">
                  <AvatarFallback className="text-xl rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                    {getInitials(user?.name ?? "?")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-lg font-semibold">{user?.name ?? "—"}</p>
                  <p className="text-sm text-muted-foreground">{user?.email ?? "—"}</p>
                  {(ownStaff || userRole) && (
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {userRole && (
                        <span className="inline-flex items-center rounded-md bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                          {labelCase(userRole)}
                        </span>
                      )}
                      {ownStaff?.department?.name && (
                        <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                          {ownStaff.department.name}
                        </span>
                      )}
                      {ownStaff?.employmentType && (
                        <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                          {labelCase(ownStaff.employmentType)}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Edit name */}
              <form onSubmit={handleUpdateName} className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="profile-name">Display Name</Label>
                  <Input
                    id="profile-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your full name"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Email Address</Label>
                  <Input
                    value={user?.email ?? ""}
                    disabled
                    className="bg-muted cursor-not-allowed"
                  />
                  <p className="text-xs text-muted-foreground">
                    Contact an administrator to change your email address.
                  </p>
                </div>
                <Button
                  type="submit"
                  size="sm"
                  disabled={nameLoading || !name.trim() || name.trim() === user?.name}
                >
                  {nameLoading ? "Saving…" : "Save Changes"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* ── Change password ──────────────────────────────────────────── */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <KeyRound className="size-4 text-amber-500" />
                Change Password
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleChangePassword} className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="current-pw">Current Password</Label>
                  <Input
                    id="current-pw"
                    type="password"
                    value={currentPw}
                    onChange={(e) => setCurrentPw(e.target.value)}
                    autoComplete="current-password"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="new-pw">New Password</Label>
                  <Input
                    id="new-pw"
                    type="password"
                    value={newPw}
                    onChange={(e) => setNewPw(e.target.value)}
                    autoComplete="new-password"
                    placeholder="At least 8 characters"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="confirm-pw">Confirm New Password</Label>
                  <Input
                    id="confirm-pw"
                    type="password"
                    value={confirmPw}
                    onChange={(e) => setConfirmPw(e.target.value)}
                    autoComplete="new-password"
                  />
                </div>
                <Button
                  type="submit"
                  size="sm"
                  disabled={pwLoading || !currentPw || !newPw || !confirmPw}
                >
                  {pwLoading ? "Updating…" : "Update Password"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* ── My leave requests ────────────────────────────────────────── */}
          {staffProfileId && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Calendar className="size-4 text-green-500" />
                  My Leave Requests
                </CardTitle>
              </CardHeader>
              <CardContent>
                {leaveLoading ? (
                  <div className="space-y-2">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full rounded-xl" />
                    ))}
                  </div>
                ) : !leaveRequests?.length ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">
                    No leave requests on record.
                  </p>
                ) : (
                  <div className="divide-y rounded-xl border">
                    {leaveRequests.map((req) => (
                      <div
                        key={req.id}
                        className="flex items-center justify-between px-3 py-2.5 gap-3"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium">
                            {req.leaveType?.name ?? "Leave"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(parseISO(req.startDate), "dd MMM")} –{" "}
                            {format(parseISO(req.endDate), "dd MMM yyyy")}
                            {" · "}
                            {req.totalDays} day{req.totalDays !== 1 ? "s" : ""}
                          </p>
                        </div>
                        <span
                          className={`inline-flex items-center rounded-lg px-2 py-0.5 text-xs font-medium shrink-0 ${
                            LEAVE_STATUS_COLORS[req.status] ?? ""
                          }`}
                        >
                          {req.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* ── My work items ────────────────────────────────────────────── */}
          {staffProfileId && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Briefcase className="size-4 text-indigo-500" />
                  My Work Items
                </CardTitle>
              </CardHeader>
              <CardContent>
                {workLoading ? (
                  <div className="space-y-2">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full rounded-xl" />
                    ))}
                  </div>
                ) : !workItems?.length ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">
                    No work items assigned to you.
                  </p>
                ) : (
                  <div className="divide-y rounded-xl border">
                    {workItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between px-3 py-2.5 gap-3"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{item.title}</p>
                          <p className="text-xs text-muted-foreground capitalize">
                            {item.type?.replace(/_/g, " ")}
                            {item.dueDate
                              ? ` · Due ${format(parseISO(item.dueDate), "dd MMM")}`
                              : ""}
                          </p>
                        </div>
                        <span
                          className={`inline-flex items-center rounded-lg px-2 py-0.5 text-xs font-medium shrink-0 ${
                            WORK_STATUS_COLORS[item.status] ?? ""
                          }`}
                        >
                          {labelCase(item.status)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </Main>
    </>
  );
}
