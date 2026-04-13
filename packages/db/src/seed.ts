import { db } from "./index";
import { departments } from "./schema/departments";
import {
  onCallAssignments,
  onCallSchedules,
  rotaImportWarnings,
} from "./schema/rota";
import {
  overlayAssignments,
  overlaySchedules,
  overlayTasks,
  overlayTypes,
} from "./schema/operational-overlays";
import { staffProfiles } from "./schema/staff";
import { user } from "./schema/auth";
import {
  services,
  incidents,
  incidentTimeline,
  incidentAffectedServices,
  incidentResponders,
} from "./schema/incidents";
import { workItems } from "./schema/work";
import { cycles, cycleWorkItems } from "./schema/cycles";
import {
  leaveTypes,
  leaveBalances,
  leaveRequests,
} from "./schema/leave";
import { purchaseRequisitions, prLineItems } from "./schema/procurement";
import { temporaryChanges } from "./schema/temp-changes";
import {
  platformAccounts,
  platformIntegrations,
} from "./schema/access";
import {
  trainingRecords,
  ppeRecords,
  policyAcknowledgements,
} from "./schema/compliance";
import { contracts } from "./schema/contracts";
import { appraisals } from "./schema/appraisals";
import { auditLogs } from "./schema/audit";

async function seed() {
  console.log("🌱 Seeding DCS org structure...");

  // ── Departments ────────────────────────────────────────────────────────
  await db
    .insert(departments)
    .values([
      {
        id: "dept-dcs",
        name: "Data Centre Services",
        code: "DCS",
        description: "Department leadership and administration",
      },
      {
        id: "dept-asn",
        name: "Applications, Systems & NetOps",
        code: "ASN",
        description: "Application systems and network operations",
      },
      {
        id: "dept-core",
        name: "Core Infrastructure",
        code: "CORE",
        description: "Core routing and switching",
      },
      {
        id: "dept-enterprise",
        name: "Enterprise Systems",
        code: "ENT",
        description: "Enterprise network infrastructure",
      },
    ])
    .onConflictDoNothing();

  // ── Users (Better Auth requires user rows before staff_profiles) ────────
  const staffUsers = [
    {
      id: "user-sachin",
      name: "Sachin Ramsuran",
      email: "sachin.ramsuran@ndma.gov",
      emailVerified: true,
    },
    {
      id: "user-ataybia",
      name: "Ataybia Williams",
      email: "ataybia.williams@ndma.gov",
      emailVerified: true,
    },
    {
      id: "user-nicolai",
      name: "Nicolai Mahangi",
      email: "nicolai.mahangi@ndma.gov",
      emailVerified: true,
    },
    {
      id: "user-kareem",
      name: "Kareem Schultz",
      email: "kareem.schultz@ndma.gov",
      emailVerified: true,
    },
    {
      id: "user-shemar",
      name: "Shemar Henry",
      email: "shemar.henry@ndma.gov",
      emailVerified: true,
    },
    {
      id: "user-timothy",
      name: "Timothy Paul",
      email: "timothy.paul@ndma.gov",
      emailVerified: true,
    },
    {
      id: "user-devon",
      name: "Devon Abrams",
      email: "devon.abrams@ndma.gov",
      emailVerified: true,
    },
    {
      id: "user-bheesham",
      name: "Bheesham Ramrattan",
      email: "bheesham.ramrattan@ndma.gov",
      emailVerified: true,
    },
    {
      id: "user-gerard",
      name: "Gerard Budhan",
      email: "gerard.budhan@ndma.gov",
      emailVerified: true,
    },
    {
      id: "user-richie",
      name: "Richie Goring",
      email: "richie.goring@ndma.gov",
      emailVerified: true,
    },
    // Note: ID uses legacy spelling "johnatan" to preserve FK references in existing DBs
    {
      id: "user-johnatan",
      name: "Johnathan Sukhlall",
      email: "johnathan.sukhlall@ndma.gov",
      emailVerified: true,
    },
  ];

  await db
    .insert(user)
    .values(
      staffUsers.map((u) => ({
        ...u,
        createdAt: new Date(),
        updatedAt: new Date(),
      })),
    )
    .onConflictDoNothing();

  // ── Staff Profiles ─────────────────────────────────────────────────────
  // Per DCS roster: ALL on-call engineers are lead-eligible (the spreadsheet
  // shows non-leads serving as Lead Engineer regularly).
  await db
    .insert(staffProfiles)
    .values([
      // DCS Leadership — not on-call
      {
        id: "sp-sachin",
        userId: "user-sachin",
        employeeId: "DCS-001",
        departmentId: "dept-dcs",
        jobTitle: "Manager, DCS & NOC",
        isTeamLead: true,
        isLeadEngineerEligible: false,
        isOnCallEligible: false,
        startDate: new Date("2018-01-01"),
      },
      {
        id: "sp-ataybia",
        userId: "user-ataybia",
        employeeId: "DCS-002",
        departmentId: "dept-dcs",
        jobTitle: "PA / Admin Support",
        isTeamLead: false,
        isLeadEngineerEligible: false,
        isOnCallEligible: false,
        startDate: new Date("2020-06-01"),
      },
      // ASN — all eligible; Nicolai is team lead
      {
        id: "sp-nicolai",
        userId: "user-nicolai",
        employeeId: "ASN-001",
        departmentId: "dept-asn",
        jobTitle: "ASN Team Lead",
        isTeamLead: true,
        isLeadEngineerEligible: true,
        isOnCallEligible: true,
        startDate: new Date("2017-03-01"),
      },
      {
        id: "sp-kareem",
        userId: "user-kareem",
        employeeId: "ASN-002",
        departmentId: "dept-asn",
        jobTitle: "Network Engineer",
        isTeamLead: false,
        isLeadEngineerEligible: true,
        isOnCallEligible: true,
        startDate: new Date("2021-09-01"),
      },
      {
        id: "sp-shemar",
        userId: "user-shemar",
        employeeId: "ASN-003",
        departmentId: "dept-asn",
        jobTitle: "Systems Engineer",
        isTeamLead: false,
        isLeadEngineerEligible: true,
        isOnCallEligible: true,
        startDate: new Date("2022-01-01"),
      },
      {
        id: "sp-timothy",
        userId: "user-timothy",
        employeeId: "ASN-004",
        departmentId: "dept-asn",
        jobTitle: "Network Engineer",
        isTeamLead: false,
        isLeadEngineerEligible: true,
        isOnCallEligible: true,
        startDate: new Date("2023-03-01"),
      },
      // Core — Devon is team lead
      {
        id: "sp-devon",
        userId: "user-devon",
        employeeId: "CORE-001",
        departmentId: "dept-core",
        jobTitle: "Core Infrastructure Lead",
        isTeamLead: true,
        isLeadEngineerEligible: true,
        isOnCallEligible: true,
        startDate: new Date("2016-07-01"),
      },
      {
        id: "sp-bheesham",
        userId: "user-bheesham",
        employeeId: "CORE-002",
        departmentId: "dept-core",
        jobTitle: "Network Engineer",
        isTeamLead: false,
        isLeadEngineerEligible: true,
        isOnCallEligible: true,
        startDate: new Date("2019-11-01"),
      },
      // Enterprise — Gerard is team lead
      {
        id: "sp-gerard",
        userId: "user-gerard",
        employeeId: "ENT-001",
        departmentId: "dept-enterprise",
        jobTitle: "Enterprise Lead",
        isTeamLead: true,
        isLeadEngineerEligible: true,
        isOnCallEligible: true,
        startDate: new Date("2015-04-01"),
      },
      {
        id: "sp-richie",
        userId: "user-richie",
        employeeId: "ENT-002",
        departmentId: "dept-enterprise",
        jobTitle: "Enterprise Engineer",
        isTeamLead: false,
        isLeadEngineerEligible: true,
        isOnCallEligible: true,
        startDate: new Date("2020-02-01"),
      },
      // Note: ID uses legacy spelling to preserve FK references in existing DBs
      {
        id: "sp-johnatan",
        userId: "user-johnatan",
        employeeId: "ENT-003",
        departmentId: "dept-enterprise",
        jobTitle: "Enterprise Engineer",
        isTeamLead: false,
        isLeadEngineerEligible: true,
        isOnCallEligible: true,
        startDate: new Date("2021-05-01"),
      },
    ])
    .onConflictDoNothing();

  // ── 2026 Roster Schedule (Sunday–Saturday weeks) ───────────────────────
  // Derived from the official DCS Excel workbook.
  // Blanks → no assignment created.
  // Ambiguous multi-name entries → import warning created.
  // Devon/Bheesham dual-role weeks → lead assigned, core flagged as warning.
  console.log("🗓️  Seeding 2026 roster...");

  const nameToProfile: Record<string, string> = {
    Kareem: "sp-kareem",
    Devon: "sp-devon",
    Gerard: "sp-gerard",
    Timothy: "sp-timothy",
    Nicolai: "sp-nicolai",
    Bheesham: "sp-bheesham",
    Richie: "sp-richie",
    Johnathan: "sp-johnatan",
    Jonathan: "sp-johnatan",
    Shemar: "sp-shemar",
  };

  type WeekRow = {
    id: string;
    weekStart: string; // YYYY-MM-DD, always a Sunday
    weekEnd: string; // YYYY-MM-DD, always a Saturday
    lead: string | null;
    asn: string | null;
    enterprise: string | string | null; // null | staffId | "AMBIGUOUS:<raw>"
    core: string | null;
  };

  function staffId(name: string | null): string | null {
    if (!name) return null;
    return nameToProfile[name] ?? null;
  }

  // Ambiguous entries are represented as "AMBIGUOUS:<raw text>"
  function ambig(raw: string): string {
    return `AMBIGUOUS:${raw}`;
  }

  const weeks: WeekRow[] = [
    // ── January ──────────────────────────────────────────────────────────
    {
      id: "sched-2026-w01",
      weekStart: "2026-01-04",
      weekEnd: "2026-01-10",
      lead: staffId("Kareem"),
      asn: null,
      enterprise: staffId("Richie"),
      core: staffId("Devon"),
    },
    {
      id: "sched-2026-w02",
      weekStart: "2026-01-11",
      weekEnd: "2026-01-17",
      lead: staffId("Devon"),
      asn: staffId("Shemar"),
      enterprise: staffId("Johnathan"),
      core: ambig("Devon"), // Devon already Lead — flag as warning
    },
    {
      id: "sched-2026-w03",
      weekStart: "2026-01-18",
      weekEnd: "2026-01-24",
      lead: staffId("Gerard"),
      asn: staffId("Timothy"),
      enterprise: null,
      core: staffId("Devon"),
    },
    {
      id: "sched-2026-w04",
      weekStart: "2026-01-25",
      weekEnd: "2026-01-31",
      lead: staffId("Nicolai"),
      asn: null,
      enterprise: staffId("Gerard"),
      core: staffId("Bheesham"),
    },
    // ── February ─────────────────────────────────────────────────────────
    {
      id: "sched-2026-w05",
      weekStart: "2026-02-01",
      weekEnd: "2026-02-07",
      lead: staffId("Bheesham"),
      asn: staffId("Kareem"),
      enterprise: staffId("Richie"),
      core: ambig("Bheesham"), // Bheesham already Lead — flag as warning
    },
    {
      id: "sched-2026-w06",
      weekStart: "2026-02-08",
      weekEnd: "2026-02-14",
      lead: staffId("Richie"),
      asn: staffId("Nicolai"),
      enterprise: null,
      core: staffId("Bheesham"),
    },
    {
      id: "sched-2026-w07",
      weekStart: "2026-02-15",
      weekEnd: "2026-02-21",
      lead: staffId("Johnathan"),
      asn: staffId("Timothy"),
      enterprise: null,
      core: staffId("Bheesham"),
    },
    {
      id: "sched-2026-w08",
      weekStart: "2026-02-22",
      weekEnd: "2026-02-28",
      lead: staffId("Shemar"),
      asn: null,
      enterprise: staffId("Johnathan"),
      core: staffId("Devon"),
    },
    // ── March ─────────────────────────────────────────────────────────────
    {
      id: "sched-2026-w09",
      weekStart: "2026-03-01",
      weekEnd: "2026-03-07",
      lead: staffId("Timothy"),
      asn: null,
      enterprise: staffId("Gerard"),
      core: staffId("Devon"),
    },
    {
      id: "sched-2026-w10",
      weekStart: "2026-03-08",
      weekEnd: "2026-03-14",
      lead: staffId("Kareem"),
      asn: null,
      enterprise: staffId("Johnathan"),
      core: staffId("Devon"),
    },
    {
      id: "sched-2026-w11",
      weekStart: "2026-03-15",
      weekEnd: "2026-03-21",
      lead: staffId("Devon"),
      asn: staffId("Nicolai"),
      enterprise: staffId("Richie"),
      core: ambig("Devon"), // Devon already Lead
    },
    {
      id: "sched-2026-w12",
      weekStart: "2026-03-22",
      weekEnd: "2026-03-28",
      lead: staffId("Gerard"),
      asn: staffId("Shemar"),
      enterprise: null,
      core: staffId("Devon"),
    },
    // ── April ─────────────────────────────────────────────────────────────
    {
      id: "sched-2026-w13",
      weekStart: "2026-03-29",
      weekEnd: "2026-04-04",
      lead: staffId("Nicolai"),
      asn: null,
      enterprise: staffId("Johnathan"),
      core: staffId("Bheesham"),
    },
    {
      id: "sched-2026-w14",
      weekStart: "2026-04-05",
      weekEnd: "2026-04-11",
      lead: staffId("Bheesham"),
      asn: staffId("Timothy"),
      enterprise: staffId("Gerard"),
      core: null,
    },
    {
      id: "sched-2026-w15",
      weekStart: "2026-04-12",
      weekEnd: "2026-04-18",
      lead: staffId("Richie"),
      asn: null,
      enterprise: null,
      core: staffId("Bheesham"),
    },
    {
      id: "sched-2026-w16",
      weekStart: "2026-04-19",
      weekEnd: "2026-04-25",
      lead: staffId("Gerard"),
      asn: staffId("Kareem"),
      enterprise: null,
      core: staffId("Bheesham"),
    },
    {
      id: "sched-2026-w17",
      weekStart: "2026-04-26",
      weekEnd: "2026-05-02",
      lead: staffId("Shemar"),
      asn: null,
      enterprise: staffId("Richie"),
      core: staffId("Bheesham"),
    },
    // ── May ───────────────────────────────────────────────────────────────
    {
      id: "sched-2026-w18",
      weekStart: "2026-05-03",
      weekEnd: "2026-05-09",
      lead: staffId("Timothy"),
      asn: null,
      enterprise: staffId("Johnathan"),
      core: staffId("Devon"),
    },
    {
      id: "sched-2026-w19",
      weekStart: "2026-05-10",
      weekEnd: "2026-05-16",
      lead: staffId("Devon"),
      asn: staffId("Kareem"),
      enterprise: ambig("Gerard/ Shemar"),
      core: null,
    },
    {
      id: "sched-2026-w20",
      weekStart: "2026-05-17",
      weekEnd: "2026-05-23",
      lead: staffId("Richie"),
      asn: staffId("Shemar"),
      enterprise: null,
      core: null,
    },
    {
      id: "sched-2026-w21",
      weekStart: "2026-05-24",
      weekEnd: "2026-05-30",
      lead: staffId("Johnathan"),
      asn: staffId("Timothy"),
      enterprise: null,
      core: null,
    },
    // ── June ──────────────────────────────────────────────────────────────
    {
      id: "sched-2026-w22",
      weekStart: "2026-05-31",
      weekEnd: "2026-06-06",
      lead: staffId("Kareem"),
      asn: null,
      enterprise: ambig("Richie/ Timothy"),
      core: staffId("Bheesham"),
    },
    {
      id: "sched-2026-w23",
      weekStart: "2026-06-07",
      weekEnd: "2026-06-13",
      lead: staffId("Bheesham"),
      asn: staffId("Nicolai"),
      enterprise: ambig("Johnathan/Shemar"),
      core: null,
    },
    {
      id: "sched-2026-w24",
      weekStart: "2026-06-14",
      weekEnd: "2026-06-20",
      lead: staffId("Gerard"),
      asn: staffId("Shemar"),
      enterprise: null,
      core: null,
    },
    {
      id: "sched-2026-w25",
      weekStart: "2026-06-21",
      weekEnd: "2026-06-27",
      lead: staffId("Nicolai"),
      asn: staffId("Timothy"),
      enterprise: ambig("Richie/Timothy"),
      core: null,
    },
    // ── July ──────────────────────────────────────────────────────────────
    {
      id: "sched-2026-w26",
      weekStart: "2026-06-28",
      weekEnd: "2026-07-04",
      lead: staffId("Devon"),
      asn: staffId("Kareem"),
      enterprise: null,
      core: ambig("Devon"), // Devon already Lead
    },
    {
      id: "sched-2026-w27",
      weekStart: "2026-07-05",
      weekEnd: "2026-07-11",
      lead: staffId("Richie"),
      asn: staffId("Nicolai"),
      enterprise: null,
      core: null,
    },
    {
      id: "sched-2026-w28",
      weekStart: "2026-07-12",
      weekEnd: "2026-07-18",
      lead: staffId("Johnathan"),
      asn: staffId("Timothy"),
      enterprise: null,
      core: null,
    },
    {
      id: "sched-2026-w29",
      weekStart: "2026-07-19",
      weekEnd: "2026-07-25",
      lead: staffId("Shemar"),
      asn: null,
      enterprise: null,
      core: null,
    },
    {
      id: "sched-2026-w30",
      weekStart: "2026-07-26",
      weekEnd: "2026-08-01",
      lead: staffId("Timothy"),
      asn: null,
      enterprise: null,
      core: null,
    },
    // ── August ────────────────────────────────────────────────────────────
    {
      id: "sched-2026-w31",
      weekStart: "2026-08-02",
      weekEnd: "2026-08-08",
      lead: staffId("Kareem"),
      asn: null,
      enterprise: null,
      core: staffId("Bheesham"),
    },
    {
      id: "sched-2026-w32",
      weekStart: "2026-08-09",
      weekEnd: "2026-08-15",
      lead: staffId("Bheesham"),
      asn: staffId("Shemar"),
      enterprise: null,
      core: null,
    },
    {
      id: "sched-2026-w33",
      weekStart: "2026-08-16",
      weekEnd: "2026-08-22",
      lead: staffId("Gerard"),
      asn: staffId("Timothy"),
      enterprise: null,
      core: null,
    },
    {
      id: "sched-2026-w34",
      weekStart: "2026-08-23",
      weekEnd: "2026-08-29",
      lead: staffId("Nicolai"),
      asn: null,
      enterprise: null,
      core: null,
    },
    {
      id: "sched-2026-w35",
      weekStart: "2026-08-30",
      weekEnd: "2026-09-05",
      lead: staffId("Bheesham"),
      asn: staffId("Kareem"),
      enterprise: null,
      core: null,
    },
    // ── September ─────────────────────────────────────────────────────────
    {
      id: "sched-2026-w36",
      weekStart: "2026-09-06",
      weekEnd: "2026-09-12",
      lead: staffId("Richie"),
      asn: null,
      enterprise: null,
      core: staffId("Devon"),
    },
    {
      id: "sched-2026-w37",
      weekStart: "2026-09-13",
      weekEnd: "2026-09-19",
      lead: staffId("Johnathan"),
      asn: null,
      enterprise: null,
      core: null,
    },
    {
      id: "sched-2026-w38",
      weekStart: "2026-09-20",
      weekEnd: "2026-09-26",
      lead: staffId("Shemar"),
      asn: null,
      enterprise: null,
      core: null,
    },
    {
      id: "sched-2026-w39",
      weekStart: "2026-09-27",
      weekEnd: "2026-10-03",
      lead: staffId("Timothy"),
      asn: null,
      enterprise: null,
      core: null,
    },
    // ── October ───────────────────────────────────────────────────────────
    {
      id: "sched-2026-w40",
      weekStart: "2026-10-04",
      weekEnd: "2026-10-10",
      lead: staffId("Kareem"),
      asn: null,
      enterprise: null,
      core: staffId("Bheesham"),
    },
    {
      id: "sched-2026-w41",
      weekStart: "2026-10-11",
      weekEnd: "2026-10-17",
      lead: staffId("Bheesham"),
      asn: null,
      enterprise: null,
      core: null,
    },
    {
      id: "sched-2026-w42",
      weekStart: "2026-10-18",
      weekEnd: "2026-10-24",
      lead: staffId("Gerard"),
      asn: null,
      enterprise: null,
      core: null,
    },
    {
      id: "sched-2026-w43",
      weekStart: "2026-10-25",
      weekEnd: "2026-10-31",
      lead: staffId("Nicolai"),
      asn: null,
      enterprise: null,
      core: null,
    },
    // ── November ──────────────────────────────────────────────────────────
    {
      id: "sched-2026-w44",
      weekStart: "2026-11-01",
      weekEnd: "2026-11-07",
      lead: staffId("Devon"),
      asn: null,
      enterprise: null,
      core: ambig("Devon"), // Devon already Lead
    },
    {
      id: "sched-2026-w45",
      weekStart: "2026-11-08",
      weekEnd: "2026-11-14",
      lead: staffId("Richie"),
      asn: null,
      enterprise: null,
      core: null,
    },
    {
      id: "sched-2026-w46",
      weekStart: "2026-11-15",
      weekEnd: "2026-11-21",
      lead: staffId("Johnathan"),
      asn: null,
      enterprise: null,
      core: null,
    },
    {
      id: "sched-2026-w47",
      weekStart: "2026-11-22",
      weekEnd: "2026-11-28",
      lead: staffId("Shemar"),
      asn: null,
      enterprise: null,
      core: null,
    },
    // ── December ──────────────────────────────────────────────────────────
    {
      id: "sched-2026-w48",
      weekStart: "2026-11-29",
      weekEnd: "2026-12-05",
      lead: staffId("Timothy"),
      asn: null,
      enterprise: null,
      core: staffId("Bheesham"),
    },
    {
      id: "sched-2026-w49",
      weekStart: "2026-12-06",
      weekEnd: "2026-12-12",
      lead: staffId("Kareem"),
      asn: null,
      enterprise: null,
      core: null,
    },
    {
      id: "sched-2026-w50",
      weekStart: "2026-12-13",
      weekEnd: "2026-12-19",
      lead: staffId("Bheesham"),
      asn: null,
      enterprise: null,
      core: null,
    },
    {
      id: "sched-2026-w51",
      weekStart: "2026-12-20",
      weekEnd: "2026-12-26",
      lead: staffId("Gerard"),
      asn: null,
      enterprise: null,
      core: null,
    },
    {
      id: "sched-2026-w52",
      weekStart: "2026-12-27",
      weekEnd: "2027-01-02",
      lead: staffId("Nicolai"),
      asn: null,
      enterprise: null,
      core: null,
    },
  ];

  for (const week of weeks) {
    const [schedule] = await db
      .insert(onCallSchedules)
      .values({
        id: week.id,
        weekStart: week.weekStart,
        weekEnd: week.weekEnd,
        status: "published",
        publishedAt: new Date("2026-01-01"),
        publishedById: "user-sachin",
        notes: "Imported from 2026 DCS on-call roster",
        isLegacyImport: true,
        hasConflicts: false,
      })
      .onConflictDoNothing()
      .returning();

    if (!schedule) continue; // already seeded

    const roles: Array<{
      role: "lead_engineer" | "asn_support" | "enterprise_support" | "core_support";
      profileId: string | null;
    }> = [
      { role: "lead_engineer", profileId: week.lead },
      { role: "asn_support", profileId: week.asn },
      { role: "enterprise_support", profileId: week.enterprise },
      { role: "core_support", profileId: week.core },
    ];

    for (const { role, profileId } of roles) {
      if (!profileId) continue;

      if (profileId.startsWith("AMBIGUOUS:")) {
        // Create an import warning for this slot
        const rawValue = profileId.replace("AMBIGUOUS:", "");
        await db
          .insert(rotaImportWarnings)
          .values({
            scheduleId: schedule.id,
            weekStart: week.weekStart,
            weekEnd: week.weekEnd,
            role,
            rawValue,
            status: "pending",
          })
          .onConflictDoNothing();
        continue;
      }

      await db
        .insert(onCallAssignments)
        .values({
          scheduleId: schedule.id,
          staffProfileId: profileId,
          role,
          isConfirmed: true,
          isLegacyImport: true,
        })
        .onConflictDoNothing();
    }
  }

  // ── Operational Overlays ───────────────────────────────────────────────
  console.log("📋 Seeding operational overlays...");

  const [cleaningType] = await db
    .insert(overlayTypes)
    .values({
      id: "ot-cleaning",
      name: "Cleaning Server Room",
      description: "Quarterly server room cleaning and inspection duties",
      category: "facilities",
    })
    .onConflictDoNothing()
    .returning();

  const [maintenanceType] = await db
    .insert(overlayTypes)
    .values({
      id: "ot-maintenance",
      name: "Routine Maintenance DCS",
      description: "Quarterly DCS routine maintenance, fire detection tests, and dust filter cleaning",
      category: "maintenance",
    })
    .onConflictDoNothing()
    .returning();

  // Quarter date ranges for 2026
  const quarters = [
    { q: "Q1", year: "2026", start: "2026-01-01", end: "2026-03-31" },
    { q: "Q2", year: "2026", start: "2026-04-01", end: "2026-06-30" },
    { q: "Q3", year: "2026", start: "2026-07-01", end: "2026-09-30" },
    { q: "Q4", year: "2026", start: "2026-10-01", end: "2026-12-31" },
  ] as const;

  // Cleaning Server Room assignments per quarter
  const cleaningAssignees: Record<string, string[]> = {
    Q1: ["sp-bheesham", "sp-johnatan"],
    Q2: ["sp-kareem", "sp-richie"],
    Q3: ["sp-gerard", "sp-timothy"],
    Q4: ["sp-devon", "sp-shemar"],
  };

  // Routine Maintenance DCS assignments per quarter
  // External entities (NOC, Asif, Core) use externalLabel
  type MaintenanceEntry = { staffId?: string; external?: string; role?: string };
  const maintenanceAssignees: Record<string, MaintenanceEntry[]> = {
    Q1: [
      { staffId: "sp-kareem" },
      { staffId: "sp-nicolai" },
      { staffId: "sp-johnatan" },
      { external: "NOC" },
      { external: "Asif", role: "Test Fire Detection System (March)" },
    ],
    Q2: [
      { staffId: "sp-richie" },
      { staffId: "sp-johnatan" },
      { external: "NOC" },
      { external: "Asif", role: "Test Fire Detection System" },
      { external: "Core", role: "Clean Dust Filters (June)" },
    ],
    Q3: [
      { staffId: "sp-timothy" },
      { staffId: "sp-johnatan" },
      { external: "NOC" },
      { external: "Asif", role: "Test Fire Detection System (September)" },
    ],
    Q4: [
      { staffId: "sp-shemar" },
      { staffId: "sp-johnatan" },
      { external: "NOC" },
      { external: "Asif", role: "Test Fire Detection System" },
      { external: "Core", role: "Clean Dust Filters (December)" },
    ],
  };

  // Default tasks for Cleaning Server Room
  const cleaningTasks = [
    "Inspect all server rack equipment",
    "Remove dust from servers and networking equipment",
    "Verify cooling airflow and HVAC systems",
    "Check cable management and labelling",
    "Log inspection findings",
  ];

  // Default tasks for Routine Maintenance
  const maintenanceTasks = [
    "Test fire detection system",
    "Inspect rack conditions",
    "Verify UPS battery health",
    "Check access control logs",
    "Log maintenance findings",
  ];

  for (const { q, year, start, end } of quarters) {
    // Create cleaning schedule
    const cleaningId = `os-cleaning-${year}-${q}`;
    if (cleaningType) {
      const [cs] = await db
        .insert(overlaySchedules)
        .values({
          id: cleaningId,
          overlayTypeId: cleaningType.id,
          quarter: q,
          year,
          startDate: start,
          endDate: end,
        })
        .onConflictDoNothing()
        .returning();

      if (cs) {
        for (const spId of cleaningAssignees[q] ?? []) {
          await db
            .insert(overlayAssignments)
            .values({ overlayScheduleId: cs.id, staffProfileId: spId })
            .onConflictDoNothing();
        }

        const [firstAssignee] = cleaningAssignees[q] ?? [];
        for (const taskName of cleaningTasks) {
          await db
            .insert(overlayTasks)
            .values({
              overlayScheduleId: cs.id,
              name: taskName,
              assignedToId: firstAssignee ?? null,
              dueDate: end, // due by end of quarter
            })
            .onConflictDoNothing();
        }
      }
    }

    // Create maintenance schedule
    const maintId = `os-maintenance-${year}-${q}`;
    if (maintenanceType) {
      const [ms] = await db
        .insert(overlaySchedules)
        .values({
          id: maintId,
          overlayTypeId: maintenanceType.id,
          quarter: q,
          year,
          startDate: start,
          endDate: end,
        })
        .onConflictDoNothing()
        .returning();

      if (ms) {
        for (const entry of maintenanceAssignees[q] ?? []) {
          await db
            .insert(overlayAssignments)
            .values({
              overlayScheduleId: ms.id,
              staffProfileId: entry.staffId ?? null,
              externalLabel: entry.external ?? null,
              roleDescription: entry.role ?? null,
            })
            .onConflictDoNothing();
        }

        const [firstInternal] = (maintenanceAssignees[q] ?? []).filter(
          (e) => e.staffId,
        );
        for (const taskName of maintenanceTasks) {
          await db
            .insert(overlayTasks)
            .values({
              overlayScheduleId: ms.id,
              name: taskName,
              assignedToId: firstInternal?.staffId ?? null,
              dueDate: end,
            })
            .onConflictDoNothing();
        }
      }
    }
  }

  // ── Services ───────────────────────────────────────────────────────────────
  console.log("🌐 Seeding services...");
  await db.insert(services).values([
    { id: "svc-dcn",        name: "Data Centre Network",              departmentId: "dept-core",       isActive: true },
    { id: "svc-inet",       name: "Internet Gateway",                 departmentId: "dept-core",       isActive: true },
    { id: "svc-ad",         name: "Active Directory / LDAP",          departmentId: "dept-asn",        isActive: true },
    { id: "svc-monitoring", name: "Zabbix Monitoring",                departmentId: "dept-asn",        isActive: true },
    { id: "svc-ipam",       name: "phpIPAM – IP Address Management",  departmentId: "dept-asn",        isActive: true },
    { id: "svc-email",      name: "Email Server",                     departmentId: "dept-enterprise", isActive: true },
  ]).onConflictDoNothing();

  // ── Work Items ─────────────────────────────────────────────────────────────
  console.log("🗂️  Seeding work items...");
  await db.insert(workItems).values([
    { id: "wi-001", title: "Migrate core switches to new firmware", type: "project",  status: "in_progress", priority: "critical", assignedToId: "sp-devon",     description: "Upgrade Cisco Catalyst switches in Rack A and B to firmware 17.11.1a to resolve CVE-2025-20188.", dueDate: "2026-04-25", createdById: "user-sachin" },
    { id: "wi-002", title: "Update Zabbix monitoring templates",   type: "routine",   status: "done",        priority: "medium",   assignedToId: "sp-kareem",    description: "Refresh all SNMP templates to align with upgraded switch firmware versions.", dueDate: "2026-03-20", completedAt: new Date("2026-03-18"), createdById: "user-sachin" },
    { id: "wi-003", title: "Configure redundant BGP peers on edge routers", type: "project", status: "in_progress", priority: "high", assignedToId: "sp-nicolai", description: "Add secondary BGP peer with upstream provider to eliminate single-point-of-failure on internet uplinks.", dueDate: "2026-04-30", createdById: "user-sachin" },
    { id: "wi-004", title: "Audit AD group memberships",           type: "routine",   status: "review",      priority: "medium",   assignedToId: "sp-kareem",    description: "Quarterly review of all Active Directory security groups — remove stale and orphaned accounts.", dueDate: "2026-04-15", createdById: "user-sachin" },
    { id: "wi-005", title: "Install new server rack in Room B",    type: "project",   status: "todo",        priority: "high",     assignedToId: "sp-gerard",    description: "Physical installation of 42U rack, PDU, and patch panel. Coordinate with facilities for power provisioning.", dueDate: "2026-05-15", createdById: "user-sachin" },
    { id: "wi-006", title: "Renew SSL certificate for staff portal", type: "routine", status: "in_progress", priority: "critical", assignedToId: "sp-shemar",    description: "Portal SSL certificate expires 2026-04-18. Renew via Let's Encrypt and update all reverse proxy configs.", dueDate: "2026-04-10", createdById: "user-sachin" },
    { id: "wi-007", title: "Document network topology for Q2 2026", type: "routine",  status: "done",        priority: "low",      assignedToId: "sp-timothy",   description: "Update Visio diagrams and Confluence pages with current physical and logical topology.", dueDate: "2026-03-31", completedAt: new Date("2026-03-28"), createdById: "user-sachin" },
    { id: "wi-008", title: "Configure phpIPAM subnets for new campus", type: "routine", status: "in_progress", priority: "medium", assignedToId: "sp-kareem",   description: "Allocate and document /24 subnets for the new Annex building. Assign to relevant VLANs.", dueDate: "2026-04-22", createdById: "user-sachin" },
    { id: "wi-009", title: "Review and update DRP procedures",     type: "project",   status: "todo",        priority: "high",     assignedToId: "sp-sachin",    description: "Annual review of Disaster Recovery Plan. Update RTO/RPO targets and test failover procedures.", dueDate: "2026-05-30", createdById: "user-sachin" },
    { id: "wi-010", title: "Patch management cycle – April 2026",  type: "routine",   status: "in_progress", priority: "medium",   assignedToId: "sp-bheesham",  description: "Apply OS patches to all Windows and Linux servers per the monthly patch schedule.", dueDate: "2026-04-10", createdById: "user-sachin" },
    { id: "wi-011", title: "Setup Grafana dashboard for LTE monitoring", type: "project", status: "review", priority: "medium",   assignedToId: "sp-shemar",    description: "Create Grafana panels pulling from LTE gateway SNMP metrics to monitor signal quality and throughput.", dueDate: "2026-04-20", createdById: "user-sachin" },
    { id: "wi-012", title: "Decommission legacy PBX system",       type: "project",   status: "done",        priority: "medium",   assignedToId: "sp-devon",     description: "Remove Panasonic KX-TDA100 PBX and migrate remaining extensions to MS Teams calling.", dueDate: "2026-03-15", completedAt: new Date("2026-03-12"), createdById: "user-sachin" },
  ]).onConflictDoNothing();

  // ── Incidents ──────────────────────────────────────────────────────────────
  console.log("🚨 Seeding incidents...");
  await db.insert(incidents).values([
    { id: "inc-001", title: "Internet connectivity degraded on primary uplink", severity: "sev2", status: "investigating", detectedAt: new Date("2026-04-13T08:15:00Z"), description: "Multiple users reporting slow internet. Monitoring shows 60% packet loss on primary ISP uplink. Failover not triggered automatically.", commanderId: "sp-kareem", createdById: "user-kareem" },
    { id: "inc-002", title: "Active Directory authentication failures – Sev1", severity: "sev1", status: "resolved", detectedAt: new Date("2026-04-08T14:30:00Z"), resolvedAt: new Date("2026-04-08T17:45:00Z"), description: "Domain controller NDMA-DC01 unresponsive causing widespread login failures. Root cause: disk full on system drive.", commanderId: "sp-nicolai", createdById: "user-nicolai" },
    { id: "inc-003", title: "Zabbix monitoring outage – no alerts firing", severity: "sev3", status: "closed", detectedAt: new Date("2026-04-01T09:00:00Z"), resolvedAt: new Date("2026-04-01T11:20:00Z"), description: "Zabbix server ran out of memory due to uncapped discovery rules. Alerts stopped firing for 2h 20m.", commanderId: "sp-shemar", createdById: "user-shemar" },
    { id: "inc-004", title: "Fortigate HA failover triggered unexpectedly", severity: "sev2", status: "mitigating", detectedAt: new Date("2026-04-12T22:05:00Z"), description: "Primary Fortigate unit failed HA heartbeat check, causing failover to secondary. Traffic restored but root cause unknown.", commanderId: "sp-devon", createdById: "user-devon" },
  ]).onConflictDoNothing();

  await db.insert(incidentAffectedServices).values([
    { incidentId: "inc-001", serviceId: "svc-inet" },
    { incidentId: "inc-002", serviceId: "svc-ad" },
    { incidentId: "inc-002", serviceId: "svc-email" },
    { incidentId: "inc-003", serviceId: "svc-monitoring" },
    { incidentId: "inc-004", serviceId: "svc-dcn" },
    { incidentId: "inc-004", serviceId: "svc-inet" },
  ]).onConflictDoNothing();

  await db.insert(incidentResponders).values([
    { incidentId: "inc-001", staffProfileId: "sp-kareem", role: "commander",  joinedAt: new Date("2026-04-13T08:20:00Z") },
    { incidentId: "inc-001", staffProfileId: "sp-devon",  role: "technical",  joinedAt: new Date("2026-04-13T08:25:00Z") },
    { incidentId: "inc-001", staffProfileId: "sp-bheesham", role: "observer", joinedAt: new Date("2026-04-13T08:30:00Z") },
    { incidentId: "inc-002", staffProfileId: "sp-nicolai", role: "commander", joinedAt: new Date("2026-04-08T14:35:00Z") },
    { incidentId: "inc-002", staffProfileId: "sp-kareem",  role: "technical", joinedAt: new Date("2026-04-08T14:40:00Z") },
    { incidentId: "inc-004", staffProfileId: "sp-devon",   role: "commander", joinedAt: new Date("2026-04-12T22:10:00Z") },
    { incidentId: "inc-004", staffProfileId: "sp-gerard",  role: "technical", joinedAt: new Date("2026-04-12T22:15:00Z") },
  ]).onConflictDoNothing();

  await db.insert(incidentTimeline).values([
    { incidentId: "inc-001", eventType: "detected",     content: "NOC alerted by user reports and Zabbix ICMP loss alert on ISP-uplink-01.", staffProfileId: "sp-kareem", createdAt: new Date("2026-04-13T08:15:00Z") },
    { incidentId: "inc-001", eventType: "status_change", content: "Status changed to Investigating. ISP TAC ticket #IRN-9842 opened.", staffProfileId: "sp-kareem", createdAt: new Date("2026-04-13T08:35:00Z") },
    { incidentId: "inc-002", eventType: "detected",     content: "Help desk flood — 15 tickets in 10 minutes reporting login failures.", staffProfileId: "sp-nicolai", createdAt: new Date("2026-04-08T14:30:00Z") },
    { incidentId: "inc-002", eventType: "status_change", content: "Root cause identified: /var/log partition full at 100%. Services restarted after log rotation.", staffProfileId: "sp-nicolai", createdAt: new Date("2026-04-08T16:10:00Z") },
    { incidentId: "inc-002", eventType: "resolved",     content: "NDMA-DC01 fully operational. All authentication services restored. Monitoring alert threshold adjusted.", staffProfileId: "sp-kareem", createdAt: new Date("2026-04-08T17:45:00Z") },
    { incidentId: "inc-004", eventType: "detected",     content: "HA failover alert received from Fortigate SNMP trap at 22:05. Secondary unit active.", staffProfileId: "sp-devon", createdAt: new Date("2026-04-12T22:05:00Z") },
    { incidentId: "inc-004", eventType: "status_change", content: "Mitigation in progress. Primary unit restarted. Investigating HA heartbeat interface for faults.", staffProfileId: "sp-devon", createdAt: new Date("2026-04-12T23:00:00Z") },
  ]).onConflictDoNothing();

  // ── Leave Types + Balances + Requests ──────────────────────────────────────
  console.log("🏖️  Seeding leave data...");
  await db.insert(leaveTypes).values([
    { id: "lt-annual",    name: "Annual Leave",    code: "ANNUAL",    defaultAnnualAllowance: 20, maxCarryOver: 5,  requiresApproval: true,  isPaidLeave: true,  isActive: true },
    { id: "lt-sick",      name: "Sick Leave",      code: "SICK",      defaultAnnualAllowance: 14, maxCarryOver: 0,  requiresApproval: false, isPaidLeave: true,  isActive: true },
    { id: "lt-emergency", name: "Emergency Leave", code: "EMERGENCY", defaultAnnualAllowance: 5,  maxCarryOver: 0,  requiresApproval: true,  isPaidLeave: true,  isActive: true },
    { id: "lt-study",     name: "Study Leave",     code: "STUDY",     defaultAnnualAllowance: 10, maxCarryOver: 0,  requiresApproval: true,  isPaidLeave: true,  isActive: true },
  ]).onConflictDoNothing();

  await db.insert(leaveBalances).values([
    { id: "lb-kareem-annual",  staffProfileId: "sp-kareem",   leaveTypeId: "lt-annual",    contractYearStart: "2026-01-01", contractYearEnd: "2026-12-31", entitlement: 20, used: 5, carriedOver: 2, adjustment: 0 },
    { id: "lb-shemar-annual",  staffProfileId: "sp-shemar",   leaveTypeId: "lt-annual",    contractYearStart: "2026-01-01", contractYearEnd: "2026-12-31", entitlement: 20, used: 0, carriedOver: 3, adjustment: 0 },
    { id: "lb-bheesham-annual",staffProfileId: "sp-bheesham", leaveTypeId: "lt-annual",    contractYearStart: "2026-01-01", contractYearEnd: "2026-12-31", entitlement: 20, used: 2, carriedOver: 0, adjustment: 0 },
    { id: "lb-timothy-annual", staffProfileId: "sp-timothy",  leaveTypeId: "lt-annual",    contractYearStart: "2026-01-01", contractYearEnd: "2026-12-31", entitlement: 20, used: 0, carriedOver: 4, adjustment: 0 },
    { id: "lb-timothy-study",  staffProfileId: "sp-timothy",  leaveTypeId: "lt-study",     contractYearStart: "2026-01-01", contractYearEnd: "2026-12-31", entitlement: 10, used: 10, carriedOver: 0, adjustment: 0 },
    { id: "lb-richie-sick",    staffProfileId: "sp-richie",   leaveTypeId: "lt-sick",      contractYearStart: "2026-01-01", contractYearEnd: "2026-12-31", entitlement: 14, used: 1, carriedOver: 0, adjustment: 0 },
    { id: "lb-gerard-annual",  staffProfileId: "sp-gerard",   leaveTypeId: "lt-annual",    contractYearStart: "2026-01-01", contractYearEnd: "2026-12-31", entitlement: 20, used: 3, carriedOver: 5, adjustment: 0 },
  ]).onConflictDoNothing();

  await db.insert(leaveRequests).values([
    { id: "lr-001", staffProfileId: "sp-kareem",   leaveTypeId: "lt-annual",    startDate: "2026-03-10", endDate: "2026-03-14", totalDays: 5, reason: "Family vacation",          status: "approved",  approvedById: "user-sachin", overlapOverride: false },
    { id: "lr-002", staffProfileId: "sp-shemar",   leaveTypeId: "lt-annual",    startDate: "2026-04-21", endDate: "2026-04-23", totalDays: 3, reason: "Personal commitments",     status: "pending",   overlapOverride: false },
    { id: "lr-003", staffProfileId: "sp-bheesham", leaveTypeId: "lt-annual",    startDate: "2026-02-16", endDate: "2026-02-17", totalDays: 2, reason: "Medical appointment",      status: "approved",  approvedById: "user-sachin", overlapOverride: false },
    { id: "lr-004", staffProfileId: "sp-timothy",  leaveTypeId: "lt-study",     startDate: "2026-02-02", endDate: "2026-02-13", totalDays: 10, reason: "CCNP exam preparation",   status: "approved",  approvedById: "user-sachin", overlapOverride: false },
    { id: "lr-005", staffProfileId: "sp-richie",   leaveTypeId: "lt-sick",      startDate: "2026-04-09", endDate: "2026-04-09", totalDays: 1, reason: "Flu",                      status: "approved",  approvedById: "user-sachin", overlapOverride: false },
    { id: "lr-006", staffProfileId: "sp-gerard",   leaveTypeId: "lt-annual",    startDate: "2026-03-23", endDate: "2026-03-25", totalDays: 3, reason: "Annual leave",             status: "approved",  approvedById: "user-sachin", overlapOverride: false },
    { id: "lr-007", staffProfileId: "sp-nicolai",  leaveTypeId: "lt-emergency", startDate: "2026-04-28", endDate: "2026-04-29", totalDays: 2, reason: "Family emergency",         status: "pending",   overlapOverride: false },
  ]).onConflictDoNothing();

  // ── Procurement ────────────────────────────────────────────────────────────
  console.log("🛒 Seeding procurement...");
  await db.insert(purchaseRequisitions).values([
    { id: "pr-001", title: "Network switches – server room expansion", priority: "high",   status: "draft",     requestedById: "sp-devon",    departmentId: "dept-core",       currency: "TTD", totalEstimatedCost: "62000.00", vendorName: "Cisco Systems",      justification: "Capacity upgrade for Room B rack installation. Current switches at 90% port utilisation." },
    { id: "pr-002", title: "Zabbix Enterprise annual licence renewal",  priority: "medium", status: "submitted", requestedById: "sp-kareem",   departmentId: "dept-asn",        currency: "TTD", totalEstimatedCost: "18500.00", vendorName: "Zabbix LLC",         justification: "Existing licence expires May 2026. Required for continued monitoring alerting." },
    { id: "pr-003", title: "UPS replacement batteries – Room A",        priority: "urgent", status: "approved",  requestedById: "sp-gerard",   departmentId: "dept-enterprise", currency: "TTD", totalEstimatedCost: "9800.00",  vendorName: "APC by Schneider",   justification: "Batteries last replaced 4 years ago. Self-test failure rate at 30%.", approvedById: "user-sachin", approvedAt: new Date("2026-04-10") },
    { id: "pr-004", title: "Cat6A cabling and patch panels – Annex",    priority: "medium", status: "received",  requestedById: "sp-bheesham", departmentId: "dept-core",       currency: "TTD", totalEstimatedCost: "14200.00", vendorName: "CommScope",          justification: "Structured cabling for 48-port Annex network expansion." },
  ]).onConflictDoNothing();

  await db.insert(prLineItems).values([
    { prId: "pr-001", description: "Cisco Catalyst 9300-24P switch",           quantity: 4,  unitCost: "12000.00", unit: "unit", totalCost: "48000.00" },
    { prId: "pr-001", description: "Cisco SmartNet support (1 year)",           quantity: 4,  unitCost: "3500.00",  unit: "unit", totalCost: "14000.00" },
    { prId: "pr-002", description: "Zabbix Enterprise licence (500 hosts)",     quantity: 1,  unitCost: "18500.00", unit: "licence", totalCost: "18500.00" },
    { prId: "pr-003", description: "APC RBC5 replacement battery cartridge",    quantity: 7,  unitCost: "1400.00",  unit: "unit", totalCost: "9800.00" },
    { prId: "pr-004", description: "Cat6A shielded cable (500m drum)",          quantity: 3,  unitCost: "2800.00",  unit: "drum", totalCost: "8400.00" },
    { prId: "pr-004", description: "24-port keystone patch panel",              quantity: 6,  unitCost: "300.00",   unit: "unit", totalCost: "1800.00" },
    { prId: "pr-004", description: "Cable management D-rings and velcro ties",  quantity: 1,  unitCost: "400.00",   unit: "lot",  totalCost: "400.00"  },
    { prId: "pr-004", description: "RJ45 toolless keystone jacks (box of 100)", quantity: 4,  unitCost: "400.00",   unit: "box",  totalCost: "1600.00" },
  ]).onConflictDoNothing();

  // ── Temporary Changes ──────────────────────────────────────────────────────
  console.log("🔄 Seeding temporary changes...");
  await db.insert(temporaryChanges).values([
    { id: "tc-001", title: "Public IP for Cisco TAC vendor VPN access",         status: "active",     category: "public_ip_exposure",  riskLevel: "high",     environment: "production", systemName: "Fortigate SSL-VPN", publicIp: "203.0.113.45", externalExposure: true,  ownerType: "external_contact", externalAgencyName: "Cisco Systems", externalAgencyType: "vendor",  implementationDate: "2026-04-01", removeByDate: "2026-06-30", createdById: "user-kareem" },
    { id: "tc-002", title: "Temporary VLAN 999 for external audit team",        status: "active",     category: "temporary_access",    riskLevel: "medium",   environment: "production", systemName: "Core Switch Stack",                             externalExposure: false, ownerType: "external_contact", externalAgencyName: "ISACA Audit Firm", externalAgencyType: "government", implementationDate: "2026-04-10", removeByDate: "2026-04-17", createdById: "user-sachin" },
    { id: "tc-003", title: "Bypass firewall rule for treasury data transfer",   status: "overdue",    category: "temporary_change",    riskLevel: "high",     environment: "production", systemName: "Fortigate FW01",                                externalExposure: false, ownerType: "internal_staff", ownerId: "sp-devon", implementationDate: "2026-03-20", removeByDate: "2026-04-05", createdById: "user-devon" },
    { id: "tc-004", title: "Test server exposed in DMZ for API integration",   status: "active",     category: "temporary_service",   riskLevel: "critical", environment: "staging",    systemName: "DMZ-TESTSVR-01", publicIp: "198.51.100.22", internalIp: "10.10.50.22", port: "8443", protocol: "tcp", externalExposure: true, ownerType: "internal_staff", ownerId: "sp-shemar", implementationDate: "2026-04-05", removeByDate: "2026-05-31", createdById: "user-shemar" },
    { id: "tc-005", title: "Static NAT for NDMA Head Office remote audit",     status: "removed",    category: "temporary_access",    riskLevel: "low",      environment: "production", systemName: "Edge Router", actualRemovalDate: "2026-03-31", implementationDate: "2026-03-01", removeByDate: "2026-03-31", createdById: "user-kareem" },
  ]).onConflictDoNothing();

  // ── Platform Integrations & Accounts ──────────────────────────────────────
  console.log("🔌 Seeding access data...");
  await db.insert(platformIntegrations).values([
    { id: "pi-ad",    name: "NDMA Active Directory", platform: "ad",      hasApi: true,  syncEnabled: true,  syncDirection: "inbound",     manualFallbackAllowed: true,  status: "active",  syncFrequencyMinutes: 60 },
    { id: "pi-vpn",   name: "Fortigate SSL-VPN",     platform: "vpn",     hasApi: true,  syncEnabled: true,  syncDirection: "inbound",     manualFallbackAllowed: true,  status: "active",  syncFrequencyMinutes: 30 },
    { id: "pi-ipam",  name: "phpIPAM",                platform: "phpipam", hasApi: true,  syncEnabled: false, syncDirection: "bidirectional", manualFallbackAllowed: true, status: "inactive" },
  ]).onConflictDoNothing();

  await db.insert(platformAccounts).values([
    { id: "pa-001", platform: "vpn",     accountIdentifier: "kareem.schultz",    displayName: "Kareem Schultz",    affiliationType: "ndma_internal", authSource: "active_directory", status: "active",   vpnEnabled: true,  syncMode: "synced",  staffProfileId: "sp-kareem",   integrationId: "pi-vpn" },
    { id: "pa-002", platform: "ad",      accountIdentifier: "n.mahangi",         displayName: "Nicolai Mahangi",   affiliationType: "ndma_internal", authSource: "local",            status: "active",   vpnEnabled: false, syncMode: "synced",  staffProfileId: "sp-nicolai",  integrationId: "pi-ad"  },
    { id: "pa-003", platform: "vpn",     accountIdentifier: "devon.abrams",      displayName: "Devon Abrams",      affiliationType: "ndma_internal", authSource: "active_directory", status: "active",   vpnEnabled: true,  syncMode: "synced",  staffProfileId: "sp-devon",    integrationId: "pi-vpn" },
    { id: "pa-004", platform: "vpn",     accountIdentifier: "b.ramrattan",       displayName: "Bheesham Ramrattan",affiliationType: "ndma_internal", authSource: "active_directory", status: "active",   vpnEnabled: true,  syncMode: "synced",  staffProfileId: "sp-bheesham", integrationId: "pi-vpn" },
    { id: "pa-005", platform: "ad",      accountIdentifier: "g.budhan",          displayName: "Gerard Budhan",     affiliationType: "ndma_internal", authSource: "local",            status: "active",   vpnEnabled: false, syncMode: "synced",  staffProfileId: "sp-gerard",   integrationId: "pi-ad"  },
    { id: "pa-006", platform: "phpipam", accountIdentifier: "rg_admin",          displayName: "Richie Goring",     affiliationType: "ndma_internal", authSource: "local",            status: "active",   vpnEnabled: false, syncMode: "manual",  staffProfileId: "sp-richie"  },
    { id: "pa-007", platform: "zabbix",  accountIdentifier: "shemar.henry",      displayName: "Shemar Henry",      affiliationType: "ndma_internal", authSource: "local",            status: "active",   vpnEnabled: false, syncMode: "manual",  staffProfileId: "sp-shemar"  },
    { id: "pa-008", platform: "vpn",     accountIdentifier: "vendor.cisco.tac",  displayName: "Cisco TAC Account", affiliationType: "vendor",        authSource: "local",            status: "active",   vpnEnabled: true,  syncMode: "manual"  },
  ]).onConflictDoNothing();

  // ── Compliance Training + PPE ──────────────────────────────────────────────
  console.log("🎓 Seeding compliance records...");
  await db.insert(trainingRecords).values([
    { id: "tr-001", staffProfileId: "sp-kareem",   trainingName: "Network Security Fundamentals",         provider: "CISCO NetAcad",        completedDate: "2025-03-01", expiryDate: "2027-03-01", status: "current",        notes: "Online certification course" },
    { id: "tr-002", staffProfileId: "sp-shemar",   trainingName: "ITIL 4 Foundation",                     provider: "Axelos / PeopleCert",  completedDate: "2025-06-15", expiryDate: "2026-12-31", status: "current",        notes: "Pass grade 85%" },
    { id: "tr-003", staffProfileId: "sp-bheesham", trainingName: "Cisco CCNA",                            provider: "Cisco Systems",        completedDate: "2023-11-20", expiryDate: "2026-05-01", status: "expiring_soon",  notes: "Recertification required" },
    { id: "tr-004", staffProfileId: "sp-timothy",  trainingName: "CompTIA Network+",                      provider: "CompTIA",              completedDate: "2022-09-10", expiryDate: "2025-09-10", status: "expired",        notes: "Renewal overdue" },
    { id: "tr-005", staffProfileId: "sp-devon",    trainingName: "Data Centre Operations",                provider: "EPI (Edge Performance Index)", completedDate: "2024-06-01", expiryDate: "2027-06-01", status: "current", notes: "Includes hands-on rack assessment" },
    { id: "tr-006", staffProfileId: "sp-gerard",   trainingName: "Enterprise Network Design",             provider: "Cisco Systems",        completedDate: "2025-01-15", expiryDate: "2027-01-15", status: "current",        notes: "CCNP Enterprise Design module" },
    { id: "tr-007", staffProfileId: "sp-richie",   trainingName: "Fire Safety Awareness",                 provider: "NDMA HSE Unit",        completedDate: "2023-04-30", expiryDate: "2026-04-30", status: "expiring_soon",  notes: "Annual renewal required" },
    { id: "tr-008", staffProfileId: "sp-nicolai",  trainingName: "Project Management Professional (PMP)", provider: "PMI",                  completedDate: "2024-01-20", expiryDate: "2028-01-01", status: "current",        notes: "PDU renewal programme active" },
  ]).onConflictDoNothing();

  await db.insert(ppeRecords).values([
    { id: "ppe-001", staffProfileId: "sp-bheesham", itemName: "Safety Boots",           issuedDate: "2025-01-15", expiryDate: "2026-01-15", condition: "worn",    status: "expired" },
    { id: "ppe-002", staffProfileId: "sp-gerard",   itemName: "Hard Hat",               issuedDate: "2024-06-01", expiryDate: "2026-06-01", condition: "good",    status: "current" },
    { id: "ppe-003", staffProfileId: "sp-devon",    itemName: "High-Visibility Vest",   issuedDate: "2025-03-01", expiryDate: "2026-03-01", condition: "good",    status: "expired" },
    { id: "ppe-004", staffProfileId: "sp-kareem",   itemName: "Safety Glasses",         issuedDate: "2025-11-01", expiryDate: "2026-11-01", condition: "good",    status: "current" },
  ]).onConflictDoNothing();

  await db.insert(policyAcknowledgements).values([
    { id: "pk-001", staffProfileId: "sp-kareem",   policyName: "Acceptable Use Policy",          policyVersion: "3.1", acknowledgedAt: new Date("2026-01-15") },
    { id: "pk-002", staffProfileId: "sp-shemar",   policyName: "Acceptable Use Policy",          policyVersion: "3.1", acknowledgedAt: new Date("2026-01-15") },
    { id: "pk-003", staffProfileId: "sp-devon",    policyName: "Data Centre Physical Security",  policyVersion: "2.0", acknowledgedAt: new Date("2026-02-01") },
    { id: "pk-004", staffProfileId: "sp-bheesham", policyName: "Incident Response Policy",       policyVersion: "1.4", acknowledgedAt: new Date("2026-02-15") },
  ]).onConflictDoNothing();

  // ── Cycles ─────────────────────────────────────────────────────────────────
  console.log("🔁 Seeding cycles...");
  await db.insert(cycles).values([
    { id: "cyc-001", name: "Q1 2026 Ops Sprint",    period: "quarterly", startDate: "2026-01-01", endDate: "2026-03-31", status: "completed", goal: "Complete firmware upgrades, topology docs, and PBX decommission.", createdById: "user-sachin" },
    { id: "cyc-002", name: "Q2 2026 Infrastructure", period: "quarterly", startDate: "2026-04-01", endDate: "2026-06-30", status: "active",    goal: "Server room expansion, BGP redundancy, DRP review.", createdById: "user-sachin" },
    { id: "cyc-003", name: "April Patch Sprint",    period: "monthly",   startDate: "2026-04-01", endDate: "2026-04-30", status: "active",    goal: "Complete all April patching, SSL renewal, and monitoring improvements.", createdById: "user-sachin" },
  ]).onConflictDoNothing();

  await db.insert(cycleWorkItems).values([
    { cycleId: "cyc-001", workItemId: "wi-002" },
    { cycleId: "cyc-001", workItemId: "wi-007" },
    { cycleId: "cyc-001", workItemId: "wi-012" },
    { cycleId: "cyc-002", workItemId: "wi-001" },
    { cycleId: "cyc-002", workItemId: "wi-003" },
    { cycleId: "cyc-002", workItemId: "wi-004" },
    { cycleId: "cyc-002", workItemId: "wi-005" },
    { cycleId: "cyc-002", workItemId: "wi-009" },
    { cycleId: "cyc-003", workItemId: "wi-006" },
    { cycleId: "cyc-003", workItemId: "wi-008" },
    { cycleId: "cyc-003", workItemId: "wi-010" },
    { cycleId: "cyc-003", workItemId: "wi-011" },
  ]).onConflictDoNothing();

  // ── Contracts ──────────────────────────────────────────────────────────────
  console.log("📋 Seeding contracts...");
  await db.insert(contracts).values([
    { id: "con-001", staffProfileId: "sp-nicolai",  contractType: "permanent",    startDate: "2017-03-01", renewalReminderDays: 90, status: "active",        salary: "18500.00", currency: "TTD" },
    { id: "con-002", staffProfileId: "sp-kareem",   contractType: "permanent",    startDate: "2021-09-01", renewalReminderDays: 90, status: "active",        salary: "16000.00", currency: "TTD" },
    { id: "con-003", staffProfileId: "sp-bheesham", contractType: "permanent",    startDate: "2019-11-01", renewalReminderDays: 90, status: "active",        salary: "17200.00", currency: "TTD" },
    { id: "con-004", staffProfileId: "sp-richie",   contractType: "contract",     startDate: "2024-01-01", endDate: "2026-06-30", renewalReminderDays: 60, status: "expiring_soon", salary: "14000.00", currency: "TTD", notes: "Contract renewal under discussion with HR." },
    { id: "con-005", staffProfileId: "sp-timothy",  contractType: "probationary", startDate: "2023-03-01", endDate: "2024-03-01", renewalReminderDays: 30, status: "expired",   salary: "12500.00", currency: "TTD", notes: "Converted to permanent after probation." },
  ]).onConflictDoNothing();

  // ── Appraisals ─────────────────────────────────────────────────────────────
  console.log("📝 Seeding appraisals...");
  await db.insert(appraisals).values([
    { id: "apr-001", staffProfileId: "sp-kareem",   periodStart: "2025-01-01", periodEnd: "2025-12-31", status: "completed",   rating: "meets_expectations",  reviewedById: "sp-sachin", goals: "Improve network documentation coverage to 90%.", achievements: "Completed CCNA recertification. Led Zabbix migration.", completedDate: "2026-02-10" },
    { id: "apr-002", staffProfileId: "sp-shemar",   periodStart: "2026-01-01", periodEnd: "2026-06-30", status: "in_progress",  reviewedById: "sp-sachin", goals: "ITIL certification and incident response improvement.", achievements: "Completed ITIL 4 Foundation with distinction." },
    { id: "apr-003", staffProfileId: "sp-timothy",  periodStart: "2026-01-01", periodEnd: "2026-06-30", status: "scheduled",   scheduledDate: "2026-05-15", reviewedById: "sp-sachin", goals: "CompTIA Network+ renewal and BGP implementation experience." },
    { id: "apr-004", staffProfileId: "sp-bheesham", periodStart: "2025-01-01", periodEnd: "2025-12-31", status: "overdue",     reviewedById: "sp-sachin", goals: "CCNA renewal and patch management ownership.", notes: "Review delayed — reschedule for April 2026." },
  ]).onConflictDoNothing();

  // ── Audit Log ──────────────────────────────────────────────────────────────
  console.log("📒 Seeding audit log...");
  await db.insert(auditLogs).values([
    { actorId: "user-sachin", actorName: "Sachin Ramsuran", actorRole: "admin", action: "rota.schedule.publish",   module: "rota",       resourceType: "on_call_schedule",    resourceId: "sched-2026-w14", afterValue: { status: "published" },                            ipAddress: "10.0.0.5",  userAgent: "Mozilla/5.0", createdAt: new Date("2026-04-06T09:05:00Z") },
    { actorId: "user-kareem", actorName: "Kareem Schultz",  actorRole: "staff", action: "incident.create",         module: "incident",   resourceType: "incident",            resourceId: "inc-001",        afterValue: { title: "Internet connectivity degraded", severity: "sev2" }, ipAddress: "10.0.0.12", userAgent: "Mozilla/5.0", createdAt: new Date("2026-04-13T08:16:00Z") },
    { actorId: "user-kareem", actorName: "Kareem Schultz",  actorRole: "staff", action: "incident.timeline.add",   module: "incident",   resourceType: "incident_timeline",   resourceId: "inc-001",        afterValue: { eventType: "status_change" },                     ipAddress: "10.0.0.12", userAgent: "Mozilla/5.0", createdAt: new Date("2026-04-13T08:35:00Z") },
    { actorId: "user-sachin", actorName: "Sachin Ramsuran", actorRole: "admin", action: "leave.request.approve",   module: "leave",      resourceType: "leave_request",       resourceId: "lr-001",         beforeValue: { status: "pending" }, afterValue: { status: "approved" }, ipAddress: "10.0.0.5", userAgent: "Mozilla/5.0", createdAt: new Date("2026-03-08T10:20:00Z") },
    { actorId: "user-sachin", actorName: "Sachin Ramsuran", actorRole: "admin", action: "leave.request.approve",   module: "leave",      resourceType: "leave_request",       resourceId: "lr-003",         beforeValue: { status: "pending" }, afterValue: { status: "approved" }, ipAddress: "10.0.0.5", userAgent: "Mozilla/5.0", createdAt: new Date("2026-02-14T11:00:00Z") },
    { actorId: "user-devon",  actorName: "Devon Abrams",    actorRole: "staff", action: "temp_change.create",      module: "changes",    resourceType: "temporary_change",    resourceId: "tc-003",         afterValue: { title: "Bypass firewall rule for treasury data transfer" }, ipAddress: "10.0.0.8", userAgent: "Mozilla/5.0", createdAt: new Date("2026-03-20T14:00:00Z") },
    { actorId: "user-sachin", actorName: "Sachin Ramsuran", actorRole: "admin", action: "procurement.pr.approve",  module: "procurement", resourceType: "purchase_requisition", resourceId: "pr-003",        beforeValue: { status: "submitted" }, afterValue: { status: "approved" }, ipAddress: "10.0.0.5", userAgent: "Mozilla/5.0", createdAt: new Date("2026-04-10T09:45:00Z") },
    { actorId: "user-kareem", actorName: "Kareem Schultz",  actorRole: "staff", action: "work_item.create",        module: "work",       resourceType: "work_item",           resourceId: "wi-006",         afterValue: { title: "Renew SSL certificate for staff portal", priority: "critical" }, ipAddress: "10.0.0.12", userAgent: "Mozilla/5.0", createdAt: new Date("2026-04-07T15:30:00Z") },
    { actorId: "user-nicolai",actorName: "Nicolai Mahangi", actorRole: "staff", action: "incident.status_change",  module: "incident",   resourceType: "incident",            resourceId: "inc-002",        beforeValue: { status: "investigating" }, afterValue: { status: "resolved" }, ipAddress: "10.0.0.9", userAgent: "Mozilla/5.0", createdAt: new Date("2026-04-08T17:45:00Z") },
    { actorId: "user-sachin", actorName: "Sachin Ramsuran", actorRole: "admin", action: "staff.profile.update",    module: "staff",      resourceType: "staff_profile",       resourceId: "sp-richie",      beforeValue: { status: "active" }, afterValue: { status: "active", jobTitle: "Enterprise Engineer" }, ipAddress: "10.0.0.5", userAgent: "Mozilla/5.0", createdAt: new Date("2026-03-01T08:00:00Z") },
  ]).onConflictDoNothing();

  console.log("✅ Seed complete.");
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
