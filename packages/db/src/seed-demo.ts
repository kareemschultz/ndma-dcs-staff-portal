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
  postIncidentReviews,
} from "./schema/incidents";
import {
  workItems, workItemAssignees, workItemTeamAllocations, workInitiatives,
  workItemComments, workItemWeeklyUpdates, workItemDependencies, workItemTemplates,
} from "./schema/work";
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
  accessReviews,
  reconciliationIssues,
} from "./schema/access";
import { importJobs } from "./schema/imports";
import {
  trainingRecords,
  ppeRecords,
  policyAcknowledgements,
} from "./schema/compliance";
import { contracts } from "./schema/contracts";
import { appraisals } from "./schema/appraisals";
import { auditLogs } from "./schema/audit";
import { automationRules } from "./schema/automation";
import { escalationPolicies, escalationSteps } from "./schema/escalation";
import { notifications } from "./schema/notifications";
import { onCallSwaps } from "./schema/rota";

// ── ID registries (for targeted clear) ─────────────────────────────────────

const DEMO_SERVICE_IDS       = ["svc-dcn", "svc-inet", "svc-ad", "svc-monitoring", "svc-ipam", "svc-email"] as const;
const DEMO_WORK_ITEM_IDS     = ["wi-001","wi-002","wi-003","wi-004","wi-005","wi-006","wi-007","wi-008","wi-009","wi-010","wi-011","wi-012","wi-013","wi-014","wi-015","wi-016","wi-017","wi-018","wi-019","wi-020","wi-021","wi-022"] as const;
const DEMO_TEMPLATE_IDS      = ["wt-001","wt-002","wt-003","wt-004"] as const;
const DEMO_INCIDENT_IDS      = ["inc-001","inc-002","inc-003","inc-004"] as const;
const DEMO_LEAVE_TYPE_IDS    = ["lt-annual","lt-sick","lt-emergency","lt-study"] as const;
const DEMO_LEAVE_BALANCE_IDS = ["lb-kareem-annual","lb-shemar-annual","lb-bheesham-annual","lb-timothy-annual","lb-timothy-study","lb-richie-sick","lb-gerard-annual","lb-sachin-annual","lb-devon-annual","lb-nicolai-annual"] as const;
const DEMO_LEAVE_REQUEST_IDS = ["lr-001","lr-002","lr-003","lr-004","lr-005","lr-006","lr-007","lr-008","lr-009","lr-010","lr-011","lr-012","lr-013","lr-014","lr-015"] as const;
const DEMO_PR_IDS            = ["pr-001","pr-002","pr-003","pr-004","pr-005","pr-006"] as const;
const DEMO_TC_IDS            = ["tc-001","tc-002","tc-003","tc-004","tc-005","tc-006","tc-007","tc-008","tc-009","tc-010","tc-011","tc-012"] as const;
const DEMO_INTEGRATION_IDS   = ["pi-ad","pi-vpn","pi-ipam"] as const;
const DEMO_ACCOUNT_IDS       = ["pa-001","pa-002","pa-003","pa-004","pa-005","pa-006","pa-007","pa-008","pa-009","pa-010","pa-011","pa-012","pa-013","pa-014","pa-015","pa-016","pa-017","pa-018","pa-019","pa-020","pa-021","pa-022","pa-023","pa-024","pa-025","pa-026","pa-027","pa-028","pa-029","pa-030"] as const;
const DEMO_TRAINING_IDS      = ["tr-001","tr-002","tr-003","tr-004","tr-005","tr-006","tr-007","tr-008"] as const;
const DEMO_PPE_IDS           = ["ppe-001","ppe-002","ppe-003","ppe-004"] as const;
const DEMO_POLICY_ACK_IDS    = ["pk-001","pk-002","pk-003","pk-004"] as const;
const DEMO_CYCLE_IDS         = ["cyc-001","cyc-002","cyc-003"] as const;
const DEMO_CONTRACT_IDS      = ["con-001","con-002","con-003","con-004","con-005"] as const;
const DEMO_APPRAISAL_IDS     = ["apr-001","apr-002","apr-003","apr-004"] as const;
const DEMO_ASSIGNEE_IDS      = ["wia-001","wia-002","wia-003","wia-004","wia-005","wia-006","wia-007","wia-008","wia-009"] as const;
const DEMO_TEAM_ALLOC_IDS    = ["wta-001","wta-002","wta-003","wta-004","wta-005","wta-006"] as const;
const DEMO_INITIATIVE_IDS    = ["win-001","win-002","win-003"] as const;
const DEMO_AUTOMATION_IDS    = ["auto-001","auto-002","auto-003","auto-004"] as const;
const DEMO_ESC_POLICY_IDS    = ["ep-001","ep-002"] as const;
const DEMO_ESC_STEP_IDS      = ["es-001","es-002","es-003","es-004","es-005"] as const;
const DEMO_NOTIFICATION_IDS  = ["notif-001","notif-002","notif-003","notif-004","notif-005","notif-006"] as const;
const DEMO_ACCESS_REVIEW_IDS = ["arev-001","arev-002","arev-003","arev-004"] as const;
const DEMO_SWAP_IDS          = ["swap-001","swap-002"] as const;
const DEMO_COMMENT_IDS       = ["wic-001","wic-002","wic-003","wic-004","wic-005","wic-006"] as const;
const DEMO_UPDATE_IDS        = ["wiu-001","wiu-002","wiu-003","wiu-004","wiu-005","wiu-006","wiu-007","wiu-008"] as const;
const DEMO_DEP_IDS           = ["wid-001","wid-002","wid-003"] as const;
const DEMO_PIR_IDS           = ["pir-001","pir-002"] as const;
const DEMO_RECON_IDS         = ["ri-001","ri-002","ri-003"] as const;
const DEMO_IMPORT_IDS        = ["ij-001","ij-002","ij-003"] as const;

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

  // Import jobs
  await db.delete(importJobs).where(inArray(importJobs.id, [...DEMO_IMPORT_IDS]));

  // Reconciliation issues
  await db.delete(reconciliationIssues).where(inArray(reconciliationIssues.id, [...DEMO_RECON_IDS]));

  // Work item sub-records (cascade but be explicit)
  await db.delete(workItemDependencies).where(inArray(workItemDependencies.id, [...DEMO_DEP_IDS]));
  await db.delete(workItemWeeklyUpdates).where(inArray(workItemWeeklyUpdates.id, [...DEMO_UPDATE_IDS]));
  await db.delete(workItemComments).where(inArray(workItemComments.id, [...DEMO_COMMENT_IDS]));

  // PIRs
  await db.delete(postIncidentReviews).where(inArray(postIncidentReviews.id, [...DEMO_PIR_IDS]));

  // Cycle links (before cycles and work items)
  await db.delete(cycleWorkItems).where(inArray(cycleWorkItems.cycleId, [...DEMO_CYCLE_IDS]));
  await db.delete(cycles).where(inArray(cycles.id, [...DEMO_CYCLE_IDS]));

  // Notifications
  await db.delete(notifications).where(inArray(notifications.id, [...DEMO_NOTIFICATION_IDS]));

  // On-call swaps
  await db.delete(onCallSwaps).where(inArray(onCallSwaps.id, [...DEMO_SWAP_IDS]));

  // Escalation steps (before policies)
  await db.delete(escalationSteps).where(inArray(escalationSteps.id, [...DEMO_ESC_STEP_IDS]));
  await db.delete(escalationPolicies).where(inArray(escalationPolicies.id, [...DEMO_ESC_POLICY_IDS]));

  // Automation rules
  await db.delete(automationRules).where(inArray(automationRules.id, [...DEMO_AUTOMATION_IDS]));

  // Access reviews
  await db.delete(accessReviews).where(inArray(accessReviews.id, [...DEMO_ACCESS_REVIEW_IDS]));

  // Work initiatives
  await db.delete(workInitiatives).where(inArray(workInitiatives.id, [...DEMO_INITIATIVE_IDS]));

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

  // Work item assignees + team allocations (cascade deletes with work items, but be explicit)
  await db.delete(workItemAssignees).where(inArray(workItemAssignees.id, [...DEMO_ASSIGNEE_IDS]));
  await db.delete(workItemTeamAllocations).where(inArray(workItemTeamAllocations.id, [...DEMO_TEAM_ALLOC_IDS]));

  // Work items + templates
  await db.delete(workItems).where(inArray(workItems.id, [...DEMO_WORK_ITEM_IDS]));
  await db.delete(workItemTemplates).where(inArray(workItemTemplates.id, [...DEMO_TEMPLATE_IDS]));

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
    { id: "wi-013", title: "Replace UPS batteries in Room A",       type: "project",   status: "blocked",     priority: "critical", assignedToId: "sp-gerard",    description: "APC battery replacement approved in PR-003. Blocked on vendor delivery — Schneider confirmed shipment delayed to 2026-04-28.", dueDate: "2026-04-28", createdById: "user-sachin" },

    // ── Real DCS tasks from WorkUpdate_20240118_v01.xlsx ──────────────────────
    // CurrentWork sheet — real ongoing projects adapted to 2026 timeframe
    { id: "wi-014", title: "Bartica LEO Aggregation — Starlink Bonding",  type: "project",         status: "in_progress", priority: "high",     assignedToId: "sp-devon",     description: "Design and implement bonded Starlink backhaul for Bartica region. Aggregate two LEO devices, encrypted tunnel, MPLS+IS-IS/OSPF overlay. Coordinate with Wintz and Rovin at OSP. Test with PE router in office first.", dueDate: "2026-06-30", createdById: "user-sachin" },
    { id: "wi-015", title: "VPN User Groups — AD Group Migration",         type: "project",         status: "in_progress", priority: "high",     assignedToId: "sp-kareem",    description: "Migrate all NDMA staff from local Fortigate VPN accounts to Active Directory-based VPN groups. Adjust all policies, ensure correct AD group added. Map local groups → AD groups, coordinate with Cloud Services, test MFA cutover one-by-one.", dueDate: "2026-05-17", createdById: "user-sachin" },
    { id: "wi-016", title: "WiFiGY Captive Portal Implementation",          type: "project",         status: "in_progress", priority: "medium",   assignedToId: "sp-kareem",    description: "Implement captive portal for WiFiGY public Wi-Fi across NDMA sites. Covers UniFi (Kareem), Cambium (Nicolai), Huawei (Sachin), LEO sites (Sachin). UI being developed by Avinash+Sachin.", dueDate: "2026-06-30", createdById: "user-sachin" },
    { id: "wi-017", title: "Safecountry Phase 3 — Network Low Level Design", type: "project",       status: "review",      priority: "high",     assignedToId: "sp-nicolai",   description: "Review Huawei's Phase 3 LLD document for Safecountry. Compile and send review comments to Huawei by agreed deadline. Document covers IVS ring topology, camera additions, and backhaul changes.", dueDate: "2026-04-30", createdById: "user-sachin" },
    { id: "wi-018", title: "Secondary IXP Link — OneComm Onboarding",       type: "project",        status: "todo",        priority: "critical", assignedToId: "sp-sachin",    description: "Bring up OneComm secondary IXP link for internet redundancy. Internal fibre approval pending. Will provide failover for primary GTT IXP. Includes BGP config, route filtering, and failover testing.", dueDate: "2026-06-30", createdById: "user-sachin" },
    { id: "wi-019", title: "Add DCS/NOC Servers to Wazuh SIEM",             type: "project",        status: "todo",        priority: "high",     assignedToId: "sp-shemar",    description: "Deploy Wazuh agents to all DCS and NOC servers. Configure log collection, file integrity monitoring, and alerting rules. Integrate with existing Kibana dashboard.", dueDate: "2026-05-31", createdById: "user-sachin" },
    { id: "wi-020", title: "Assess Logging Infrastructure — Syslog Strategy", type: "project",      status: "todo",        priority: "medium",   assignedToId: "sp-shemar",    description: "Evaluate current logging: Syslog-NG, Kiwi Syslog, NAT logs, VPN logs, DHCP logs. Determine future state and storage requirements for ISO certification evidence. Produce infrastructure recommendation report.", dueDate: "2026-05-31", createdById: "user-sachin" },
    { id: "wi-021", title: "MOH EMR Project — Network Infrastructure Support", type: "external_request", status: "in_progress", priority: "high", assignedToId: "sp-devon", description: "DCS providing network support for Ministry of Health EMR (Electronic Medical Records) rollout. Review project documents to understand scope. Provide connectivity configs and support for health facility sites.", dueDate: "2026-06-30", createdById: "user-sachin" },
    { id: "wi-022", title: "Fortigate 1801F CGN-2 Redundancy Design",       type: "project",        status: "blocked",     priority: "high",     assignedToId: "sp-bheesham",  description: "Design HA/redundancy between the Fortigate 1801F and CGN-2 carrier-grade NAT. Currently reviewing CGNAT and 1801F configs. Blocked pending management approval on design direction.", dueDate: "2026-05-30", createdById: "user-sachin" },
  ]).onConflictDoNothing();

  // ── Work Item Multi-Assignees ──────────────────────────────────────────────
  // wi-001 "Migrate core switches" — cross-team: Core (Devon) + ASN (Kareem)
  // wi-003 "BGP peers" — Core (Nicolai) + Enterprise (Gerard)
  // wi-005 "Install server rack" — Core (Gerard) + ASN (Bheesham)
  // wi-010 "Patch management" — shared: ASN + Enterprise
  console.log("👥 Seeding work item multi-assignees...");
  await db.insert(workItemAssignees).values([
    { id: "wia-001", workItemId: "wi-001", staffProfileId: "sp-kareem",   addedById: "user-sachin" }, // ASN contributor on Core task
    { id: "wia-002", workItemId: "wi-001", staffProfileId: "sp-nicolai",  addedById: "user-sachin" }, // Core contributor
    { id: "wia-003", workItemId: "wi-003", staffProfileId: "sp-gerard",   addedById: "user-sachin" }, // Enterprise contributor on Core BGP task
    { id: "wia-004", workItemId: "wi-005", staffProfileId: "sp-bheesham", addedById: "user-sachin" }, // ASN contributor on rack install
    { id: "wia-005", workItemId: "wi-005", staffProfileId: "sp-devon",    addedById: "user-sachin" }, // Core contributor on rack install
    { id: "wia-006", workItemId: "wi-009", staffProfileId: "sp-devon",    addedById: "user-sachin" }, // DRP — Core contributor
    { id: "wia-007", workItemId: "wi-009", staffProfileId: "sp-nicolai",  addedById: "user-sachin" }, // DRP — Core contributor
    { id: "wia-008", workItemId: "wi-010", staffProfileId: "sp-shemar",   addedById: "user-sachin" }, // Patch mgmt — ASN contributor
    { id: "wia-009", workItemId: "wi-010", staffProfileId: "sp-timothy",  addedById: "user-sachin" }, // Patch mgmt — ENT contributor
  ]).onConflictDoNothing();

  // ── Work Item Team Allocations ─────────────────────────────────────────────
  // Model the required headcount from each sub-department
  console.log("🏢 Seeding work item team allocations...");
  await db.insert(workItemTeamAllocations).values([
    { id: "wta-001", workItemId: "wi-001", departmentId: "dept-core",       requiredCount: 1, addedById: "user-sachin" }, // Core ×1 for switch migration
    { id: "wta-002", workItemId: "wi-001", departmentId: "dept-asn",        requiredCount: 2, addedById: "user-sachin" }, // ASN ×2 for monitoring + routing changes
    { id: "wta-003", workItemId: "wi-003", departmentId: "dept-core",       requiredCount: 1, addedById: "user-sachin" }, // Core ×1 for BGP config
    { id: "wta-004", workItemId: "wi-003", departmentId: "dept-enterprise",  requiredCount: 1, addedById: "user-sachin" }, // Enterprise ×1 for downstream validation
    { id: "wta-005", workItemId: "wi-005", departmentId: "dept-core",       requiredCount: 1, addedById: "user-sachin" }, // Core ×1 for rack install
    { id: "wta-006", workItemId: "wi-005", departmentId: "dept-asn",        requiredCount: 1, addedById: "user-sachin" }, // ASN ×1 for cabling + patch panel
  ]).onConflictDoNothing();

  // ── Work Item Initiative Links ─────────────────────────────────────────────
  console.log("🔗 Linking work items to initiatives...");
  // Use direct SQL update — onConflictDoNothing is only for inserts
  await db.update(workItems).set({ initiativeId: "win-001" }).where(inArray(workItems.id, ["wi-001","wi-003","wi-005","wi-009","wi-013","wi-014","wi-018"]));
  await db.update(workItems).set({ initiativeId: "win-002" }).where(inArray(workItems.id, ["wi-004","wi-008","wi-015","wi-022"]));
  await db.update(workItems).set({ initiativeId: "win-003" }).where(inArray(workItems.id, ["wi-011","wi-010","wi-002","wi-019","wi-020"]));
  // wi-016 WiFiGY, wi-017 Safecountry, wi-021 MOH are cross-functional — no single initiative

  // ── Work Item Dependencies ─────────────────────────────────────────────────
  console.log("🔀 Seeding work item dependencies...");
  await db.insert(workItemDependencies).values([
    { id: "wid-001", workItemId: "wi-013", dependsOnId: "wi-005", dependencyType: "blocks" }, // UPS replacement blocked until rack install complete
    { id: "wid-002", workItemId: "wi-003", dependsOnId: "wi-001", dependencyType: "blocks" }, // BGP redundancy needs firmware upgrade first
    { id: "wid-003", workItemId: "wi-008", dependsOnId: "wi-005", dependencyType: "blocks" }, // phpIPAM subnet config needs Annex rack in place
  ]).onConflictDoNothing();

  // ── Work Item Comments ─────────────────────────────────────────────────────
  console.log("💬 Seeding work item comments...");
  await db.insert(workItemComments).values([
    { id: "wic-001", workItemId: "wi-001", authorId: "user-kareem",  body: "Tested firmware 17.11.1a on lab switch NDMA-SW-LAB01 — no issues with OSPF adjacency. Scheduling production window for Saturday 03:00–06:00.", createdAt: new Date("2026-04-11T14:30:00Z") },
    { id: "wic-002", workItemId: "wi-001", authorId: "user-sachin",  body: "Saturday maintenance window approved. Notify all department heads by COB Thursday. Ensure rollback procedure is documented in the runbook.", createdAt: new Date("2026-04-11T16:00:00Z") },
    { id: "wic-003", workItemId: "wi-003", authorId: "user-devon",   body: "ISP confirmed secondary BGP session config. Waiting on LOA (Letter of Authorisation) from upstream. ETA: 5 business days.", createdAt: new Date("2026-04-09T10:15:00Z") },
    { id: "wic-004", workItemId: "wi-004", authorId: "user-kareem",  body: "Found 12 stale accounts in the DCS-Security-Admins group — 3 are ex-contractors, 9 are staff who changed roles. Flagged for SP-Sachin to approve removal.", createdAt: new Date("2026-04-14T09:00:00Z") },
    { id: "wic-005", workItemId: "wi-013", authorId: "user-gerard",  body: "Schneider Electric confirmed delivery of 7× RBC5 cartridges pushed to 28 April. Coordinated with facilities for access to Room A during battery swap.", createdAt: new Date("2026-04-13T11:30:00Z") },
    { id: "wic-006", workItemId: "wi-009", authorId: "user-sachin",  body: "Scheduling DRP tabletop exercise for 15 May with all team leads. Each department to submit updated RTO/RPO targets by 30 April.", createdAt: new Date("2026-04-07T15:00:00Z") },
  ]).onConflictDoNothing();

  // ── Work Item Weekly Updates ───────────────────────────────────────────────
  console.log("📅 Seeding work item weekly updates...");
  await db.insert(workItemWeeklyUpdates).values([
    {
      id: "wiu-001", workItemId: "wi-001", authorId: "user-kareem", weekStart: "2026-04-07",
      statusSummary: "Lab testing of firmware 17.11.1a completed successfully on 2 test switches. No OSPF or spanning-tree regressions observed.",
      nextSteps: "Schedule production maintenance window for Sat 18 Apr 03:00. Notify stakeholders Thursday.",
    },
    {
      id: "wiu-002", workItemId: "wi-003", authorId: "user-devon", weekStart: "2026-04-07",
      statusSummary: "Submitted BGP peering request to ISP. Received draft LOA — legal review in progress.",
      blockers: "LOA approval from ISP legal team still pending.",
      nextSteps: "Follow up with ISP TAC on LOA status. Pre-configure secondary peer on edge router.",
    },
    {
      id: "wiu-003", workItemId: "wi-005", authorId: "user-gerard", weekStart: "2026-04-07",
      statusSummary: "42U rack delivered and staged in Room B. PDU installation scheduled with electrical contractor for 22 Apr.",
      nextSteps: "Complete PDU install, run power tests, begin patch panel cabling.",
    },
    {
      id: "wiu-004", workItemId: "wi-009", authorId: "user-sachin", weekStart: "2026-04-07",
      statusSummary: "Kicked off DRP review kick-off meeting. Assigned sections to each team lead.",
      nextSteps: "Collect RTO/RPO inputs from all departments by 30 Apr. Schedule tabletop for 15 May.",
    },
    // New items from WorkUpdate Excel — real language from the tracker
    {
      id: "wiu-005", workItemId: "wi-014", authorId: "user-devon", weekStart: "2026-04-07",
      statusSummary: "Design completed for bonded Starlink backhaul. Test bed set up in office with PE router and two LEO devices. MPLS+IS-IS adjacency forming correctly on the lab setup.",
      blockers: "OSP not ready at Bartica site yet. Wintz to confirm access date.",
      nextSteps: "Stand by for OSP site readiness. Prepare RFC for production cutover.",
    },
    {
      id: "wiu-006", workItemId: "wi-015", authorId: "user-kareem", weekStart: "2026-04-07",
      statusSummary: "All NDMA VPN policies reviewed. Mapped local VPN groups to AD group equivalents: NOCUsers1, CPUsers1, PME_Users1, TransmissionUsers, VSATUsers1, CloudUsers1. List sent to Cloud Services.",
      blockers: "Waiting on Cloud Services to add users to AD groups before we can begin per-user MFA cutover testing.",
      nextSteps: "Once Cloud confirms AD group population, begin cutover testing starting with NOC team.",
    },
    {
      id: "wiu-007", workItemId: "wi-016", authorId: "user-kareem", weekStart: "2026-03-31",
      statusSummary: "UniFi captive portal tested successfully at Castellani HQ. Users authenticated via splash page. Huawei portal config drafted by Sachin.",
      nextSteps: "Cambium portal (Nicolai) and LEO sites (Sachin) still to be completed. Toni still to test at a few command centres.",
    },
    {
      id: "wiu-008", workItemId: "wi-021", authorId: "user-devon", weekStart: "2026-04-07",
      statusSummary: "Reviewed MOH EMR project charter and network scope document. Scope includes connectivity to 14 health facilities across 4 regions. DCS responsible for routing configs and firewall rules.",
      nextSteps: "Schedule call with MOH IT team to clarify VLAN requirements. Produce network design for Region 4 facilities.",
    },
  ]).onConflictDoNothing();

  // ── Work Item Templates (from Routine sheet — real recurring DCS tasks) ────
  console.log("📋 Seeding work item templates...");
  await db.insert(workItemTemplates).values([
    {
      id: "wt-001",
      title: "Monthly Configuration Checks",
      description: "Run configuration compliance checks on all managed network devices. Verify routing tables, firewall rules, BGP peers, OSPF adjacencies, and spanning-tree states match approved baselines. Follow up with engineers for any discrepancies.",
      type: "routine",
      priority: "medium",
      departmentId: "dept-asn",
      estimatedHours: 8,
      recurrencePattern: "monthly",
      createdById: "user-sachin",
    },
    {
      id: "wt-002",
      title: "Data Centre Maintenance Checklist",
      description: "Physical walkthrough of Liliendaal and Castellani data centres. Check: cooling temps and airflow, UPS health and battery state, power feed redundancy, cable management, cleanliness, fire suppression system status, CCTV coverage, and physical security. Submit facilities report.",
      type: "routine",
      priority: "high",
      departmentId: "dept-core",
      estimatedHours: 4,
      recurrencePattern: "monthly",
      createdById: "user-sachin",
    },
    {
      id: "wt-003",
      title: "Critical Asset Inventory Report",
      description: "Reconcile physical inventory against iTop CMDB, SnipeIT, and IPAM. Update asset locations, assigned users, and lifecycle dates. Flag items approaching end-of-life (core routers 8–10yr, customer routers 5yr). Produce re-order level report for procurement.",
      type: "routine",
      priority: "medium",
      departmentId: "dept-core",
      estimatedHours: 6,
      recurrencePattern: "quarterly",
      createdById: "user-sachin",
    },
    {
      id: "wt-004",
      title: "Unit Rapid Report — Critical Issue Summary",
      description: "Compile weekly rapid report covering critical incidents, open Slack alerts at Castellani and Liliendaal, and any open iTop tickets with Critical priority. Distribute to Sachin and department leads via email by COB Monday.",
      type: "routine",
      priority: "high",
      departmentId: "dept-asn",
      estimatedHours: 2,
      recurrencePattern: "weekly",
      createdById: "user-sachin",
    },
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

  // ── Post-Incident Reviews ──────────────────────────────────────────────────
  console.log("📋 Seeding post-incident reviews...");
  await db.insert(postIncidentReviews).values([
    {
      id: "pir-001",
      incidentId: "inc-002",
      ledById: "sp-nicolai",
      reviewDate: "2026-04-10",
      status: "completed",
      summary: "NDMA-DC01 domain controller failed due to /var/log partition reaching 100% capacity, causing AD authentication services to become unresponsive for 3h 15m.",
      lessonsLearned: "1. Log rotation was misconfigured — max log size was uncapped. 2. No disk-space alert was set for the system drive on DC01. 3. Runbook for DC unresponsive scenario was outdated.",
      actionItems: [
        { action: "Configure disk space alert on all DCs at 80% threshold", owner: "sp-shemar", dueDate: "2026-04-20", status: "done" },
        { action: "Audit and cap log rotation on all Windows servers", owner: "sp-kareem", dueDate: "2026-04-30", status: "in_progress" },
        { action: "Update DC incident runbook with current recovery steps", owner: "sp-nicolai", dueDate: "2026-04-25", status: "in_progress" },
      ],
    },
    {
      id: "pir-002",
      incidentId: "inc-003",
      ledById: "sp-shemar",
      reviewDate: "2026-04-03",
      status: "completed",
      summary: "Zabbix server exhausted memory due to unbounded discovery rules scanning too many subnets. Monitoring alerts suppressed for 2h 20m.",
      lessonsLearned: "1. Discovery rules had no host limit — scanned entire RFC1918 range. 2. No health monitoring on Zabbix server itself. 3. Alert suppression window of 2+ hours was not noticed until user report.",
      actionItems: [
        { action: "Set discovery rule scope limits to known subnet ranges only", owner: "sp-shemar", dueDate: "2026-04-10", status: "done" },
        { action: "Add Zabbix self-monitoring template to track server health", owner: "sp-shemar", dueDate: "2026-04-15", status: "done" },
      ],
    },
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
    // Balances for managers/leads — missing from initial seed (from LeaveDates_DCS.xlsx)
    { id: "lb-sachin-annual",   staffProfileId: "sp-sachin",   leaveTypeId: "lt-annual",    contractYearStart: "2026-01-01", contractYearEnd: "2026-12-31", entitlement: 28, used: 14, carriedOver: 0, adjustment: 0 },  // Manager allowance 28d; Jan 12-25 already taken
    { id: "lb-devon-annual",    staffProfileId: "sp-devon",    leaveTypeId: "lt-annual",     contractYearStart: "2026-01-01", contractYearEnd: "2026-12-31", entitlement: 20, used: 14, carriedOver: 5, adjustment: 0 },  // Jan 26-Feb 8 taken
    { id: "lb-nicolai-annual",  staffProfileId: "sp-nicolai",  leaveTypeId: "lt-annual",    contractYearStart: "2026-01-01", contractYearEnd: "2026-12-31", entitlement: 20, used: 0,  carriedOver: 3, adjustment: 0 },
  ]).onConflictDoNothing();

  await db.insert(leaveRequests).values([
    { id: "lr-001", staffProfileId: "sp-kareem",   leaveTypeId: "lt-annual",    startDate: "2026-03-10", endDate: "2026-03-14", totalDays: 5,  reason: "Family vacation",         status: "approved", approvedById: "user-sachin", overlapOverride: false },
    { id: "lr-002", staffProfileId: "sp-shemar",   leaveTypeId: "lt-annual",    startDate: "2026-04-21", endDate: "2026-04-23", totalDays: 3,  reason: "Personal commitments",    status: "pending",  overlapOverride: false },
    { id: "lr-003", staffProfileId: "sp-bheesham", leaveTypeId: "lt-annual",    startDate: "2026-02-16", endDate: "2026-02-17", totalDays: 2,  reason: "Medical appointment",     status: "approved", approvedById: "user-sachin", overlapOverride: false },
    { id: "lr-004", staffProfileId: "sp-timothy",  leaveTypeId: "lt-study",     startDate: "2026-02-02", endDate: "2026-02-13", totalDays: 10, reason: "CCNP exam preparation",   status: "approved", approvedById: "user-sachin", overlapOverride: false },
    { id: "lr-005", staffProfileId: "sp-richie",   leaveTypeId: "lt-sick",      startDate: "2026-04-09", endDate: "2026-04-09", totalDays: 1,  reason: "Flu",                     status: "approved", approvedById: "user-sachin", overlapOverride: false },
    { id: "lr-006", staffProfileId: "sp-gerard",   leaveTypeId: "lt-annual",    startDate: "2026-03-23", endDate: "2026-03-25", totalDays: 3,  reason: "Annual leave",            status: "approved", approvedById: "user-sachin", overlapOverride: false },
    { id: "lr-007", staffProfileId: "sp-nicolai",  leaveTypeId: "lt-emergency", startDate: "2026-04-28", endDate: "2026-04-29", totalDays: 2,  reason: "Family emergency",        status: "pending",  overlapOverride: false },
    { id: "lr-008", staffProfileId: "sp-devon",    leaveTypeId: "lt-annual",    startDate: "2026-04-19", endDate: "2026-04-20", totalDays: 2,  reason: "Easter weekend extension", status: "rejected", rejectionReason: "Devon is the on-call lead engineer for week starting 19 Apr. Cannot be approved during active on-call week.", overlapOverride: false },
    // Real 2026 leave dates from LeaveDates_DCS.xlsx
    { id: "lr-009", staffProfileId: "sp-sachin",  leaveTypeId: "lt-annual",    startDate: "2026-01-12", endDate: "2026-01-25", totalDays: 14, reason: "Annual leave – Q1",            status: "approved", approvedById: "user-sachin", overlapOverride: false },  // approved by self (manager)
    { id: "lr-010", staffProfileId: "sp-devon",   leaveTypeId: "lt-annual",    startDate: "2026-01-26", endDate: "2026-02-08", totalDays: 14, reason: "Annual leave",                 status: "approved", approvedById: "user-sachin", overlapOverride: false },
    { id: "lr-011", staffProfileId: "sp-kareem",  leaveTypeId: "lt-annual",    startDate: "2026-04-07", endDate: "2026-04-12", totalDays: 6,  reason: "Annual leave",                 status: "approved", approvedById: "user-sachin", overlapOverride: false },
    { id: "lr-012", staffProfileId: "sp-sachin",  leaveTypeId: "lt-annual",    startDate: "2026-04-13", endDate: "2026-05-18", totalDays: 26, reason: "Annual leave – Q2 block",      status: "pending",  overlapOverride: false },
    { id: "lr-013", staffProfileId: "sp-devon",   leaveTypeId: "lt-annual",    startDate: "2026-07-20", endDate: "2026-08-16", totalDays: 28, reason: "Annual leave – July/August",   status: "pending",  overlapOverride: false },
    { id: "lr-014", staffProfileId: "sp-nicolai", leaveTypeId: "lt-annual",    startDate: "2026-06-29", endDate: "2026-07-26", totalDays: 28, reason: "Annual leave",                 status: "pending",  overlapOverride: false },
    { id: "lr-015", staffProfileId: "sp-gerard",  leaveTypeId: "lt-annual",    startDate: "2026-06-08", endDate: "2026-06-14", totalDays: 7,  reason: "Annual leave",                 status: "pending",  overlapOverride: false },
  ]).onConflictDoNothing();

  // ── Procurement ────────────────────────────────────────────────────────────
  console.log("🛒 Seeding procurement...");
  await db.insert(purchaseRequisitions).values([
    { id: "pr-001", title: "Network switches – server room expansion", priority: "high",   status: "draft",     requestedById: "sp-devon",    departmentId: "dept-core",       currency: "TTD", totalEstimatedCost: "62000.00", vendorName: "Cisco Systems",    justification: "Capacity upgrade for Room B rack installation. Current switches at 90% port utilisation." },
    { id: "pr-002", title: "Zabbix Enterprise annual licence renewal",  priority: "medium", status: "submitted", requestedById: "sp-kareem",   departmentId: "dept-asn",        currency: "TTD", totalEstimatedCost: "18500.00", vendorName: "Zabbix LLC",       justification: "Existing licence expires May 2026. Required for continued monitoring alerting." },
    { id: "pr-003", title: "UPS replacement batteries – Room A",        priority: "urgent", status: "approved",  requestedById: "sp-gerard",   departmentId: "dept-enterprise", currency: "TTD", totalEstimatedCost: "9800.00",  vendorName: "APC by Schneider", justification: "Batteries last replaced 4 years ago. Self-test failure rate at 30%.", approvedById: "user-sachin", approvedAt: new Date("2026-04-10") },
    { id: "pr-004", title: "Cat6A cabling and patch panels – Annex",    priority: "medium", status: "received",  requestedById: "sp-bheesham", departmentId: "dept-core",       currency: "TTD", totalEstimatedCost: "14200.00", vendorName: "CommScope",        justification: "Structured cabling for 48-port Annex network expansion." },
    { id: "pr-005", title: "Sophos XGS firewall appliances ×2",         priority: "high",   status: "rejected",  requestedById: "sp-devon",    departmentId: "dept-core",       currency: "TTD", totalEstimatedCost: "88000.00", vendorName: "Sophos/Westcon",   justification: "Replace ageing Fortigate units with Sophos XGS3100 HA pair.", rejectionReason: "Budget not available in Q2. Defer to Q3 2026 budget cycle. Revisit in July." },
    { id: "pr-006", title: "KVM over IP console server – 16-port",      priority: "medium", status: "ordered",   requestedById: "sp-kareem",   departmentId: "dept-asn",        currency: "TTD", totalEstimatedCost: "7200.00",  vendorName: "Raritan",          justification: "Out-of-band access to servers during network outages. Current 4-port unit is at capacity.", approvedById: "user-sachin", approvedAt: new Date("2026-04-08") },
  ]).onConflictDoNothing();

  await db.insert(prLineItems).values([
    { prId: "pr-001", description: "Cisco Catalyst 9300-24P switch",           quantity: 4, unitCost: "12000.00", unit: "unit",    totalCost: "48000.00" },
    { prId: "pr-001", description: "Cisco SmartNet support (1 year)",           quantity: 4, unitCost: "3500.00",  unit: "unit",    totalCost: "14000.00" },
    { prId: "pr-002", description: "Zabbix Enterprise licence (500 hosts)",     quantity: 1, unitCost: "18500.00", unit: "licence", totalCost: "18500.00" },
    { prId: "pr-003", description: "APC RBC5 replacement battery cartridge",    quantity: 7, unitCost: "1400.00",  unit: "unit",    totalCost: "9800.00"  },
    { prId: "pr-004", description: "Cat6A shielded cable (500m drum)",          quantity: 3, unitCost: "2800.00",  unit: "drum",    totalCost: "8400.00"  },
    { prId: "pr-004", description: "24-port keystone patch panel",              quantity: 6, unitCost: "300.00",   unit: "unit",    totalCost: "1800.00"  },
    { prId: "pr-004", description: "Cable management D-rings and velcro ties",  quantity: 1, unitCost: "400.00",   unit: "lot",     totalCost: "400.00"   },
    { prId: "pr-005", description: "Sophos XGS3100 appliance",                  quantity: 2, unitCost: "38000.00", unit: "unit",    totalCost: "76000.00" },
    { prId: "pr-005", description: "Sophos Xstream Protection licence (3 yr)",  quantity: 2, unitCost: "6000.00",  unit: "unit",    totalCost: "12000.00" },
    { prId: "pr-006", description: "Raritan Dominion KX IV-116 console server", quantity: 1, unitCost: "7200.00",  unit: "unit",    totalCost: "7200.00"  },
    { prId: "pr-004", description: "RJ45 toolless keystone jacks (box of 100)", quantity: 4, unitCost: "400.00",   unit: "box",     totalCost: "1600.00"  },
  ]).onConflictDoNothing();

  // ── Temporary Changes ──────────────────────────────────────────────────────
  console.log("🔄 Seeding temporary changes...");
  await db.insert(temporaryChanges).values([
    { id: "tc-001", title: "Public IP for Cisco TAC vendor VPN access",       status: "active",   category: "public_ip_exposure", riskLevel: "high",     environment: "production", systemName: "Fortigate SSL-VPN",    publicIp: "203.0.113.45", externalExposure: true,  ownerType: "external_contact", externalAgencyName: "Cisco Systems",   externalAgencyType: "vendor",     implementationDate: "2026-04-01", removeByDate: "2026-06-30", createdById: "user-kareem" },
    { id: "tc-002", title: "Temporary VLAN 999 for external audit team",      status: "active",   category: "temporary_access",   riskLevel: "medium",   environment: "production", systemName: "Core Switch Stack",                              externalExposure: false, ownerType: "external_contact", externalAgencyName: "ISACA Audit Firm", externalAgencyType: "government", implementationDate: "2026-04-10", removeByDate: "2026-04-17", createdById: "user-sachin" },
    { id: "tc-003", title: "Bypass firewall rule for treasury data transfer",  status: "overdue",  category: "temporary_change",   riskLevel: "high",     environment: "production", systemName: "Fortigate FW01",                                 externalExposure: false, ownerType: "internal_staff",   ownerId: "sp-devon",                                        implementationDate: "2026-03-20", removeByDate: "2026-04-05", createdById: "user-devon" },
    { id: "tc-004", title: "Test server exposed in DMZ for API integration",  status: "active",   category: "temporary_service",  riskLevel: "critical", environment: "staging",    systemName: "DMZ-TESTSVR-01",       publicIp: "198.51.100.22", internalIp: "10.10.50.22", port: "8443", protocol: "tcp", externalExposure: true, ownerType: "internal_staff", ownerId: "sp-shemar", implementationDate: "2026-04-05", removeByDate: "2026-05-31", createdById: "user-shemar" },
    { id: "tc-005", title: "Static NAT for NDMA Head Office remote audit",    status: "removed",      category: "temporary_access",   riskLevel: "low",      environment: "production", systemName: "Edge Router",                                     actualRemovalDate: "2026-03-31", implementationDate: "2026-03-01", removeByDate: "2026-03-31", createdById: "user-kareem" },
    { id: "tc-006", title: "Maintenance VLAN for patch cycle – April 2026", status: "implemented",  category: "temporary_change",   riskLevel: "low",      environment: "production", systemName: "Core Switch Stack",                               implementationDate: "2026-04-08", removeByDate: "2026-04-30", createdById: "user-bheesham" },

    // ── Real temporary changes from TemporaryTracker_20241231_v01.xlsx ──────────
    { id: "tc-007", title: "Temporary VPN accounts testvpn1 / testvpn2 on UTM", status: "active",   category: "temporary_access",   riskLevel: "high",   environment: "production", systemName: "Fortigate UTM (10.6.0.29)",                         externalExposure: false, ownerType: "internal_staff",   ownerId: "sp-sachin",  implementationDate: "2026-02-02", removeByDate: "2026-05-25", createdById: "user-sachin" },
    { id: "tc-008", title: "chensuixin.huawei VPN account — pending removal",     status: "overdue",  category: "temporary_access",   riskLevel: "high",   environment: "production", systemName: "Fortigate UTM 1 & 2",                               externalExposure: false, ownerType: "external_contact", externalAgencyName: "Huawei Technologies", externalAgencyType: "vendor", implementationDate: "2025-11-14", removeByDate: "2026-01-31", createdById: "user-timothy" },
    { id: "tc-009", title: "Temporary Public IP for Owen ESD Internal Identity",  status: "active",   category: "public_ip_exposure", riskLevel: "medium", environment: "production", systemName: "Core Router",                 publicIp: "168.232.144.82", internalIp: "10.9.0.211", externalExposure: true,  ownerType: "external_contact", externalAgencyName: "ESD / Owen",          externalAgencyType: "government", implementationDate: "2025-12-02", removeByDate: "2026-06-30", createdById: "user-sachin" },
    { id: "tc-010", title: "Parika/Skeldon/Cane Grove microwave vlanif shutdown", status: "active",   category: "temporary_change",   riskLevel: "medium", environment: "production", systemName: "Transmission PEs (Parika, Skeldon, Cane Grove, Zeeburg)", externalExposure: false, ownerType: "internal_staff", ownerId: "sp-kareem", implementationDate: "2025-10-23", removeByDate: "2026-06-30", createdById: "user-kareem" },
    { id: "tc-011", title: "Allow SSH to Cash Grant Server for GCTO",             status: "active",   category: "temporary_change",   riskLevel: "high",   environment: "production", systemName: "Fortigate FW01",                                    externalExposure: false, ownerType: "external_contact", externalAgencyName: "GCTO",               externalAgencyType: "government", implementationDate: "2026-03-29", removeByDate: "2026-04-30", createdById: "user-sachin" },
    { id: "tc-012", title: "Loaned 3 routers to GPL for Solarfarm Project",       status: "active",   category: "temporary_access",   riskLevel: "low",    environment: "production", systemName: "Equipment Loan",                                    externalExposure: false, ownerType: "external_contact", externalAgencyName: "Guyana Power & Light (GPL)", externalAgencyType: "government", implementationDate: "2026-03-18", removeByDate: "2026-06-30", createdById: "user-richie" },
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
    { id: "pa-008", platform: "vpn",     accountIdentifier: "vendor.cisco.tac",  displayName: "Cisco TAC Account",  affiliationType: "vendor",        authSource: "local",            status: "active",   vpnEnabled: true,  syncMode: "manual" },
    // Edge-case accounts for reconciliation demo
    { id: "pa-009", platform: "ad",      accountIdentifier: "j.thompson",        displayName: "Jerome Thompson",    affiliationType: "ndma_internal", authSource: "active_directory", status: "orphaned",  vpnEnabled: false, syncMode: "synced", integrationId: "pi-ad" },
    { id: "pa-010", platform: "vpn",     accountIdentifier: "contractor.ws01",   displayName: "WS Engineering VPN", affiliationType: "contractor",    authSource: "local",            status: "disabled",  vpnEnabled: false, syncMode: "manual" },

    // ── Real NDMA org-wide VPN accounts (from AccountManagementMarch_20260312.xlsx) ──
    // These are non-DCS NDMA staff managed by DCS — no staffProfileId (not in DCS system)
    { id: "pa-011", platform: "vpn", accountIdentifier: "orson.smith",         displayName: "Orson Smith",         affiliationType: "ndma_internal", authSource: "active_directory", status: "active",  vpnEnabled: true,  syncMode: "synced", vpnGroup: "NOCUsers1",         privilegeLevel: "standard",  integrationId: "pi-vpn" },
    { id: "pa-012", platform: "vpn", accountIdentifier: "anisha.hintzen",      displayName: "Anisha Hintzen",      affiliationType: "ndma_internal", authSource: "active_directory", status: "active",  vpnEnabled: true,  syncMode: "synced", vpnGroup: "PME_Users1",        privilegeLevel: "standard",  integrationId: "pi-vpn" },
    { id: "pa-013", platform: "vpn", accountIdentifier: "kevin.henry",         displayName: "Kevin Henry",         affiliationType: "ndma_internal", authSource: "active_directory", status: "active",  vpnEnabled: true,  syncMode: "synced", vpnGroup: "CPUsers1",          privilegeLevel: "standard",  integrationId: "pi-vpn" },
    { id: "pa-014", platform: "vpn", accountIdentifier: "maria.augustine",     displayName: "Maria Augustine",     affiliationType: "ndma_internal", authSource: "active_directory", status: "active",  vpnEnabled: true,  syncMode: "synced", vpnGroup: "TransmissionUsers", privilegeLevel: "standard",  integrationId: "pi-vpn" },
    { id: "pa-015", platform: "vpn", accountIdentifier: "jerome.baptiste",     displayName: "Jerome Baptiste",     affiliationType: "ndma_internal", authSource: "active_directory", status: "active",  vpnEnabled: true,  syncMode: "synced", vpnGroup: "VSATUsers1",        privilegeLevel: "standard",  integrationId: "pi-vpn" },
    { id: "pa-016", platform: "vpn", accountIdentifier: "sylvia.williams",     displayName: "Sylvia Williams",     affiliationType: "ndma_internal", authSource: "active_directory", status: "active",  vpnEnabled: true,  syncMode: "synced", vpnGroup: "CloudUsers1",       privilegeLevel: "standard",  integrationId: "pi-vpn" },
    { id: "pa-017", platform: "vpn", accountIdentifier: "andy.ramsaran",       displayName: "Andy Ramsaran",       affiliationType: "ndma_internal", authSource: "active_directory", status: "active",  vpnEnabled: true,  syncMode: "synced", vpnGroup: "NOCUsers1",         privilegeLevel: "standard",  integrationId: "pi-vpn" },
    { id: "pa-018", platform: "vpn", accountIdentifier: "priya.seepersad",     displayName: "Priya Seepersad",     affiliationType: "ndma_internal", authSource: "active_directory", status: "active",  vpnEnabled: true,  syncMode: "synced", vpnGroup: "CPUsers1",          privilegeLevel: "standard",  integrationId: "pi-vpn" },
    { id: "pa-019", platform: "vpn", accountIdentifier: "calvin.jack",         displayName: "Calvin Jack",         affiliationType: "ndma_internal", authSource: "active_directory", status: "active",  vpnEnabled: true,  syncMode: "synced", vpnGroup: "PME_Users1",        privilegeLevel: "standard",  integrationId: "pi-vpn" },
    { id: "pa-020", platform: "vpn", accountIdentifier: "david.sookdeo",       displayName: "David Sookdeo",       affiliationType: "ndma_internal", authSource: "active_directory", status: "active",  vpnEnabled: true,  syncMode: "synced", vpnGroup: "TransmissionUsers", privilegeLevel: "standard",  integrationId: "pi-vpn" },
    { id: "pa-021", platform: "vpn", accountIdentifier: "rachel.narine",       displayName: "Rachel Narine",       affiliationType: "ndma_internal", authSource: "active_directory", status: "suspended", vpnEnabled: false, syncMode: "synced", vpnGroup: "NOCUsers1",        privilegeLevel: "standard",  integrationId: "pi-vpn" },  // suspended — pending offboard review
    { id: "pa-022", platform: "vpn", accountIdentifier: "consultant.netdesign", displayName: "Network Design Consultant", affiliationType: "consultant", authSource: "local",      status: "active",  vpnEnabled: true,  syncMode: "manual", vpnGroup: "CloudUsers1",       privilegeLevel: "standard" }, // external consultant

    // ── Real NDMA Zabbix accounts (from AccountManagementMarch_20260312.xlsx) ──
    // DCS engineers are Super Admin; other NDMA staff have User/Admin roles
    { id: "pa-023", platform: "zabbix", accountIdentifier: "sachin.ramsuran",  displayName: "Sachin Ramsuran",     affiliationType: "ndma_internal", authSource: "local", status: "active", vpnEnabled: false, syncMode: "manual", privilegeLevel: "super_admin", staffProfileId: "sp-sachin" },
    { id: "pa-024", platform: "zabbix", accountIdentifier: "devon.abrams",     displayName: "Devon Abrams",        affiliationType: "ndma_internal", authSource: "local", status: "active", vpnEnabled: false, syncMode: "manual", privilegeLevel: "super_admin", staffProfileId: "sp-devon"  },
    { id: "pa-025", platform: "zabbix", accountIdentifier: "nicolai.mahangi",  displayName: "Nicolai Mahangi",     affiliationType: "ndma_internal", authSource: "local", status: "active", vpnEnabled: false, syncMode: "manual", privilegeLevel: "super_admin", staffProfileId: "sp-nicolai" },
    { id: "pa-026", platform: "zabbix", accountIdentifier: "timothy.charles",  displayName: "Timothy Charles",     affiliationType: "ndma_internal", authSource: "local", status: "active", vpnEnabled: false, syncMode: "manual", privilegeLevel: "admin",       staffProfileId: "sp-timothy" },
    { id: "pa-027", platform: "zabbix", accountIdentifier: "orson.smith",      displayName: "Orson Smith",         affiliationType: "ndma_internal", authSource: "active_directory", status: "active",  vpnEnabled: false, syncMode: "synced", privilegeLevel: "user"  },  // cross-platform: also has VPN (pa-011)
    { id: "pa-028", platform: "zabbix", accountIdentifier: "kevin.henry",      displayName: "Kevin Henry",         affiliationType: "ndma_internal", authSource: "active_directory", status: "active",  vpnEnabled: false, syncMode: "synced", privilegeLevel: "admin" },   // cross-platform: also has VPN (pa-013)
    { id: "pa-029", platform: "zabbix", accountIdentifier: "alice.maharaj",    displayName: "Alice Maharaj",       affiliationType: "ndma_internal", authSource: "active_directory", status: "active",  vpnEnabled: false, syncMode: "synced", privilegeLevel: "user"  },
    { id: "pa-030", platform: "zabbix", accountIdentifier: "zabbix.guest",     displayName: "NOC Read-Only",       affiliationType: "shared_service", authSource: "local",            status: "active",  vpnEnabled: false, syncMode: "manual", privilegeLevel: "guest"  },  // shared guest account for NOC viewing
  ]).onConflictDoNothing();

  // ── Reconciliation Issues ──────────────────────────────────────────────────
  console.log("⚠️  Seeding reconciliation issues...");
  await db.insert(reconciliationIssues).values([
    {
      id: "ri-001",
      integrationId: "pi-ad",
      issueType: "orphaned_account",
      platformAccountId: "pa-009",
      details: "AD account j.thompson exists in the directory but has no matching staff profile in DCS Ops Center. Staff member may have left without offboarding completing.",
    },
    {
      id: "ri-002",
      integrationId: "pi-vpn",
      issueType: "disabled_staff_active_account",
      platformAccountId: "pa-001",
      staffProfileId: "sp-kareem",
      details: "VPN account kareem.schultz is active, but staff profile shows extended leave from 2026-03-10. Confirm whether VPN access should be suspended during leave period.",
      resolvedAt: new Date("2026-04-05T09:00:00Z"),
      resolutionNote: "Confirmed with HR — staff member is on approved leave but retains VPN access per policy. No action required.",
    },
    {
      id: "ri-003",
      integrationId: "pi-vpn",
      issueType: "expired_contractor",
      platformAccountId: "pa-010",
      details: "VPN account contractor.ws01 belongs to WS Engineering Ltd whose contract ended 2026-02-28. Account should have been disabled at contract expiry.",
    },
  ]).onConflictDoNothing();

  // ── Import Jobs ────────────────────────────────────────────────────────────
  console.log("📥 Seeding import job history...");
  await db.insert(importJobs).values([
    {
      id: "ij-001",
      importType: "staff",
      status: "completed",
      fileName: "DCS_Staff_Roster_2026.xlsx",
      totalRows: 9,
      successCount: 9,
      errorCount: 0,
      skippedCount: 0,
      createdByUserId: "user-sachin",
      completedAt: new Date("2026-01-15T10:30:00Z"),
      createdAt: new Date("2026-01-15T10:28:00Z"),
    },
    {
      id: "ij-002",
      importType: "leave",
      status: "completed",
      fileName: "LeaveDates_DCS.xlsx",
      totalRows: 7,
      successCount: 7,
      errorCount: 0,
      skippedCount: 0,
      createdByUserId: "user-sachin",
      completedAt: new Date("2026-02-01T09:15:00Z"),
      createdAt: new Date("2026-02-01T09:12:00Z"),
    },
    {
      id: "ij-003",
      importType: "platform_accounts",
      status: "partial",
      fileName: "AD_Account_Export_Mar2026.xlsx",
      totalRows: 45,
      successCount: 42,
      errorCount: 2,
      skippedCount: 1,
      errors: [
        { row: 18, field: "staffProfileId", message: "No matching staff profile for account 'j.mccoy'" },
        { row: 33, field: "platform", message: "Unrecognised platform value 'ldap' — expected one of: ad, vpn, phpipam..." },
      ],
      createdByUserId: "user-sachin",
      completedAt: new Date("2026-03-12T14:05:00Z"),
      createdAt: new Date("2026-03-12T14:00:00Z"),
    },
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
    { cycleId: "cyc-002", workItemId: "wi-014" },
    { cycleId: "cyc-002", workItemId: "wi-015" },
    { cycleId: "cyc-002", workItemId: "wi-016" },
    { cycleId: "cyc-002", workItemId: "wi-017" },
    { cycleId: "cyc-002", workItemId: "wi-018" },
    { cycleId: "cyc-002", workItemId: "wi-021" },
    { cycleId: "cyc-002", workItemId: "wi-022" },
    { cycleId: "cyc-003", workItemId: "wi-006" },
    { cycleId: "cyc-003", workItemId: "wi-008" },
    { cycleId: "cyc-003", workItemId: "wi-010" },
    { cycleId: "cyc-003", workItemId: "wi-011" },
    { cycleId: "cyc-003", workItemId: "wi-019" },
    { cycleId: "cyc-003", workItemId: "wi-020" },
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

  // ── Work Initiatives ──────────────────────────────────────────────────────
  console.log("🎯 Seeding work initiatives...");
  await db.insert(workInitiatives).values([
    {
      id: "win-001",
      title: "Infrastructure Modernisation 2026",
      description: "Upgrade core network infrastructure including switches, routers, and cabling across all data centre rooms. Align with NDMA 5-year digital roadmap.",
      status: "active",
      departmentId: "dept-core",
      targetDate: "2026-09-30",
      createdById: "user-sachin",
    },
    {
      id: "win-002",
      title: "Security Hardening & Compliance",
      description: "Comprehensive audit and hardening of all firewall rules, VPN policies, AD group memberships, and access controls. Includes remediation of all critical and high findings.",
      status: "active",
      departmentId: "dept-asn",
      targetDate: "2026-06-30",
      createdById: "user-sachin",
    },
    {
      id: "win-003",
      title: "Monitoring & Observability Uplift",
      description: "Expand Zabbix coverage to 100% of managed assets, integrate LTE monitoring into Grafana, and establish automated alerting runbooks.",
      status: "active",
      departmentId: "dept-asn",
      targetDate: "2026-07-31",
      createdById: "user-sachin",
    },
  ]).onConflictDoNothing();

  // ── Automation Rules ───────────────────────────────────────────────────────
  console.log("⚙️  Seeding automation rules...");
  await db.insert(automationRules).values([
    {
      id: "auto-001",
      name: "Notify manager on new leave request",
      description: "Sends an in-app notification to the admin role whenever a staff member submits a leave request.",
      enabled: true,
      triggerModule: "leave",
      triggerEvent: "requested",
      conditions: [],
      actions: [
        {
          type: "notify_role",
          role: "manager",
          title: "New Leave Request",
          body: "A staff member has submitted a leave request requiring your approval.",
          linkUrl: "/leave",
        },
      ],
      createdById: "user-sachin",
    },
    {
      id: "auto-002",
      name: "Alert on Sev1 incident creation",
      description: "Notifies all admins and managers immediately when a Sev1 incident is created.",
      enabled: true,
      triggerModule: "incident",
      triggerEvent: "created",
      conditions: [
        { field: "severity", operator: "eq", value: "sev1" },
      ],
      actions: [
        {
          type: "notify_role",
          role: "admin",
          title: "🚨 Sev1 Incident Raised",
          body: "A critical Sev1 incident has been created. Immediate response required.",
          linkUrl: "/incidents",
        },
      ],
      createdById: "user-sachin",
    },
    {
      id: "auto-003",
      name: "Flag overdue temporary changes",
      description: "Sends a notification to admins when a temporary change passes its remove-by date.",
      enabled: true,
      triggerModule: "temp_changes",
      triggerEvent: "overdue",
      conditions: [],
      actions: [
        {
          type: "notify_role",
          role: "admin",
          title: "Temporary Change Overdue",
          body: "A temporary change has passed its scheduled removal date and needs attention.",
          linkUrl: "/changes",
        },
      ],
      createdById: "user-sachin",
    },
    {
      id: "auto-004",
      name: "Notify requester on procurement approval",
      description: "Notifies the PR requester in-app when their purchase requisition is approved or rejected.",
      enabled: true,
      triggerModule: "procurement",
      triggerEvent: "approved",
      conditions: [],
      actions: [
        {
          type: "notify_in_app",
          title: "PR Approved",
          body: "Your purchase requisition has been approved.",
          recipientField: "requestedById",
          linkUrl: "/procurement",
        },
      ],
      createdById: "user-sachin",
    },
  ]).onConflictDoNothing();

  // ── Escalation Policies ────────────────────────────────────────────────────
  console.log("📡 Seeding escalation policies...");
  await db.insert(escalationPolicies).values([
    {
      id: "ep-001",
      name: "Network Outage Escalation",
      description: "Standard escalation chain for network-affecting incidents. Starts with ASN on-call, escalates to Lead Engineer after 15 min, then Ops Manager after 30 min.",
      serviceId: "svc-inet",
      isActive: true,
    },
    {
      id: "ep-002",
      name: "Active Directory / Auth Escalation",
      description: "Escalation for authentication and identity incidents. Lead Engineer is paged immediately; ASN on-call supports.",
      serviceId: "svc-ad",
      isActive: true,
    },
  ]).onConflictDoNothing();

  await db.insert(escalationSteps).values([
    { id: "es-001", policyId: "ep-001", stepOrder: 1, delayMinutes: 0,  notifyOnCallRole: "asn_support" },
    { id: "es-002", policyId: "ep-001", stepOrder: 2, delayMinutes: 15, notifyOnCallRole: "lead_engineer" },
    { id: "es-003", policyId: "ep-001", stepOrder: 3, delayMinutes: 30, notifyStaffId: "sp-sachin" },
    { id: "es-004", policyId: "ep-002", stepOrder: 1, delayMinutes: 0,  notifyOnCallRole: "lead_engineer" },
    { id: "es-005", policyId: "ep-002", stepOrder: 2, delayMinutes: 10, notifyOnCallRole: "asn_support" },
  ]).onConflictDoNothing();

  // ── Notifications ──────────────────────────────────────────────────────────
  console.log("🔔 Seeding notifications...");
  await db.insert(notifications).values([
    {
      id: "notif-001",
      recipientId: "user-sachin",
      channel: "in_app",
      title: "New Leave Request",
      body: "Shemar Henry has submitted an annual leave request (21–23 Apr 2026) requiring approval.",
      module: "leave",
      resourceType: "leave_request",
      resourceId: "lr-002",
      linkUrl: "/leave",
      status: "sent",
      createdAt: new Date("2026-04-10T09:15:00Z"),
    },
    {
      id: "notif-002",
      recipientId: "user-sachin",
      channel: "in_app",
      title: "New Leave Request",
      body: "Nicolai Mahangi has submitted an emergency leave request (28–29 Apr 2026) requiring approval.",
      module: "leave",
      resourceType: "leave_request",
      resourceId: "lr-007",
      linkUrl: "/leave",
      status: "sent",
      createdAt: new Date("2026-04-12T14:00:00Z"),
    },
    {
      id: "notif-003",
      recipientId: "user-sachin",
      channel: "in_app",
      title: "🚨 Sev2 Incident Raised",
      body: "Incident: Fortigate HA failover triggered unexpectedly — requires commander assignment.",
      module: "incident",
      resourceType: "incident",
      resourceId: "inc-004",
      linkUrl: "/incidents",
      status: "read",
      readAt: new Date("2026-04-12T22:30:00Z"),
      createdAt: new Date("2026-04-12T22:06:00Z"),
    },
    {
      id: "notif-004",
      recipientId: "user-kareem",
      channel: "in_app",
      title: "Temporary Change Overdue",
      body: "Bypass firewall rule for treasury data transfer passed its removal date (5 Apr 2026). Please confirm removal.",
      module: "changes",
      resourceType: "temporary_change",
      resourceId: "tc-003",
      linkUrl: "/changes",
      status: "sent",
      createdAt: new Date("2026-04-06T08:00:00Z"),
    },
    {
      id: "notif-005",
      recipientId: "user-sachin",
      channel: "in_app",
      title: "PR Approved",
      body: "Purchase Requisition: UPS replacement batteries – Room A has been approved.",
      module: "procurement",
      resourceType: "purchase_requisition",
      resourceId: "pr-003",
      linkUrl: "/procurement",
      status: "dismissed",
      createdAt: new Date("2026-04-10T09:46:00Z"),
    },
    {
      id: "notif-006",
      recipientId: "user-kareem",
      channel: "in_app",
      title: "Roster Swap Request",
      body: "Devon Abrams has requested a shift swap for the Core Support role (Week 1 2026). Please review.",
      module: "rota",
      resourceType: "on_call_swap",
      resourceId: "swap-001",
      linkUrl: "/roster",
      status: "sent",
      createdAt: new Date("2026-04-11T10:30:00Z"),
    },
  ]).onConflictDoNothing();

  // ── Access Reviews ─────────────────────────────────────────────────────────
  console.log("🔐 Seeding access reviews...");
  await db.insert(accessReviews).values([
    {
      id: "arev-001",
      platformAccountId: "pa-001",
      reviewerId: "user-sachin",
      status: "approved",
      reviewedAt: new Date("2026-03-01T10:00:00Z"),
      nextReviewDate: "2026-09-01",
      notes: "VPN access confirmed appropriate. User active, role matches.",
    },
    {
      id: "arev-002",
      platformAccountId: "pa-003",
      reviewerId: "user-sachin",
      status: "approved",
      reviewedAt: new Date("2026-03-01T10:30:00Z"),
      nextReviewDate: "2026-09-01",
      notes: "VPN access confirmed. Core team engineer — access level appropriate.",
    },
    {
      id: "arev-003",
      platformAccountId: "pa-008",
      reviewerId: "user-sachin",
      status: "pending",
      nextReviewDate: "2026-04-30",
      notes: "Vendor VPN account. Awaiting confirmation from Cisco TAC that the engagement is still active.",
    },
    {
      id: "arev-004",
      platformAccountId: "pa-006",
      reviewerId: "user-sachin",
      status: "pending",
      nextReviewDate: "2026-04-15",
      notes: "phpIPAM admin account — check if rg_admin still requires admin-level access or can be downgraded.",
    },
  ]).onConflictDoNothing();

  // ── On-Call Swap Requests ──────────────────────────────────────────────────
  console.log("🔄 Seeding on-call swap requests...");
  await db.insert(onCallSwaps).values([
    {
      id: "swap-001",
      // Devon (core_support, w01) wants to swap with Gerard
      assignmentId: "c360c1cb-69c9-4eb8-972e-d6d6dd0ba833",
      requesterId: "sp-devon",
      targetId: "sp-gerard",
      reason: "Attending a family event on Saturday. Gerard has agreed to cover.",
      status: "pending",
    },
    {
      id: "swap-002",
      // Richie (enterprise_support, w01) swapped with Timothy — already approved
      assignmentId: "10ff9a6d-4119-4224-ae4f-635b2e78b733",
      requesterId: "sp-richie",
      targetId: "sp-timothy",
      reason: "Medical appointment mid-week. Timothy confirmed availability.",
      status: "approved",
      reviewedById: "user-sachin",
      reviewedAt: new Date("2026-04-05T11:00:00Z"),
      reviewNotes: "Approved. Both engineers confirmed. Rota updated.",
    },
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
