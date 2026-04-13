/**
 * Shared types for the platform account sync connector framework.
 *
 * Each connector (phpIPAM, AD/LDAP, RADIUS, Zabbix…) implements
 * the `SyncConnector` interface, and the job processor calls it
 * via the common `runSyncJob()` function.
 */

export interface ExternalAccount {
  /** Identifier on the external platform (username, DN, badge number, etc.) */
  accountIdentifier: string;
  /** Friendly display name */
  displayName?: string;
  /** Email address linked to the account */
  email?: string;
  /** Account is currently enabled on the source system */
  isActive: boolean;
  /** Source-system-specific metadata — stored as-is for later reconciliation */
  metadata?: Record<string, unknown>;
}

export interface SyncResult {
  /** Accounts fetched from the external system */
  accounts: ExternalAccount[];
  /** Whether the fetch was successful */
  success: boolean;
  /** Error description if success === false */
  error?: string;
}

export interface ConnectorConfig {
  /** Base URL of the external API (from platform_integrations.apiBaseUrl) */
  apiBaseUrl: string;
  /** Raw JSONB config from platform_integrations.config */
  config: Record<string, unknown>;
}

/** Interface every platform connector must implement. */
export interface SyncConnector {
  /** Fetch all accounts from the external system. */
  fetchAccounts(cfg: ConnectorConfig): Promise<SyncResult>;
}
