import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { FileText, AlertCircle, Plus, Pencil } from "lucide-react";
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

export const Route = createFileRoute("/_authenticated/contracts/")({
  component: ContractsPage,
});

type ContractStatus = "active" | "expiring_soon" | "expired" | "renewed" | "terminated";

const STATUS_COLORS: Record<ContractStatus, string> = {
  active: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  expiring_soon: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  expired: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  renewed: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  terminated: "bg-muted text-muted-foreground",
};

type ContractRecord = {
  id: string;
  staffProfileId: string;
  contractType: string;
  startDate: string;
  endDate: string | null;
  status: string;
  staffProfile?: { user?: { name?: string | null } | null } | null;
};

type CreateForm = {
  staffProfileId: string;
  contractType: string;
  startDate: string;
  endDate: string;
};

type EditForm = {
  contractType: string;
  startDate: string;
  endDate: string;
  status: ContractStatus;
};

function CreateContractDialog({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();

  const { data: staffData } = useQuery(
    orpc.staff.list.queryOptions({ input: { limit: 200, offset: 0 } })
  );

  const [form, setForm] = useState<CreateForm>({
    staffProfileId: "",
    contractType: "",
    startDate: "",
    endDate: "",
  });

  const mutation = useMutation(orpc.contracts.create.mutationOptions());

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.staffProfileId || !form.contractType || !form.startDate) {
      toast.error("Staff member, contract type and start date are required.");
      return;
    }
    try {
      await mutation.mutateAsync({
        staffProfileId: form.staffProfileId,
        contractType: form.contractType,
        startDate: form.startDate,
        endDate: form.endDate || undefined,
      });
      toast.success("Contract created successfully.");
      await queryClient.invalidateQueries({ queryKey: orpc.contracts.list.key() });
      onClose();
    } catch {
      toast.error("Failed to create contract. Check your permissions and try again.");
    }
  }

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Create Contract</DialogTitle>
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
          <Label htmlFor="create-type">Contract Type</Label>
          <Input
            id="create-type"
            placeholder="e.g. Full-time, Fixed-term, Contractor"
            value={form.contractType}
            onChange={(e) => setForm((f) => ({ ...f, contractType: e.target.value }))}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="create-start">Start Date</Label>
            <Input
              id="create-start"
              type="date"
              value={form.startDate}
              onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="create-end">End Date (optional)</Label>
            <Input
              id="create-end"
              type="date"
              value={form.endDate}
              onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
            />
          </div>
        </div>

        <DialogFooter className="pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? "Creating…" : "Create Contract"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}

function EditContractDialog({
  contract,
  onClose,
}: {
  contract: ContractRecord;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();

  const [form, setForm] = useState<EditForm>({
    contractType: contract.contractType,
    startDate: contract.startDate,
    endDate: contract.endDate ?? "",
    status: (contract.status as ContractStatus) || "active",
  });

  const mutation = useMutation(orpc.contracts.update.mutationOptions());

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await mutation.mutateAsync({
        id: contract.id,
        contractType: form.contractType || undefined,
        startDate: form.startDate || undefined,
        endDate: form.endDate || undefined,
        status: form.status,
      });
      toast.success("Contract updated successfully.");
      await queryClient.invalidateQueries({ queryKey: orpc.contracts.list.key() });
      onClose();
    } catch {
      toast.error("Failed to update contract. Check your permissions and try again.");
    }
  }

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Edit Contract</DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4 py-2">
        <div className="space-y-1.5">
          <Label>Staff Member</Label>
          <Input
            value={contract.staffProfile?.user?.name ?? contract.staffProfileId}
            disabled
            className="bg-muted"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="edit-type">Contract Type</Label>
          <Input
            id="edit-type"
            placeholder="e.g. Full-time, Fixed-term, Contractor"
            value={form.contractType}
            onChange={(e) => setForm((f) => ({ ...f, contractType: e.target.value }))}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="edit-start">Start Date</Label>
            <Input
              id="edit-start"
              type="date"
              value={form.startDate}
              onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-end">End Date (optional)</Label>
            <Input
              id="edit-end"
              type="date"
              value={form.endDate}
              onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="edit-status">Status</Label>
          <Select
            value={form.status}
            onValueChange={(v) => setForm((f) => ({ ...f, status: (v ?? "active") as ContractStatus }))}
          >
            <SelectTrigger id="edit-status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="expiring_soon">Expiring Soon</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
              <SelectItem value="renewed">Renewed</SelectItem>
              <SelectItem value="terminated">Terminated</SelectItem>
            </SelectContent>
          </Select>
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

function ContractsPage() {
  const [status, setStatus] = useState<ContractStatus | "">("");
  const [showCreate, setShowCreate] = useState(false);
  const [editingContract, setEditingContract] = useState<ContractRecord | null>(null);

  const { data, isLoading } = useQuery(
    orpc.contracts.list.queryOptions({
      input: { status: status || undefined, limit: 100, offset: 0 },
    })
  );

  const { data: expiring } = useQuery(
    orpc.contracts.getExpiringSoon.queryOptions({ input: { withinDays: 60 } })
  );

  return (
    <>
      <Header fixed>
        <div className="flex items-center gap-2">
          <FileText className="size-4 text-muted-foreground" />
          <span className="text-sm font-medium">Contracts</span>
        </div>
        <div className="ms-auto flex items-center gap-2">
          <ThemeSwitch />
        </div>
      </Header>

      <Main>
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Staff Contracts</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Employment contract register with renewal tracking.
            </p>
          </div>
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="size-4 mr-2" />
            Create Contract
          </Button>
        </div>

        {expiring && expiring.length > 0 && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-900/20 p-3 text-sm text-amber-700 dark:text-amber-300">
            <AlertCircle className="size-4 shrink-0" />
            <strong>{expiring.length}</strong> contract{expiring.length > 1 ? "s" : ""} expiring
            within 60 days — renewal action required.
          </div>
        )}

        <div className="mb-4 flex flex-wrap gap-3">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as ContractStatus | "")}
            className="rounded-xl border bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="expiring_soon">Expiring Soon</option>
            <option value="expired">Expired</option>
            <option value="renewed">Renewed</option>
            <option value="terminated">Terminated</option>
          </select>
        </div>

        <div className="rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Staff Member</TableHead>
                <TableHead>Contract Type</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-16" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : !data?.length ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                    No contracts found.
                  </TableCell>
                </TableRow>
              ) : (
                data.map((contract) => (
                  <TableRow key={contract.id}>
                    <TableCell className="font-medium">
                      {contract.staffProfile?.user?.name ?? "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {contract.contractType}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {contract.startDate
                        ? format(parseISO(contract.startDate), "dd MMM yyyy")
                        : "—"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {contract.endDate
                        ? format(parseISO(contract.endDate), "dd MMM yyyy")
                        : "Open-ended"}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center rounded-lg px-2 py-0.5 text-xs font-medium ${
                          STATUS_COLORS[contract.status as ContractStatus] ?? ""
                        }`}
                      >
                        {contract.status.replace("_", " ")}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        onClick={() => setEditingContract(contract as ContractRecord)}
                        title="Edit contract"
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
        <CreateContractDialog onClose={() => setShowCreate(false)} />
      </Dialog>

      <Dialog
        open={!!editingContract}
        onOpenChange={(open) => !open && setEditingContract(null)}
      >
        {editingContract && (
          <EditContractDialog
            contract={editingContract}
            onClose={() => setEditingContract(null)}
          />
        )}
      </Dialog>
    </>
  );
}
