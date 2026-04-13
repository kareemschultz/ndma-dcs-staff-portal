import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, ClipboardCheck } from "lucide-react";
import { Button } from "@ndma-dcs-staff-portal/ui/components/button";
import { Input } from "@ndma-dcs-staff-portal/ui/components/input";
import { Textarea } from "@ndma-dcs-staff-portal/ui/components/textarea";
import { Label } from "@ndma-dcs-staff-portal/ui/components/label";
import { Header } from "@/components/layout/header";
import { Main } from "@/components/layout/main";
import { orpc, queryClient } from "@/utils/orpc";

export const Route = createFileRoute("/_authenticated/work/new")({
  component: NewWorkItemPage,
});

const schema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().optional(),
  type: z.enum(["routine", "project", "external_request", "ad_hoc"]),
  priority: z.enum(["low", "medium", "high", "critical"]),
  assignedToId: z.string().optional(),
  departmentId: z.string().optional(),
  requesterName: z.string().optional(),
  requesterEmail: z.string().email("Invalid email").optional().or(z.literal("")),
  sourceSystem: z.string().optional(),
  sourceReference: z.string().optional(),
  dueDate: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

function NewWorkItemPage() {
  const navigate = useNavigate();

  const { data: staffList } = useQuery(orpc.staff.list.queryOptions({ input: { limit: 200, offset: 0 } }));
  const { data: departments } = useQuery(orpc.staff.getDepartments.queryOptions());

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { type: "routine", priority: "medium" },
  });

  const type = watch("type");

  const mutation = useMutation(
    orpc.work.create.mutationOptions({
      onSuccess: (item) => {
        queryClient.invalidateQueries({ queryKey: orpc.work.list.key() });
        queryClient.invalidateQueries({ queryKey: orpc.work.stats.key() });
        toast.success("Work item created");
        navigate({ to: "/work/$workItemId", params: { workItemId: item.id } });
      },
      onError: (err) => toast.error(`Failed: ${err.message}`),
    })
  );

  const onSubmit = (values: FormValues) => {
    mutation.mutate({
      ...values,
      requesterEmail: values.requesterEmail || undefined,
      dueDate: values.dueDate || undefined,
    });
  };

  return (
    <>
      <Header fixed>
        <div className="flex items-center gap-2">
          <ClipboardCheck className="size-4 text-muted-foreground" />
          <Link to="/work" className="text-sm text-muted-foreground hover:text-foreground">
            Work Register
          </Link>
          <span className="text-muted-foreground">/</span>
          <span className="text-sm font-medium">New Work Item</span>
        </div>
      </Header>

      <Main>
        <div className="mb-6 flex items-center gap-3">
          <Link to="/work">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="size-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">New Work Item</h1>
            <p className="text-sm text-muted-foreground">Add a work item to the register.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl space-y-5">
          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="title">Title *</Label>
            <Input id="title" {...register("title")} placeholder="Brief title" />
            {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...register("description")}
              placeholder="Details, context, acceptance criteria..."
              rows={3}
            />
          </div>

          {/* Type + Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="type">Type</Label>
              <select
                id="type"
                {...register("type")}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="routine">Routine</option>
                <option value="project">Project</option>
                <option value="external_request">External Request</option>
                <option value="ad_hoc">Ad Hoc</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="priority">Priority</Label>
              <select
                id="priority"
                {...register("priority")}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>

          {/* Assignee + Department */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="assignedToId">Assignee</Label>
              <select
                id="assignedToId"
                {...register("assignedToId")}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Unassigned</option>
                {staffList?.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.user?.name} — {s.jobTitle}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="departmentId">Department</Label>
              <select
                id="departmentId"
                {...register("departmentId")}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">No department</option>
                {departments?.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Due Date */}
          <div className="space-y-1.5">
            <Label htmlFor="dueDate">Due Date</Label>
            <Input id="dueDate" type="date" {...register("dueDate")} />
          </div>

          {/* External request fields */}
          {type === "external_request" && (
            <div className="grid grid-cols-2 gap-4 rounded-md border p-4">
              <div className="space-y-1.5">
                <Label htmlFor="requesterName">Requester Name</Label>
                <Input id="requesterName" {...register("requesterName")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="requesterEmail">Requester Email</Label>
                <Input id="requesterEmail" type="email" {...register("requesterEmail")} />
                {errors.requesterEmail && (
                  <p className="text-xs text-destructive">{errors.requesterEmail.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="sourceSystem">Source System</Label>
                <Input id="sourceSystem" {...register("sourceSystem")} placeholder="e.g. ServiceNow" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="sourceReference">Reference No.</Label>
                <Input id="sourceReference" {...register("sourceReference")} />
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={isSubmitting || mutation.isPending}>
              {mutation.isPending ? "Creating..." : "Create Work Item"}
            </Button>
            <Link to="/work">
              <Button type="button" variant="outline">Cancel</Button>
            </Link>
          </div>
        </form>
      </Main>
    </>
  );
}
