import type { RouterClient } from "@orpc/server";

import { protectedProcedure, publicProcedure } from "../index";
import { accessRouter } from "./access";
import { importRouter } from "./import";
import { appraisalsRouter } from "./appraisals";
import { auditRouter } from "./audit";
import { complianceRouter } from "./compliance";
import { contractsRouter } from "./contracts";
import { dashboardRouter } from "./dashboard";
import { escalationRouter } from "./escalation";
import { incidentsRouter } from "./incidents";
import { leaveRouter } from "./leave";
import { notificationsRouter } from "./notifications";
import { procurementRouter } from "./procurement";
import { rotaRouter } from "./rota";
import { servicesRouter } from "./services";
import { staffRouter } from "./staff";
import { tempChangesRouter } from "./temp-changes";
import { workRouter } from "./work";

export const appRouter = {
  healthCheck: publicProcedure.handler(() => "OK"),
  privateData: protectedProcedure.handler(({ context }) => ({
    message: "This is private",
    user: context.session?.user,
  })),
  access: accessRouter,
  appraisals: appraisalsRouter,
  audit: auditRouter,
  compliance: complianceRouter,
  contracts: contractsRouter,
  dashboard: dashboardRouter,
  escalation: escalationRouter,
  incidents: incidentsRouter,
  leave: leaveRouter,
  notifications: notificationsRouter,
  procurement: procurementRouter,
  rota: rotaRouter,
  services: servicesRouter,
  staff: staffRouter,
  tempChanges: tempChangesRouter,
  import: importRouter,
  work: workRouter,
};

export type AppRouter = typeof appRouter;
export type AppRouterClient = RouterClient<typeof appRouter>;
