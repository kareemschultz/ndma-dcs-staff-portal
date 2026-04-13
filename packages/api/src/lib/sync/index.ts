/**
 * Sync job processor.
 *
 * Called from access.integrations.triggerSync (manual) or a future scheduled
 * worker (cron). Picks up the integration config, runs the matching connector,
 * reconciles the fetched accounts against existing platform_accounts rows that
 * are owned by this integration, and writes the job outcome + any
 * reconciliation issues back to the database.
 *
 * Reconciliation logic:
 *   - Accounts returned by the connector → upsert (create or update status/displayName)
 *   - Accounts in DB owned by this integration but NOT returned → mark isOrphaned=true
 *     and open a "missing_externally" reconciliation issue.
 *   - Accounts returned but with isActive=false → ensure local status="disabled"
 */

import { eq, and } from "drizzle-orm";
import {
  db,
  platformAccounts,
  platformIntegrations,
  syncJobs,
  reconciliationIssues,
} from "@ndma-dcs-staff-portal/db";

import { ipamConnector } from "./connectors/ipam";
import { ldapConnector } from "./connectors/ldap";

// ── Connector registry ─────────────────────────────────────────────────────

const CONNECTORS = {
  ipam: ipamConnector,
  phpipam: ipamConnector,
  ad: ldapConnector,
} as const;

type ConnectorKey = keyof typeof CONNECTORS;

// ── Main processor ─────────────────────────────────────────────────────────

export interface RunSyncJobResult {
  success: boolean;
  recordsProcessed: number;
  recordsCreated: number;
  recordsUpdated: number;
  recordsSkipped: number;
  issuesOpened: number;
  error?: string;
}

export async function runSyncJob(syncJobId: string): Promise<RunSyncJobResult> {
  // Load sync job + integration
  const job = await db.query.syncJobs.findFirst({
    where: eq(syncJobs.id, syncJobId),
    with: { integration: true },
  });

  if (!job) {
    return { success: false, recordsProcessed: 0, recordsCreated: 0, recordsUpdated: 0, recordsSkipped: 0, issuesOpened: 0, error: "Sync job not found" };
  }

  const integration = job.integration;

  // Mark job as running
  await db
    .update(syncJobs)
    .set({ status: "running", startedAt: new Date() })
    .where(eq(syncJobs.id, syncJobId));

  const counters = {
    processed: 0,
    created: 0,
    updated: 0,
    skipped: 0,
    issues: 0,
  };

  const jobErrors: { externalId: string; message: string }[] = [];

  try {
    // ── 1. Select connector ──────────────────────────────────────────────
    const connectorKey = integration.platform as ConnectorKey;
    const connector = CONNECTORS[connectorKey];

    if (!connector) {
      throw new Error(`No sync connector available for platform: ${integration.platform}`);
    }

    if (!integration.apiBaseUrl) {
      throw new Error("Integration has no apiBaseUrl configured");
    }

    // ── 2. Fetch external accounts ───────────────────────────────────────
    const syncResult = await connector.fetchAccounts({
      apiBaseUrl: integration.apiBaseUrl,
      config: (integration.config ?? {}) as Record<string, unknown>,
    });

    if (!syncResult.success) {
      throw new Error(syncResult.error ?? "Connector returned failure");
    }

    const fetchedAccounts = syncResult.accounts;

    // ── 3. Load existing accounts owned by this integration ──────────────
    const existingAccounts = await db.query.platformAccounts.findMany({
      where: and(
        eq(platformAccounts.syncSourceSystem, integration.platform),
        eq(platformAccounts.syncMode, "synced"),
      ),
    });

    // Index existing accounts by accountIdentifier for O(1) lookup
    const existingByIdentifier = new Map(
      existingAccounts.map((a) => [a.accountIdentifier, a]),
    );

    // Track which identifiers appear in the fetch result
    const fetchedIdentifiers = new Set<string>();

    // ── 4. Upsert each fetched account ───────────────────────────────────
    for (const ext of fetchedAccounts) {
      counters.processed++;

      if (!ext.accountIdentifier) {
        counters.skipped++;
        continue;
      }

      fetchedIdentifiers.add(ext.accountIdentifier);

      const existing = existingByIdentifier.get(ext.accountIdentifier);
      const newStatus = ext.isActive ? "active" : "disabled";

      try {
        if (!existing) {
          // Create new record
          await db.insert(platformAccounts).values({
            platform: integration.platform,
            accountIdentifier: ext.accountIdentifier,
            displayName: ext.displayName ?? null,
            email: ext.email ?? null,
            status: newStatus,
            syncMode: "synced",
            syncSourceSystem: integration.platform,
            externalAccountId: (ext.metadata?.objectGUID as string | undefined) ??
              (ext.metadata?.ipamId as string | undefined) ?? null,
            lastSyncedAt: new Date(),
            affiliationType: "ndma_internal",
            authSource: integration.platform === "ad" ? "active_directory" : "local",
          });
          counters.created++;
        } else {
          // Update existing record — only fields owned by the sync source
          await db
            .update(platformAccounts)
            .set({
              displayName: ext.displayName ?? existing.displayName,
              email: ext.email ?? existing.email,
              status: newStatus,
              lastSyncedAt: new Date(),
              isOrphaned: false,
              // Clear stale flag since we just saw this account
              isStale: false,
            })
            .where(eq(platformAccounts.id, existing.id));
          counters.updated++;
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Upsert failed";
        jobErrors.push({ externalId: ext.accountIdentifier, message: msg });
        counters.skipped++;
      }
    }

    // ── 5. Find orphaned accounts (in DB, not returned by connector) ─────
    const orphanedAccounts = existingAccounts.filter(
      (a) => !fetchedIdentifiers.has(a.accountIdentifier),
    );

    for (const orphan of orphanedAccounts) {
      // Mark account as orphaned in the main table
      await db
        .update(platformAccounts)
        .set({ isOrphaned: true, status: "orphaned" })
        .where(eq(platformAccounts.id, orphan.id));

      // Open a reconciliation issue (avoid duplicates by checking unresolved ones)
      const existing_issue = await db.query.reconciliationIssues.findFirst({
        where: and(
          eq(reconciliationIssues.platformAccountId, orphan.id),
          eq(reconciliationIssues.issueType, "missing_externally"),
        ),
      });

      if (!existing_issue) {
        await db.insert(reconciliationIssues).values({
          syncJobId,
          integrationId: integration.id,
          issueType: "missing_externally",
          platformAccountId: orphan.id,
          externalAccountId: orphan.accountIdentifier,
          staffProfileId: orphan.staffProfileId ?? null,
          details: `Account "${orphan.accountIdentifier}" was not returned by the ${integration.platform} connector — it may have been deleted or renamed on the external system.`,
        });
        counters.issues++;
      }
    }

    // ── 6. Finalise job as completed ─────────────────────────────────────
    const finalStatus =
      jobErrors.length === 0
        ? "completed"
        : counters.processed > jobErrors.length
          ? "partial"
          : "failed";

    await db
      .update(syncJobs)
      .set({
        status: finalStatus,
        recordsProcessed: counters.processed,
        recordsCreated: counters.created,
        recordsUpdated: counters.updated,
        recordsSkipped: counters.skipped,
        errors: jobErrors.length > 0 ? jobErrors : null,
        completedAt: new Date(),
      })
      .where(eq(syncJobs.id, syncJobId));

    // Update integration's lastSyncAt
    await db
      .update(platformIntegrations)
      .set({
        lastSyncAt: new Date(),
        lastSyncError: jobErrors.length > 0 ? `${jobErrors.length} errors during sync` : null,
        status: finalStatus === "failed" ? "error" : "active",
      })
      .where(eq(platformIntegrations.id, integration.id));

    return {
      success: finalStatus !== "failed",
      recordsProcessed: counters.processed,
      recordsCreated: counters.created,
      recordsUpdated: counters.updated,
      recordsSkipped: counters.skipped,
      issuesOpened: counters.issues,
    };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Unknown sync error";

    await db
      .update(syncJobs)
      .set({
        status: "failed",
        recordsProcessed: counters.processed,
        recordsCreated: counters.created,
        recordsUpdated: counters.updated,
        recordsSkipped: counters.skipped,
        errors: [{ externalId: "N/A", message: errorMsg }],
        completedAt: new Date(),
      })
      .where(eq(syncJobs.id, syncJobId));

    await db
      .update(platformIntegrations)
      .set({ status: "error", lastSyncError: errorMsg })
      .where(eq(platformIntegrations.id, job.integrationId));

    return {
      success: false,
      recordsProcessed: counters.processed,
      recordsCreated: counters.created,
      recordsUpdated: counters.updated,
      recordsSkipped: counters.skipped,
      issuesOpened: counters.issues,
      error: errorMsg,
    };
  }
}
