// NDMA DCS Staff Portal — Sidebar Navigation
import {
  BarChart3,
  Bell,
  CalendarClock,
  CalendarOff,
  ClipboardCheck,
  FileText,
  GraduationCap,
  HardHat,
  LayoutDashboard,
  ScrollText,
  Settings,
  Shield,
  ShoppingCart,
  Users,
  Building2,
  Activity,
  BookOpen,
} from "lucide-react";
import { type SidebarData } from "../types";

export const sidebarData: SidebarData = {
  user: {
    name: "Admin User",
    email: "admin@ndma.gov",
    avatar: "",
  },
  teams: [
    {
      name: "NDMA",
      logo: Shield,
      plan: "Data Centre Services",
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
      ],
    },
    {
      title: "Staff Management",
      items: [
        {
          title: "Staff Directory",
          url: "/staff",
          icon: Users,
        },
        {
          title: "Leave Management",
          url: "/leave",
          icon: CalendarOff,
        },
        {
          title: "On-Call Rota",
          url: "/rota",
          icon: CalendarClock,
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
      title: "Procurement",
      items: [
        {
          title: "Purchase Requisitions",
          url: "/procurement",
          icon: ShoppingCart,
        },
      ],
    },
    {
      title: "Compliance",
      items: [
        {
          title: "Training Records",
          url: "/compliance/training",
          icon: GraduationCap,
        },
        {
          title: "PPE Management",
          url: "/compliance/ppe",
          icon: HardHat,
        },
        {
          title: "Compliance Items",
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
