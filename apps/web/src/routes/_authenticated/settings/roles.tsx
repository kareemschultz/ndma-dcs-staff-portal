import { createFileRoute } from "@tanstack/react-router";
import { Shield, Check, X } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@ndma-dcs-staff-portal/ui/components/table";
import { Header } from "@/components/layout/header";
import { Main } from "@/components/layout/main";
import { ThemeSwitch } from "@/components/theme-switch";

export const Route = createFileRoute("/_authenticated/settings/roles")({
  component: RolesSettingsPage,
});

const ROLES = [
  { key: "readOnly", label: "Read Only", description: "View-only access to all modules" },
  { key: "staff", label: "Staff", description: "Submit leaves, view rota, log work items" },
  { key: "manager", label: "Manager", description: "Approve leaves, manage team, assign work" },
  { key: "hrAdminOps", label: "HR / Admin Ops", description: "Full HR, procurement, and compliance access" },
  { key: "admin", label: "Admin", description: "Full system access including settings and audit" },
];

const RESOURCES = [
  "staff", "work", "leave", "rota", "compliance",
  "contract", "appraisal", "report", "audit", "settings",
  "procurement", "notification", "access",
];

const PERMISSIONS: Record<string, string[]> = {
  readOnly: ["staff:read", "work:read", "leave:read", "rota:read", "compliance:read", "contract:read", "appraisal:read", "report:read", "audit:read", "procurement:read", "notification:read", "access:read"],
  staff: ["staff:read", "work:create", "work:read", "leave:create", "leave:read", "rota:read", "compliance:read", "contract:read", "appraisal:read", "procurement:create", "procurement:read", "notification:read", "notification:update", "access:read"],
  manager: ["staff:read", "staff:update", "work:create", "work:read", "work:update", "work:assign", "leave:create", "leave:read", "leave:update", "rota:read", "rota:create", "rota:update", "compliance:read", "contract:read", "appraisal:read", "appraisal:create", "procurement:create", "procurement:read", "notification:read", "notification:update", "access:read"],
  hrAdminOps: ["staff:read", "staff:create", "staff:update", "work:read", "leave:read", "leave:update", "rota:read", "rota:create", "compliance:read", "compliance:create", "compliance:update", "contract:read", "contract:create", "contract:update", "appraisal:read", "appraisal:create", "appraisal:update", "report:read", "procurement:read", "procurement:approve", "notification:read", "access:read", "access:create", "access:update"],
  admin: RESOURCES.flatMap((r) => [`${r}:create`, `${r}:read`, `${r}:update`, `${r}:delete`]),
};

function RolesSettingsPage() {
  return (
    <>
      <Header fixed>
        <div className="flex items-center gap-2">
          <Shield className="size-4 text-muted-foreground" />
          <span className="text-sm font-medium">Roles & Permissions</span>
        </div>
        <div className="ms-auto flex items-center gap-2">
          <ThemeSwitch />
        </div>
      </Header>

      <Main>
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">Roles & Permissions</h1>
          <p className="text-sm text-muted-foreground mt-1">
            5-role RBAC model. Roles are assigned at user creation via the Better Auth Admin plugin.
          </p>
        </div>

        {/* Role cards */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 mb-8">
          {ROLES.map((role) => (
            <div key={role.key} className="rounded-md border p-3">
              <p className="text-sm font-semibold">{role.label}</p>
              <p className="text-xs text-muted-foreground mt-1">{role.description}</p>
            </div>
          ))}
        </div>

        {/* Permission matrix */}
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Permission Matrix
        </h2>

        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[120px]">Resource</TableHead>
                {ROLES.map((r) => (
                  <TableHead key={r.key} className="text-center text-xs">{r.label}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {RESOURCES.map((resource) => (
                <TableRow key={resource}>
                  <TableCell className="font-mono text-xs">{resource}</TableCell>
                  {ROLES.map((role) => {
                    const hasRead = PERMISSIONS[role.key]?.includes(`${resource}:read`);
                    const hasWrite = PERMISSIONS[role.key]?.some((p) =>
                      p.startsWith(`${resource}:`) && p !== `${resource}:read`
                    );
                    return (
                      <TableCell key={role.key} className="text-center">
                        {hasRead ? (
                          <span className="inline-flex items-center gap-0.5 text-xs text-green-600">
                            <Check className="size-3" />
                            {hasWrite ? "R/W" : "R"}
                          </span>
                        ) : (
                          <X className="size-3 text-muted-foreground mx-auto" />
                        )}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Main>
    </>
  );
}
