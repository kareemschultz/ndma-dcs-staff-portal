// DCS Ops Center — Sidebar Navigation
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bell,
  BookOpen,
  Building2,
  CalendarClock,
  CalendarOff,
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

export const sidebarData: SidebarData = {
  user: {
    name: "Admin User",
    email: "admin@ndma.gov.gh",
    avatar: "",
  },
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
          url: "/work",
          icon: ListTodo,
        },
        {
          title: "Incidents",
          url: "/incidents",
          icon: AlertTriangle,
        },
        {
          title: "On-Call Rota",
          icon: CalendarClock,
          items: [
            { title: "Current Rota", url: "/rota" },
            { title: "Planner", url: "/rota/planner" },
            { title: "Swap Requests", url: "/rota/swaps" },
            { title: "History", url: "/rota/history" },
          ],
        },
        {
          title: "Temp Changes",
          url: "/changes",
          icon: Shuffle,
        },
        {
          title: "Procurement",
          url: "/procurement",
          icon: ShoppingCart,
        },
      ],
    },
    {
      title: "People",
      items: [
        {
          title: "Staff Directory",
          url: "/staff",
          icon: Users,
        },
        {
          title: "Leave",
          url: "/leave",
          icon: CalendarOff,
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
        },
      ],
    },
    {
      title: "Services",
      items: [
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
      title: "Compliance",
      items: [
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
          title: "Reports",
          url: "/reports",
          icon: BarChart3,
        },
        {
          title: "Audit Log",
          url: "/audit",
          icon: ScrollText,
        },
        {
          title: "Import Data",
          url: "/import",
          icon: Upload,
        },
        {
          title: "Notifications",
          url: "/notifications",
          icon: Bell,
        },
        {
          title: "Documentation",
          url: "/docs",
          icon: BookOpen,
        },
        {
          title: "Settings",
          icon: Settings,
          items: [
            {
              title: "General",
              url: "/settings/general",
              icon: Activity,
            },
            {
              title: "Departments",
              url: "/settings/departments",
              icon: Building2,
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
          ],
        },
      ],
    },
  ],
};
