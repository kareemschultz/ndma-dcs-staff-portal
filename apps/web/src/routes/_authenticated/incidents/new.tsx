import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { AlertTriangle, ArrowLeft } from "lucide-react";
import { Button } from "@ndma-dcs-staff-portal/ui/components/button";
import { Input } from "@ndma-dcs-staff-portal/ui/components/input";
import { Textarea } from "@ndma-dcs-staff-portal/ui/components/textarea";
import { Label } from "@ndma-dcs-staff-portal/ui/components/label";
import { Header } from "@/components/layout/header";
import { Main } from "@/components/layout/main";
import { orpc, queryClient } from "@/utils/orpc";

export const Route = createFileRoute("/_authenticated/incidents/new")({
  component: DeclareIncidentPage,
});

const schema = z.object({
  title: z.string().min(1, "Title is required").max(300),
  description: z.string().optional(),
  severity: z.enum(["sev1", "sev2", "sev3", "sev4"]),
  commanderId: z.string().optional(),
  impactSummary: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

function DeclareIncidentPage() {
  const navigate = useNavigate();
  const { data: staffList } = useQuery(orpc.staff.list.queryOptions({ input: { limit: 200, offset: 0 } }));

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { severity: "sev3" },
  });

  const mutation = useMutation(
    orpc.incidents.create.mutationOptions({
      onSuccess: (inc) => {
        queryClient.invalidateQueries({ queryKey: orpc.incidents.list.key() });
        queryClient.invalidateQueries({ queryKey: orpc.incidents.getActive.key() });
        toast.success("Incident declared");
        navigate({ to: "/incidents/$incidentId", params: { incidentId: inc.id } });
      },
      onError: (err) => toast.error(err.message),
    })
  );

  return (
    <>
      <Header fixed>
        <div className="flex items-center gap-2">
          <AlertTriangle className="size-4 text-muted-foreground" />
          <Link to="/incidents" className="text-sm text-muted-foreground hover:text-foreground">
            Incidents
          </Link>
          <span className="text-muted-foreground">/</span>
          <span className="text-sm font-medium">Declare Incident</span>
        </div>
      </Header>

      <Main>
        <div className="mb-6 flex items-center gap-3">
          <Link to="/incidents">
            <Button variant="ghost" size="icon"><ArrowLeft className="size-4" /></Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Declare Incident</h1>
            <p className="text-sm text-muted-foreground">Create an incident record and begin response.</p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit((v) => mutation.mutate({
            ...v,
            commanderId: v.commanderId || undefined,
          }))}
          className="max-w-2xl space-y-5"
        >
          <div className="space-y-1.5">
            <Label htmlFor="title">Incident Title *</Label>
            <Input id="title" {...register("title")} placeholder="Brief description of the incident" />
            {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="severity">Severity *</Label>
            <select
              id="severity"
              {...register("severity")}
              className="w-full rounded-xl border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="sev1">Sev1 — Critical (production down, data loss)</option>
              <option value="sev2">Sev2 — High (major feature broken)</option>
              <option value="sev3">Sev3 — Medium (degraded performance)</option>
              <option value="sev4">Sev4 — Low (minor issue)</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...register("description")}
              placeholder="What happened? What is the impact?"
              rows={3}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="impactSummary">Impact Summary</Label>
            <Input
              id="impactSummary"
              {...register("impactSummary")}
              placeholder="e.g. All users unable to login"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="commanderId">Incident Commander</Label>
            <select
              id="commanderId"
              {...register("commanderId")}
              className="w-full rounded-xl border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Assign later</option>
              {staffList?.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.user?.name} — {s.jobTitle}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" variant="destructive" disabled={mutation.isPending}>
              {mutation.isPending ? "Declaring..." : "Declare Incident"}
            </Button>
            <Link to="/incidents">
              <Button type="button" variant="outline">Cancel</Button>
            </Link>
          </div>
        </form>
      </Main>
    </>
  );
}
