import { createDb } from "@ndma-dcs-staff-portal/db";
import * as schema from "@ndma-dcs-staff-portal/db/schema/auth";
import { env } from "@ndma-dcs-staff-portal/env/server";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin, createAccessControl } from "better-auth/plugins";

// ─── RBAC: Custom resources and actions ──────────────────────────────────────
const statement = {
  staff: ["create", "read", "update", "delete", "import", "export"] as const,
  leave: ["create", "read", "update", "approve", "reject", "cancel"] as const,
  rota: ["create", "read", "update", "delete", "swap"] as const,
  compliance: ["create", "read", "update", "assign"] as const,
  contract: ["create", "read", "update"] as const,
  appraisal: ["create", "read", "update"] as const,
  report: ["read", "export"] as const,
  audit: ["read"] as const,
  settings: ["read", "update"] as const,
  procurement: [
    "create",
    "read",
    "update",
    "delete",
    "approve",
    "reject",
    "export",
  ] as const,
} as const;

export const ac = createAccessControl(statement);

// Read Only — view everything, change nothing
export const readOnlyRole = ac.newRole({
  staff: ["read"],
  leave: ["read"],
  rota: ["read"],
  compliance: ["read"],
  contract: ["read"],
  appraisal: ["read"],
  report: ["read"],
  audit: ["read"],
  settings: ["read"],
  procurement: ["read"],
});

// Staff — own profile, self-service leave, submit PRs, view rota
export const staffRole = ac.newRole({
  staff: ["read"],
  leave: ["create", "read", "cancel"],
  rota: ["read", "swap"],
  compliance: ["read"],
  contract: ["read"],
  appraisal: ["read"],
  procurement: ["create", "read"],
});

// Manager — approve leave, manage rota, view reports, create appraisals
export const managerRole = ac.newRole({
  staff: ["read", "update"],
  leave: ["create", "read", "approve", "reject", "cancel"],
  rota: ["create", "read", "update", "swap"],
  compliance: ["read", "assign"],
  contract: ["read"],
  appraisal: ["create", "read", "update"],
  report: ["read"],
  audit: ["read"],
  procurement: ["create", "read", "approve", "reject"],
});

// HR/Admin Ops — full staff + compliance + procurement management
export const hrAdminOpsRole = ac.newRole({
  staff: ["create", "read", "update", "delete", "import", "export"],
  leave: ["create", "read", "update", "approve", "reject", "cancel"],
  rota: ["create", "read", "update", "delete", "swap"],
  compliance: ["create", "read", "update", "assign"],
  contract: ["create", "read", "update"],
  appraisal: ["create", "read", "update"],
  report: ["read", "export"],
  audit: ["read"],
  settings: ["read", "update"],
  procurement: ["create", "read", "update", "delete", "approve", "reject", "export"],
});

// Admin — everything (inherits from hrAdminOps + settings + audit export)
export const adminRole = ac.newRole({
  staff: ["create", "read", "update", "delete", "import", "export"],
  leave: ["create", "read", "update", "approve", "reject", "cancel"],
  rota: ["create", "read", "update", "delete", "swap"],
  compliance: ["create", "read", "update", "assign"],
  contract: ["create", "read", "update"],
  appraisal: ["create", "read", "update"],
  report: ["read", "export"],
  audit: ["read"],
  settings: ["read", "update"],
  procurement: ["create", "read", "update", "delete", "approve", "reject", "export"],
});

// ─── Auth factory ─────────────────────────────────────────────────────────────
export function createAuth() {
  const db = createDb();

  return betterAuth({
    database: drizzleAdapter(db, {
      provider: "pg",
      schema: schema,
    }),
    trustedOrigins: [env.CORS_ORIGIN],

    // Local email+password login MUST remain enabled as emergency admin fallback
    // even when LDAP is the primary auth method.
    emailAndPassword: {
      enabled: true,
    },

    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    advanced: {
      defaultCookieAttributes: {
        sameSite: "lax",
        secure: env.NODE_ENV === "production",
        httpOnly: true,
      },
    },
    plugins: [
      admin({
        ac,
        roles: {
          readOnly: readOnlyRole,
          staff: staffRole,
          manager: managerRole,
          hrAdminOps: hrAdminOpsRole,
          admin: adminRole,
        },
        defaultRole: "staff",
        adminRoles: ["admin"],
      }),
    ],
  });
}

export const auth = createAuth();

// Export role type for client-side usage
export type AppRole = "readOnly" | "staff" | "manager" | "hrAdminOps" | "admin";
