import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { useState } from "react";
import { Clock3, Plus } from "lucide-react";
import { toast } from "sonner";

import { Header } from "@/components/layout/header";
import { Main } from "@/components/layout/main";
import { ThemeSwitch } from "@/components/theme-switch";
import { orpc } from "@/utils/orpc";
import { Button } from "@ndma-dcs-staff-portal/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@ndma-dcs-staff-portal/ui/components/dialog";
import { Input } from "@ndma-dcs-staff-portal/ui/components/input";
import { Label } from "@ndma-dcs-staff-portal/ui/components/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@ndma-dcs-staff-portal/ui/components/select";
import { Skeleton } from "@ndma-dcs-staff-portal/ui/components/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@ndma-dcs-staff-portal/ui/components/table";
import { Textarea } from "@ndma-dcs-staff-portal/ui/components/textarea";

export const Route = createFileRoute("/_authenticated/hr/attendance")({
  component: AttendanceExceptionsPage,
});

function CreateAttendanceDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const queryClient = useQueryClient();
  const { data: staff } = useQuery(orpc.staff.list.queryOptions({ input: { limit: 200, offset: 0 } }));
  const [form, setForm] = useState({
    staffProfileId: "",
    exceptionDate: "",
    exceptionType: "reported_sick" as "reported_sick" | "medical" | "lateness" | "early_leave" | "wfh" | "absent" | "other",
    hours: "",
    reason: "",
    notes: "",
  });

  const mutation = useMutation(
    orpc.attendance.create.mutationOptions({
      onSuccess: async () => {
        toast.success("Attendance exception created");
        await queryClient.invalidateQueries({ queryKey: orpc.attendance.list.key() });
        onOpenChange(false);
        setForm({ staffProfileId: "", exceptionDate: "", exceptionType: "reported_sick", hours: "", reason: "", notes: "" });
      },
      onError: (error: Error) => toast.error(error.message ?? "Failed to create attendance exception"),
    }),
  );

  function submit() {
    if (!form.staffProfileId || !form.exceptionDate || !form.reason) {
      toast.error("Staff, date, and reason are required.");
      return;
    }
    mutation.mutate({
      staffProfileId: form.staffProfileId,
      exceptionDate: form.exceptionDate,
      exceptionType: form.exceptionType,
      hours: form.hours || undefined,
      reason: form.reason,
      notes: form.notes || undefined,
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New Attendance Exception</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Staff</Label>
            <Select value={form.staffProfileId} onValueChange={(value) => setForm((current) => ({ ...current, staffProfileId: value ?? "" }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select staff member" />
              </SelectTrigger>
              <SelectContent>
                {staff?.map((person) => (
                  <SelectItem key={person.id} value={person.id}>
                    {person.user?.name ?? person.id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="attendance-date">Date</Label>
              <Input id="attendance-date" type="date" value={form.exceptionDate} onChange={(e) => setForm((current) => ({ ...current, exceptionDate: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={form.exceptionType} onValueChange={(value) => setForm((current) => ({ ...current, exceptionType: value as typeof form.exceptionType }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="reported_sick">Reported Sick</SelectItem>
                  <SelectItem value="medical">Medical</SelectItem>
                  <SelectItem value="lateness">Lateness</SelectItem>
                  <SelectItem value="early_leave">Early Leave</SelectItem>
                  <SelectItem value="wfh">WFH</SelectItem>
                  <SelectItem value="absent">Absent</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="attendance-hours">Hours</Label>
            <Input id="attendance-hours" value={form.hours} onChange={(e) => setForm((current) => ({ ...current, hours: e.target.value }))} placeholder="e.g. 4" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="attendance-reason">Reason</Label>
            <Input id="attendance-reason" value={form.reason} onChange={(e) => setForm((current) => ({ ...current, reason: e.target.value }))} placeholder="Enter reason" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="attendance-notes">Notes</Label>
            <Textarea id="attendance-notes" value={form.notes} onChange={(e) => setForm((current) => ({ ...current, notes: e.target.value }))} placeholder="Optional notes" />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={mutation.isPending}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={mutation.isPending}>
            {mutation.isPending ? "Saving..." : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AttendanceExceptionsPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const { data, isLoading } = useQuery(orpc.attendance.list.queryOptions({ input: {} }));

  return (
    <>
      <Header fixed>
        <div className="flex items-center gap-2">
          <Clock3 className="size-4 text-muted-foreground" />
          <span className="text-sm font-medium">Attendance Exceptions</span>
        </div>
        <div className="ms-auto flex items-center gap-2">
          <ThemeSwitch />
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 size-4" />
            New Exception
          </Button>
        </div>
      </Header>

      <Main>
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">Attendance Exceptions</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Sick days, lateness, WFH, and other attendance exceptions recorded for staff.
          </p>
        </div>

        <div className="rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Staff</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Hours</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Reason</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, rowIdx) => (
                  <TableRow key={rowIdx}>
                    {Array.from({ length: 6 }).map((_, cellIdx) => (
                      <TableCell key={cellIdx}>
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : !data?.length ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                    No attendance exceptions found.
                  </TableCell>
                </TableRow>
              ) : (
                data.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">{row.staffProfile?.user?.name ?? "—"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {row.exceptionDate ? format(parseISO(row.exceptionDate), "dd MMM yyyy") : "—"}
                    </TableCell>
                    <TableCell className="capitalize">{row.exceptionType}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{row.hours ?? "—"}</TableCell>
                    <TableCell className="capitalize">{row.status}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{row.reason}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Main>

      <CreateAttendanceDialog open={createOpen} onOpenChange={setCreateOpen} />
    </>
  );
}
