import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { ClipboardCheck, AlertCircle, Plus, Pencil } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@ndma-dcs-staff-portal/ui/components/skeleton";
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
import { Button } from "@ndma-dcs-staff-portal/ui/components/button";
import { Input } from "@ndma-dcs-staff-portal/ui/components/input";
import { Label } from "@ndma-dcs-staff-portal/ui/components/label";
import { Textarea } from "@ndma-dcs-staff-portal/ui/components/textarea";
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

type AppraisalRecord = {
  id: string;
  staffProfileId: string;
  reviewerId: string | null;
  periodStart: string;
  periodEnd: string;
  scheduledDate: string | null;
  status: string;
  overallRating: number | null;
  summary: string | null;
  staffProfile?: {
    user?: { name?: string | null } | null;
    department?: { name: string } | null;
  } | null;
  reviewer?: { user?: { name?: string | null } | null } | null;
};

function StarRating({ rating }: { rating: number | null }) {
  if (!rating) return <span className="text-muted-foreground">—</span>;
  return (
    <span className="text-amber-500 text-sm">
      {"★".repeat(rating)}{"☆".repeat(5 - rating)}
    </span>
  );
}

type CreateForm = {
  staffProfileId: string;
  reviewerId: string;
  periodStart: string;
  periodEnd: string;
  scheduledDate: string;
  summary: string;
};

function CreateAppraisalDialog({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();

  const { data: staffData } = useQuery(
    orpc.staff.list.queryOptions({ input: { limit: 200, offset: 0 } })
  );

  const [form, setForm] = useState<CreateForm>({
    staffProfileId: "",
    reviewerId: "",
    periodStart: "",
    periodEnd: "",
    scheduledDate: "",
    summary: "",
  });

  const mutation = useMutation(orpc.appraisals.create.mutationOptions());

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.staffProfileId || !form.periodStart || !form.periodEnd) {
      toast.error("Staff member, period start and period end are required.");
      return;
    }
    try {
      await mutation.mutateAsync({
        staffProfileId: form.staffProfileId,
        reviewerId: form.reviewerId || undefined,
        periodStart: form.periodStart,
        periodEnd: form.periodEnd,
        scheduledDate: form.scheduledDate || undefined,
      });
      toast.success("Appraisal scheduled successfully.");
      await queryClient.invalidateQueries({ queryKey: orpc.appraisals.list.key() });
      onClose();
    } catch {
      toast.error("Failed to create appraisal. Check your permissions and try again.");
    }
  }

  return (
    <DialogContent className="sm:max-w-lg">
      <DialogHeader>
        <DialogTitle>Schedule Appraisal</DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4 py-2">
        <div className="space-y-1.5">
          <Label htmlFor="create-staff">Staff Member</Label>
          <Select
            value={form.staffProfileId}
            onValueChange={(v) => setForm((f) => ({ ...f, staffProfileId: v ?? "" }))}
          >
            <SelectTrigger id="create-staff">
              <SelectValue placeholder="Select staff member…" />
            </SelectTrigger>
            <SelectContent>
              {staffData?.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.user?.name ?? s.id}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="create-reviewer">Reviewer (optional)</Label>
          <Select
            value={form.reviewerId}
            onValueChange={(v) => setForm((f) => ({ ...f, reviewerId: v ?? "" }))}
          >
            <SelectTrigger id="create-reviewer">
              <SelectValue placeholder="Select reviewer…" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">None</SelectItem>
              {staffData?.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.user?.name ?? s.id}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="create-period-start">Period Start</Label>
            <Input
              id="create-period-start"
              type="date"
              value={form.periodStart}
              onChange={(e) => setForm((f) => ({ ...f, periodStart: e.target.value }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="create-period-end">Period End</Label>
            <Input
              id="create-period-end"
              type="date"
              value={form.periodEnd}
              onChange={(e) => setForm((f) => ({ ...f, periodEnd: e.target.value }))}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="create-scheduled">Scheduled Date (optional)</Label>
          <Input
            id="create-scheduled"
            type="date"
            value={form.scheduledDate}
            onChange={(e) => setForm((f) => ({ ...f, scheduledDate: e.target.value }))}
          />
        </div>

        <DialogFooter className="pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? "Scheduling…" : "Schedule Appraisal"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}

type EditForm = {
  reviewerId: string;
  scheduledDate: string;
  completedDate: string;
  status: AppraisalStatus;
  overallRating: string;
  summary: string;
};

function EditAppraisalDialog({
  appraisal,
  onClose,
}: {
  appraisal: AppraisalRecord;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();

  const { data: staffData } = useQuery(
    orpc.staff.list.queryOptions({ input: { limit: 200, offset: 0 } })
  );

  const [form, setForm] = useState<EditForm>({
    reviewerId: appraisal.reviewerId ?? "",
    scheduledDate: appraisal.scheduledDate ?? "",
    completedDate: "",
    status: (appraisal.status as AppraisalStatus) || "scheduled",
    overallRating: appraisal.overallRating?.toString() ?? "",
    summary: appraisal.summary ?? "",
  });

  const mutation = useMutation(orpc.appraisals.update.mutationOptions());

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const ratingNum = form.overallRating ? parseInt(form.overallRating, 10) : undefined;
    if (ratingNum !== undefined && (ratingNum < 1 || ratingNum > 5)) {
      toast.error("Rating must be between 1 and 5.");
      return;
    }
    try {
      await mutation.mutateAsync({
        id: appraisal.id,
        reviewerId: form.reviewerId || undefined,
        scheduledDate: form.scheduledDate || undefined,
        completedDate: form.completedDate || undefined,
        status: form.status,
        overallRating: ratingNum,
        summary: form.summary || undefined,
      });
      toast.success("Appraisal updated successfully.");
      await queryClient.invalidateQueries({ queryKey: orpc.appraisals.list.key() });
      onClose();
    } catch {
      toast.error("Failed to update appraisal. Check your permissions and try again.");
    }
  }

  return (
    <DialogContent className="sm:max-w-lg">
      <DialogHeader>
        <DialogTitle>Edit Appraisal</DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4 py-2">
        <div className="space-y-1.5">
          <Label>Staff Member</Label>
          <Input
            value={appraisal.staffProfile?.user?.name ?? appraisal.staffProfileId}
            disabled
            className="bg-muted"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="edit-reviewer">Reviewer (optional)</Label>
          <Select
            value={form.reviewerId}
            onValueChange={(v) => setForm((f) => ({ ...f, reviewerId: v ?? "" }))}
          >
            <SelectTrigger id="edit-reviewer">
              <SelectValue placeholder="Select reviewer…" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">None</SelectItem>
              {staffData?.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.user?.name ?? s.id}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="edit-scheduled">Scheduled Date</Label>
            <Input
              id="edit-scheduled"
              type="date"
              value={form.scheduledDate}
              onChange={(e) => setForm((f) => ({ ...f, scheduledDate: e.target.value }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-completed">Completed Date</Label>
            <Input
              id="edit-completed"
              type="date"
              value={form.completedDate}
              onChange={(e) => setForm((f) => ({ ...f, completedDate: e.target.value }))}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="edit-status">Status</Label>
            <Select
              value={form.status}
              onValueChange={(v) => setForm((f) => ({ ...f, status: (v ?? "scheduled") as AppraisalStatus }))}
            >
              <SelectTrigger id="edit-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-rating">Overall Rating (1–5)</Label>
            <Input
              id="edit-rating"
              type="number"
              min={1}
              max={5}
              placeholder="e.g. 4"
              value={form.overallRating}
              onChange={(e) => setForm((f) => ({ ...f, overallRating: e.target.value }))}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="edit-summary">Summary / Notes (optional)</Label>
          <Textarea
            id="edit-summary"
            placeholder="Overall appraisal notes…"
            rows={3}
            value={form.summary}
            onChange={(e) => setForm((f) => ({ ...f, summary: e.target.value }))}
          />
        </div>

        <DialogFooter className="pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? "Saving…" : "Save Changes"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}

function AppraisalsPage() {
  const [status, setStatus] = useState<AppraisalStatus | "">("");
  const [showCreate, setShowCreate] = useState(false);
  const [editingAppraisal, setEditingAppraisal] = useState<AppraisalRecord | null>(null);

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
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Performance Appraisals</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Schedule, track, and complete staff performance reviews.
            </p>
          </div>
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="size-4 mr-2" />
            Schedule Appraisal
          </Button>
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
                <TableHead className="w-16" />
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
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        onClick={() => setEditingAppraisal(appraisal as AppraisalRecord)}
                        title="Edit appraisal"
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Main>

      <Dialog open={showCreate} onOpenChange={(open) => !open && setShowCreate(false)}>
        <CreateAppraisalDialog onClose={() => setShowCreate(false)} />
      </Dialog>

      <Dialog
        open={!!editingAppraisal}
        onOpenChange={(open) => !open && setEditingAppraisal(null)}
      >
        {editingAppraisal && (
          <EditAppraisalDialog
            appraisal={editingAppraisal}
            onClose={() => setEditingAppraisal(null)}
          />
        )}
      </Dialog>
    </>
  );
}
