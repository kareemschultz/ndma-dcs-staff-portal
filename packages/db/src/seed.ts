import { db } from "./index";
import { departments } from "./schema/departments";
import { onCallAssignments, onCallSchedules } from "./schema/rota";
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
    {
      id: "user-johnatan",
      name: "Johnatan Sukhlall",
      email: "johnatan.sukhlall@ndma.gov",
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
  await db
    .insert(staffProfiles)
    .values([
      // DCS Leadership
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
      // ASN
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
        isLeadEngineerEligible: false,
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
        isLeadEngineerEligible: false,
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
        isLeadEngineerEligible: false,
        isOnCallEligible: true,
        startDate: new Date("2023-03-01"),
      },
      // Core
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
        isLeadEngineerEligible: false,
        isOnCallEligible: true,
        startDate: new Date("2019-11-01"),
      },
      // Enterprise
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
        isLeadEngineerEligible: false,
        isOnCallEligible: true,
        startDate: new Date("2020-02-01"),
      },
      {
        id: "sp-johnatan",
        userId: "user-johnatan",
        employeeId: "ENT-003",
        departmentId: "dept-enterprise",
        jobTitle: "Enterprise Engineer",
        isTeamLead: false,
        isLeadEngineerEligible: false,
        isOnCallEligible: true,
        startDate: new Date("2021-05-01"),
      },
    ])
    .onConflictDoNothing();

  // ── Demo: current week schedule (published) ────────────────────────────
  // Compute current ISO Monday
  const now = new Date();
  const dayOfWeek = now.getDay();
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const weekStartStr = monday.toISOString().split("T")[0];
  const weekEndStr = sunday.toISOString().split("T")[0];

  const [schedule] = await db
    .insert(onCallSchedules)
    .values({
      id: "sched-demo-current",
      weekStart: weekStartStr,
      weekEnd: weekEndStr,
      status: "published",
      publishedAt: new Date(),
      publishedById: "user-sachin",
      notes: "Seeded demo schedule",
      hasConflicts: false,
    })
    .onConflictDoNothing()
    .returning();

  if (schedule) {
    await db
      .insert(onCallAssignments)
      .values([
        {
          scheduleId: schedule.id,
          staffProfileId: "sp-nicolai",
          role: "lead_engineer",
          isConfirmed: true,
        },
        {
          scheduleId: schedule.id,
          staffProfileId: "sp-kareem",
          role: "asn_support",
          isConfirmed: true,
        },
        {
          scheduleId: schedule.id,
          staffProfileId: "sp-bheesham",
          role: "core_support",
          isConfirmed: true,
        },
        {
          scheduleId: schedule.id,
          staffProfileId: "sp-richie",
          role: "enterprise_support",
          isConfirmed: true,
        },
      ])
      .onConflictDoNothing();
  }

  console.log("✅ Seed complete.");
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
