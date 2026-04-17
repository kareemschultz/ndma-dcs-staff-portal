import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Users, Search, Plus, Eye } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@ndma-dcs-staff-portal/ui/components/input";
import { Skeleton } from "@ndma-dcs-staff-portal/ui/components/skeleton";
import { Button } from "@ndma-dcs-staff-portal/ui/components/button";
import { Label } from "@ndma-dcs-staff-portal/ui/components/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@ndma-dcs-staff-portal/ui/components/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@ndma-dcs-staff-portal/ui/components/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@ndma-dcs-staff-portal/ui/components/select";
import { Header } from "@/components/layout/header";
import { Main } from "@/components/layout/main";
import { ThemeSwitch } from "@/components/theme-switch";
import { orpc } from "@/utils/orpc";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/_authenticated/staff/")({
  component: StaffPage,
});

const STATUS_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "on_leave", label: "On Leave" },
  { value: "terminated", label: "Terminated" },
];

const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  inactive: "bg-muted text-muted-foreground",
  on_leave: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  terminated: "bg-muted text-muted-foreground line-through",
};

function NewStaffDialog({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const { data: departments } = useQuery(orpc.staff.getDepartments.queryOptions());
  const createProfile = useMutation(orpc.staff.create.mutationOptions());

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    employeeId: "",
    departmentId: "",
    jobTitle: "",
    employmentType: "full_time" as "full_time" | "part_time" | "contract" | "temporary",
    startDate: new Date().toISOString().slice(0, 10),
  });
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.email || !form.password || !form.employeeId || !form.departmentId || !form.jobTitle) {
      toast.error("All fields are required.");
      return;
    }
    setSubmitting(true);
    try {
      // 1. Create the auth user via Better Auth admin
      const { data, error } = await authClient.admin.createUser({
        name: form.name,
        email: form.email,
        password: form.password,
        role: "user",
      });
      if (error || !data?.user?.id) {
        toast.error(error?.message ?? "Failed to create user account.");
        return;
      }
      const userId = data.user.id;

      // 2. Create the staff profile linked to the user
      await createProfile.mutateAsync({
        userId,
        employeeId: form.employeeId,
        departmentId: form.departmentId,
        jobTitle: form.jobTitle,
        employmentType: form.employmentType,
        startDate: form.startDate,
      });

      toast.success(`Staff member ${form.name} created. They can sign in with their email and password.`);
      await queryClient.invalidateQueries({ queryKey: orpc.staff.list.key() });
      onClose();
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to create staff member.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>New Staff Member</DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4 py-2">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="ns-name">Full Name</Label>
            <Input id="ns-name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Kareem Schultz" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ns-empid">Employee ID</Label>
            <Input id="ns-empid" value={form.employeeId} onChange={(e) => setForm((f) => ({ ...f, employeeId: e.target.value }))} placeholder="DCS-001" />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ns-email">Email</Label>
          <Input id="ns-email" type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="name@ndma.gov.gh" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ns-password">Temporary Password</Label>
          <Input id="ns-password" type="password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} placeholder="Min 8 characters" />
          <p className="text-xs text-muted-foreground">Staff will use this to sign in. Ask them to change it on first login.</p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ns-title">Job Title</Label>
          <Input id="ns-title" value={form.jobTitle} onChange={(e) => setForm((f) => ({ ...f, jobTitle: e.target.value }))} placeholder="Senior Network Engineer" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Department</Label>
            <Select value={form.departmentId} onValueChange={(v) => setForm((f) => ({ ...f, departmentId: v ?? f.departmentId }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select…" />
              </SelectTrigger>
              <SelectContent>
                {departments?.map((d) => (
                  <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Employment Type</Label>
            <Select value={form.employmentType} onValueChange={(v) => setForm((f) => ({ ...f, employmentType: v as any }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="full_time">Full Time</SelectItem>
                <SelectItem value="part_time">Part Time</SelectItem>
                <SelectItem value="contract">Contract</SelectItem>
                <SelectItem value="temporary">Temporary</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ns-start">Start Date</Label>
          <Input id="ns-start" type="date" value={form.startDate} onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))} />
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? "Creating…" : "Create Staff Member"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}

function StaffPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [deptId, setDeptId] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  const { data, isLoading } = useQuery(
    orpc.staff.list.queryOptions({ input: { limit: 200, offset: 0 } })
  );
  const { data: departments } = useQuery(orpc.staff.getDepartments.queryOptions());

  const filtered = data?.filter((s) => {
    if (status && s.status !== status) return false;
    if (deptId && s.departmentId !== deptId) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        s.user?.name?.toLowerCase().includes(q) ||
        s.jobTitle?.toLowerCase().includes(q) ||
        s.employeeId?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <>
      <Header fixed>
        <div className="flex items-center gap-2">
          <Users className="size-4 text-muted-foreground" />
          <span className="text-sm font-medium">Staff Directory</span>
        </div>
        <div className="ms-auto flex items-center gap-2">
          <Button size="sm" onClick={() => setShowCreate(true)}>
            <Plus className="size-4 mr-1.5" /> New Staff
          </Button>
          <ThemeSwitch />
        </div>
      </Header>

      <Main>
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">Staff Directory</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {data?.length ?? "—"} staff members
          </p>
        </div>

        {/* Search + Status Filter */}
        <div className="mb-3 flex flex-wrap gap-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, title, ID..."
              className="pl-8 w-64"
            />
          </div>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-xl border bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        {/* Department filter pills */}
        <div className="mb-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setDeptId("")}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
              deptId === ""
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background text-muted-foreground hover:border-primary hover:text-foreground"
            }`}
          >
            All
          </button>
          {departments?.map((d) => (
            <button
              key={d.id}
              type="button"
              onClick={() => setDeptId(d.id === deptId ? "" : d.id)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                deptId === d.id
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background text-muted-foreground hover:border-primary hover:text-foreground"
              }`}
            >
              {d.name}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Employee ID</TableHead>
                <TableHead>Job Title</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>On-Call Eligible</TableHead>
                <TableHead className="w-16" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 8 }).map((_, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : !filtered?.length ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-12 text-center text-muted-foreground">
                    {search ? "No staff matching your search." : "No staff found."}
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell>
                      <Link
                        to="/staff/$staffId"
                        params={{ staffId: s.id }}
                        className="font-medium hover:underline"
                      >
                        {s.user?.name ?? "—"}
                      </Link>
                      {s.isTeamLead && (
                        <span className="ml-2 text-xs text-amber-600 dark:text-amber-400">Lead</span>
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-muted-foreground text-xs">
                      {s.employeeId}
                    </TableCell>
                    <TableCell>{s.jobTitle}</TableCell>
                    <TableCell>{s.department?.name ?? "—"}</TableCell>
                    <TableCell className="capitalize">
                      {s.employmentType?.replace("_", " ")}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center rounded-lg px-2 py-0.5 text-xs font-medium ${
                          STATUS_COLORS[s.status] ?? "bg-muted text-muted-foreground"
                        }`}
                      >
                        {s.status?.replace("_", " ")}
                      </span>
                    </TableCell>
                    <TableCell>
                      {s.isOnCallEligible ? (
                        <span className="text-green-600 text-xs">Yes</span>
                      ) : (
                        <span className="text-muted-foreground text-xs">No</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        title="View profile"
                        onClick={() =>
                          navigate({ to: "/staff/$staffId", params: { staffId: s.id } })
                        }
                      >
                        <Eye className="size-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Main>
      <Dialog open={showCreate} onOpenChange={(o) => !o && setShowCreate(false)}>
        <NewStaffDialog onClose={() => setShowCreate(false)} />
      </Dialog>
    </>
  );
}
