import { createFileRoute, Link } from "@tanstack/react-router";
import { Header } from "@/components/layout/header";
import { Main } from "@/components/layout/main";
import { ThemeSwitch } from "@/components/theme-switch";
import { NotificationBell } from "@/components/notification-bell";
import {
  AlertTriangle,
  CalendarClock,
  CalendarOff,
  ClipboardCheck,
  LayoutDashboard,
  ShoppingCart,
  Users,
  Wrench,
  Zap,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@ndma-dcs-staff-portal/ui/components/card";

export const Route = createFileRoute("/_authenticated/")({
  component: DashboardPage,
});

const kpiCards = [
  { title: "Active Staff", value: "—", icon: Users, color: "text-blue-500", href: "/staff" },
  { title: "On Leave Today", value: "—", icon: CalendarOff, color: "text-red-500", href: "/leave" },
  { title: "On Call Today", value: "—", icon: CalendarClock, color: "text-green-500", href: "/rota" },
  { title: "Active Incidents", value: "—", icon: AlertTriangle, color: "text-rose-600", href: "/incidents" },
  { title: "Open Work Items", value: "—", icon: ClipboardCheck, color: "text-indigo-500", href: "/work" },
  { title: "Pending PRs", value: "—", icon: ShoppingCart, color: "text-amber-500", href: "/procurement" },
  { title: "Overdue Changes", value: "—", icon: Wrench, color: "text-orange-500", href: "/changes" },
  { title: "Ops Readiness", value: "—", icon: Zap, color: "text-emerald-500", href: "/ops-readiness" },
];

function DashboardPage() {
  return (
    <>
      <Header fixed>
        <div className="ms-auto flex items-center gap-2">
          <NotificationBell />
          <ThemeSwitch />
        </div>
      </Header>
      <Main>
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <LayoutDashboard className="size-6" />
              DCS Ops Center
            </h1>
            <p className="text-sm text-muted-foreground">
              Data Centre Services — operational overview
            </p>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {kpiCards.map((card) => (
            <Link key={card.title} to={card.href}>
              <Card className="hover:border-primary/50 transition-colors cursor-pointer">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                  <card.icon className={`size-4 ${card.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{card.value}</div>
                  <p className="text-xs text-muted-foreground">Live data in Phase J</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Placeholder for charts + activity feed */}
        <div className="mt-6 rounded-lg border border-dashed p-8 text-center text-muted-foreground">
          Charts, activity feed, and Ops Readiness traffic-light coming in Phase J (Dashboards)
        </div>
      </Main>
    </>
  );
}
