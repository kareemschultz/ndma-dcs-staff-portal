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
  CalendarDays,
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
  Clock3,
  PhoneCall,
  ListChecks,
  Settings,
  Shield,
  ShoppingCart,
  Shuffle,
  Upload,
  Users,
  Wrench,
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
    // ── Overview ──────────────────────────────────────────────
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

    // ── Core Operations ───────────────────────────────────────
    {
      title: "Operations",
      items: [
        {
          title: "Work Register",
          icon: ListTodo,
          items: [
            { title: "All Work Items", url: "/work" },
            { title: "Workload View", url: "/work/workload" },
          ],
        },
        {
          title: "Sprint Cycles",
          url: "/cycles",
          icon: CalendarRange,
        },
        {
          title: "Incidents",
          url: "/incidents",
          icon: AlertTriangle,
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
        {
          title: "Service Registry",
          url: "/services",
          icon: Zap,
        },
        {
          title: "Access Management",
          url: "/access",
          icon: Key,
        },
      ],
    },

    // ── Scheduling ────────────────────────────────────────────
    // DCS uses an on-call rotation; NOC works 24/7 shifts (Day/Swing/Night).
    // Both are listed here so managers and PAs have one place for scheduling.
    {
      title: "Scheduling",
      items: [
        {
          title: "DCS On-Call Roster",
          icon: CalendarClock,
          items: [
            { title: "Current Roster", url: "/rota" },
            { title: "Roster Planner", url: "/rota/planner" },
            { title: "Swap Requests", url: "/rota/swaps" },
            { title: "Roster History", url: "/rota/history" },
            { title: "Monthly Calendar", url: "/rota/calendar" },
            { title: "Fairness Report", url: "/rota/fairness" },
            { title: "Import Warnings", url: "/rota/warnings" },
          ],
        },
        {
          title: "NOC Shift Schedule",
          icon: CalendarDays,
          items: [
            { title: "Schedule Overview", url: "/roster" },
            { title: "Today's Coverage", url: "/roster/today" },
            { title: "Shift Planner", url: "/roster/planner" },
            { title: "My Shifts", url: "/roster/my-roster" },
            { title: "Swap Requests", url: "/roster/swaps" },
            { title: "Monthly Calendar", url: "/roster/calendar" },
          ],
        },
        {
          title: "Maintenance Planning",
          url: "/roster/maintenance",
          icon: Wrench,
        },
      ],
    },

    // ── HR & People ───────────────────────────────────────────
    {
      title: "HR & People",
      items: [
        {
          title: "Staff Directory",
          url: "/staff",
          icon: Users,
        },
        {
          title: "Leave Management",
          icon: CalendarOff,
          items: [
            { title: "All Requests", url: "/leave" },
            { title: "Team Calendar", url: "/leave/calendar" },
          ],
        },
        {
          title: "Contracts",
          url: "/contracts",
          icon: FileText,
        },
        {
          title: "Appraisals",
          icon: ClipboardCheck,
          requiredResource: "appraisal",
          items: [
            { title: "All Appraisals", url: "/appraisals" },
            { title: "My Inbox", url: "/appraisals/inbox" },
          ],
        },
        {
          title: "Attendance Exceptions",
          url: "/hr/attendance",
          icon: Clock3,
        },
        {
          title: "Callout Register",
          url: "/hr/callouts",
          icon: PhoneCall,
        },
        {
          title: "Timesheets",
          url: "/timesheets",
          icon: ListChecks,
        },
      ],
    },

    // ── Equipment & Compliance ────────────────────────────────
    {
      title: "Equipment & Compliance",
      items: [
        {
          title: "PPE & Tools",
          url: "/hr/ppe",
          icon: HardHat,
        },
        {
          title: "Training Records",
          url: "/compliance/training",
          icon: GraduationCap,
        },
        {
          title: "Policy Compliance",
          url: "/compliance/items",
          icon: Shield,
        },
      ],
    },

    // ── System ────────────────────────────────────────────────
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
            { title: "General", url: "/settings/general" },
            { title: "Departments", url: "/settings/departments", icon: Building2 },
            { title: "Dept. Assignments", url: "/settings/department-assignments", icon: Users },
            { title: "Leave Types", url: "/settings/leave-types", icon: CalendarOff },
            { title: "Escalation Policies", url: "/settings/escalation", icon: AlertTriangle },
            { title: "Roles & Permissions", url: "/settings/roles", icon: Shield },
            { title: "Automation Rules", url: "/settings/automation", icon: Bot },
          ],
        },
      ],
    },
  ],
};
