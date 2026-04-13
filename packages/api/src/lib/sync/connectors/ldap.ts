/**
 * Active Directory / LDAP connector.
 *
 * Uses the Node.js `ldapts` package for LDAP queries.
 * Install when ready: `bun add ldapts`
 *
 * Required config keys (stored in platform_integrations.config JSONB):
 *   url          — LDAP URL, e.g. "ldap://ad.ndma.gov.gh:389" or "ldaps://..."
 *   bindDn       — Bind DN for service account, e.g. "CN=svc-sync,OU=ServiceAccounts,DC=ndma,DC=gov,DC=gh"
 *   bindPassword — Password for the bind account
 *   baseDn       — Search base, e.g. "OU=Users,DC=ndma,DC=gov,DC=gh"
 *   filter       — LDAP search filter (default: "(objectClass=user)")
 *   useTls       — boolean (default: false)
 *
 * Attributes mapped:
 *   sAMAccountName → accountIdentifier
 *   cn / displayName → displayName
 *   mail → email
 *   userAccountControl → isActive (bit 2 = disabled flag)
 */

import type { ConnectorConfig, ExternalAccount, SyncConnector, SyncResult } from "../types";

// ── Helpers ───────────────────────────────────────────────────────────────

/** userAccountControl bit 2 (0x0002) indicates a disabled AD account. */
function isAdAccountActive(uac: string | number | undefined): boolean {
  if (uac === undefined) return true;
  const val = typeof uac === "string" ? parseInt(uac, 10) : uac;
  return (val & 0x0002) === 0;
}

// ── Connector ─────────────────────────────────────────────────────────────

export const ldapConnector: SyncConnector = {
  async fetchAccounts(cfg: ConnectorConfig): Promise<SyncResult> {
    const { config } = cfg;

    const url = config.url as string | undefined;
    const bindDn = config.bindDn as string | undefined;
    const bindPassword = config.bindPassword as string | undefined;
    const baseDn = config.baseDn as string | undefined;
    const filter = (config.filter as string | undefined) ?? "(&(objectClass=user)(!(objectClass=computer)))";

    if (!url || !bindDn || !bindPassword || !baseDn) {
      return {
        accounts: [],
        success: false,
        error: "LDAP config missing: url, bindDn, bindPassword, or baseDn",
      };
    }

    try {
      // Dynamic import so the module is optional — install `ldapts` to enable.
      // The `@ts-expect-error` below suppresses the "cannot find module" error
      // since ldapts is an optional peer dependency.
      // @ts-expect-error ldapts is an optional peer dependency
      const { Client } = await import("ldapts").catch(() => {
        throw new Error(
          "ldapts package not installed — run: bun add ldapts",
        );
      });

      const client = new Client({ url, tlsOptions: config.useTls ? {} : undefined });

      await client.bind(bindDn, bindPassword);

      const { searchEntries } = await client.search(baseDn, {
        scope: "sub",
        filter,
        attributes: ["sAMAccountName", "cn", "displayName", "mail", "userAccountControl", "objectGUID"],
      });

      await client.unbind();

      const accounts: ExternalAccount[] = searchEntries.map((entry: Record<string, unknown>) => {
        const samAccount = (entry.sAMAccountName as string | undefined) ?? "";
        const displayName =
          (entry.displayName as string | undefined) ??
          (entry.cn as string | undefined) ??
          samAccount;
        const email = entry.mail as string | undefined;
        const uac = entry.userAccountControl as string | number | undefined;

        return {
          accountIdentifier: samAccount,
          displayName,
          email: email ?? undefined,
          isActive: isAdAccountActive(uac),
          metadata: {
            objectGUID: entry.objectGUID,
            userAccountControl: uac,
          },
        };
      });

      return { accounts, success: true };
    } catch (err) {
      return {
        accounts: [],
        success: false,
        error: err instanceof Error ? err.message : "LDAP fetch failed",
      };
    }
  },
};
