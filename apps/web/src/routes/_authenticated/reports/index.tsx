import { createFileRoute } from "@tanstack/react-router";
import { BarChart3, FileText, Users, ClipboardList, ShoppingCart } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@ndma-dcs-staff-portal/ui/components/card";
import { Header } from "@/components/layout/header";
import { Main } from "@/components/layout/main";
import { ThemeSwitch } from "@/components/theme-switch";

export const Route = createFileRoute("/_authenticated/reports/")({
  component: ReportsPage,
});

const REPORT_TYPES = [
  {
    title: "Staff Report",
    description: "Headcount, departments, employment types, and contract status summary.",
    icon: Users,
    available: false,
  },
  {
    title: "Leave Summary",
    description: "Leave utilisation by staff member, type, and period.",
    icon: FileText,
    available: false,
  },
  {
    title: "Work Register Export",
    description: "All work items with status, priority, and completion dates.",
    icon: ClipboardList,
    available: false,
  },
  {
    title: "Procurement Summary",
    description: "Purchase requisitions by status, department, and value.",
    icon: ShoppingCart,
    available: false,
  },
  {
    title: "Compliance Report",
    description: "Training and PPE expiry status across all staff.",
    icon: BarChart3,
    available: false,
  },
];

function ReportsPage() {
  return (
    <>
      <Header fixed>
        <div className="flex items-center gap-2">
          <BarChart3 className="size-4 text-muted-foreground" />
          <span className="text-sm font-medium">Reports</span>
        </div>
        <div className="ms-auto flex items-center gap-2">
          <ThemeSwitch />
        </div>
      </Header>

      <Main>
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Exportable operational reports — Phase J (Dashboards).
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {REPORT_TYPES.map((report) => (
            <Card key={report.title} className="opacity-60 cursor-not-allowed">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <report.icon className="size-4 text-muted-foreground" />
                  <CardTitle className="text-sm">{report.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">{report.description}</p>
                <p className="text-xs text-muted-foreground mt-2 italic">Coming in Phase J</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </Main>
    </>
  );
}
