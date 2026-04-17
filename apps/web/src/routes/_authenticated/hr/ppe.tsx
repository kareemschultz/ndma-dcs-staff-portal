import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format, isPast, parseISO } from "date-fns";
import { useState } from "react";
import { HardHat, Plus } from "lucide-react";
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

export const Route = createFileRoute("/_authenticated/hr/ppe")({
  component: PPEOpsPage,
});

function CreatePpeDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const queryClient = useQueryClient();
  const { data: staff } = useQuery(orpc.staff.list.queryOptions({ input: { limit: 200, offset: 0 } }));
  const { data: catalog } = useQuery(orpc.ppe.catalog.list.queryOptions());
  const [form, setForm] = useState({
    staffProfileId: "",
    ppeItemId: "",
    issuedDate: "",
    dueDate: "",
    serialNumber: "",
    size: "",
    condition: "good",
    notes: "",
  });

  const mutation = useMutation(
    orpc.ppe.issuances.create.mutationOptions({
      onSuccess: async () => {
        toast.success("PPE issuance created");
        await queryClient.invalidateQueries({ queryKey: orpc.ppe.issuances.list.key() });
        onOpenChange(false);
        setForm({ staffProfileId: "", ppeItemId: "", issuedDate: "", dueDate: "", serialNumber: "", size: "", condition: "good", notes: "" });
      },
      onError: (error: Error) => toast.error(error.message ?? "Failed to create PPE issuance"),
    }),
  );

  function submit() {
    if (!form.staffProfileId || !form.ppeItemId || !form.issuedDate) {
      toast.error("Staff, item, and issue date are required.");
      return;
    }
    mutation.mutate({
      staffProfileId: form.staffProfileId,
      ppeItemId: form.ppeItemId,
      issuedDate: form.issuedDate,
      dueDate: form.dueDate || undefined,
      serialNumber: form.serialNumber || undefined,
      size: form.size || undefined,
      condition: form.condition || undefined,
      notes: form.notes || undefined,
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Issue PPE</DialogTitle>
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
            <Label>PPE Item</Label>
            <Select value={form.ppeItemId} onValueChange={(value) => setForm((current) => ({ ...current, ppeItemId: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select PPE item" />
              </SelectTrigger>
              <SelectContent>
                {catalog?.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.name} {item.category ? `(${item.category})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="ppe-issued">Issued Date</Label>
              <Input id="ppe-issued" type="date" value={form.issuedDate} onChange={(e) => setForm((current) => ({ ...current, issuedDate: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ppe-due">Due Date</Label>
              <Input id="ppe-due" type="date" value={form.dueDate} onChange={(e) => setForm((current) => ({ ...current, dueDate: e.target.value }))} />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="ppe-serial">Serial Number</Label>
              <Input id="ppe-serial" value={form.serialNumber} onChange={(e) => setForm((current) => ({ ...current, serialNumber: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ppe-size">Size</Label>
              <Input id="ppe-size" value={form.size} onChange={(e) => setForm((current) => ({ ...current, size: e.target.value }))} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Condition</Label>
            <Select value={form.condition} onValueChange={(value) => setForm((current) => ({ ...current, condition: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="good">Good</SelectItem>
                <SelectItem value="fair">Fair</SelectItem>
                <SelectItem value="damaged">Damaged</SelectItem>
                <SelectItem value="replaced">Replaced</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ppe-notes">Notes</Label>
            <Textarea id="ppe-notes" value={form.notes} onChange={(e) => setForm((current) => ({ ...current, notes: e.target.value }))} placeholder="Optional notes" />
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

function PPEOpsPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const { data, isLoading } = useQuery(orpc.ppe.issuances.list.queryOptions({ input: {} }));

  return (
    <>
      <Header fixed>
        <div className="flex items-center gap-2">
          <HardHat className="size-4 text-muted-foreground" />
          <span className="text-sm font-medium">PPE & Tools</span>
        </div>
        <div className="ms-auto flex items-center gap-2">
          <ThemeSwitch />
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 size-4" />
            Issue PPE
          </Button>
        </div>
      </Header>

      <Main>
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">PPE & Tools</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Track equipment issuance, due dates, and replacement needs.
          </p>
        </div>

        <div className="mb-4 flex flex-wrap gap-4 text-sm">
          <span className="text-muted-foreground">
            <strong className="text-foreground">{data?.length ?? 0}</strong> issuance records
          </span>
          <span className="text-red-600">
            <strong>
              {data?.filter((row) => row.dueDate && isPast(parseISO(row.dueDate))).length ?? 0}
            </strong>{" "}
            overdue
          </span>
        </div>

        <div className="rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Staff</TableHead>
                <TableHead>Item</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Issued</TableHead>
                <TableHead>Due</TableHead>
                <TableHead>Status</TableHead>
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
                    No PPE issuance records found.
                  </TableCell>
                </TableRow>
              ) : (
                data.map((row) => {
                  const overdue = row.dueDate && isPast(parseISO(row.dueDate));
                  return (
                    <TableRow key={row.id}>
                      <TableCell className="font-medium">{row.staffProfile?.user?.name ?? "—"}</TableCell>
                      <TableCell>{row.ppeItem?.name ?? row.ppeItemId}</TableCell>
                      <TableCell className="text-muted-foreground">{row.ppeItem?.category ?? "—"}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {row.issuedDate ? format(parseISO(row.issuedDate), "dd MMM yyyy") : "—"}
                      </TableCell>
                      <TableCell className={overdue ? "text-red-600" : "text-muted-foreground"}>
                        {row.dueDate ? format(parseISO(row.dueDate), "dd MMM yyyy") : "—"}
                      </TableCell>
                      <TableCell className="text-sm capitalize">{row.status}</TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </Main>

      <CreatePpeDialog open={createOpen} onOpenChange={setCreateOpen} />
    </>
  );
}
