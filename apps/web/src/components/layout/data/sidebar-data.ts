// DCS Ops Center — Sidebar Navigation
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bell,
  BookOpen,
  Bot,
  Building2,
  CalendarClock,
  CalendarOff,
  CalendarRange,
  ClipboardCheck,
  FileText,
  GraduationCap,
  HardHat,
  Key,
  LayoutDashboard,
  ListTodo,
  MonitorDot,
  ScrollText,
  Settings,
  Shield,
  ShoppingCart,
  Shuffle,
  Upload,
  Users,
  Zap,
} from "lucide-react";
import { type SidebarData } from "../types";

// Note: `user` is intentionally omitted — real user data comes from the auth
// session via app-sidebar.tsx (authClient.useSession), not static config.
export const sidebarData: Omit<SidebarData, "user"> = {
  teams: [
    {
      name: "DCS Ops Center",
      logo: Shield,
      plan: "NDMA Data Centre Services",
    },
  ],
  navGroups: [
    {
      title: "Overview",
      items: [
        {
          title: "Dashboard",
          url: "/",
          icon: LayoutDashboard,
        },
        {
          title: "Ops Readiness",
          url: "/ops-readiness",
          icon: MonitorDot,
        },
      ],
    },
    {
      title: "Operations",
      items: [
        {
          title: "Work Register",
          icon: ListTodo,
          items: [
            { title: "All Items", url: "/work" },
            { title: "Workload View", url: "/work/workload" },
          ],
        },
        {
          title: "Cycles",
          url: "/cycles",
          icon: CalendarRange,
        },
        {
          title: "Incidents",
          url: "/incidents",
          icon: AlertTriangle,
        },
        {
          title: "On-Call Roster",
          icon: CalendarClock,
          items: [
            { title: "Current Roster", url: "/rota" },
            { title: "Planner", url: "/rota/planner" },
            { title: "Swap Requests", url: "/rota/swaps" },
            { title: "History", url: "/rota/history" },
            { title: "Monthly Calendar", url: "/rota/calendar" },
            { title: "Fairness Report", url: "/rota/fairness" },
            { title: "Import Warnings", url: "/rota/warnings" },
          ],
        },
        {
          title: "Temp Changes",
          icon: Shuffle,
          items: [
            { title: "All Changes", url: "/changes" },
            { title: "New Change", url: "/changes/new" },
          ],
        },
        {
          title: "Procurement",
          icon: ShoppingCart,
          items: [
            { title: "Requisitions", url: "/procurement" },
            { title: "New PR", url: "/procurement/new" },
          ],
        },
        {
          title: "Service Registry",
          url: "/services",
          icon: Zap,
        },
        {
          title: "Platform Accounts",
          url: "/access",
          icon: Key,
        },
      ],
    },
    {
      title: "People & Compliance",
      items: [
        {
          title: "Staff Directory",
          url: "/staff",
          icon: Users,
        },
        {
          title: "Leave",
          icon: CalendarOff,
          items: [
            { title: "Leave Requests", url: "/leave" },
            { title: "Team Calendar", url: "/leave/calendar" },
            { title: "New Request", url: "/leave/new" },
          ],
        },
        {
          title: "Contracts",
          url: "/contracts",
          icon: FileText,
        },
        {
          title: "Appraisals",
          url: "/appraisals",
          icon: ClipboardCheck,
          requiredResource: "appraisal",
        },
        {
          title: "Training",
          url: "/compliance/training",
          icon: GraduationCap,
        },
        {
          title: "PPE",
          url: "/compliance/ppe",
          icon: HardHat,
        },
        {
          title: "Policy Items",
          url: "/compliance/items",
          icon: Shield,
        },
      ],
    },
    {
      title: "System",
      items: [
        {
          title: "Analytics",
          url: "/analytics",
          icon: BarChart3,
          requiredResource: "report",
        },
        {
          title: "Reports",
          url: "/reports",
          icon: ScrollText,
          requiredResource: "report",
        },
        {
          title: "Audit Log",
          url: "/audit",
          icon: Activity,
          requiredResource: "audit",
        },
        {
          title: "Import Data",
          url: "/import",
          icon: Upload,
          requiredResource: "settings",
        },
        {
          title: "Notifications",
          url: "/notifications",
          icon: Bell,
        },
        {
          title: "Documentation",
          // Falls back to port 4000 if VITE_DOCS_URL is not set at build time.
          // External links (starting with http) open in a new tab automatically.
          url: (import.meta.env.VITE_DOCS_URL as string | undefined) ?? "http://localhost:4000",
          icon: BookOpen,
        },
        {
          title: "Settings",
          icon: Settings,
          requiredResource: "settings",
          items: [
            {
              title: "General",
              url: "/settings/general",
            },
            {
              title: "Departments",
              url: "/settings/departments",
              icon: Building2,
            },
            {
              title: "Department Assignments",
              url: "/settings/department-assignments",
              icon: Users,
            },
            {
              title: "Leave Types",
              url: "/settings/leave-types",
              icon: CalendarOff,
            },
            {
              title: "Escalation",
              url: "/settings/escalation",
              icon: AlertTriangle,
            },
            {
              title: "Roles & Permissions",
              url: "/settings/roles",
              icon: Shield,
            },
            {
              title: "Automation",
              url: "/settings/automation",
              icon: Bot,
            },
          ],
        },
      ],
    },
  ],
};
