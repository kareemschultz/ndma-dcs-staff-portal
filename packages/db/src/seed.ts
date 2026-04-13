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
        parentId: "dept-dcs",
      },
      {
        id: "dept-core",
        name: "Core Infrastructure",
        code: "CORE",
        description: "Core routing and switching",
        parentId: "dept-dcs",
      },
      {
        id: "dept-enterprise",
        name: "Enterprise Systems",
        code: "ENT",
        description: "Enterprise network infrastructure",
        parentId: "dept-dcs",
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

  console.log("✅ Seed complete.");
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
