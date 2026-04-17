import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { useState } from "react";
import { ListChecks, Plus } from "lucide-react";
import { toast } from "sonner";

import { Header } from "@/components/layout/header";
import { Main } from "@/components/layout/main";
import { ThemeSwitch } from "@/components/theme-switch";
import { orpc } from "@/utils/orpc";
import { Button } from "@ndma-dcs-staff-portal/ui/components/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@ndma-dcs-staff-portal/ui/components/dialog";
import { Input } from "@ndma-dcs-staff-portal/ui/components/input";
import { Label } from "@ndma-dcs-staff-portal/ui/components/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@ndma-dcs-staff-portal/ui/components/select";
import { Skeleton } from "@ndma-dcs-staff-portal/ui/components/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@ndma-dcs-staff-portal/ui/components/table";

export const Route = createFileRoute("/_authenticated/timesheets/")({
  component: TimesheetsPage,
});

function CreateTimesheetDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const queryClient = useQueryClient();
  const { data: staff } = useQuery(orpc.staff.list.queryOptions({ input: { limit: 200, offset: 0 } }));
  const [form, setForm] = useState({
    staffProfileId: "",
    title: "",
    periodStart: "",
    periodEnd: "",
  });

  const mutation = useMutation(
    orpc.timesheets.create.mutationOptions({
      onSuccess: async () => {
        toast.success("Timesheet created");
        await queryClient.invalidateQueries({ queryKey: orpc.timesheets.list.key() });
        onOpenChange(false);
        setForm({ staffProfileId: "", title: "", periodStart: "", periodEnd: "" });
      },
      onError: (error: Error) => toast.error(error.message ?? "Failed to create timesheet"),
    }),
  );

  function submit() {
    if (!form.staffProfileId || !form.title || !form.periodStart || !form.periodEnd) {
      toast.error("Staff, title, start date, and end date are required.");
      return;
    }
    mutation.mutate({
      staffProfileId: form.staffProfileId,
      title: form.title,
      periodStart: form.periodStart,
      periodEnd: form.periodEnd,
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New Timesheet</DialogTitle>
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

          <div className="space-y-1.5">
            <Label htmlFor="timesheet-title">Title</Label>
            <Input id="timesheet-title" value={form.title} onChange={(e) => setForm((current) => ({ ...current, title: e.target.value }))} placeholder="e.g. April Operations" />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="timesheet-start">Period Start</Label>
              <Input id="timesheet-start" type="date" value={form.periodStart} onChange={(e) => setForm((current) => ({ ...current, periodStart: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="timesheet-end">Period End</Label>
              <Input id="timesheet-end" type="date" value={form.periodEnd} onChange={(e) => setForm((current) => ({ ...current, periodEnd: e.target.value }))} />
            </div>
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

function TimesheetsPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const { data, isLoading } = useQuery(orpc.timesheets.list.queryOptions({ input: {} }));

  return (
    <>
      <Header fixed>
        <div className="flex items-center gap-2">
          <ListChecks className="size-4 text-muted-foreground" />
          <span className="text-sm font-medium">Timesheets</span>
        </div>
        <div className="ms-auto flex items-center gap-2">
          <ThemeSwitch />
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 size-4" />
            New Timesheet
          </Button>
        </div>
      </Header>

      <Main>
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">Timesheets</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Track period submissions, entries, and approvals for operational work.
          </p>
        </div>

        <div className="rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Staff</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Hours</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Entries</TableHead>
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
                    No timesheets found.
                  </TableCell>
                </TableRow>
              ) : (
                data.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">{row.staffProfile?.user?.name ?? "—"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {row.periodStart ? format(parseISO(row.periodStart), "dd MMM") : "—"}
                      {" – "}
                      {row.periodEnd ? format(parseISO(row.periodEnd), "dd MMM yyyy") : "—"}
                    </TableCell>
                    <TableCell>{row.title}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{row.totalHours}</TableCell>
                    <TableCell className="capitalize">{row.status}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{row.entries?.length ?? 0}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Main>

      <CreateTimesheetDialog open={createOpen} onOpenChange={setCreateOpen} />
    </>
  );
}
