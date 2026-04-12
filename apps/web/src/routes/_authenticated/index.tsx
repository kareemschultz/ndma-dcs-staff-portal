import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/layout/header";
import { Main } from "@/components/layout/main";
import { ThemeSwitch } from "@/components/theme-switch";
import {
  LayoutDashboard,
  Users,
  CalendarOff,
  CalendarClock,
  ShoppingCart,
  AlertTriangle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@ndma-dcs-staff-portal/ui/components/card";

export const Route = createFileRoute("/_authenticated/")({
  component: DashboardPage,
});

const kpiCards = [
  { title: "Total Active Staff", value: "—", icon: Users, color: "text-blue-500" },
  { title: "On Leave Today", value: "—", icon: CalendarOff, color: "text-red-500" },
  { title: "On Call Today", value: "—", icon: CalendarClock, color: "text-green-500" },
  { title: "Pending Approvals", value: "—", icon: AlertTriangle, color: "text-amber-500" },
  { title: "Open Requisitions", value: "—", icon: ShoppingCart, color: "text-indigo-500" },
];

function DashboardPage() {
  return (
    <>
      <Header fixed>
        <div className="ms-auto flex items-center gap-2">
          <ThemeSwitch />
        </div>
      </Header>
      <Main>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <LayoutDashboard className="size-6" />
              Dashboard
            </h1>
            <p className="text-sm text-muted-foreground">
              Data Centre Services Staff Portal overview
            </p>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {kpiCards.map((card) => (
            <Card key={card.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                <card.icon className={`size-4 ${card.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{card.value}</div>
                <p className="text-xs text-muted-foreground">Loading data...</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Placeholder for charts — Phase 8 */}
        <div className="mt-6 rounded-lg border border-dashed p-8 text-center text-muted-foreground">
          Charts and activity feed coming in Phase 8
        </div>
      </Main>
    </>
  );
}
