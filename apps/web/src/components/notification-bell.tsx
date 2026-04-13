import { Bell } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@ndma-dcs-staff-portal/ui/components/button";

// Notification bell shown in the header.
// Badge count will be wired to orpc.notifications.list in Phase J.
export function NotificationBell() {
  // TODO (Phase J): replace with real unread count from orpc query
  const unreadCount = 0;

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
