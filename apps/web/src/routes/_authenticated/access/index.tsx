import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
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
  Shield,
  Users,
  Network,
  UserX,
  ExternalLink,
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

// ── Label/color maps ──────────────────────────────────────────────────────

type Platform =
  | "vpn" | "fortigate" | "uportal" | "biometric" | "ad"
  | "ipam" | "phpipam" | "radius" | "zabbix" | "other";
type AccountStatus = "active" | "suspended" | "disabled" | "pending_creation" | "orphaned" | "pending_review";
type SyncMode = "manual" | "synced" | "hybrid";
type AuthSource =
  | "local" | "active_directory" | "ldap" | "radius" | "saml"
  | "oauth_oidc" | "service_account" | "api_only";
type Affiliation =
  | "ndma_internal" | "external_agency" | "contractor"
  | "consultant" | "vendor" | "shared_service";

const PLATFORM_LABELS: Record<Platform, string> = {
  vpn: "VPN", fortigate: "Fortigate", uportal: "uPortal",
  biometric: "Biometric", ad: "Active Directory", ipam: "IPAM",
  phpipam: "phpIPAM", radius: "RADIUS", zabbix: "Zabbix", other: "Other",
};

const AUTH_SOURCE_LABELS: Record<AuthSource, string> = {
  local: "Local", active_directory: "AD", ldap: "LDAP", radius: "RADIUS",
  saml: "SAML", oauth_oidc: "OAuth/OIDC", service_account: "Service Acct", api_only: "API Only",
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
  orphaned: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  pending_review: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
};

const AFFILIATION_LABELS: Record<Affiliation, string> = {
  ndma_internal: "NDMA", external_agency: "Agency", contractor: "Contractor",
  consultant: "Consultant", vendor: "Vendor", shared_service: "Shared",
};

const AFFILIATION_COLORS: Record<Affiliation, string> = {
  ndma_internal: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  external_agency: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300",
  contractor: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  consultant: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  vendor: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  shared_service: "bg-muted text-muted-foreground",
};

const INTEGRATION_STATUS_COLORS: Record<string, string> = {
  active: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  inactive: "bg-muted text-muted-foreground",
  error: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  pending: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
};

type Tab = "accounts" | "vpn" | "groups" | "external" | "reviews" | "integrations" | "reconciliation";

// ── Badge helpers ─────────────────────────────────────────────────────────

function AuthBadge({ source }: { source: string }) {
  return (
    <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium ${AUTH_SOURCE_COLORS[source as AuthSource] ?? "bg-muted text-muted-foreground"}`}>
      {AUTH_SOURCE_LABELS[source as AuthSource] ?? source}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[status as AccountStatus] ?? "bg-muted text-muted-foreground"}`}>
      {status.replace(/_/g, " ")}
    </span>
  );
}

function AffiliationBadge({ affiliation }: { affiliation: string }) {
  return (
    <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium ${AFFILIATION_COLORS[affiliation as Affiliation] ?? "bg-muted text-muted-foreground"}`}>
      {AFFILIATION_LABELS[affiliation as Affiliation] ?? affiliation}
    </span>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────

function PlatformAccountsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("accounts");
  const [platform, setPlatform] = useState<Platform | "">("");
  const [statusFilter, setStatusFilter] = useState<AccountStatus | "">("");
  const [syncMode, setSyncMode] = useState<SyncMode | "">("");

  const { data, isLoading } = useQuery(
    orpc.access.accounts.list.queryOptions({
      input: {
        platform: platform || undefined,
        status: statusFilter || undefined,
        syncMode: syncMode || undefined,
      },
    })
  );

  const { data: expiring } = useQuery(
    orpc.access.accounts.getExpiring.queryOptions({ input: { withinDays: 30 } })
  );

  const { data: vpnAccounts, isLoading: vpnLoading } = useQuery(
    orpc.access.accounts.getVpnEnabled.queryOptions()
  );

  const { data: groups, isLoading: groupsLoading } = useQuery(
    orpc.access.groups.list.queryOptions({ input: {} })
  );

  const { data: externalContacts, isLoading: extLoading } = useQuery(
    orpc.access.externalContacts.list.queryOptions({ input: {} })
  );

  const { data: pendingReviews, isLoading: reviewsLoading } = useQuery(
    orpc.access.reviews.getPending.queryOptions()
  );

  const { data: integrations, isLoading: integrationsLoading } = useQuery(
    orpc.access.integrations.list.queryOptions()
  );

  const { data: reconciliationData, isLoading: reconcLoading } = useQuery(
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

  const completeReviewMutation = useMutation(
    orpc.access.reviews.complete.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: orpc.access.reviews.getPending.key() });
        toast.success("Review completed");
      },
      onError: (err) => toast.error(err.message),
    })
  );

  const openIssueCount = reconciliationData?.length ?? 0;
  const pendingReviewCount = pendingReviews?.length ?? 0;

  const TABS = [
    { key: "accounts" as Tab, label: "Accounts", icon: Key, count: data?.length },
    { key: "vpn" as Tab, label: "VPN Access", icon: Network, count: vpnAccounts?.length },
    { key: "groups" as Tab, label: "Groups", icon: Users, count: groups?.length },
    { key: "external" as Tab, label: "External Contacts", icon: ExternalLink, count: externalContacts?.length },
    { key: "reviews" as Tab, label: "Access Reviews", icon: Shield, count: pendingReviewCount, alert: pendingReviewCount > 0 },
    { key: "integrations" as Tab, label: "Integrations", icon: Plug, count: integrations?.length },
    { key: "reconciliation" as Tab, label: "Reconciliation", icon: AlertTriangle, count: openIssueCount || undefined, alert: openIssueCount > 0 },
  ];

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
            Identity governance for all managed platforms — VPN, AD, RADIUS, phpIPAM,
            Zabbix, and more. Tracks NDMA staff, contractors, vendors, and external agencies.
          </p>
        </div>

        {/* Alert banners */}
        {expiring && expiring.length > 0 && (
          <div className="mb-3 flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 dark:bg-amber-900/20 p-3 text-sm text-amber-700 dark:text-amber-300">
            <AlertCircle className="size-4 shrink-0" />
            <strong>{expiring.length}</strong> account{expiring.length > 1 ? "s" : ""} expiring within 30 days.
          </div>
        )}
        {openIssueCount > 0 && (
          <div className="mb-3 flex items-center gap-2 rounded-md border border-red-200 bg-red-50 dark:bg-red-900/20 p-3 text-sm text-red-700 dark:text-red-300">
            <AlertTriangle className="size-4 shrink-0" />
            <strong>{openIssueCount}</strong> unresolved reconciliation {openIssueCount === 1 ? "issue" : "issues"}.{" "}
            <button onClick={() => setActiveTab("reconciliation")} className="underline font-medium">View</button>
          </div>
        )}
        {pendingReviewCount > 0 && (
          <div className="mb-3 flex items-center gap-2 rounded-md border border-blue-200 bg-blue-50 dark:bg-blue-900/20 p-3 text-sm text-blue-700 dark:text-blue-300">
            <Shield className="size-4 shrink-0" />
            <strong>{pendingReviewCount}</strong> access {pendingReviewCount === 1 ? "review" : "reviews"} pending certification.{" "}
            <button onClick={() => setActiveTab("reviews")} className="underline font-medium">Review now</button>
          </div>
        )}

        {/* Tabs */}
        <div className="mb-4 flex gap-0.5 border-b overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.key
                  ? "border-b-2 border-primary text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <tab.icon className="size-3.5" />
              {tab.label}
              {tab.count !== undefined && (
                <span className={`rounded-full px-1.5 py-0.5 text-xs ${tab.alert ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300" : "bg-muted text-muted-foreground"}`}>
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
                <span><strong>{data.length}</strong> total</span>
                <span className="text-green-600"><strong>{data.filter((a) => a.status === "active").length}</strong> active</span>
                <span className="text-muted-foreground"><strong>{data.filter((a) => a.vpnEnabled).length}</strong> VPN enabled</span>
                <span className="text-muted-foreground"><strong>{data.filter((a) => a.affiliationType !== "ndma_internal").length}</strong> external</span>
              </div>
            )}

            <div className="mb-4 flex flex-wrap gap-3">
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value as Platform | "")}
                className="rounded-md border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">All Platforms</option>
                {(Object.keys(PLATFORM_LABELS) as Platform[]).map((p) => (
                  <option key={p} value={p}>{PLATFORM_LABELS[p]}</option>
                ))}
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as AccountStatus | "")}
                className="rounded-md border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">All Statuses</option>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
                <option value="disabled">Disabled</option>
                <option value="orphaned">Orphaned</option>
                <option value="pending_review">Pending Review</option>
              </select>
              <select
                value={syncMode}
                onChange={(e) => setSyncMode(e.target.value as SyncMode | "")}
                className="rounded-md border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
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
                    <TableHead>Identity</TableHead>
                    <TableHead>Platform</TableHead>
                    <TableHead>Account / ID</TableHead>
                    <TableHead>Affiliation</TableHead>
                    <TableHead>Auth Source</TableHead>
                    <TableHead>Sync</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        {Array.from({ length: 9 }).map((_, j) => (
                          <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
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
                      const isExpired = account.expiresAt && isPast(parseISO(account.expiresAt));
                      const displayName = account.staffProfile?.user?.name ?? account.externalContact?.name ?? account.displayName ?? "—";
                      return (
                        <TableRow key={account.id}>
                          <TableCell className="font-medium">
                            <Link to="/access/$accountId" params={{ accountId: account.id }} className="hover:underline">
                              {displayName}
                            </Link>
                            {account.externalContact && (
                              <p className="text-xs text-muted-foreground mt-0.5">{account.externalContact.organization}</p>
                            )}
                          </TableCell>
                          <TableCell className="text-sm">{PLATFORM_LABELS[account.platform as Platform] ?? account.platform}</TableCell>
                          <TableCell className="font-mono text-xs text-muted-foreground">
                            {account.accountIdentifier}
                            {account.privilegeLevel && (
                              <span className="ml-1 text-xs text-amber-600">({account.privilegeLevel})</span>
                            )}
                          </TableCell>
                          <TableCell><AffiliationBadge affiliation={account.affiliationType} /></TableCell>
                          <TableCell><AuthBadge source={account.authSource} /></TableCell>
                          <TableCell>
                            <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium ${SYNC_MODE_COLORS[account.syncMode as SyncMode] ?? ""}`}>
                              {account.syncMode}
                            </span>
                          </TableCell>
                          <TableCell><StatusBadge status={account.status} /></TableCell>
                          <TableCell className={`text-xs ${isExpired ? "text-red-600 font-medium" : "text-muted-foreground"}`}>
                            {account.expiresAt ? format(parseISO(account.expiresAt), "dd MMM yyyy") : "—"}
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs gap-1"
                              onClick={() => markReviewedMutation.mutate({ id: account.id })}
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

        {/* ── VPN Tab ──────────────────────────────────────────────────── */}
        {activeTab === "vpn" && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              All identities with VPN access enabled, grouped by VPN group/profile.
              Covers NDMA staff, contractors, and other external users.
            </p>

            {vpnLoading ? (
              Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-md" />)
            ) : !vpnAccounts?.length ? (
              <div className="rounded-md border border-dashed p-12 text-center text-muted-foreground">
                <Network className="size-8 mx-auto mb-3 opacity-40" />
                <p className="font-medium">No VPN accounts recorded</p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Identity</TableHead>
                      <TableHead>Account ID</TableHead>
                      <TableHead>Affiliation</TableHead>
                      <TableHead>VPN Group</TableHead>
                      <TableHead>VPN Profile</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Expires</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vpnAccounts.map((account) => {
                      const displayName = account.staffProfile?.user?.name ?? account.externalContact?.name ?? account.displayName ?? "—";
                      const isExpired = account.expiresAt && isPast(parseISO(account.expiresAt));
                      return (
                        <TableRow key={account.id}>
                          <TableCell className="font-medium">
                            <Link to="/access/$accountId" params={{ accountId: account.id }} className="hover:underline">
                              {displayName}
                            </Link>
                            {account.externalContact?.organization && (
                              <p className="text-xs text-muted-foreground mt-0.5">{account.externalContact.organization}</p>
                            )}
                          </TableCell>
                          <TableCell className="font-mono text-xs text-muted-foreground">{account.accountIdentifier}</TableCell>
                          <TableCell><AffiliationBadge affiliation={account.affiliationType} /></TableCell>
                          <TableCell className="text-sm">{account.vpnGroup ?? <span className="text-muted-foreground">—</span>}</TableCell>
                          <TableCell className="text-sm">{account.vpnProfile ?? <span className="text-muted-foreground">—</span>}</TableCell>
                          <TableCell><StatusBadge status={account.status} /></TableCell>
                          <TableCell className={`text-xs ${isExpired ? "text-red-600 font-medium" : "text-muted-foreground"}`}>
                            {account.expiresAt ? format(parseISO(account.expiresAt), "dd MMM yyyy") : "—"}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        )}

        {/* ── Groups Tab ───────────────────────────────────────────────── */}
        {activeTab === "groups" && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              AD groups, VPN groups, platform roles, and local groups. Each group may
              contain NDMA staff accounts or external contact accounts.
            </p>

            {groupsLoading ? (
              Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-md" />)
            ) : !groups?.length ? (
              <div className="rounded-md border border-dashed p-12 text-center text-muted-foreground">
                <Users className="size-8 mx-auto mb-3 opacity-40" />
                <p className="font-medium">No access groups defined</p>
                <p className="text-sm mt-1">Define AD groups, VPN groups, or platform roles.</p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Group Name</TableHead>
                      <TableHead>Platform</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Sync</TableHead>
                      <TableHead>External ID</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {groups.map((group) => (
                      <TableRow key={group.id}>
                        <TableCell className="font-medium">{group.name}</TableCell>
                        <TableCell className="text-sm">{PLATFORM_LABELS[group.platform as Platform] ?? group.platform}</TableCell>
                        <TableCell>
                          <span className="inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium bg-muted text-muted-foreground">
                            {group.groupType.replace(/_/g, " ")}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium ${SYNC_MODE_COLORS[group.syncMode as SyncMode] ?? ""}`}>
                            {group.syncMode}
                          </span>
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">{group.externalId ?? "—"}</TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium ${group.isActive ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300" : "bg-muted text-muted-foreground"}`}>
                            {group.isActive ? "Active" : "Inactive"}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        )}

        {/* ── External Contacts Tab ─────────────────────────────────────── */}
        {activeTab === "external" && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              External identities — contractors, consultants, vendors, and external agency
              users — who hold accounts on DCS-managed platforms.
            </p>

            {extLoading ? (
              Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-md" />)
            ) : !externalContacts?.length ? (
              <div className="rounded-md border border-dashed p-12 text-center text-muted-foreground">
                <UserX className="size-8 mx-auto mb-3 opacity-40" />
                <p className="font-medium">No external contacts</p>
                <p className="text-sm mt-1">External contacts are non-NDMA identities with platform access.</p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Organization</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Affiliation</TableHead>
                      <TableHead>Accounts</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {externalContacts.map((contact) => (
                      <TableRow key={contact.id}>
                        <TableCell className="font-medium">{contact.name}</TableCell>
                        <TableCell className="text-sm">{contact.organization ?? <span className="text-muted-foreground">—</span>}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{contact.email ?? "—"}</TableCell>
                        <TableCell><AffiliationBadge affiliation={contact.affiliationType} /></TableCell>
                        <TableCell className="text-sm">{contact.platformAccounts?.length ?? 0}</TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium ${contact.isActive ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300" : "bg-muted text-muted-foreground"}`}>
                            {contact.isActive ? "Active" : "Inactive"}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        )}

        {/* ── Access Reviews Tab ───────────────────────────────────────── */}
        {activeTab === "reviews" && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Pending access certifications. Approve to confirm access is still required,
              Revoke to immediately disable the account, or Escalate for manager review.
            </p>

            {reviewsLoading ? (
              Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-md" />)
            ) : !pendingReviews?.length ? (
              <div className="rounded-md border border-dashed p-12 text-center text-muted-foreground">
                <Shield className="size-8 mx-auto mb-3 opacity-40 text-green-500" />
                <p className="font-medium">All access reviews complete</p>
                <p className="text-sm mt-1">No pending certifications.</p>
              </div>
            ) : (
              pendingReviews.map((review) => {
                const account = review.platformAccount;
                const displayName = account?.staffProfile?.user?.name ?? account?.externalContact?.name ?? "Unknown";
                return (
                  <div key={review.id} className="rounded-md border p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium text-sm">{displayName}</p>
                          {account && <span className="text-xs text-muted-foreground">{PLATFORM_LABELS[account.platform as Platform] ?? account.platform} · {account.accountIdentifier}</span>}
                          {account && <AffiliationBadge affiliation={account.affiliationType} />}
                        </div>
                        {review.nextReviewDate && (
                          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                            <Clock className="size-3" />
                            Due: {format(parseISO(review.nextReviewDate), "dd MMM yyyy")}
                          </p>
                        )}
                        {review.notes && (
                          <p className="text-xs text-muted-foreground mt-1">{review.notes}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs text-green-600 hover:text-green-700"
                          onClick={() => completeReviewMutation.mutate({ id: review.id, status: "approved" })}
                          disabled={completeReviewMutation.isPending}
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs text-red-600 hover:text-red-700"
                          onClick={() => completeReviewMutation.mutate({ id: review.id, status: "revoked" })}
                          disabled={completeReviewMutation.isPending}
                        >
                          Revoke
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* ── Integrations Tab ─────────────────────────────────────────── */}
        {activeTab === "integrations" && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground mb-4">
              Platform connectors for API-based account synchronization. Configure to pull
              records automatically from phpIPAM, Active Directory, RADIUS, Zabbix, or other
              managed systems. Manual entry remains available for all platforms.
            </p>

            {integrationsLoading ? (
              Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-md" />)
            ) : !integrations?.length ? (
              <div className="rounded-md border border-dashed p-12 text-center text-muted-foreground">
                <Plug className="size-8 mx-auto mb-3 opacity-40" />
                <p className="font-medium">No integrations configured</p>
                <p className="text-sm mt-1">Platform integrations enable automatic account sync from external APIs.</p>
              </div>
            ) : (
              integrations.map((integration) => (
                <div key={integration.id} className="rounded-md border p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-sm">{integration.name}</p>
                        <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium ${INTEGRATION_STATUS_COLORS[integration.status] ?? ""}`}>
                          {integration.status}
                        </span>
                        {integration.syncEnabled && (
                          <span className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300">
                            <Activity className="size-3" />Sync on
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {PLATFORM_LABELS[integration.platform as Platform] ?? integration.platform}
                        {integration.syncDirection && <span className="ml-2">· {integration.syncDirection}</span>}
                        {integration.syncFrequencyMinutes && <span className="ml-2">· every {integration.syncFrequencyMinutes}m</span>}
                      </p>
                      {integration.supportTeam && (
                        <p className="text-xs text-muted-foreground mt-0.5">Support: {integration.supportTeam}</p>
                      )}
                      {integration.lastSyncAt && (
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                          <Clock className="size-3" />
                          Last sync: {format(new Date(integration.lastSyncAt), "dd MMM yyyy, HH:mm")}
                        </p>
                      )}
                      {integration.lastSyncError && (
                        <p className="text-xs text-red-600 mt-1">{integration.lastSyncError}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {integration.runbookUrl && (
                        <a href={integration.runbookUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">Runbook</a>
                      )}
                      {integration.syncEnabled && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs gap-1"
                          onClick={() => triggerSyncMutation.mutate({ integrationId: integration.id })}
                          disabled={triggerSyncMutation.isPending}
                        >
                          <RefreshCw className="size-3" />Sync now
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
              Discrepancies detected during sync — orphaned accounts, disabled staff with
              active accounts, expired contractors, stale records, and mismatches. Resolve
              each issue manually or dismiss with a note.
            </p>

            {reconcLoading ? (
              Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-md" />)
            ) : !reconciliationData?.length ? (
              <div className="rounded-md border border-dashed p-12 text-center text-muted-foreground">
                <CheckCircle className="size-8 mx-auto mb-3 opacity-40" />
                <p className="font-medium">No open issues</p>
                <p className="text-sm mt-1">All reconciliation checks passed.</p>
              </div>
            ) : (
              reconciliationData.map((issue) => (
                <div key={issue.id} className="rounded-md border border-amber-200 bg-amber-50 dark:bg-amber-900/10 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="inline-flex items-center rounded px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                          {issue.issueType.replace(/_/g, " ")}
                        </span>
                        <span className="text-xs text-muted-foreground">{issue.integration?.name}</span>
                      </div>
                      {issue.platformAccount?.staffProfile?.user?.name && (
                        <p className="text-sm font-medium mt-1">{issue.platformAccount.staffProfile.user.name}</p>
                      )}
                      {issue.platformAccount?.externalContact?.name && (
                        <p className="text-sm font-medium mt-1">{issue.platformAccount.externalContact.name} (external)</p>
                      )}
                      {issue.externalAccountId && (
                        <p className="text-xs text-muted-foreground font-mono mt-0.5">External ID: {issue.externalAccountId}</p>
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
