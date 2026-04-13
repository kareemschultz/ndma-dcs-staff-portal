import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { format, parseISO, isPast } from "date-fns";
import {
  Key,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Plug,
  Activity,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@ndma-dcs-staff-portal/ui/components/button";
import { Skeleton } from "@ndma-dcs-staff-portal/ui/components/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@ndma-dcs-staff-portal/ui/components/table";
import { Header } from "@/components/layout/header";
import { Main } from "@/components/layout/main";
import { ThemeSwitch } from "@/components/theme-switch";
import { orpc, queryClient } from "@/utils/orpc";

export const Route = createFileRoute("/_authenticated/access/")({
  component: PlatformAccountsPage,
});

type Platform = "vpn" | "fortigate" | "uportal" | "biometric" | "ad" | "ipam" | "radius" | "other";
type AccountStatus = "active" | "suspended" | "disabled" | "pending_creation";
type SyncMode = "manual" | "synced" | "hybrid";
type AuthSource =
  | "local"
  | "active_directory"
  | "ldap"
  | "radius"
  | "saml"
  | "oauth_oidc"
  | "service_account"
  | "api_only";

const PLATFORM_LABELS: Record<Platform, string> = {
  vpn: "VPN",
  fortigate: "Fortigate",
  uportal: "uPortal",
  biometric: "Biometric",
  ad: "Active Directory",
  ipam: "IPAM",
  radius: "RADIUS",
  other: "Other",
};

const AUTH_SOURCE_LABELS: Record<AuthSource, string> = {
  local: "Local",
  active_directory: "AD",
  ldap: "LDAP",
  radius: "RADIUS",
  saml: "SAML",
  oauth_oidc: "OAuth/OIDC",
  service_account: "Service Account",
  api_only: "API Only",
};

const AUTH_SOURCE_COLORS: Record<AuthSource, string> = {
  local: "bg-muted text-muted-foreground",
  active_directory: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  ldap: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  radius: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300",
  saml: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  oauth_oidc: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  service_account: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  api_only: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
};

const SYNC_MODE_COLORS: Record<SyncMode, string> = {
  manual: "bg-muted text-muted-foreground",
  synced: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  hybrid: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
};

const STATUS_COLORS: Record<AccountStatus, string> = {
  active: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  suspended: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  disabled: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  pending_creation: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
};

const INTEGRATION_STATUS_COLORS: Record<string, string> = {
  active: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  inactive: "bg-muted text-muted-foreground",
  error: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  pending: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
};

type Tab = "accounts" | "integrations" | "reconciliation";

function PlatformAccountsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("accounts");
  const [platform, setPlatform] = useState<Platform | "">("");
  const [status, setStatus] = useState<AccountStatus | "">("");
  const [syncMode, setSyncMode] = useState<SyncMode | "">("");

  const { data, isLoading } = useQuery(
    orpc.access.accounts.list.queryOptions({
      input: {
        platform: platform || undefined,
        status: status || undefined,
        syncMode: syncMode || undefined,
      },
    })
  );

  const { data: expiring } = useQuery(
    orpc.access.accounts.getExpiring.queryOptions({ input: { withinDays: 30 } })
  );

  const { data: integrations, isLoading: integrationsLoading } = useQuery(
    orpc.access.integrations.list.queryOptions()
  );

  const { data: reconciliationIssues, isLoading: reconcLoading } = useQuery(
    orpc.access.reconciliation.list.queryOptions({ input: { resolved: false } })
  );

  const markReviewedMutation = useMutation(
    orpc.access.accounts.markReviewed.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: orpc.access.accounts.list.key() });
        toast.success("Account marked as reviewed");
      },
      onError: (err) => toast.error(err.message),
    })
  );

  const triggerSyncMutation = useMutation(
    orpc.access.integrations.triggerSync.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: orpc.access.integrations.list.key() });
        queryClient.invalidateQueries({ queryKey: orpc.access.syncJobs.list.key() });
        toast.success("Sync job queued");
      },
      onError: (err) => toast.error(err.message),
    })
  );

  const resolveIssueMutation = useMutation(
    orpc.access.reconciliation.resolve.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: orpc.access.reconciliation.list.key() });
        toast.success("Issue resolved");
      },
      onError: (err) => toast.error(err.message),
    })
  );

  const openIssueCount = reconciliationIssues?.length ?? 0;

  return (
    <>
      <Header fixed>
        <div className="flex items-center gap-2">
          <Key className="size-4 text-muted-foreground" />
          <span className="text-sm font-medium">Access & Accounts</span>
        </div>
        <div className="ms-auto flex items-center gap-2">
          <ThemeSwitch />
        </div>
      </Header>

      <Main>
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">Access & Accounts</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Staff account records across all managed platforms — manually entered or
            synced via API. Supports Local, AD/LDAP, RADIUS, and other auth sources.
          </p>
        </div>

        {/* Expiry alert */}
        {expiring && expiring.length > 0 && (
          <div className="mb-4 flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 dark:bg-amber-900/20 p-3 text-sm text-amber-700 dark:text-amber-300">
            <AlertCircle className="size-4 shrink-0" />
            <strong>{expiring.length}</strong> account{expiring.length > 1 ? "s" : ""}{" "}
            expiring within 30 days — access review required.
          </div>
        )}

        {/* Reconciliation alert */}
        {openIssueCount > 0 && (
          <div className="mb-4 flex items-center gap-2 rounded-md border border-red-200 bg-red-50 dark:bg-red-900/20 p-3 text-sm text-red-700 dark:text-red-300">
            <AlertTriangle className="size-4 shrink-0" />
            <strong>{openIssueCount}</strong> unresolved reconciliation{" "}
            {openIssueCount === 1 ? "issue" : "issues"} detected.{" "}
            <button
              onClick={() => setActiveTab("reconciliation")}
              className="underline font-medium"
            >
              View issues
            </button>
          </div>
        )}

        {/* Tabs */}
        <div className="mb-4 flex gap-1 border-b">
          {([
            { key: "accounts", label: "Accounts", count: data?.length },
            { key: "integrations", label: "Integrations", count: integrations?.length },
            {
              key: "reconciliation",
              label: "Reconciliation",
              count: openIssueCount > 0 ? openIssueCount : undefined,
              alert: openIssueCount > 0,
            },
          ] as const).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? "border-b-2 border-primary text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span
                  className={`rounded-full px-1.5 py-0.5 text-xs ${
                    "alert" in tab && tab.alert
                      ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── Accounts Tab ─────────────────────────────────────────────── */}
        {activeTab === "accounts" && (
          <>
            {data && (
              <div className="mb-4 flex flex-wrap gap-4 text-sm">
                <span className="text-muted-foreground">
                  <strong className="text-foreground">{data.length}</strong> accounts
                </span>
                <span className="text-green-600">
                  <strong>{data.filter((a) => a.status === "active").length}</strong> active
                </span>
                <span className="text-muted-foreground">
                  <strong className="text-blue-600">
                    {data.filter((a) => a.syncMode === "synced").length}
                  </strong>{" "}
                  synced
                </span>
                <span className="text-muted-foreground">
                  <strong>{data.filter((a) => a.syncMode === "manual").length}</strong> manual
                </span>
              </div>
            )}

            <div className="mb-4 flex flex-wrap gap-3">
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value as Platform | "")}
                className="rounded-md border bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">All Platforms</option>
                {(Object.keys(PLATFORM_LABELS) as Platform[]).map((p) => (
                  <option key={p} value={p}>
                    {PLATFORM_LABELS[p]}
                  </option>
                ))}
              </select>

              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as AccountStatus | "")}
                className="rounded-md border bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">All Statuses</option>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
                <option value="disabled">Disabled</option>
                <option value="pending_creation">Pending Creation</option>
              </select>

              <select
                value={syncMode}
                onChange={(e) => setSyncMode(e.target.value as SyncMode | "")}
                className="rounded-md border bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">All Sync Modes</option>
                <option value="manual">Manual</option>
                <option value="synced">Synced</option>
                <option value="hybrid">Hybrid</option>
              </select>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Staff Member</TableHead>
                    <TableHead>Platform</TableHead>
                    <TableHead>Account / ID</TableHead>
                    <TableHead>Auth Source</TableHead>
                    <TableHead>Sync</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead>Last Reviewed</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        {Array.from({ length: 9 }).map((_, j) => (
                          <TableCell key={j}>
                            <Skeleton className="h-4 w-full" />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : !data?.length ? (
                    <TableRow>
                      <TableCell colSpan={9} className="py-12 text-center text-muted-foreground">
                        No platform accounts found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    data.map((account) => {
                      const isExpired =
                        account.expiresAt && isPast(parseISO(account.expiresAt));
                      const authSrc = account.authSource as AuthSource;
                      const syncM = account.syncMode as SyncMode;
                      return (
                        <TableRow key={account.id}>
                          <TableCell className="font-medium">
                            {account.staffProfile?.user?.name ?? "—"}
                            {account.displayName && account.displayName !== account.accountIdentifier && (
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {account.displayName}
                              </p>
                            )}
                          </TableCell>
                          <TableCell className="text-sm">
                            {PLATFORM_LABELS[account.platform as Platform] ?? account.platform}
                          </TableCell>
                          <TableCell className="font-mono text-xs text-muted-foreground">
                            {account.accountIdentifier}
                            {account.privilegeLevel && (
                              <span className="ml-1 text-xs text-amber-600">
                                ({account.privilegeLevel})
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            <span
                              className={`inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium ${
                                AUTH_SOURCE_COLORS[authSrc] ?? "bg-muted text-muted-foreground"
                              }`}
                            >
                              {AUTH_SOURCE_LABELS[authSrc] ?? authSrc}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span
                              className={`inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium ${
                                SYNC_MODE_COLORS[syncM] ?? "bg-muted text-muted-foreground"
                              }`}
                            >
                              {syncM}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span
                              className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${
                                STATUS_COLORS[account.status as AccountStatus] ?? ""
                              }`}
                            >
                              {account.status.replace("_", " ")}
                            </span>
                          </TableCell>
                          <TableCell
                            className={`text-xs ${
                              isExpired ? "text-red-600 font-medium" : "text-muted-foreground"
                            }`}
                          >
                            {account.expiresAt
                              ? format(parseISO(account.expiresAt), "dd MMM yyyy")
                              : "—"}
                            {isExpired && " ⚠️"}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {account.lastReviewedAt ? (
                              format(parseISO(account.lastReviewedAt), "dd MMM yyyy")
                            ) : (
                              <span className="text-amber-600">Never</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs gap-1"
                              onClick={() =>
                                markReviewedMutation.mutate({ id: account.id })
                              }
                              disabled={markReviewedMutation.isPending}
                            >
                              <CheckCircle className="size-3" />
                              Review
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </>
        )}

        {/* ── Integrations Tab ─────────────────────────────────────────── */}
        {activeTab === "integrations" && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground mb-4">
              Platform connectors for API-based account synchronization. Configure a
              connector to pull account records automatically from systems like IPAM, AD,
              or RADIUS. Manual entry remains available for all platforms.
            </p>

            {integrationsLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full rounded-md" />
              ))
            ) : !integrations?.length ? (
              <div className="rounded-md border border-dashed p-12 text-center text-muted-foreground">
                <Plug className="size-8 mx-auto mb-3 opacity-40" />
                <p className="font-medium">No integrations configured</p>
                <p className="text-sm mt-1">
                  Platform integrations enable automatic account sync from external APIs.
                </p>
              </div>
            ) : (
              integrations.map((integration) => (
                <div key={integration.id} className="rounded-md border p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm">{integration.name}</p>
                        <span
                          className={`inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium ${
                            INTEGRATION_STATUS_COLORS[integration.status] ?? ""
                          }`}
                        >
                          {integration.status}
                        </span>
                        {integration.syncEnabled && (
                          <span className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300">
                            <Activity className="size-3" />
                            Sync on
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {PLATFORM_LABELS[integration.platform as Platform] ?? integration.platform}
                        {integration.syncDirection && (
                          <span className="ml-2">· {integration.syncDirection}</span>
                        )}
                        {integration.syncFrequencyMinutes && (
                          <span className="ml-2">
                            · every {integration.syncFrequencyMinutes}m
                          </span>
                        )}
                      </p>
                      {integration.description && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {integration.description}
                        </p>
                      )}
                      {integration.lastSyncAt && (
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                          <Clock className="size-3" />
                          Last sync:{" "}
                          {format(new Date(integration.lastSyncAt), "dd MMM yyyy, HH:mm")}
                        </p>
                      )}
                      {integration.lastSyncError && (
                        <p className="text-xs text-red-600 mt-1">{integration.lastSyncError}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {integration.syncEnabled && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs gap-1"
                          onClick={() =>
                            triggerSyncMutation.mutate({
                              integrationId: integration.id,
                            })
                          }
                          disabled={triggerSyncMutation.isPending}
                        >
                          <RefreshCw className="size-3" />
                          Sync now
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ── Reconciliation Tab ───────────────────────────────────────── */}
        {activeTab === "reconciliation" && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground mb-4">
              Discrepancies detected during sync — orphaned accounts, stale records,
              unlinked accounts, and username mismatches. Resolve each issue manually
              or dismiss with a note.
            </p>

            {reconcLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-md" />
              ))
            ) : !reconciliationIssues?.length ? (
              <div className="rounded-md border border-dashed p-12 text-center text-muted-foreground">
                <CheckCircle className="size-8 mx-auto mb-3 opacity-40" />
                <p className="font-medium">No open issues</p>
                <p className="text-sm mt-1">All reconciliation checks passed.</p>
              </div>
            ) : (
              reconciliationIssues.map((issue) => (
                <div
                  key={issue.id}
                  className="rounded-md border border-amber-200 bg-amber-50 dark:bg-amber-900/10 p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center rounded px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                          {issue.issueType.replace(/_/g, " ")}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {issue.integration?.name}
                        </span>
                      </div>
                      {issue.platformAccount?.staffProfile?.user?.name && (
                        <p className="text-sm font-medium mt-1">
                          {issue.platformAccount.staffProfile.user.name}
                        </p>
                      )}
                      {issue.externalAccountId && (
                        <p className="text-xs text-muted-foreground font-mono mt-0.5">
                          External ID: {issue.externalAccountId}
                        </p>
                      )}
                      {issue.details && (
                        <p className="text-xs text-muted-foreground mt-1">{issue.details}</p>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs shrink-0"
                      onClick={() => resolveIssueMutation.mutate({ id: issue.id })}
                      disabled={resolveIssueMutation.isPending}
                    >
                      Resolve
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </Main>
    </>
  );
}
