import { ORPCError, os } from "@orpc/server";
import {
  readOnlyRole,
  staffRole,
  managerRole,
  hrAdminOpsRole,
  adminRole,
} from "@ndma-dcs-staff-portal/auth";

import type { Context } from "./context";

export const o = os.$context<Context>();

export const publicProcedure = o;

const requireAuth = o.middleware(async ({ context, next }) => {
  if (!context.session?.user) {
    throw new ORPCError("UNAUTHORIZED");
  }
  return next({
    context: {
      session: context.session,
    },
  });
});

export const protectedProcedure = publicProcedure.use(requireAuth);

// ── RBAC middleware factory ───────────────────────────────────────────────────

// Each role's statements are the plain object passed to ac.newRole().
// Better Auth stores them on .statements — access them directly since
// createAccessControl() does not expose a .check() helper.
const roleMap: Record<string, { statements: Record<string, readonly string[]> }> = {
  readOnly: readOnlyRole,
  staff: staffRole,
  manager: managerRole,
  hrAdminOps: hrAdminOpsRole,
  admin: adminRole,
};

/**
 * Create a procedure that requires a specific RBAC permission.
 * Enforces role from the Better Auth session against the statements
 * defined in packages/auth/src/index.ts.
 *
 * Usage:
 *   create: requireRole("work", "create").input(schema).handler(...)
 */
export function requireRole(resource: string, action: string) {
  return protectedProcedure.use(
    o.middleware(async ({ context, next }) => {
      const roleName = (context as Record<string, unknown>).userRole as
        | string
        | null;

      if (!roleName) {
        throw new ORPCError("FORBIDDEN", { message: "No role assigned" });
      }

      const roleDef = roleMap[roleName];
      if (!roleDef) {
        throw new ORPCError("FORBIDDEN", {
          message: `Unknown role: ${roleName}`,
        });
      }

      const allowedActions = roleDef.statements[resource] ?? [];
      const allowed = allowedActions.includes(action);

      if (!allowed) {
        throw new ORPCError("FORBIDDEN", {
          message: `Role '${roleName}' lacks '${action}' on '${resource}'`,
        });
      }

      return next();
    }),
  );
}
