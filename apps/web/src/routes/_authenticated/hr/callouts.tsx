import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { useState } from "react";
import { PhoneCall, Plus } from "lucide-react";
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
import { Textarea } from "@ndma-dcs-staff-portal/ui/components/textarea";

export const Route = createFileRoute("/_authenticated/hr/callouts")({
  component: CalloutsPage,
});

function CreateCalloutDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const queryClient = useQueryClient();
  const { data: staff } = useQuery(orpc.staff.list.queryOptions({ input: { limit: 200, offset: 0 } }));
  const [form, setForm] = useState({
    staffProfileId: "",
    relatedIncidentId: "",
    calloutAt: "",
    calloutType: "manual" as "phone" | "sms" | "whatsapp" | "email" | "manual",
    reason: "",
    outcome: "",
  });

  const mutation = useMutation(
    orpc.callouts.create.mutationOptions({
      onSuccess: async () => {
        toast.success("Callout logged");
        await queryClient.invalidateQueries({ queryKey: orpc.callouts.list.key() });
        onOpenChange(false);
        setForm({ staffProfileId: "", relatedIncidentId: "", calloutAt: "", calloutType: "manual", reason: "", outcome: "" });
      },
      onError: (error: Error) => toast.error(error.message ?? "Failed to log callout"),
    }),
  );

  function submit() {
    if (!form.staffProfileId || !form.calloutAt || !form.reason) {
      toast.error("Staff, callout time, and reason are required.");
      return;
    }
    mutation.mutate({
      staffProfileId: form.staffProfileId,
      relatedIncidentId: form.relatedIncidentId || undefined,
      calloutAt: form.calloutAt,
      calloutType: form.calloutType,
      reason: form.reason,
      outcome: form.outcome || undefined,
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New Callout</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Staff</Label>
            <Select value={form.staffProfileId} onValueChange={(value) => setForm((current) => ({ ...current, staffProfileId: value }))}>
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
            <Label htmlFor="callout-incident">Related Incident ID</Label>
            <Input id="callout-incident" value={form.relatedIncidentId} onChange={(e) => setForm((current) => ({ ...current, relatedIncidentId: e.target.value }))} placeholder="Optional incident id" />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="callout-at">Callout Time</Label>
              <Input id="callout-at" type="datetime-local" value={form.calloutAt} onChange={(e) => setForm((current) => ({ ...current, calloutAt: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={form.calloutType} onValueChange={(value) => setForm((current) => ({ ...current, calloutType: value as typeof form.calloutType }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="phone">Phone</SelectItem>
                  <SelectItem value="sms">SMS</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="manual">Manual</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="callout-reason">Reason</Label>
            <Input id="callout-reason" value={form.reason} onChange={(e) => setForm((current) => ({ ...current, reason: e.target.value }))} placeholder="Enter reason" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="callout-outcome">Outcome</Label>
            <Textarea id="callout-outcome" value={form.outcome} onChange={(e) => setForm((current) => ({ ...current, outcome: e.target.value }))} placeholder="Optional outcome" />
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

function CalloutsPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const { data, isLoading } = useQuery(orpc.callouts.list.queryOptions({ input: {} }));

  return (
    <>
      <Header fixed>
        <div className="flex items-center gap-2">
          <PhoneCall className="size-4 text-muted-foreground" />
          <span className="text-sm font-medium">Callouts</span>
        </div>
        <div className="ms-auto flex items-center gap-2">
          <ThemeSwitch />
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 size-4" />
            New Callout
          </Button>
        </div>
      </Header>

      <Main>
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">Callouts</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Emergency and after-hours callout records linked to staff and incidents.
          </p>
        </div>

        <div className="rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Staff</TableHead>
                <TableHead>Incident</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Callout At</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Outcome</TableHead>
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
                    No callout records found.
                  </TableCell>
                </TableRow>
              ) : (
                data.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">{row.staffProfile?.user?.name ?? "—"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {row.relatedIncident?.title ?? row.relatedIncidentId ?? "—"}
                    </TableCell>
                    <TableCell className="capitalize">{row.calloutType}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {row.calloutAt ? format(parseISO(row.calloutAt), "dd MMM yyyy HH:mm") : "—"}
                    </TableCell>
                    <TableCell className="capitalize">{row.status}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{row.outcome ?? "—"}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Main>

      <CreateCalloutDialog open={createOpen} onOpenChange={setCreateOpen} />
    </>
  );
}
