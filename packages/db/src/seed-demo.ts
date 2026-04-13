/**
 * seed-demo.ts — Demo operational data for DCS Ops Center
 *
 * Run:    bun --env-file=../../apps/server/.env src/seed-demo.ts
 * Clear:  bun --env-file=../../apps/server/.env src/seed-demo.ts --clear
 *
 * This file is intentionally separate from seed.ts (org structure / auth data)
 * so all demo data can be removed in one command before going to production.
 *
 * All inserts use onConflictDoNothing() — safe to re-run multiple times.
 * All IDs are prefixed so clearDemo() can target them precisely.
 */

import { and, inArray } from "drizzle-orm";
import { db } from "./index";
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

// ── ID registries (for targeted clear) ─────────────────────────────────────

const DEMO_SERVICE_IDS       = ["svc-dcn", "svc-inet", "svc-ad", "svc-monitoring", "svc-ipam", "svc-email"] as const;
const DEMO_WORK_ITEM_IDS     = ["wi-001","wi-002","wi-003","wi-004","wi-005","wi-006","wi-007","wi-008","wi-009","wi-010","wi-011","wi-012"] as const;
const DEMO_INCIDENT_IDS      = ["inc-001","inc-002","inc-003","inc-004"] as const;
const DEMO_LEAVE_TYPE_IDS    = ["lt-annual","lt-sick","lt-emergency","lt-study"] as const;
const DEMO_LEAVE_BALANCE_IDS = ["lb-kareem-annual","lb-shemar-annual","lb-bheesham-annual","lb-timothy-annual","lb-timothy-study","lb-richie-sick","lb-gerard-annual"] as const;
const DEMO_LEAVE_REQUEST_IDS = ["lr-001","lr-002","lr-003","lr-004","lr-005","lr-006","lr-007"] as const;
const DEMO_PR_IDS            = ["pr-001","pr-002","pr-003","pr-004"] as const;
const DEMO_TC_IDS            = ["tc-001","tc-002","tc-003","tc-004","tc-005"] as const;
const DEMO_INTEGRATION_IDS   = ["pi-ad","pi-vpn","pi-ipam"] as const;
const DEMO_ACCOUNT_IDS       = ["pa-001","pa-002","pa-003","pa-004","pa-005","pa-006","pa-007","pa-008"] as const;
const DEMO_TRAINING_IDS      = ["tr-001","tr-002","tr-003","tr-004","tr-005","tr-006","tr-007","tr-008"] as const;
const DEMO_PPE_IDS           = ["ppe-001","ppe-002","ppe-003","ppe-004"] as const;
const DEMO_POLICY_ACK_IDS    = ["pk-001","pk-002","pk-003","pk-004"] as const;
const DEMO_CYCLE_IDS         = ["cyc-001","cyc-002","cyc-003"] as const;
const DEMO_CONTRACT_IDS      = ["con-001","con-002","con-003","con-004","con-005"] as const;
const DEMO_APPRAISAL_IDS     = ["apr-001","apr-002","apr-003","apr-004"] as const;

// ── Clear all demo data (reverse FK order) ──────────────────────────────────

async function clearDemo() {
  console.log("🧹 Clearing demo data...");

  // Audit log rows seeded by demo (no FK — filter by known resourceIds)
  const demoResourceIds = [
    ...DEMO_INCIDENT_IDS,
    ...DEMO_LEAVE_REQUEST_IDS,
    ...DEMO_PR_IDS,
    ...DEMO_WORK_ITEM_IDS,
    "sp-richie",
  ];
  await db.delete(auditLogs).where(inArray(auditLogs.resourceId, demoResourceIds));

  // Cycle links (before cycles and work items)
  await db.delete(cycleWorkItems).where(inArray(cycleWorkItems.cycleId, [...DEMO_CYCLE_IDS]));
  await db.delete(cycles).where(inArray(cycles.id, [...DEMO_CYCLE_IDS]));

  // Appraisals
  await db.delete(appraisals).where(inArray(appraisals.id, [...DEMO_APPRAISAL_IDS]));

  // Contracts
  await db.delete(contracts).where(inArray(contracts.id, [...DEMO_CONTRACT_IDS]));

  // Compliance
  await db.delete(policyAcknowledgements).where(inArray(policyAcknowledgements.id, [...DEMO_POLICY_ACK_IDS]));
  await db.delete(ppeRecords).where(inArray(ppeRecords.id, [...DEMO_PPE_IDS]));
  await db.delete(trainingRecords).where(inArray(trainingRecords.id, [...DEMO_TRAINING_IDS]));

  // Access
  await db.delete(platformAccounts).where(inArray(platformAccounts.id, [...DEMO_ACCOUNT_IDS]));
  await db.delete(platformIntegrations).where(inArray(platformIntegrations.id, [...DEMO_INTEGRATION_IDS]));

  // Temp changes
  await db.delete(temporaryChanges).where(inArray(temporaryChanges.id, [...DEMO_TC_IDS]));

  // Procurement
  await db.delete(prLineItems).where(inArray(prLineItems.prId, [...DEMO_PR_IDS]));
  await db.delete(purchaseRequisitions).where(inArray(purchaseRequisitions.id, [...DEMO_PR_IDS]));

  // Leave (child → parent)
  await db.delete(leaveRequests).where(inArray(leaveRequests.id, [...DEMO_LEAVE_REQUEST_IDS]));
  await db.delete(leaveBalances).where(inArray(leaveBalances.id, [...DEMO_LEAVE_BALANCE_IDS]));
  await db.delete(leaveTypes).where(inArray(leaveTypes.id, [...DEMO_LEAVE_TYPE_IDS]));

  // Incidents (child tables first)
  await db.delete(incidentTimeline).where(inArray(incidentTimeline.incidentId, [...DEMO_INCIDENT_IDS]));
  await db.delete(incidentResponders).where(inArray(incidentResponders.incidentId, [...DEMO_INCIDENT_IDS]));
  await db.delete(incidentAffectedServices).where(inArray(incidentAffectedServices.incidentId, [...DEMO_INCIDENT_IDS]));
  await db.delete(incidents).where(inArray(incidents.id, [...DEMO_INCIDENT_IDS]));

  // Work items
  await db.delete(workItems).where(inArray(workItems.id, [...DEMO_WORK_ITEM_IDS]));

  // Services
  await db.delete(services).where(inArray(services.id, [...DEMO_SERVICE_IDS]));

  console.log("✅ Demo data cleared.");
  process.exit(0);
}

// ── Seed all demo data ──────────────────────────────────────────────────────

async function seedDemo() {
  console.log("🌱 Seeding demo operational data...");

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
    { incidentId: "inc-001", staffProfileId: "sp-kareem",   role: "commander",  joinedAt: new Date("2026-04-13T08:20:00Z") },
    { incidentId: "inc-001", staffProfileId: "sp-devon",    role: "technical",  joinedAt: new Date("2026-04-13T08:25:00Z") },
    { incidentId: "inc-001", staffProfileId: "sp-bheesham", role: "observer",   joinedAt: new Date("2026-04-13T08:30:00Z") },
    { incidentId: "inc-002", staffProfileId: "sp-nicolai",  role: "commander",  joinedAt: new Date("2026-04-08T14:35:00Z") },
    { incidentId: "inc-002", staffProfileId: "sp-kareem",   role: "technical",  joinedAt: new Date("2026-04-08T14:40:00Z") },
    { incidentId: "inc-004", staffProfileId: "sp-devon",    role: "commander",  joinedAt: new Date("2026-04-12T22:10:00Z") },
    { incidentId: "inc-004", staffProfileId: "sp-gerard",   role: "technical",  joinedAt: new Date("2026-04-12T22:15:00Z") },
  ]).onConflictDoNothing();

  await db.insert(incidentTimeline).values([
    { incidentId: "inc-001", eventType: "detected",      content: "NOC alerted by user reports and Zabbix ICMP loss alert on ISP-uplink-01.", staffProfileId: "sp-kareem",  createdAt: new Date("2026-04-13T08:15:00Z") },
    { incidentId: "inc-001", eventType: "status_change", content: "Status changed to Investigating. ISP TAC ticket #IRN-9842 opened.", staffProfileId: "sp-kareem",  createdAt: new Date("2026-04-13T08:35:00Z") },
    { incidentId: "inc-002", eventType: "detected",      content: "Help desk flood — 15 tickets in 10 minutes reporting login failures.", staffProfileId: "sp-nicolai", createdAt: new Date("2026-04-08T14:30:00Z") },
    { incidentId: "inc-002", eventType: "status_change", content: "Root cause identified: /var/log partition full at 100%. Services restarted after log rotation.", staffProfileId: "sp-nicolai", createdAt: new Date("2026-04-08T16:10:00Z") },
    { incidentId: "inc-002", eventType: "resolved",      content: "NDMA-DC01 fully operational. All authentication services restored. Monitoring alert threshold adjusted.", staffProfileId: "sp-kareem", createdAt: new Date("2026-04-08T17:45:00Z") },
    { incidentId: "inc-004", eventType: "detected",      content: "HA failover alert received from Fortigate SNMP trap at 22:05. Secondary unit active.", staffProfileId: "sp-devon",   createdAt: new Date("2026-04-12T22:05:00Z") },
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
    { id: "lb-kareem-annual",   staffProfileId: "sp-kareem",   leaveTypeId: "lt-annual",    contractYearStart: "2026-01-01", contractYearEnd: "2026-12-31", entitlement: 20, used: 5,  carriedOver: 2, adjustment: 0 },
    { id: "lb-shemar-annual",   staffProfileId: "sp-shemar",   leaveTypeId: "lt-annual",    contractYearStart: "2026-01-01", contractYearEnd: "2026-12-31", entitlement: 20, used: 0,  carriedOver: 3, adjustment: 0 },
    { id: "lb-bheesham-annual", staffProfileId: "sp-bheesham", leaveTypeId: "lt-annual",    contractYearStart: "2026-01-01", contractYearEnd: "2026-12-31", entitlement: 20, used: 2,  carriedOver: 0, adjustment: 0 },
    { id: "lb-timothy-annual",  staffProfileId: "sp-timothy",  leaveTypeId: "lt-annual",    contractYearStart: "2026-01-01", contractYearEnd: "2026-12-31", entitlement: 20, used: 0,  carriedOver: 4, adjustment: 0 },
    { id: "lb-timothy-study",   staffProfileId: "sp-timothy",  leaveTypeId: "lt-study",     contractYearStart: "2026-01-01", contractYearEnd: "2026-12-31", entitlement: 10, used: 10, carriedOver: 0, adjustment: 0 },
    { id: "lb-richie-sick",     staffProfileId: "sp-richie",   leaveTypeId: "lt-sick",      contractYearStart: "2026-01-01", contractYearEnd: "2026-12-31", entitlement: 14, used: 1,  carriedOver: 0, adjustment: 0 },
    { id: "lb-gerard-annual",   staffProfileId: "sp-gerard",   leaveTypeId: "lt-annual",    contractYearStart: "2026-01-01", contractYearEnd: "2026-12-31", entitlement: 20, used: 3,  carriedOver: 5, adjustment: 0 },
  ]).onConflictDoNothing();

  await db.insert(leaveRequests).values([
    { id: "lr-001", staffProfileId: "sp-kareem",   leaveTypeId: "lt-annual",    startDate: "2026-03-10", endDate: "2026-03-14", totalDays: 5,  reason: "Family vacation",         status: "approved", approvedById: "user-sachin", overlapOverride: false },
    { id: "lr-002", staffProfileId: "sp-shemar",   leaveTypeId: "lt-annual",    startDate: "2026-04-21", endDate: "2026-04-23", totalDays: 3,  reason: "Personal commitments",    status: "pending",  overlapOverride: false },
    { id: "lr-003", staffProfileId: "sp-bheesham", leaveTypeId: "lt-annual",    startDate: "2026-02-16", endDate: "2026-02-17", totalDays: 2,  reason: "Medical appointment",     status: "approved", approvedById: "user-sachin", overlapOverride: false },
    { id: "lr-004", staffProfileId: "sp-timothy",  leaveTypeId: "lt-study",     startDate: "2026-02-02", endDate: "2026-02-13", totalDays: 10, reason: "CCNP exam preparation",   status: "approved", approvedById: "user-sachin", overlapOverride: false },
    { id: "lr-005", staffProfileId: "sp-richie",   leaveTypeId: "lt-sick",      startDate: "2026-04-09", endDate: "2026-04-09", totalDays: 1,  reason: "Flu",                     status: "approved", approvedById: "user-sachin", overlapOverride: false },
    { id: "lr-006", staffProfileId: "sp-gerard",   leaveTypeId: "lt-annual",    startDate: "2026-03-23", endDate: "2026-03-25", totalDays: 3,  reason: "Annual leave",            status: "approved", approvedById: "user-sachin", overlapOverride: false },
    { id: "lr-007", staffProfileId: "sp-nicolai",  leaveTypeId: "lt-emergency", startDate: "2026-04-28", endDate: "2026-04-29", totalDays: 2,  reason: "Family emergency",        status: "pending",  overlapOverride: false },
  ]).onConflictDoNothing();

  // ── Procurement ────────────────────────────────────────────────────────────
  console.log("🛒 Seeding procurement...");
  await db.insert(purchaseRequisitions).values([
    { id: "pr-001", title: "Network switches – server room expansion", priority: "high",   status: "draft",     requestedById: "sp-devon",    departmentId: "dept-core",       currency: "TTD", totalEstimatedCost: "62000.00", vendorName: "Cisco Systems",    justification: "Capacity upgrade for Room B rack installation. Current switches at 90% port utilisation." },
    { id: "pr-002", title: "Zabbix Enterprise annual licence renewal",  priority: "medium", status: "submitted", requestedById: "sp-kareem",   departmentId: "dept-asn",        currency: "TTD", totalEstimatedCost: "18500.00", vendorName: "Zabbix LLC",       justification: "Existing licence expires May 2026. Required for continued monitoring alerting." },
    { id: "pr-003", title: "UPS replacement batteries – Room A",        priority: "urgent", status: "approved",  requestedById: "sp-gerard",   departmentId: "dept-enterprise", currency: "TTD", totalEstimatedCost: "9800.00",  vendorName: "APC by Schneider", justification: "Batteries last replaced 4 years ago. Self-test failure rate at 30%.", approvedById: "user-sachin", approvedAt: new Date("2026-04-10") },
    { id: "pr-004", title: "Cat6A cabling and patch panels – Annex",    priority: "medium", status: "received",  requestedById: "sp-bheesham", departmentId: "dept-core",       currency: "TTD", totalEstimatedCost: "14200.00", vendorName: "CommScope",        justification: "Structured cabling for 48-port Annex network expansion." },
  ]).onConflictDoNothing();

  await db.insert(prLineItems).values([
    { prId: "pr-001", description: "Cisco Catalyst 9300-24P switch",           quantity: 4, unitCost: "12000.00", unit: "unit",    totalCost: "48000.00" },
    { prId: "pr-001", description: "Cisco SmartNet support (1 year)",           quantity: 4, unitCost: "3500.00",  unit: "unit",    totalCost: "14000.00" },
    { prId: "pr-002", description: "Zabbix Enterprise licence (500 hosts)",     quantity: 1, unitCost: "18500.00", unit: "licence", totalCost: "18500.00" },
    { prId: "pr-003", description: "APC RBC5 replacement battery cartridge",    quantity: 7, unitCost: "1400.00",  unit: "unit",    totalCost: "9800.00"  },
    { prId: "pr-004", description: "Cat6A shielded cable (500m drum)",          quantity: 3, unitCost: "2800.00",  unit: "drum",    totalCost: "8400.00"  },
    { prId: "pr-004", description: "24-port keystone patch panel",              quantity: 6, unitCost: "300.00",   unit: "unit",    totalCost: "1800.00"  },
    { prId: "pr-004", description: "Cable management D-rings and velcro ties",  quantity: 1, unitCost: "400.00",   unit: "lot",     totalCost: "400.00"   },
    { prId: "pr-004", description: "RJ45 toolless keystone jacks (box of 100)", quantity: 4, unitCost: "400.00",   unit: "box",     totalCost: "1600.00"  },
  ]).onConflictDoNothing();

  // ── Temporary Changes ──────────────────────────────────────────────────────
  console.log("🔄 Seeding temporary changes...");
  await db.insert(temporaryChanges).values([
    { id: "tc-001", title: "Public IP for Cisco TAC vendor VPN access",       status: "active",   category: "public_ip_exposure", riskLevel: "high",     environment: "production", systemName: "Fortigate SSL-VPN",    publicIp: "203.0.113.45", externalExposure: true,  ownerType: "external_contact", externalAgencyName: "Cisco Systems",   externalAgencyType: "vendor",     implementationDate: "2026-04-01", removeByDate: "2026-06-30", createdById: "user-kareem" },
    { id: "tc-002", title: "Temporary VLAN 999 for external audit team",      status: "active",   category: "temporary_access",   riskLevel: "medium",   environment: "production", systemName: "Core Switch Stack",                              externalExposure: false, ownerType: "external_contact", externalAgencyName: "ISACA Audit Firm", externalAgencyType: "government", implementationDate: "2026-04-10", removeByDate: "2026-04-17", createdById: "user-sachin" },
    { id: "tc-003", title: "Bypass firewall rule for treasury data transfer",  status: "overdue",  category: "temporary_change",   riskLevel: "high",     environment: "production", systemName: "Fortigate FW01",                                 externalExposure: false, ownerType: "internal_staff",   ownerId: "sp-devon",                                        implementationDate: "2026-03-20", removeByDate: "2026-04-05", createdById: "user-devon" },
    { id: "tc-004", title: "Test server exposed in DMZ for API integration",  status: "active",   category: "temporary_service",  riskLevel: "critical", environment: "staging",    systemName: "DMZ-TESTSVR-01",       publicIp: "198.51.100.22", internalIp: "10.10.50.22", port: "8443", protocol: "tcp", externalExposure: true, ownerType: "internal_staff", ownerId: "sp-shemar", implementationDate: "2026-04-05", removeByDate: "2026-05-31", createdById: "user-shemar" },
    { id: "tc-005", title: "Static NAT for NDMA Head Office remote audit",    status: "removed",  category: "temporary_access",   riskLevel: "low",      environment: "production", systemName: "Edge Router",                                    actualRemovalDate: "2026-03-31", implementationDate: "2026-03-01", removeByDate: "2026-03-31", createdById: "user-kareem" },
  ]).onConflictDoNothing();

  // ── Platform Integrations & Accounts ──────────────────────────────────────
  console.log("🔌 Seeding access data...");
  await db.insert(platformIntegrations).values([
    { id: "pi-ad",   name: "NDMA Active Directory", platform: "ad",      hasApi: true,  syncEnabled: true,  syncDirection: "inbound",       manualFallbackAllowed: true, status: "active",   syncFrequencyMinutes: 60 },
    { id: "pi-vpn",  name: "Fortigate SSL-VPN",     platform: "vpn",     hasApi: true,  syncEnabled: true,  syncDirection: "inbound",       manualFallbackAllowed: true, status: "active",   syncFrequencyMinutes: 30 },
    { id: "pi-ipam", name: "phpIPAM",                platform: "phpipam", hasApi: true,  syncEnabled: false, syncDirection: "bidirectional", manualFallbackAllowed: true, status: "inactive" },
  ]).onConflictDoNothing();

  await db.insert(platformAccounts).values([
    { id: "pa-001", platform: "vpn",     accountIdentifier: "kareem.schultz",    displayName: "Kareem Schultz",     affiliationType: "ndma_internal", authSource: "active_directory", status: "active", vpnEnabled: true,  syncMode: "synced", staffProfileId: "sp-kareem",   integrationId: "pi-vpn" },
    { id: "pa-002", platform: "ad",      accountIdentifier: "n.mahangi",         displayName: "Nicolai Mahangi",    affiliationType: "ndma_internal", authSource: "local",            status: "active", vpnEnabled: false, syncMode: "synced", staffProfileId: "sp-nicolai",  integrationId: "pi-ad"  },
    { id: "pa-003", platform: "vpn",     accountIdentifier: "devon.abrams",      displayName: "Devon Abrams",       affiliationType: "ndma_internal", authSource: "active_directory", status: "active", vpnEnabled: true,  syncMode: "synced", staffProfileId: "sp-devon",    integrationId: "pi-vpn" },
    { id: "pa-004", platform: "vpn",     accountIdentifier: "b.ramrattan",       displayName: "Bheesham Ramrattan", affiliationType: "ndma_internal", authSource: "active_directory", status: "active", vpnEnabled: true,  syncMode: "synced", staffProfileId: "sp-bheesham", integrationId: "pi-vpn" },
    { id: "pa-005", platform: "ad",      accountIdentifier: "g.budhan",          displayName: "Gerard Budhan",      affiliationType: "ndma_internal", authSource: "local",            status: "active", vpnEnabled: false, syncMode: "synced", staffProfileId: "sp-gerard",   integrationId: "pi-ad"  },
    { id: "pa-006", platform: "phpipam", accountIdentifier: "rg_admin",          displayName: "Richie Goring",      affiliationType: "ndma_internal", authSource: "local",            status: "active", vpnEnabled: false, syncMode: "manual", staffProfileId: "sp-richie"  },
    { id: "pa-007", platform: "zabbix",  accountIdentifier: "shemar.henry",      displayName: "Shemar Henry",       affiliationType: "ndma_internal", authSource: "local",            status: "active", vpnEnabled: false, syncMode: "manual", staffProfileId: "sp-shemar"  },
    { id: "pa-008", platform: "vpn",     accountIdentifier: "vendor.cisco.tac",  displayName: "Cisco TAC Account",  affiliationType: "vendor",        authSource: "local",            status: "active", vpnEnabled: true,  syncMode: "manual" },
  ]).onConflictDoNothing();

  // ── Compliance Training + PPE ──────────────────────────────────────────────
  console.log("🎓 Seeding compliance records...");
  await db.insert(trainingRecords).values([
    { id: "tr-001", staffProfileId: "sp-kareem",   trainingName: "Network Security Fundamentals",         provider: "CISCO NetAcad",             completedDate: "2025-03-01", expiryDate: "2027-03-01", status: "current",        notes: "Online certification course" },
    { id: "tr-002", staffProfileId: "sp-shemar",   trainingName: "ITIL 4 Foundation",                     provider: "Axelos / PeopleCert",        completedDate: "2025-06-15", expiryDate: "2026-12-31", status: "current",        notes: "Pass grade 85%" },
    { id: "tr-003", staffProfileId: "sp-bheesham", trainingName: "Cisco CCNA",                            provider: "Cisco Systems",              completedDate: "2023-11-20", expiryDate: "2026-05-01", status: "expiring_soon",  notes: "Recertification required" },
    { id: "tr-004", staffProfileId: "sp-timothy",  trainingName: "CompTIA Network+",                      provider: "CompTIA",                    completedDate: "2022-09-10", expiryDate: "2025-09-10", status: "expired",        notes: "Renewal overdue" },
    { id: "tr-005", staffProfileId: "sp-devon",    trainingName: "Data Centre Operations",                provider: "EPI (Edge Performance Index)", completedDate: "2024-06-01", expiryDate: "2027-06-01", status: "current",      notes: "Includes hands-on rack assessment" },
    { id: "tr-006", staffProfileId: "sp-gerard",   trainingName: "Enterprise Network Design",             provider: "Cisco Systems",              completedDate: "2025-01-15", expiryDate: "2027-01-15", status: "current",        notes: "CCNP Enterprise Design module" },
    { id: "tr-007", staffProfileId: "sp-richie",   trainingName: "Fire Safety Awareness",                 provider: "NDMA HSE Unit",              completedDate: "2023-04-30", expiryDate: "2026-04-30", status: "expiring_soon",  notes: "Annual renewal required" },
    { id: "tr-008", staffProfileId: "sp-nicolai",  trainingName: "Project Management Professional (PMP)", provider: "PMI",                        completedDate: "2024-01-20", expiryDate: "2028-01-01", status: "current",        notes: "PDU renewal programme active" },
  ]).onConflictDoNothing();

  await db.insert(ppeRecords).values([
    { id: "ppe-001", staffProfileId: "sp-bheesham", itemName: "Safety Boots",         issuedDate: "2025-01-15", expiryDate: "2026-01-15", condition: "worn", status: "expired" },
    { id: "ppe-002", staffProfileId: "sp-gerard",   itemName: "Hard Hat",             issuedDate: "2024-06-01", expiryDate: "2026-06-01", condition: "good", status: "current" },
    { id: "ppe-003", staffProfileId: "sp-devon",    itemName: "High-Visibility Vest", issuedDate: "2025-03-01", expiryDate: "2026-03-01", condition: "good", status: "expired" },
    { id: "ppe-004", staffProfileId: "sp-kareem",   itemName: "Safety Glasses",       issuedDate: "2025-11-01", expiryDate: "2026-11-01", condition: "good", status: "current" },
  ]).onConflictDoNothing();

  await db.insert(policyAcknowledgements).values([
    { id: "pk-001", staffProfileId: "sp-kareem",   policyName: "Acceptable Use Policy",         policyVersion: "3.1", acknowledgedAt: new Date("2026-01-15") },
    { id: "pk-002", staffProfileId: "sp-shemar",   policyName: "Acceptable Use Policy",         policyVersion: "3.1", acknowledgedAt: new Date("2026-01-15") },
    { id: "pk-003", staffProfileId: "sp-devon",    policyName: "Data Centre Physical Security", policyVersion: "2.0", acknowledgedAt: new Date("2026-02-01") },
    { id: "pk-004", staffProfileId: "sp-bheesham", policyName: "Incident Response Policy",      policyVersion: "1.4", acknowledgedAt: new Date("2026-02-15") },
  ]).onConflictDoNothing();

  // ── Cycles ─────────────────────────────────────────────────────────────────
  console.log("🔁 Seeding cycles...");
  await db.insert(cycles).values([
    { id: "cyc-001", name: "Q1 2026 Ops Sprint",     period: "quarterly", startDate: "2026-01-01", endDate: "2026-03-31", status: "completed", goal: "Complete firmware upgrades, topology docs, and PBX decommission.", createdById: "user-sachin" },
    { id: "cyc-002", name: "Q2 2026 Infrastructure", period: "quarterly", startDate: "2026-04-01", endDate: "2026-06-30", status: "active",    goal: "Server room expansion, BGP redundancy, DRP review.",             createdById: "user-sachin" },
    { id: "cyc-003", name: "April Patch Sprint",      period: "monthly",   startDate: "2026-04-01", endDate: "2026-04-30", status: "active",    goal: "Complete all April patching, SSL renewal, and monitoring improvements.", createdById: "user-sachin" },
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
    { id: "apr-001", staffProfileId: "sp-kareem",   periodStart: "2025-01-01", periodEnd: "2025-12-31", status: "completed",  rating: "meets_expectations", reviewedById: "sp-sachin", goals: "Improve network documentation coverage to 90%.",           achievements: "Completed CCNA recertification. Led Zabbix migration.", completedDate: "2026-02-10" },
    { id: "apr-002", staffProfileId: "sp-shemar",   periodStart: "2026-01-01", periodEnd: "2026-06-30", status: "in_progress", reviewedById: "sp-sachin", goals: "ITIL certification and incident response improvement.",     achievements: "Completed ITIL 4 Foundation with distinction." },
    { id: "apr-003", staffProfileId: "sp-timothy",  periodStart: "2026-01-01", periodEnd: "2026-06-30", status: "scheduled",  scheduledDate: "2026-05-15", reviewedById: "sp-sachin", goals: "CompTIA Network+ renewal and BGP implementation experience." },
    { id: "apr-004", staffProfileId: "sp-bheesham", periodStart: "2025-01-01", periodEnd: "2025-12-31", status: "overdue",     reviewedById: "sp-sachin", goals: "CCNA renewal and patch management ownership.",              notes: "Review delayed — reschedule for April 2026." },
  ]).onConflictDoNothing();

  // ── Audit Log ──────────────────────────────────────────────────────────────
  console.log("📒 Seeding audit log entries...");
  await db.insert(auditLogs).values([
    { actorId: "user-sachin",  actorName: "Sachin Ramsuran",  actorRole: "admin", action: "rota.schedule.publish",   module: "rota",        resourceType: "on_call_schedule",     resourceId: "sched-2026-w14", afterValue: { status: "published" },                                                           ipAddress: "10.0.0.5",  userAgent: "Mozilla/5.0", createdAt: new Date("2026-04-06T09:05:00Z") },
    { actorId: "user-kareem",  actorName: "Kareem Schultz",   actorRole: "staff", action: "incident.create",         module: "incident",    resourceType: "incident",             resourceId: "inc-001",        afterValue: { title: "Internet connectivity degraded", severity: "sev2" },                    ipAddress: "10.0.0.12", userAgent: "Mozilla/5.0", createdAt: new Date("2026-04-13T08:16:00Z") },
    { actorId: "user-kareem",  actorName: "Kareem Schultz",   actorRole: "staff", action: "incident.timeline.add",   module: "incident",    resourceType: "incident_timeline",    resourceId: "inc-001",        afterValue: { eventType: "status_change" },                                                    ipAddress: "10.0.0.12", userAgent: "Mozilla/5.0", createdAt: new Date("2026-04-13T08:35:00Z") },
    { actorId: "user-sachin",  actorName: "Sachin Ramsuran",  actorRole: "admin", action: "leave.request.approve",   module: "leave",       resourceType: "leave_request",        resourceId: "lr-001",         beforeValue: { status: "pending" }, afterValue: { status: "approved" },                    ipAddress: "10.0.0.5",  userAgent: "Mozilla/5.0", createdAt: new Date("2026-03-08T10:20:00Z") },
    { actorId: "user-sachin",  actorName: "Sachin Ramsuran",  actorRole: "admin", action: "leave.request.approve",   module: "leave",       resourceType: "leave_request",        resourceId: "lr-003",         beforeValue: { status: "pending" }, afterValue: { status: "approved" },                    ipAddress: "10.0.0.5",  userAgent: "Mozilla/5.0", createdAt: new Date("2026-02-14T11:00:00Z") },
    { actorId: "user-devon",   actorName: "Devon Abrams",     actorRole: "staff", action: "temp_change.create",      module: "changes",     resourceType: "temporary_change",     resourceId: "tc-003",         afterValue: { title: "Bypass firewall rule for treasury data transfer" },                      ipAddress: "10.0.0.8",  userAgent: "Mozilla/5.0", createdAt: new Date("2026-03-20T14:00:00Z") },
    { actorId: "user-sachin",  actorName: "Sachin Ramsuran",  actorRole: "admin", action: "procurement.pr.approve",  module: "procurement", resourceType: "purchase_requisition", resourceId: "pr-003",         beforeValue: { status: "submitted" }, afterValue: { status: "approved" },                    ipAddress: "10.0.0.5",  userAgent: "Mozilla/5.0", createdAt: new Date("2026-04-10T09:45:00Z") },
    { actorId: "user-kareem",  actorName: "Kareem Schultz",   actorRole: "staff", action: "work_item.create",        module: "work",        resourceType: "work_item",            resourceId: "wi-006",         afterValue: { title: "Renew SSL certificate for staff portal", priority: "critical" },           ipAddress: "10.0.0.12", userAgent: "Mozilla/5.0", createdAt: new Date("2026-04-07T15:30:00Z") },
    { actorId: "user-nicolai", actorName: "Nicolai Mahangi",  actorRole: "staff", action: "incident.status_change",  module: "incident",    resourceType: "incident",             resourceId: "inc-002",        beforeValue: { status: "investigating" }, afterValue: { status: "resolved" },                ipAddress: "10.0.0.9",  userAgent: "Mozilla/5.0", createdAt: new Date("2026-04-08T17:45:00Z") },
    { actorId: "user-sachin",  actorName: "Sachin Ramsuran",  actorRole: "admin", action: "staff.profile.update",    module: "staff",       resourceType: "staff_profile",        resourceId: "sp-richie",      beforeValue: { status: "active" }, afterValue: { status: "active", jobTitle: "Enterprise Engineer" }, ipAddress: "10.0.0.5", userAgent: "Mozilla/5.0", createdAt: new Date("2026-03-01T08:00:00Z") },
  ]).onConflictDoNothing();

  console.log("✅ Demo seed complete.");
  process.exit(0);
}

// ── Entry point ─────────────────────────────────────────────────────────────

const shouldClear = process.argv.includes("--clear");

if (shouldClear) {
  clearDemo().catch((err) => {
    console.error("❌ Clear failed:", err);
    process.exit(1);
  });
} else {
  seedDemo().catch((err) => {
    console.error("❌ Demo seed failed:", err);
    process.exit(1);
  });
}
