import type { RouterClient } from "@orpc/server";

import { protectedProcedure, publicProcedure } from "../index";
import { accessRouter } from "./access";
import { importRouter } from "./import";
import { appraisalsRouter } from "./appraisals";
import { appraisalCyclesRouter } from "./appraisal-cycles";
import { auditRouter } from "./audit";
import { complianceRouter } from "./compliance";
import { contractsRouter } from "./contracts";
import { attendanceExceptionsRouter } from "./attendance-exceptions";
import { departmentAssignmentsRouter } from "./department-assignments";
import { departmentsRouter } from "./departments";
import { dashboardRouter } from "./dashboard";
import { escalationRouter } from "./escalation";
import { hrDocsRouter } from "./hr-docs";
import { incidentsRouter } from "./incidents";
import { leaveRouter } from "./leave";
import { notificationsRouter } from "./notifications";
import { ppeRouter } from "./ppe";
import { procurementRouter } from "./procurement";
import { rotaRouter } from "./rota";
import { servicesRouter } from "./services";
import { staffRouter } from "./staff";
import { tempChangesRouter } from "./temp-changes";
import { calloutsRouter } from "./callouts";
import { timesheetsRouter } from "./timesheets";
import { workRouter } from "./work";
import { cyclesRouter } from "./cycles";
import { workloadRouter } from "./workload";
import { automationRouter } from "./automation";
import { overlaysRouter } from "./overlays";
import { analyticsRouter } from "./analytics";

export const appRouter = {
  healthCheck: publicProcedure.handler(() => "OK"),
  privateData: protectedProcedure.handler(({ context }) => ({
    message: "This is private",
    user: context.session?.user,
  })),
  access: accessRouter,
  appraisals: appraisalsRouter,
  appraisalCycles: appraisalCyclesRouter,
  audit: auditRouter,
  compliance: complianceRouter,
  attendance: attendanceExceptionsRouter,
  contracts: contractsRouter,
  departmentAssignments: departmentAssignmentsRouter,
  departments: departmentsRouter,
  dashboard: dashboardRouter,
  escalation: escalationRouter,
  hrDocs: hrDocsRouter,
  incidents: incidentsRouter,
  leave: leaveRouter,
  notifications: notificationsRouter,
  ppe: ppeRouter,
  procurement: procurementRouter,
  rota: rotaRouter,
  services: servicesRouter,
  staff: staffRouter,
  tempChanges: tempChangesRouter,
  callouts: calloutsRouter,
  import: importRouter,
  work: workRouter,
  timesheets: timesheetsRouter,
  cycles: cyclesRouter,
  workload: workloadRouter,
  automation: automationRouter,
  overlays: overlaysRouter,
  analytics: analyticsRouter,
};

export type AppRouter = typeof appRouter;
export type AppRouterClient = RouterClient<typeof appRouter>;
