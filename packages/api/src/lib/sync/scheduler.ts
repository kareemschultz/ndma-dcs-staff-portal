import { db, platformIntegrations, syncJobs } from "@ndma-dcs-staff-portal/db";
import { eq, and } from "drizzle-orm";
import { runSyncJob } from "./index";

/**
 * Check all sync-enabled integrations and fire a sync job for any that are due.
 * Called on server startup and then every POLL_INTERVAL_MS.
 */
async function runScheduledSyncs() {
  try {
    const now = new Date();
    const integrations = await db.query.platformIntegrations.findMany({
      where: eq(platformIntegrations.syncEnabled, true),
    });

    for (const integration of integrations) {
      const freqMs = (integration.syncFrequencyMinutes ?? 0) * 60_000;
      if (freqMs <= 0) continue;

      const lastSync = integration.lastSyncAt ? new Date(integration.lastSyncAt) : null;
      const isDue = !lastSync || now.getTime() - lastSync.getTime() >= freqMs;
      if (!isDue) continue;

      // Skip if a job is already running
      const running = await db.query.syncJobs.findFirst({
        where: and(
          eq(syncJobs.integrationId, integration.id),
          eq(syncJobs.status, "running"),
        ),
      });
      if (running) continue;

      const [job] = await db
        .insert(syncJobs)
        .values({
          integrationId: integration.id,
          triggeredBy: "scheduled",
          status: "pending",
        })
        .returning();

      if (!job) continue;

      console.log(
        `[sync-scheduler] Firing scheduled sync for integration ${integration.id} (${integration.name})`,
      );
      void runSyncJob(job.id).catch((err) => {
        console.error(`[sync-scheduler] Sync job ${job.id} failed:`, err);
      });
    }
  } catch (err) {
    console.error("[sync-scheduler] Error during scheduled sync check:", err);
  }
}

const POLL_INTERVAL_MS = 5 * 60_000; // 5 minutes

/**
 * Start the background sync scheduler. Safe to call multiple times — only
 * starts the interval once. Returns a cleanup function for tests.
 */
export function startSyncScheduler(): () => void {
  void runScheduledSyncs();
  const handle = setInterval(() => void runScheduledSyncs(), POLL_INTERVAL_MS);
  return () => clearInterval(handle);
}
