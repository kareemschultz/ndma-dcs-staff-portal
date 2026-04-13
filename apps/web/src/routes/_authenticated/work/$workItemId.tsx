import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { format, parseISO, startOfISOWeek } from "date-fns";
import {
  ArrowLeft,
  Calendar,
  ClipboardCheck,
  MessageSquare,
  User,
  Building2,
  Clock,
} from "lucide-react";
import { Button } from "@ndma-dcs-staff-portal/ui/components/button";
import { Textarea } from "@ndma-dcs-staff-portal/ui/components/textarea";
import { Label } from "@ndma-dcs-staff-portal/ui/components/label";
import { Skeleton } from "@ndma-dcs-staff-portal/ui/components/skeleton";
import { Separator } from "@ndma-dcs-staff-portal/ui/components/separator";
import { Header } from "@/components/layout/header";
import { Main } from "@/components/layout/main";
import { orpc, queryClient } from "@/utils/orpc";
import {
  StatusBadge,
  PriorityBadge,
  TypeBadge,
} from "@/features/work/components/badges";
import type { WorkStatus, WorkPriority, WorkType } from "@/features/work/components/badges";

export const Route = createFileRoute("/_authenticated/work/$workItemId")({
  component: WorkItemDetailPage,
});

function WorkItemDetailPage() {
  const { workItemId } = Route.useParams();
  const navigate = useNavigate();

  const [commentBody, setCommentBody] = useState("");
  const [updateSummary, setUpdateSummary] = useState("");
  const [updateBlockers, setUpdateBlockers] = useState("");
  const [updateNextSteps, setUpdateNextSteps] = useState("");

  const { data: item, isLoading, error } = useQuery(
    orpc.work.get.queryOptions({ input: { id: workItemId } })
  );

  const commentMutation = useMutation(
    orpc.work.addComment.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: orpc.work.get.key({ input: { id: workItemId } }) });
        setCommentBody("");
        toast.success("Comment added");
      },
      onError: (err) => toast.error(err.message),
    })
  );

  const updateMutation = useMutation(
    orpc.work.addWeeklyUpdate.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: orpc.work.get.key({ input: { id: workItemId } }) });
        setUpdateSummary("");
        setUpdateBlockers("");
        setUpdateNextSteps("");
        toast.success("Weekly update saved");
      },
      onError: (err) => toast.error(err.message),
    })
  );

  const statusMutation = useMutation(
    orpc.work.update.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: orpc.work.get.key({ input: { id: workItemId } }) });
        queryClient.invalidateQueries({ queryKey: orpc.work.list.key() });
        queryClient.invalidateQueries({ queryKey: orpc.work.stats.key() });
        toast.success("Status updated");
      },
      onError: (err) => toast.error(err.message),
    })
  );

  const thisWeekStart = format(startOfISOWeek(new Date()), "yyyy-MM-dd");

  if (isLoading) {
    return (
      <>
        <Header fixed>
          <div className="flex items-center gap-2">
            <ClipboardCheck className="size-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Work Register</span>
          </div>
        </Header>
        <Main>
          <Skeleton className="h-8 w-64 mb-4" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-3/4" />
        </Main>
      </>
    );
  }

  if (error || !item) {
    return (
      <Main>
        <p className="text-muted-foreground">Work item not found.</p>
        <Link to="/work"><Button variant="outline" className="mt-4">Back to Work Register</Button></Link>
      </Main>
    );
  }

  const STATUS_TRANSITIONS: WorkStatus[] = [
    "backlog", "todo", "in_progress", "blocked", "review", "done", "cancelled",
  ];

  return (
    <>
      <Header fixed>
        <div className="flex items-center gap-2 min-w-0">
          <ClipboardCheck className="size-4 shrink-0 text-muted-foreground" />
          <Link to="/work" className="text-sm text-muted-foreground hover:text-foreground shrink-0">
            Work Register
          </Link>
          <span className="text-muted-foreground shrink-0">/</span>
          <span className="text-sm font-medium truncate">{item.title}</span>
        </div>
      </Header>

      <Main>
        <div className="mb-6 flex items-start gap-3">
          <Link to="/work">
            <Button variant="ghost" size="icon" className="mt-1">
              <ArrowLeft className="size-4" />
            </Button>
          </Link>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <TypeBadge type={item.type as WorkType} />
              <StatusBadge status={item.status as WorkStatus} />
              <PriorityBadge priority={item.priority as WorkPriority} />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">{item.title}</h1>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            {item.description && (
              <div>
                <h2 className="font-semibold mb-2">Description</h2>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{item.description}</p>
              </div>
            )}

            {/* Weekly updates */}
            <div>
              <h2 className="font-semibold mb-3 flex items-center gap-2">
                <Clock className="size-4" />
                Weekly Updates
              </h2>

              {/* Add update form */}
              <div className="rounded-md border p-4 mb-4 space-y-3">
                <p className="text-xs text-muted-foreground">Week of {thisWeekStart}</p>
                <div className="space-y-1.5">
                  <Label>Status Summary *</Label>
                  <Textarea
                    value={updateSummary}
                    onChange={(e) => setUpdateSummary(e.target.value)}
                    placeholder="What was done this week..."
                    rows={2}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Blockers</Label>
                    <Textarea
                      value={updateBlockers}
                      onChange={(e) => setUpdateBlockers(e.target.value)}
                      placeholder="Any blockers?"
                      rows={2}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Next Steps</Label>
                    <Textarea
                      value={updateNextSteps}
                      onChange={(e) => setUpdateNextSteps(e.target.value)}
                      placeholder="Planned for next week..."
                      rows={2}
                    />
                  </div>
                </div>
                <Button
                  size="sm"
                  disabled={!updateSummary.trim() || updateMutation.isPending}
                  onClick={() =>
                    updateMutation.mutate({
                      workItemId,
                      weekStart: thisWeekStart,
                      statusSummary: updateSummary,
                      blockers: updateBlockers || undefined,
                      nextSteps: updateNextSteps || undefined,
                    })
                  }
                >
                  {updateMutation.isPending ? "Saving..." : "Save Weekly Update"}
                </Button>
              </div>

              {/* Past updates */}
              {item.weeklyUpdates?.length ? (
                <div className="space-y-3">
                  {item.weeklyUpdates.map((u) => (
                    <div key={u.id} className="rounded-md border p-3 text-sm">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium">Week of {u.weekStart}</span>
                        <span className="text-xs text-muted-foreground">{u.author?.name}</span>
                      </div>
                      <p className="text-muted-foreground">{u.statusSummary}</p>
                      {u.blockers && (
                        <p className="text-red-600 dark:text-red-400 mt-1">
                          <strong>Blockers:</strong> {u.blockers}
                        </p>
                      )}
                      {u.nextSteps && (
                        <p className="text-muted-foreground mt-1">
                          <strong>Next:</strong> {u.nextSteps}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No weekly updates yet.</p>
              )}
            </div>

            <Separator />

            {/* Comments */}
            <div>
              <h2 className="font-semibold mb-3 flex items-center gap-2">
                <MessageSquare className="size-4" />
                Comments
              </h2>

              <div className="space-y-1.5 mb-4">
                <Textarea
                  value={commentBody}
                  onChange={(e) => setCommentBody(e.target.value)}
                  placeholder="Add a comment..."
                  rows={3}
                />
                <Button
                  size="sm"
                  disabled={!commentBody.trim() || commentMutation.isPending}
                  onClick={() =>
                    commentMutation.mutate({ workItemId, body: commentBody })
                  }
                >
                  {commentMutation.isPending ? "Posting..." : "Post Comment"}
                </Button>
              </div>

              {item.comments?.length ? (
                <div className="space-y-3">
                  {item.comments.map((c) => (
                    <div key={c.id} className="flex gap-3">
                      <div className="size-7 shrink-0 rounded-full bg-muted flex items-center justify-center text-xs font-semibold">
                        {c.author?.name?.[0] ?? "?"}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                          <span className="font-medium text-foreground">{c.author?.name}</span>
                          <span>{format(new Date(c.createdAt), "dd MMM yyyy, HH:mm")}</span>
                        </div>
                        <p className="text-sm whitespace-pre-wrap">{c.body}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No comments yet.</p>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Status changer */}
            <div className="rounded-md border p-4 space-y-3">
              <h3 className="font-semibold text-sm">Status</h3>
              <div className="flex flex-wrap gap-1.5">
                {STATUS_TRANSITIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() =>
                      statusMutation.mutate({ id: workItemId, status: s })
                    }
                    disabled={item.status === s || statusMutation.isPending}
                    className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
                      item.status === s
                        ? "bg-primary text-primary-foreground"
                        : "border hover:bg-muted"
                    }`}
                  >
                    {s.replace("_", " ")}
                  </button>
                ))}
              </div>
            </div>

            {/* Details */}
            <div className="rounded-md border p-4 space-y-3 text-sm">
              <h3 className="font-semibold">Details</h3>

              <div className="flex items-center gap-2 text-muted-foreground">
                <User className="size-3.5 shrink-0" />
                <span className="font-medium text-foreground">
                  {item.assignedTo?.user?.name ?? "Unassigned"}
                </span>
              </div>

              {item.department && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Building2 className="size-3.5 shrink-0" />
                  <span>{item.department.name}</span>
                </div>
              )}

              {item.dueDate && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="size-3.5 shrink-0" />
                  <span>{format(parseISO(item.dueDate), "dd MMM yyyy")}</span>
                </div>
              )}

              <Separator />

              <div className="text-xs text-muted-foreground space-y-1">
                <p>Created by {item.createdBy?.name}</p>
                <p>{format(new Date(item.createdAt), "dd MMM yyyy, HH:mm")}</p>
              </div>

              {item.requesterName && (
                <>
                  <Separator />
                  <div className="text-xs space-y-1">
                    <p className="font-medium">External Request</p>
                    <p className="text-muted-foreground">{item.requesterName}</p>
                    {item.requesterEmail && (
                      <p className="text-muted-foreground">{item.requesterEmail}</p>
                    )}
                    {item.sourceSystem && (
                      <p className="text-muted-foreground">
                        {item.sourceSystem}
                        {item.sourceReference ? ` #${item.sourceReference}` : ""}
                      </p>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </Main>
    </>
  );
}
