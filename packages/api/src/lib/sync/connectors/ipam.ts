/**
 * phpIPAM connector — fetches user/device records via the phpIPAM REST API.
 *
 * phpIPAM API reference: https://phpipam.net/api/api_reference/
 *
 * Required config keys (stored in platform_integrations.config JSONB):
 *   apiToken  — phpIPAM application API token
 *   appId     — phpIPAM application ID (used in URL path)
 *
 * Optional:
 *   userGroupId — only fetch users in this group (default: all)
 */

import type { ConnectorConfig, ExternalAccount, SyncConnector, SyncResult } from "../types";

interface PhpIpamUser {
  id: string;
  username: string;
  real_name?: string;
  email?: string;
  disabled?: "0" | "1" | boolean;
}

interface PhpIpamResponse<T> {
  code: number;
  success: boolean;
  data?: T;
  message?: string;
}

async function ipamRequest<T>(
  apiBaseUrl: string,
  appId: string,
  apiToken: string,
  path: string,
): Promise<T> {
  const url = `${apiBaseUrl.replace(/\/$/, "")}/api/${appId}${path}`;
  const res = await fetch(url, {
    headers: {
      "token": apiToken,
      "Content-Type": "application/json",
    },
    signal: AbortSignal.timeout(15_000),
  });

  if (!res.ok) {
    throw new Error(`phpIPAM API error: HTTP ${res.status} ${res.statusText}`);
  }

  const body = (await res.json()) as PhpIpamResponse<T>;
  if (!body.success) {
    throw new Error(`phpIPAM API error: ${body.message ?? "Unknown error"}`);
  }

  return body.data as T;
}

export const ipamConnector: SyncConnector = {
  async fetchAccounts(cfg: ConnectorConfig): Promise<SyncResult> {
    const { apiBaseUrl, config } = cfg;
    const apiToken = config.apiToken as string | undefined;
    const appId = config.appId as string | undefined;

    if (!apiToken || !appId) {
      return { accounts: [], success: false, error: "phpIPAM config missing apiToken or appId" };
    }

    try {
      const users = await ipamRequest<PhpIpamUser[]>(
        apiBaseUrl,
        appId,
        apiToken,
        "/user/",
      );

      const accounts: ExternalAccount[] = users.map((u) => ({
        accountIdentifier: u.username,
        displayName: u.real_name ?? u.username,
        email: u.email ?? undefined,
        isActive: u.disabled !== "1" && u.disabled !== true,
        metadata: { ipamId: u.id, rawUser: u },
      }));

      return { accounts, success: true };
    } catch (err) {
      return {
        accounts: [],
        success: false,
        error: err instanceof Error ? err.message : "phpIPAM fetch failed",
      };
    }
  },
};
