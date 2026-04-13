import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { format } from "date-fns";
import { Bell, Check, X } from "lucide-react";
import { Button } from "@ndma-dcs-staff-portal/ui/components/button";
import { Skeleton } from "@ndma-dcs-staff-portal/ui/components/skeleton";
import { Header } from "@/components/layout/header";
import { Main } from "@/components/layout/main";
import { ThemeSwitch } from "@/components/theme-switch";
import { orpc, queryClient } from "@/utils/orpc";

export const Route = createFileRoute("/_authenticated/notifications/")({
  component: NotificationsPage,
});

function NotificationsPage() {
  const { data, isLoading } = useQuery(orpc.notifications.list.queryOptions({ input: { limit: 50 } }));

  const markReadMutation = useMutation(
    orpc.notifications.markRead.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: orpc.notifications.list.key() });
      },
      onError: (err) => toast.error(err.message),
    })
  );

  const dismissMutation = useMutation(
    orpc.notifications.dismiss.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: orpc.notifications.list.key() });
      },
      onError: (err) => toast.error(err.message),
    })
  );

  const unreadCount = data?.unreadCount ?? 0;

  return (
    <>
      <Header fixed>
        <div className="flex items-center gap-2">
          <Bell className="size-4 text-muted-foreground" />
          <span className="text-sm font-medium">Notifications</span>
          {unreadCount > 0 && (
            <span className="flex size-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="ms-auto flex items-center gap-2">
          <ThemeSwitch />
        </div>
      </Header>

      <Main>
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-xl" />
            ))}
          </div>
        ) : !data?.items?.length ? (
          <div className="rounded-xl border border-dashed p-12 text-center text-muted-foreground">
            No notifications yet.
          </div>
        ) : (
          <div className="space-y-2">
            {data.items.map((n: any) => {
              const isUnread = n.status === "pending" || n.status === "sent";
              return (
                <div
                  key={n.id}
                  className={`flex items-start gap-3 rounded-xl border p-4 transition-colors ${
                    isUnread ? "border-primary/30 bg-primary/5" : ""
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={`text-sm font-medium ${isUnread ? "text-foreground" : "text-muted-foreground"}`}>
                        {n.title}
                      </p>
                      {isUnread && (
                        <span className="size-2 rounded-full bg-primary shrink-0" />
                      )}
                    </div>
                    {n.body && (
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">{n.body}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(n.createdAt), "dd MMM yyyy, HH:mm")} · {n.module}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {isUnread && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-7"
                        title="Mark as read"
                        onClick={() => markReadMutation.mutate({ id: n.id })}
                      >
                        <Check className="size-3.5" />
                      </Button>
                    )}
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-7 text-muted-foreground"
                      title="Dismiss"
                      onClick={() => dismissMutation.mutate({ id: n.id })}
                    >
                      <X className="size-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Main>
    </>
  );
}
