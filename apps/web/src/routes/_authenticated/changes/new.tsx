import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Wrench, ArrowLeft } from "lucide-react";
import { Button } from "@ndma-dcs-staff-portal/ui/components/button";
import { Header } from "@/components/layout/header";
import { Main } from "@/components/layout/main";
import { ThemeSwitch } from "@/components/theme-switch";
import { orpc, queryClient } from "@/utils/orpc";

export const Route = createFileRoute("/_authenticated/changes/new")({
  component: NewChangePage,
});

const schema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  justification: z.string().optional(),
  implementationDate: z.string().optional(),
  removeByDate: z.string().optional(),
  rollbackPlan: z.string().optional(),
  ownerId: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

function NewChangePage() {
  const navigate = useNavigate();

  const { data: staff } = useQuery(
    orpc.staff.list.queryOptions({ input: { limit: 100, offset: 0 } })
  );

  const { data: services } = useQuery(orpc.services.list.queryOptions());

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const mutation = useMutation(
    orpc.tempChanges.create.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: orpc.tempChanges.list.key() });
        queryClient.invalidateQueries({ queryKey: orpc.tempChanges.stats.key() });
        toast.success("Temporary change logged");
        navigate({ to: "/changes" });
      },
      onError: (err) => toast.error(err.message),
    })
  );

  return (
    <>
      <Header fixed>
        <div className="flex items-center gap-2">
          <Wrench className="size-4 text-muted-foreground" />
          <span className="text-sm font-medium">Log Temporary Change</span>
        </div>
        <div className="ms-auto flex items-center gap-2">
          <ThemeSwitch />
        </div>
      </Header>

      <Main>
        <div className="mb-6">
          <Button
            variant="ghost"
            size="sm"
            className="mb-3 -ml-2 gap-1"
            onClick={() => navigate({ to: "/changes" })}
          >
            <ArrowLeft className="size-3.5" />
            Back to Changes
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">Log Temporary Change</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Record a temporary technical change with a planned removal date.
          </p>
        </div>

        <form
          onSubmit={handleSubmit((data) => mutation.mutate(data))}
          className="space-y-5 max-w-2xl"
        >
          <div>
            <label className="block text-sm font-medium mb-1.5">
              Title <span className="text-destructive">*</span>
            </label>
            <input
              {...register("title")}
              placeholder="Brief description of the change"
              className="w-full rounded-xl border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            {errors.title && (
              <p className="text-xs text-destructive mt-1">{errors.title.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Description</label>
            <textarea
              {...register("description")}
              rows={3}
              placeholder="Detailed description of the change..."
              className="w-full rounded-xl border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Justification</label>
            <textarea
              {...register("justification")}
              rows={2}
              placeholder="Why was this change made?"
              className="w-full rounded-xl border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Implementation Date</label>
              <input
                {...register("implementationDate")}
                type="date"
                className="w-full rounded-xl border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Remove By Date</label>
              <input
                {...register("removeByDate")}
                type="date"
                className="w-full rounded-xl border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Owner</label>
            <select
              {...register("ownerId")}
              className="w-full rounded-xl border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Select owner (optional)</option>
              {staff?.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.user?.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Rollback Plan</label>
            <textarea
              {...register("rollbackPlan")}
              rows={3}
              placeholder="How can this change be reversed if needed?"
              className="w-full rounded-xl border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Logging..." : "Log Change"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate({ to: "/changes" })}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Main>
    </>
  );
}
