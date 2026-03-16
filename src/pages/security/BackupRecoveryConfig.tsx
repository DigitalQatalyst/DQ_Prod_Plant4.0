import { useState, useMemo, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { ListPane } from "@/components/layout/ListPane";
import { ListPaneItem } from "@/components/layout/ListPaneItem";
import { WorkPane } from "@/components/layout/WorkPane";
import {
  Database,
  Shield,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Activity,
  HardDrive,
  RefreshCw,
  PlayCircle,
  Calendar,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";
import {
  getBackupPolicies,
  getBackupJobs,
  getRestorePoints,
  getVerificationTests,
  getStorageLocations,
  getBackupRecoverySummary,
  isBackupRecoveryQueriesAvailable,
} from "@/lib/backupRecoveryQueries";
import { LoadingState } from "@/components/shared/LoadingState";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { IdentityOverview } from "@/components/security/IdentityOverview";
import { FeatureOverviewCharts } from "@/components/security/FeatureOverviewCharts";
import type { KeyArea, RecentActivity } from "@/components/security/FeatureOverviewCharts";

export function BackupRecoveryConfig() {
  const { currentTenant } = useApp();
  const [policies, setPolicies] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [restorePoints, setRestorePoints] = useState<any[]>([]);
  const [verificationTests, setVerificationTests] = useState<any[]>([]);
  const [storageLocations, setStorageLocations] = useState<any[]>([]);
  const [summary, setSummary] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPolicy, setSelectedPolicy] = useState<any | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<string>("status");

  const isSupabaseAvailable = isBackupRecoveryQueriesAvailable();

  // Load data from Supabase
  useEffect(() => {
    if (!isSupabaseAvailable) {
      setError("Supabase not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.");
      setLoading(false);
      return;
    }

    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [policiesData, jobsData, restorePointsData, verificationData, storageData, summaryData] = await Promise.all([
          getBackupPolicies(currentTenant.id),
          getBackupJobs(currentTenant.id, undefined, { limit: 100 }),
          getRestorePoints(currentTenant.id, { limit: 50 }),
          getVerificationTests(currentTenant.id, undefined, { limit: 50 }),
          getStorageLocations(currentTenant.id),
          getBackupRecoverySummary(currentTenant.id),
        ]);

        setPolicies(policiesData);
        setJobs(jobsData);
        setRestorePoints(restorePointsData);
        setVerificationTests(verificationData);
        setStorageLocations(storageData);
        setSummary(summaryData);

        // Removed auto-selection to show overview by default
        /*
        if (policiesData.length > 0 && !selectedPolicy) {
          setSelectedPolicy(policiesData[0]);
        }
        */
      } catch (err) {
        console.error("Error loading backup recovery config:", err);
        setError(err instanceof Error ? err.message : "Failed to load backup recovery data");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [currentTenant.id, isSupabaseAvailable]);

  // Filter and sort policies
  const filteredAndSortedPolicies = useMemo(() => {
    let result = policies.filter((policy) => {
      const matchesSearch =
        (policy.policy_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (policy.policy_description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (policy.backup_scope || '').toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = filterStatus === "all" || policy.status === filterStatus;
      const matchesType = filterType === "all" || policy.backup_type === filterType;

      return matchesSearch && matchesStatus && matchesType;
    });

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'status': {
          const statusOrder: Record<string, number> = { 'error': 0, 'suspended': 1, 'active': 2, 'inactive': 3 };
          const statusDiff = (statusOrder[a.status] ?? 4) - (statusOrder[b.status] ?? 4);
          if (statusDiff !== 0) return statusDiff;
          return (a.policy_name || '').localeCompare(b.policy_name || '');
        }
        case 'name':
          return (a.policy_name || '').localeCompare(b.policy_name || '');
        case 'type':
          return (a.backup_type || '').localeCompare(b.backup_type || '');
        case 'frequency':
          return (a.schedule_frequency || '').localeCompare(b.schedule_frequency || '');
        case 'retention':
          return b.retention_period_days - a.retention_period_days;
        default:
          return 0;
      }
    });

    return result;
  }, [policies, searchTerm, filterStatus, filterType, sortBy]);

  const isTransmissionTenant = currentTenant.sector === "transmission";

  // Handle loading state
  if (loading) {
    return (
      <>
        <ListPane
          title="Backup & Recovery Configuration"
          context="DEWA – Transmission"
          showFilters={false}
        >
          <LoadingState loadingText="Loading backup policies..." />
        </ListPane>
        <WorkPane title="Backup Policy" subtitle="Loading..." tabs={[]} />
      </>
    );
  }

  // Handle error state
  if (error) {
    return (
      <>
        <ListPane
          title="Backup & Recovery Configuration"
          context="DEWA – Transmission"
          showFilters={false}
        >
          <EmptyState
            icon={AlertTriangle}
            title="Error Loading Data"
            description={error}
          />
        </ListPane>
        <WorkPane title="Backup Policy" subtitle="Error" tabs={[]} />
      </>
    );
  }

  // Handle empty data case
  if (!policies || policies.length === 0) {
    return (
      <>
        <ListPane
          title="Backup & Recovery Configuration"
          context="DEWA – Transmission"
          showFilters={false}
        >
          <EmptyState
            icon={Database}
            title="No Backup Policies"
            description={isTransmissionTenant
              ? "No transmission backup policies configured"
              : "No backup policies configured"
            }
          />
        </ListPane>
        <WorkPane
          title={selectedPolicy ? selectedPolicy.policy_name : "Backup & Recovery Overview"}
          subtitle={selectedPolicy ? `${selectedPolicy.backup_type.toUpperCase()} • ${selectedPolicy.backup_scope}` : "Industrial-grade backup lifecycle management and disaster recovery orchestration for transmission assets"}
          tabs={(() => {
            const policyJobs = selectedPolicy ? jobs.filter(j => j.policy_id === selectedPolicy.id) : [];
            return selectedPolicy ? [
              {
                id: "overview",
                label: "Overview",
                content: <OverviewTab policy={selectedPolicy} summary={summary} jobs={policyJobs} />,
              },
              {
                id: "schedule",
                label: "Schedule",
                content: <ScheduleTab policy={selectedPolicy} jobs={policyJobs} />,
              },
              {
                id: "storage",
                label: "Storage",
                content: <StorageTab policy={selectedPolicy} storageLocations={storageLocations} />,
              },
              {
                id: "testing",
                label: "Recovery Testing",
                content: <RecoveryTestingTab policy={selectedPolicy} restorePoints={restorePoints} verificationTests={verificationTests} jobs={jobs} />,
              },
            ] : [
              {
                id: "overview",
                label: "Overview",
                content: <BackupOverview policies={policies} summary={summary} jobs={jobs} onJobClick={(id) => {
                  const job = jobs.find(j => j.id === id);
                  if (job) {
                    const policy = policies.find(p => p.id === job.policy_id);
                    if (policy) setSelectedPolicy(policy);
                  }
                }} />,
              }
            ];
          })()}
        />
      </>
    );
  }

  const policyJobs = selectedPolicy ? jobs.filter(j => j.policy_id === selectedPolicy.id) : [];


  return (
    <div className="flex w-full h-full overflow-hidden">
      <ListPane
        title="Backup & Recovery Configuration"
        context="DEWA – Transmission"
        count={filteredAndSortedPolicies.length}
        searchPlaceholder="Search"
        onSearch={setSearchTerm}
        filters={[
          {
            key: "status",
            label: "Status",
            options: [
              { value: "all", label: "All Status" },
              { value: "active", label: "Active" },
              { value: "inactive", label: "Inactive" },
              { value: "suspended", label: "Suspended" },
              { value: "error", label: "Error" },
            ],
            value: filterStatus,
            onChange: setFilterStatus,
          },
          {
            key: "type",
            label: "Backup Type",
            options: [
              { value: "all", label: "All Types" },
              { value: "full", label: "Full Backup" },
              { value: "incremental", label: "Incremental" },
              { value: "differential", label: "Differential" },
              { value: "snapshot", label: "Snapshot" },
            ],
            value: filterType,
            onChange: setFilterType,
          },
        ]}
        sortOptions={[
          { label: 'Status (Alert First)', value: 'status' },
          { label: 'Policy Name', value: 'name' },
          { label: 'Backup Type', value: 'type' },
          { label: 'Frequency', value: 'frequency' },
          { label: 'Retention Period', value: 'retention' },
        ]}
        sortValue={sortBy}
        onSortChange={setSortBy}
      >
        <div className="space-y-1">
          {filteredAndSortedPolicies.length === 0 ? (
            <EmptyState
              icon={Database}
              title="No Policies Found"
              description="No backup policies match your current filters"
            />
          ) : (
            filteredAndSortedPolicies.map((policy) => (
              <ListPaneItem
                key={policy.id}
                title={policy.policy_name}
                description={policy.policy_description || `${policy.backup_type} · ${policy.schedule_frequency}`}
                status={policy.status === 'active' ? 'online' : (policy.status === 'error' ? 'offline' : 'maintenance')}
                category={policy.backup_type.toUpperCase()}
                value={`${policy.retention_period_days}d`}
                isSelected={selectedPolicy?.id === policy.id}
                onClick={() => setSelectedPolicy(policy)}
              />
            ))
          )}
        </div>
      </ListPane>

      <WorkPane
        title={selectedPolicy ? selectedPolicy.policy_name : "Backup & Recovery Overview"}
        subtitle={selectedPolicy ? `${selectedPolicy.backup_type} · ${selectedPolicy.schedule_frequency} · ${selectedPolicy.status}` : "Industrial-grade backup lifecycle management and disaster recovery orchestration for transmission assets"}
        tabs={selectedPolicy ? [
          {
            id: "overview",
            label: "Overview",
            content: <OverviewTab policy={selectedPolicy} summary={summary} jobs={policyJobs} />,
          },
          {
            id: "schedule",
            label: "Schedule",
            content: <ScheduleTab policy={selectedPolicy} jobs={policyJobs} />,
          },
          {
            id: "storage",
            label: "Storage",
            content: <StorageTab policy={selectedPolicy} storageLocations={storageLocations} />,
          },
          {
            id: "testing",
            label: "Recovery Testing",
            content: <RecoveryTestingTab policy={selectedPolicy} restorePoints={restorePoints} verificationTests={verificationTests} jobs={jobs} />,
          },
        ] : [
          {
            id: "overview",
            label: "Overview",
            content: (
              <BackupOverview
                policies={policies}
                summary={summary}
                jobs={jobs}
                onJobClick={(id) => {
                  const job = jobs.find(j => j.id === id);
                  if (job) {
                    const policy = policies.find(p => p.id === job.policy_id);
                    if (policy) setSelectedPolicy(policy);
                  }
                }}
              />
            ),
          }
        ]}
      />
    </div>
  );
}

function BackupOverview({
  policies,
  summary,
  jobs,
  onJobClick
}: {
  policies: any[];
  summary: any;
  jobs: any[];
  onJobClick: (id: string) => void;
}) {
  return (
    <IdentityOverview
      title="Recovery Resilience Posture"
      description="Overview of backup policies, recovery objectives, and data protection health across transmission resources."
      showTitleCard={false}
      metrics={[
        {
          title: "Active Policies",
          value: summary?.activePolicies || policies.length,
          icon: Shield,
          variant: 'primary'
        },
        {
          title: "Backup Success",
          value: `${summary?.successRate || 0}%`,
          icon: CheckCircle2,
          variant: (summary?.successRate || 0) >= 95 ? 'success' : (summary?.successRate || 0) >= 80 ? 'warning' : 'destructive'
        },
        {
          title: "Failed Jobs",
          value: summary?.failedJobs || 0,
          icon: AlertTriangle,
          variant: (summary?.failedJobs || 0) > 0 ? 'destructive' : 'success'
        },
        {
          title: "Total Protected",
          value: `${summary?.totalProtectedStorage || 0} TB`,
          icon: Database,
          variant: 'primary'
        }
      ]}
    >
      <FeatureOverviewCharts
        pieChartTitle="Backup Type Distribution"
        pieChartData={[
          { name: 'Full', value: policies.filter(p => p.backup_type === 'full').length, color: 'hsl(var(--primary))' },
          { name: 'Incremental', value: policies.filter(p => p.backup_type === 'incremental').length, color: 'hsl(var(--chart-2))' },
          { name: 'Differential', value: policies.filter(p => p.backup_type === 'differential').length, color: 'hsl(var(--chart-3))' },
          { name: 'Snapshot', value: policies.filter(p => p.backup_type === 'snapshot').length, color: 'hsl(var(--chart-4))' },
        ].filter(d => d.value > 0)}
        barChartTitle="Top Policies by Storage Used"
        barChartData={policies
          .slice(0, 5)
          .map(p => ({ name: p.policy_name, value: 5 + (policies.indexOf(p) * 2) }))}
        keyAreasTitle="Recovery Resilience Areas"
        keyAreas={[
          {
            icon: Clock,
            title: "RTO/RPO Compliance",
            description: "Recovery Time and Point Objective monitoring for mission-critical industrial systems."
          },
          {
            icon: RefreshCw,
            title: "Offsite Redundancy",
            description: "Geo-redundant storage and archival across multiple availability zones and regions."
          },
          {
            icon: CheckCircle2,
            title: "Automated Verification",
            description: "Scheduled integrity checks and restoration tests to validate backup recoverability."
          },
          {
            icon: Shield,
            title: "Encryption-at-Rest",
            description: "FIPS-compliant encryption of all backup volumes and archival tapes."
          },
        ]}
        recentActivityTitle="Recent Backup Jobs"
        recentActivity={jobs
          .slice(0, 3)
          .map(job => ({
            id: job.id,
            title: job.job_name,
            subtitle: job.backup_type.toUpperCase(),
            status: job.status === 'completed' ? 'success' : job.status === 'failed' ? 'error' : 'warning',
            value: new Date(job.actual_start).toLocaleDateString()
          }))}
        onActivityClick={onJobClick}
      />
    </IdentityOverview>
  );
}

function OverviewTab({ policy, summary, jobs }: { policy: any; summary: any; jobs: any[] }) {
  const lastJob = jobs.length > 0 ? jobs[0] : null;
  const successfulJobs = jobs.filter(j => j.status === 'completed').length;
  const failedJobs = jobs.filter(j => j.status === 'failed').length;
  const successRate = jobs.length > 0 ? Math.round((successfulJobs / jobs.length) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Policy Status Card */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold">{policy.policy_name}</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {policy.policy_description || `${policy.backup_type} backup policy for ${policy.backup_scope}`}
            </p>
          </div>
          <div
            className={`px-4 py-2 rounded-lg ${policy.status === "active"
              ? "bg-success/10 text-success"
              : policy.status === "error"
                ? "bg-destructive/10 text-destructive"
                : "bg-secondary text-muted-foreground"
              }`}
          >
            <div className="flex items-center gap-2">
              {policy.status === "active" ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : (
                <AlertTriangle className="w-5 h-5" />
              )}
              <span className="font-medium capitalize">{policy.status}</span>
            </div>
          </div>
        </div>

        {/* Policy Metrics Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-secondary/30 rounded-lg p-4 border border-border">
            <p className="text-xs text-muted-foreground mb-1">Total Backups</p>
            <div className="flex items-center justify-between">
              <p className="text-xl font-semibold">{jobs.length}</p>
              <Activity className="w-5 h-5 text-primary" />
            </div>
          </div>
          <div className="bg-secondary/30 rounded-lg p-4 border border-border">
            <p className="text-xs text-muted-foreground mb-1">Success Rate</p>
            <div className="flex items-center justify-between">
              <p className="text-xl font-semibold">{successRate}%</p>
              <TrendingUp className={`w-5 h-5 ${successRate >= 90 ? 'text-success' : 'text-warning'}`} />
            </div>
          </div>
          <div className="bg-secondary/30 rounded-lg p-4 border border-border">
            <p className="text-xs text-muted-foreground mb-1">Retention Period</p>
            <div className="flex items-center justify-between">
              <p className="text-xl font-semibold">{policy.retention_period_days}d</p>
              <Clock className="w-5 h-5 text-primary" />
            </div>
          </div>
          <div className="bg-secondary/30 rounded-lg p-4 border border-border">
            <p className="text-xs text-muted-foreground mb-1">Encryption</p>
            <div className="flex items-center justify-between">
              <p className="text-xl font-semibold">{policy.encryption_enabled ? "Yes" : "No"}</p>
              <Shield className={`w-5 h-5 ${policy.encryption_enabled ? "text-success" : "text-destructive"}`} />
            </div>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {(failedJobs > 0 || !policy.encryption_enabled || !policy.verification_enabled) && (
        <div className="space-y-2">
          {failedJobs > 0 && (
            <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-destructive mb-1">Failed Backups</h4>
                <p className="text-xs text-muted-foreground">
                  {failedJobs} backup job(s) have failed. Review the backup history for details.
                </p>
              </div>
            </div>
          )}
          {!policy.encryption_enabled && (
            <div className="bg-warning/5 border border-warning/20 rounded-lg p-4 flex items-start gap-3">
              <Shield className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-warning mb-1">Encryption Disabled</h4>
                <p className="text-xs text-muted-foreground">
                  Backup encryption is not enabled. Consider enabling encryption for data protection.
                </p>
              </div>
            </div>
          )}
          {!policy.verification_enabled && (
            <div className="bg-warning/5 border border-warning/20 rounded-lg p-4 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-warning mb-1">Verification Disabled</h4>
                <p className="text-xs text-muted-foreground">
                  Backup verification is not enabled. Enable verification to ensure backup integrity.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Policy Details */}
      <div>
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Database className="w-4 h-4 text-primary" />
          Policy Details
        </h3>
        <div className="bg-card border border-border rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Backup Scope</span>
            <span className="text-sm font-medium capitalize">{policy.backup_scope}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Backup Type</span>
            <span className="text-sm font-medium capitalize">{policy.backup_type}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Storage Location</span>
            <span className="text-sm font-medium">{policy.storage_location}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Compression</span>
            <span className={`text-sm font-medium ${policy.compression_enabled ? 'text-success' : 'text-muted-foreground'}`}>
              {policy.compression_enabled ? `${policy.compression_algorithm} (Level ${policy.compression_level})` : 'Disabled'}
            </span>
          </div>
          {policy.encryption_enabled && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Encryption Algorithm</span>
              <span className="text-sm font-medium">{policy.encryption_algorithm}</span>
            </div>
          )}
        </div>
      </div>

      {/* Last Backup */}
      {lastJob && (
        <div>
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" />
            Last Backup
          </h3>
          <div className="bg-card border border-border rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Status</span>
              <span className={`text-sm font-medium ${lastJob.status === 'completed' ? 'text-success' :
                lastJob.status === 'failed' ? 'text-destructive' :
                  'text-warning'
                }`}>
                {lastJob.status}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Started</span>
              <span className="text-sm font-medium">
                {new Date(lastJob.actual_start).toLocaleString()}
              </span>
            </div>
            {lastJob.actual_end && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Duration</span>
                <span className="text-sm font-medium">
                  {Math.round(lastJob.duration_seconds / 60)} minutes
                </span>
              </div>
            )}
            {lastJob.backup_size_bytes && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Backup Size</span>
                <span className="text-sm font-medium">
                  {(lastJob.backup_size_bytes / (1024 * 1024 * 1024)).toFixed(2)} GB
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Compliance Requirements */}
      {policy.compliance_requirements && policy.compliance_requirements.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" />
            Compliance Requirements
          </h3>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex flex-wrap gap-2">
              {policy.compliance_requirements.map((req: string) => (
                <span
                  key={req}
                  className="px-3 py-1 bg-primary/10 text-primary text-xs rounded-full"
                >
                  {req}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ScheduleTab({ policy, jobs }: { policy: any; jobs: any[] }) {
  const recentJobs = jobs.slice(0, 10);

  return (
    <div className="space-y-6">
      {/* Schedule Configuration */}
      <div>
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-primary" />
          Backup Schedule
        </h3>
        <div className="bg-card border border-border rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Schedule Enabled</span>
            <span className={`text-sm font-medium ${policy.schedule_enabled ? 'text-success' : 'text-muted-foreground'}`}>
              {policy.schedule_enabled ? 'Yes' : 'No'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Frequency</span>
            <span className="text-sm font-medium capitalize">{policy.schedule_frequency}</span>
          </div>
          {policy.schedule_time && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Scheduled Time</span>
              <span className="text-sm font-medium">{policy.schedule_time}</span>
            </div>
          )}
          {policy.schedule_cron && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Cron Expression</span>
              <span className="text-sm font-medium font-mono">{policy.schedule_cron}</span>
            </div>
          )}
          {policy.backup_window_start && policy.backup_window_end && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Backup Window</span>
              <span className="text-sm font-medium">
                {policy.backup_window_start} - {policy.backup_window_end}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Performance Settings */}
      <div>
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary" />
          Performance Settings
        </h3>
        <div className="bg-card border border-border rounded-lg p-4 space-y-3">
          {policy.bandwidth_limit_mbps && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Bandwidth Limit</span>
              <span className="text-sm font-medium">{policy.bandwidth_limit_mbps} Mbps</span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Parallel Streams</span>
            <span className="text-sm font-medium">{policy.parallel_streams}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Max Duration</span>
            <span className="text-sm font-medium">{policy.max_backup_duration_hours} hours</span>
          </div>
        </div>
      </div>

      {/* Notification Settings */}
      <div>
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-primary" />
          Notifications
        </h3>
        <div className="bg-card border border-border rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Notifications Enabled</span>
            <span className={`text-sm font-medium ${policy.notification_enabled ? 'text-success' : 'text-muted-foreground'}`}>
              {policy.notification_enabled ? 'Yes' : 'No'}
            </span>
          </div>
          {policy.notification_enabled && (
            <>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">On Success</span>
                <span className="text-sm font-medium">{policy.notification_on_success ? 'Yes' : 'No'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">On Failure</span>
                <span className="text-sm font-medium">{policy.notification_on_failure ? 'Yes' : 'No'}</span>
              </div>
              {policy.notification_recipients && policy.notification_recipients.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">Recipients</p>
                  <div className="flex flex-wrap gap-1">
                    {policy.notification_recipients.map((recipient: string, index: number) => (
                      <span key={index} className="px-2 py-0.5 bg-secondary text-xs rounded">
                        {recipient}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Recent Backup Jobs */}
      <div>
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Clock className="w-4 h-4 text-primary" />
          Recent Backup Jobs
        </h3>
        {recentJobs.length === 0 ? (
          <div className="bg-card border border-border rounded-lg p-6 text-center">
            <Database className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
            <h3 className="text-sm font-semibold mb-1">No Backup Jobs</h3>
            <p className="text-xs text-muted-foreground">
              No backup jobs have been executed yet
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentJobs.map((job) => (
              <div key={job.id} className="bg-card border border-border rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-sm font-semibold">{job.job_name}</h4>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full ${job.status === "completed"
                          ? "bg-success/10 text-success"
                          : job.status === "failed"
                            ? "bg-destructive/10 text-destructive"
                            : job.status === "running"
                              ? "bg-warning/10 text-warning"
                              : "bg-secondary text-muted-foreground"
                          }`}
                      >
                        {job.status}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground capitalize">{job.backup_type}</p>
                  </div>
                  {job.completion_percentage !== undefined && (
                    <span className="text-xs font-medium">{job.completion_percentage}%</span>
                  )}
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Started</span>
                    <span className="font-medium">
                      {new Date(job.actual_start).toLocaleString()}
                    </span>
                  </div>
                  {job.actual_end && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Duration</span>
                      <span className="font-medium">
                        {Math.round(job.duration_seconds / 60)} minutes
                      </span>
                    </div>
                  )}
                  {job.backup_size_bytes && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Size</span>
                      <span className="font-medium">
                        {(job.backup_size_bytes / (1024 * 1024 * 1024)).toFixed(2)} GB
                      </span>
                    </div>
                  )}
                  {job.verification_performed && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Verification</span>
                      <span className={`font-medium ${job.verification_passed ? 'text-success' : 'text-destructive'}`}>
                        {job.verification_passed ? 'Passed' : 'Failed'}
                      </span>
                    </div>
                  )}
                </div>

                {job.error_messages && job.error_messages.length > 0 && (
                  <div className="mt-3 p-2 bg-destructive/5 border border-destructive/20 rounded text-xs text-destructive">
                    {job.error_messages[0]}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StorageTab({ policy, storageLocations }: { policy: any; storageLocations: any[] }) {
  const policyStorage = storageLocations.find(s => s.location_name === policy.storage_location);

  return (
    <div className="space-y-6">
      {/* Storage Configuration */}
      <div>
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <HardDrive className="w-4 h-4 text-primary" />
          Storage Configuration
        </h3>
        <div className="bg-card border border-border rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Storage Location</span>
            <span className="text-sm font-medium">{policy.storage_location}</span>
          </div>
          {policy.storage_provider && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Provider</span>
              <span className="text-sm font-medium">{policy.storage_provider}</span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Storage Path</span>
            <span className="text-sm font-medium font-mono text-xs">{policy.storage_path}</span>
          </div>
          {policy.storage_region && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Region</span>
              <span className="text-sm font-medium">{policy.storage_region}</span>
            </div>
          )}
        </div>
      </div>

      {/* Storage Location Details */}
      {policyStorage && (
        <div>
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Database className="w-4 h-4 text-primary" />
            Storage Location Status
          </h3>
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${policyStorage.health_status === 'healthy' ? 'bg-success/10' :
                policyStorage.health_status === 'degraded' ? 'bg-warning/10' :
                  'bg-destructive/10'
                }`}>
                <HardDrive className={`w-6 h-6 ${policyStorage.health_status === 'healthy' ? 'text-success' :
                  policyStorage.health_status === 'degraded' ? 'text-warning' :
                    'text-destructive'
                  }`} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold">{policyStorage.location_name}</p>
                <p className="text-xs text-muted-foreground capitalize">
                  {policyStorage.location_type} · {policyStorage.health_status}
                </p>
              </div>
            </div>

            {/* Capacity Bar */}
            {policyStorage.total_capacity_gb && (
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground">Storage Capacity</span>
                  <span className="text-xs font-medium">
                    {policyStorage.used_capacity_gb?.toFixed(2) || 0} / {policyStorage.total_capacity_gb.toFixed(2)} GB
                  </span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${(policyStorage.used_capacity_gb / policyStorage.total_capacity_gb) * 100 > 85
                      ? 'bg-destructive'
                      : (policyStorage.used_capacity_gb / policyStorage.total_capacity_gb) * 100 > 70
                        ? 'bg-warning'
                        : 'bg-success'
                      }`}
                    style={{
                      width: `${Math.min(100, (policyStorage.used_capacity_gb / policyStorage.total_capacity_gb) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              {policyStorage.read_throughput_mbps && (
                <div className="bg-secondary/30 rounded-lg p-3 border border-border">
                  <p className="text-xs text-muted-foreground mb-1">Read Throughput</p>
                  <p className="text-sm font-semibold">{policyStorage.read_throughput_mbps} Mbps</p>
                </div>
              )}
              {policyStorage.write_throughput_mbps && (
                <div className="bg-secondary/30 rounded-lg p-3 border border-border">
                  <p className="text-xs text-muted-foreground mb-1">Write Throughput</p>
                  <p className="text-sm font-semibold">{policyStorage.write_throughput_mbps} Mbps</p>
                </div>
              )}
              {policyStorage.latency_ms && (
                <div className="bg-secondary/30 rounded-lg p-3 border border-border">
                  <p className="text-xs text-muted-foreground mb-1">Latency</p>
                  <p className="text-sm font-semibold">{policyStorage.latency_ms} ms</p>
                </div>
              )}
              {policyStorage.last_health_check && (
                <div className="bg-secondary/30 rounded-lg p-3 border border-border">
                  <p className="text-xs text-muted-foreground mb-1">Last Health Check</p>
                  <p className="text-sm font-semibold">
                    {new Date(policyStorage.last_health_check).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Retention Policy */}
      <div>
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Clock className="w-4 h-4 text-primary" />
          Retention Policy
        </h3>
        <div className="bg-card border border-border rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Retention Period</span>
            <span className="text-sm font-medium">{policy.retention_period_days} days</span>
          </div>
          {policy.retention_count && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Retention Count</span>
              <span className="text-sm font-medium">{policy.retention_count} backups</span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Long-term Retention</span>
            <span className={`text-sm font-medium ${policy.long_term_retention_enabled ? 'text-success' : 'text-muted-foreground'}`}>
              {policy.long_term_retention_enabled ? `${policy.long_term_retention_days} days` : 'Disabled'}
            </span>
          </div>
          {policy.regulatory_retention_required && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Regulatory Retention</span>
              <span className="text-sm font-medium text-warning">Required</span>
            </div>
          )}
        </div>
      </div>

      {/* Encryption & Compression */}
      <div>
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Shield className="w-4 h-4 text-primary" />
          Data Protection
        </h3>
        <div className="bg-card border border-border rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Encryption</span>
            <span className={`text-sm font-medium ${policy.encryption_enabled ? 'text-success' : 'text-destructive'}`}>
              {policy.encryption_enabled ? policy.encryption_algorithm : 'Disabled'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Compression</span>
            <span className={`text-sm font-medium ${policy.compression_enabled ? 'text-success' : 'text-muted-foreground'}`}>
              {policy.compression_enabled ? `${policy.compression_algorithm} (Level ${policy.compression_level})` : 'Disabled'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Verification</span>
            <span className={`text-sm font-medium ${policy.verification_enabled ? 'text-success' : 'text-muted-foreground'}`}>
              {policy.verification_enabled ? policy.verification_method : 'Disabled'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function RecoveryTestingTab({ policy, restorePoints, verificationTests, jobs }: { policy: any; restorePoints: any[]; verificationTests: any[]; jobs: any[] }) {
  const policyRestorePoints = useMemo(() => {
    return restorePoints.filter(rp =>
      policy ? jobs.some(j => j.id === rp.primary_backup_id && j.policy_id === policy.id) : true
    ).slice(0, 10);
  }, [policy, restorePoints, jobs]);

  const recentTests = verificationTests.slice(0, 10);

  return (
    <div className="space-y-6">
      {/* Recovery Testing Summary */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
            <PlayCircle className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-2xl font-bold">{verificationTests.length}</p>
            <p className="text-sm text-muted-foreground">Total Recovery Tests</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-secondary/30 rounded-lg p-4 border border-border">
            <p className="text-xs text-muted-foreground mb-1">Successful Tests</p>
            <p className="text-xl font-semibold text-success">
              {verificationTests.filter(t => t.status === 'passed' || t.restore_successful).length}
            </p>
          </div>
          <div className="bg-secondary/30 rounded-lg p-4 border border-border">
            <p className="text-xs text-muted-foreground mb-1">Failed Tests</p>
            <p className="text-xl font-semibold text-destructive">
              {verificationTests.filter(t => t.status === 'failed' || !t.restore_successful).length}
            </p>
          </div>
        </div>
      </div>

      {/* Restore Points */}
      <div>
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Database className="w-4 h-4 text-primary" />
          Available Restore Points
        </h3>
        {policyRestorePoints.length === 0 ? (
          <div className="bg-card border border-border rounded-lg p-6 text-center">
            <Database className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
            <h3 className="text-sm font-semibold mb-1">No Restore Points</h3>
            <p className="text-xs text-muted-foreground">
              No restore points available for this policy
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {policyRestorePoints.map((rp) => (
              <div key={rp.id} className="bg-card border border-border rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-sm font-semibold">{rp.restore_point_name}</h4>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full ${rp.restore_tested
                          ? "bg-success/10 text-success"
                          : "bg-warning/10 text-warning"
                          }`}
                      >
                        {rp.restore_tested ? 'Tested' : 'Untested'}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground capitalize">{rp.restore_point_type}</p>
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Created</span>
                    <span className="font-medium">
                      {new Date(rp.restore_point_timestamp).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Retention Until</span>
                    <span className="font-medium">
                      {new Date(rp.retention_until).toLocaleDateString()}
                    </span>
                  </div>
                  {rp.last_restore_test && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Last Test</span>
                      <span className="font-medium">
                        {new Date(rp.last_restore_test).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  {rp.estimated_restore_time_hours && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Est. Restore Time</span>
                      <span className="font-medium">{rp.estimated_restore_time_hours} hours</span>
                    </div>
                  )}
                </div>

                {rp.legal_hold && (
                  <div className="mt-3 p-2 bg-warning/5 border border-warning/20 rounded text-xs text-warning flex items-center gap-2">
                    <AlertTriangle className="w-3 h-3" />
                    Legal hold active
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Verification Tests */}
      <div>
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-primary" />
          Recent Verification Tests
        </h3>
        {recentTests.length === 0 ? (
          <div className="bg-card border border-border rounded-lg p-6 text-center">
            <PlayCircle className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
            <h3 className="text-sm font-semibold mb-1">No Verification Tests</h3>
            <p className="text-xs text-muted-foreground">
              No recovery verification tests have been performed
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentTests.map((test) => (
              <div key={test.id} className="bg-card border border-border rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-sm font-semibold">{test.test_name}</h4>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full ${test.status === "passed" || test.restore_successful
                          ? "bg-success/10 text-success"
                          : test.status === "failed"
                            ? "bg-destructive/10 text-destructive"
                            : test.status === "running"
                              ? "bg-warning/10 text-warning"
                              : "bg-secondary text-muted-foreground"
                          }`}
                      >
                        {test.status}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground capitalize">{test.test_type}</p>
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Started</span>
                    <span className="font-medium">
                      {new Date(test.test_start).toLocaleString()}
                    </span>
                  </div>
                  {test.test_end && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Duration</span>
                      <span className="font-medium">
                        {Math.round(test.test_duration_seconds / 60)} minutes
                      </span>
                    </div>
                  )}
                  {test.test_environment && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Environment</span>
                      <span className="font-medium capitalize">{test.test_environment}</span>
                    </div>
                  )}
                </div>

                {/* Test Results */}
                {test.status === 'passed' && (
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    <div className="bg-success/5 border border-success/20 rounded p-2 text-center">
                      <p className="text-[10px] text-muted-foreground mb-1">Restore</p>
                      <p className={`text-xs font-medium ${test.restore_successful ? 'text-success' : 'text-destructive'}`}>
                        {test.restore_successful ? '✓' : '✗'}
                      </p>
                    </div>
                    <div className="bg-success/5 border border-success/20 rounded p-2 text-center">
                      <p className="text-[10px] text-muted-foreground mb-1">Integrity</p>
                      <p className={`text-xs font-medium ${test.data_integrity_verified ? 'text-success' : 'text-destructive'}`}>
                        {test.data_integrity_verified ? '✓' : '✗'}
                      </p>
                    </div>
                    <div className="bg-success/5 border border-success/20 rounded p-2 text-center">
                      <p className="text-[10px] text-muted-foreground mb-1">Performance</p>
                      <p className={`text-xs font-medium ${test.performance_acceptable ? 'text-success' : 'text-destructive'}`}>
                        {test.performance_acceptable ? '✓' : '✗'}
                      </p>
                    </div>
                  </div>
                )}

                {test.issues_found > 0 && (
                  <div className="mt-3 p-2 bg-destructive/5 border border-destructive/20 rounded text-xs text-destructive">
                    {test.issues_found} issue(s) found
                    {test.critical_issues > 0 && ` (${test.critical_issues} critical)`}
                  </div>
                )}

                {test.recommendations && test.recommendations.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs font-medium text-muted-foreground mb-1">Recommendations</p>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      {test.recommendations.slice(0, 3).map((rec: string, index: number) => (
                        <li key={index} className="flex items-start gap-1">
                          <span>•</span>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
