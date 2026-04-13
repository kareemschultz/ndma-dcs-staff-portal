import { auth } from "@ndma-dcs-staff-portal/auth";
import type { Context as HonoContext } from "hono";

export type CreateContextOptions = {
  context: HonoContext;
};

export async function createContext({ context }: CreateContextOptions) {
  const session = await auth.api.getSession({
    headers: context.req.raw.headers,
  });

  // Extract audit metadata from the incoming request
  const ipAddress =
    context.req.header("x-forwarded-for")?.split(",")[0]?.trim() ??
    context.req.header("x-real-ip") ??
    null;
  const userAgent = context.req.header("user-agent") ?? null;

  // Extract role from Better Auth admin plugin (stored on user record)
  const userRole = session?.user
    ? ((session.user as Record<string, unknown>).role as string) ?? "staff"
    : null;

  // Request ID for audit log correlation (from upstream proxy or generated)
  const requestId = context.req.header("x-request-id") ?? crypto.randomUUID();

  return {
    auth: null,
    session,
    ipAddress,
    userAgent,
    userRole,
    requestId,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
