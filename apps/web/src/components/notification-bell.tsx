import { Bell } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@ndma-dcs-staff-portal/ui/components/button";
import { orpc } from "../utils/orpc";

export function NotificationBell() {
  const { data } = useQuery(
    orpc.notifications.list.queryOptions({ input: { includeRead: false, limit: 1 } }),
  );
  const unreadCount = data?.unreadCount ?? 0;

  return (
    <Link to="/notifications">
      <Button variant="ghost" size="icon" className="relative size-8 rounded-full">
        <Bell className="size-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-semibold text-destructive-foreground">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
        <span className="sr-only">Notifications ({unreadCount} unread)</span>
      </Button>
    </Link>
  );
}
