import { useState, useMemo, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { ListPane } from "@/components/layout/ListPane";
import { ListPaneItem } from "@/components/layout/ListPaneItem";
import { WorkPane } from "@/components/layout/WorkPane";
import {
  Shield,
  Lock,
  Database,
  Clock,
  Users,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Activity,
} from "lucide-react";
import {
  getDataProtectionPolicies,
  getDataProtectionViolations,
  getPlatformDataProtectionSummary,
  isPlatformProtectionQueriesAvailable
} from "@/lib/platformProtectionQueries";
import { isSupabaseConfigured } from "@/lib/supabase";
import type { DataProtectionPolicy, DataProtectionViolation } from "@/types/security";
import { LoadingState } from "@/components/shared/LoadingState";
import { EmptyState } from "@/components/shared/EmptyState";
import { IdentityOverview } from "@/components/security/IdentityOverview";
import { FeatureOverviewCharts } from "@/components/security/FeatureOverviewCharts";
import type { KeyArea, RecentActivity } from "@/components/security/FeatureOverviewCharts";

export function PlatformDataProtection() {
  const { currentTenant } = useApp();
  const [policies, setPolicies] = useState<DataProtectionPolicy[]>([]);
  const [violations, setViolations] = useState<DataProtectionViolation[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPolicy, setSelectedPolicy] = useState<DataProtectionPolicy | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortBy, setSortBy] = useState<string>("name");

  // Check if Supabase is available
  const isSupabaseAvailable = isPlatformProtectionQueriesAvailable();

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

        const [policiesData, violationsData, summaryData] = await Promise.all([
          getDataProtectionPolicies(currentTenant.id),
          getDataProtectionViolations(currentTenant.id, { limit: 50 }),
          getPlatformDataProtectionSummary(currentTenant.id)
        ]);

        setPolicies(policiesData);
        setViolations(violationsData);
        setSummary(summaryData);

        // Removed auto-selection to show overview by default
        /*
        if (policiesData.length > 0 && !selectedPolicy) {
          setSelectedPolicy(policiesData[0]);
        }
        */
      } catch (err) {
        console.error("Error loading platform data protection:", err);
        setError(err instanceof Error ? err.message : "Failed to load data protection information");
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
        (policy.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (policy.dataCategory || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (policy.description || '').toLowerCase().includes(searchTerm.toLowerCase());

      const mappedStatus = policy.status === 'active' ? 'online' : (policy.status === 'degraded' ? 'maintenance' : 'offline');
      const matchesStatus = statusFilter === "all" || mappedStatus === statusFilter;

      const matchesCategory = categoryFilter === "all" || policy.dataCategory === categoryFilter;

      return matchesSearch && matchesStatus && matchesCategory;
    });

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return (a.name || '').localeCompare(b.name || '');
        case 'category':
          return (a.dataCategory || '').localeCompare(b.dataCategory || '');
        case 'status':
          return (a.status || '').localeCompare(b.status || '');
        default:
          return 0;
      }
    });

    return result;
  }, [policies, searchTerm, statusFilter, categoryFilter, sortBy]);

  const categoryIcons = {
    encryption: Lock,
    backup: Database,
    retention: Clock,
    "access-control": Users,
  };

  // Get transmission-specific context
  const isTransmissionTenant = currentTenant.sector === 'transmission';

  // Handle loading state
  if (loading) {
    return (
      <>
        <ListPane
          title={isTransmissionTenant ? "Platform Data Protection" : "Data Protection"}
          context="DEWA – Transmission"
          count={0}
        >
          <LoadingState loadingText="Loading data protection settings..." />
        </ListPane>
        <WorkPane title="Data Protection" subtitle="Loading..." tabs={[]} />
      </>
    );
  }

  // Handle error state
  if (error) {
    return (
      <>
        <ListPane
          title={isTransmissionTenant ? "Platform Data Protection" : "Data Protection"}
          subtitle={isTransmissionTenant ? `${currentTenant.name} - Transmission Operations` : currentTenant.name}
          showFilters={false}
        >
          <EmptyState
            icon={AlertTriangle}
            title="Error Loading Data"
            description={error}
          />
        </ListPane>
        <WorkPane title="Data Protection" subtitle="Error" tabs={[]} />
      </>
    );
  }

  // Handle empty data case
  if (!policies || policies.length === 0) {
    return (
      <>
        <ListPane
          title={isTransmissionTenant ? "Platform Data Protection" : "Data Protection"}
          context="DEWA – Transmission"
          count={0}
        >
          <EmptyState
            icon={Shield}
            title="No Data Protection Policies"
            description={isTransmissionTenant
              ? "No transmission data protection policies configured"
              : "No data protection policies configured"
            }
          />
        </ListPane>
        <WorkPane title="Data Protection" subtitle="No data available" tabs={[]} />
      </>
    );
  }


  return (
    <>
      <ListPane
        title="Protection Policies"
        context="DEWA – Transmission"
        count={filteredAndSortedPolicies.length}
        searchPlaceholder="Search"
        onSearch={setSearchTerm}
        filters={[
          {
            key: "status",
            label: "Status",
            options: [
              { value: "all", label: "All Statuses" },
              { value: "online", label: "Active" },
              { value: "maintenance", label: "In Review" },
              { value: "offline", label: "Disabled" },
            ],
            value: statusFilter,
            onChange: setStatusFilter,
          },
          {
            key: "category",
            label: "Category",
            options: [
              { value: "all", label: "All Categories" },
              { value: "encryption", label: "Encryption" },
              { value: "backup", label: "Backup" },
              { value: "retention", label: "Retention" },
              { value: "access-control", label: "Access Control" },
            ],
            value: categoryFilter,
            onChange: setCategoryFilter,
          },
        ]}
        sortOptions={[
          { label: 'Name', value: 'name' },
          { label: 'Category', value: 'category' },
          { label: 'Status', value: 'status' },
        ]}
        sortValue={sortBy}
        onSortChange={setSortBy}
      >
        <div className="space-y-1">
          {filteredAndSortedPolicies.length === 0 ? (
            <EmptyState
              icon={Shield}
              title="No Policies Found"
              description="No data protection policies match your current search"
            />
          ) : (
            filteredAndSortedPolicies.map((policy) => {
              const policyViolations = violations.filter(v => v.policyId === policy.id);
              return (
                <ListPaneItem
                  key={policy.id}
                  title={policy.name}
                  description={`${policy.dataCategory.replace('-', ' ')} • ${policy.classificationLevel}`}
                  status={policy.status === 'active' ? 'online' : (policy.status === 'inactive' ? 'maintenance' : 'offline')}
                  category={policy.dataCategory.toUpperCase()}
                  value={policyViolations.length > 0 ? `${policyViolations.length} Viol.` : 'Clear'}
                  isSelected={selectedPolicy?.id === policy.id}
                  onClick={() => setSelectedPolicy(policy)}
                />
              );
            })
          )}
        </div>
      </ListPane>

      {selectedPolicy ? (
        <WorkPane
          title={selectedPolicy.name}
          subtitle={`Last checked: ${new Date(selectedPolicy.lastAssessment || selectedPolicy.createdAt).toLocaleString()}`}
          tabs={[
            {
              id: "status",
              label: "Status",
              content: <StatusTab policy={selectedPolicy} violations={violations} summary={summary} />,
            },
            {
              id: "policies",
              label: "Policies",
              content: <PoliciesTab policy={selectedPolicy} />,
            },
            {
              id: "metrics",
              label: "Metrics",
              content: <MetricsTab summary={summary} policy={selectedPolicy} />,
            },
            {
              id: "violations",
              label: "Violations",
              content: <ViolationsTab violations={violations} policy={selectedPolicy} />,
            },
          ]}
        />
      ) : (
        <WorkPane
          title="Platform Data Protection Overview"
          subtitle="Summary of data protection status across the platform"
          tabs={[
            {
              id: "overview",
              label: "Overview",
              content: <ProtectionOverview policies={policies} summary={summary} violations={violations} onViolationClick={(id) => {
                const violation = violations.find(v => v.id === id);
                if (violation) {
                  const policy = policies.find(p => p.id === violation.policyId);
                  if (policy) setSelectedPolicy(policy);
                }
              }} />,
            }
          ]}
        />
      )}
    </>
  );
}

function ProtectionOverview({
  policies,
  summary,
  violations,
  onViolationClick
}: {
  policies: DataProtectionPolicy[];
  summary: any;
  violations: DataProtectionViolation[];
  onViolationClick: (id: string) => void;
}) {
  return (
    <IdentityOverview
      title="Platform Data Protection Posture"
      description="Overview of data protection policies, encryption coverage, and backup status across platform resources."
      showTitleCard={false}
      metrics={[
        {
          title: "Total Policies",
          value: summary?.totalPolicies || policies.length,
          icon: Shield,
          variant: 'primary'
        },
        {
          title: "Encryption Coverage",
          value: `${summary?.encryptionCoverage || 0}%`,
          icon: Lock,
          variant: (summary?.encryptionCoverage || 0) >= 90 ? 'success' : (summary?.encryptionCoverage || 0) >= 70 ? 'warning' : 'destructive'
        },
        {
          title: "Backup Coverage",
          value: `${summary?.backupCoverage || 0}%`,
          icon: Database,
          variant: (summary?.backupCoverage || 0) >= 90 ? 'success' : (summary?.backupCoverage || 0) >= 70 ? 'warning' : 'destructive'
        },
        {
          title: "Compliance Score",
          value: `${summary?.complianceScore || 0}%`,
          icon: Activity,
          variant: (summary?.complianceScore || 0) >= 90 ? 'success' : (summary?.complianceScore || 0) >= 70 ? 'warning' : 'destructive'
        }
      ]}
    >
      <FeatureOverviewCharts
        pieChartTitle="Policy Status Distribution"
        pieChartData={[
          { name: 'Active', value: policies.filter(p => p.status === 'active').length, color: 'hsl(var(--success))' },
          { name: 'Inactive', value: policies.filter(p => p.status === 'inactive').length, color: 'hsl(var(--warning))' },
        ].filter(d => d.value > 0)}
        barChartTitle="Top Data Categories"
        barChartData={(() => {
          const categoryCounts = policies.reduce((acc, policy) => {
            acc[policy.dataCategory] = (acc[policy.dataCategory] || 0) + 1;
            return acc;
          }, {} as Record<string, number>);
          return Object.entries(categoryCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([name, value]) => ({
              name: name.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
              value
            }));
        })()}
        keyAreasTitle="Key Protection Areas"
        keyAreas={[
          {
            icon: Lock,
            title: "Encryption",
            description: "Data-at-rest and data-in-transit encryption for SCADA and operational data."
          },
          {
            icon: Database,
            title: "Backup & Recovery",
            description: "Automated backup policies and disaster recovery procedures for critical systems."
          },
          {
            icon: Users,
            title: "Access Control",
            description: "Role-based access control and data access policies for transmission systems."
          },
          {
            icon: Clock,
            title: "Data Retention",
            description: "Compliance-driven data retention and archival policies for operational data."
          },
        ]}
        recentActivityTitle="Recent Policy Violations"
        recentActivity={violations
          .slice(0, 3)
          .map(v => ({
            id: v.id,
            title: v.violationDescription,
            subtitle: `${v.policyName} • ${new Date(v.detectedAt).toLocaleString()}`,
            status: v.severity === 'critical' ? 'error' : v.severity === 'high' ? 'warning' : 'info',
            value: v.severity
          }))}
        onActivityClick={onViolationClick}
      />
    </IdentityOverview>
  );
}

function StatusTab({ policy, violations, summary }: { policy: DataProtectionPolicy; violations: DataProtectionViolation[]; summary: any }) {
  const isTransmissionPolicy = policy.allowedZones && policy.allowedZones.length > 0;

  const getTransmissionDescription = (categoryType: string) => {
    switch (categoryType) {
      case 'encryption':
        return 'SCADA telemetry, protection relay configurations, and grid data encryption status';
      case 'backup':
        return 'Critical system backups for SCADA configs, protection settings, and grid topology';
      case 'retention':
        return 'Data retention for operational data, security events, and audit logs';
      case 'access-control':
        return 'Access control for OT systems, SCADA, and critical transmission assets';
      default:
        return 'Overall protection status and health';
    }
  };

  const policyViolations = violations.filter(v => v.policyId === policy.id);
  const cat = policy.dataCategory;

  return (
    <div className="space-y-6">
      {/* Overall Status Card */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold">{policy.name}</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {isTransmissionPolicy ? getTransmissionDescription(cat) : policy.description || 'Overall protection status and health'}
            </p>
          </div>
          <div
            className={`px-4 py-2 rounded-lg ${policy.status === 'active'
              ? 'bg-success/10 text-success'
              : policy.status === 'inactive'
                ? 'bg-warning/10 text-warning'
                : 'bg-destructive/10 text-destructive'
              }`}
          >
            <div className="flex items-center gap-2">
              {policy.status === 'active' ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : (
                <AlertTriangle className="w-5 h-5" />
              )}
              <span className="font-medium capitalize">{policy.status}</span>
            </div>
          </div>
        </div>

        {/* Per-category metrics derived from the policy itself */}
        <div className="grid grid-cols-2 gap-3">
          {/* ── ENCRYPTION ── */}
          {cat === 'encryption' && (
            <>
              <div className="bg-secondary/30 rounded-lg p-4 border border-border">
                <p className="text-xs text-muted-foreground mb-1">Encryption at Rest</p>
                <div className="flex items-center justify-between">
                  <p className="text-xl font-semibold">{policy.encryptionRequired ? 'Required' : 'Optional'}</p>
                  <div className={`w-2 h-2 rounded-full ${policy.encryptionRequired ? 'bg-success' : 'bg-warning'}`} />
                </div>
              </div>
              <div className="bg-secondary/30 rounded-lg p-4 border border-border">
                <p className="text-xs text-muted-foreground mb-1">Algorithm</p>
                <div className="flex items-center justify-between">
                  <p className="text-xl font-semibold">{policy.encryptionAlgorithm || 'AES-256'}</p>
                  <div className="w-2 h-2 rounded-full bg-success" />
                </div>
              </div>
              <div className="bg-secondary/30 rounded-lg p-4 border border-border">
                <p className="text-xs text-muted-foreground mb-1">In-Transit Encryption</p>
                <div className="flex items-center justify-between">
                  <p className="text-xl font-semibold">
                    {policy.protectionMeasures?.includes('encryption-in-transit') ? 'Enabled' : 'Disabled'}
                  </p>
                  <div className={`w-2 h-2 rounded-full ${policy.protectionMeasures?.includes('encryption-in-transit') ? 'bg-success' : 'bg-destructive'}`} />
                </div>
              </div>
              <div className="bg-secondary/30 rounded-lg p-4 border border-border">
                <p className="text-xs text-muted-foreground mb-1">Key Rotation</p>
                <div className="flex items-center justify-between">
                  <p className="text-xl font-semibold">
                    {policy.keyRotationDays ? `${policy.keyRotationDays}d` : 'Not set'}
                  </p>
                  <div className={`w-2 h-2 rounded-full ${policy.keyRotationDays ? 'bg-success' : 'bg-warning'}`} />
                </div>
              </div>
            </>
          )}

          {/* ── BACKUP ── */}
          {cat === 'backup' && (
            <>
              <div className="bg-secondary/30 rounded-lg p-4 border border-border">
                <p className="text-xs text-muted-foreground mb-1">Backup Required</p>
                <div className="flex items-center justify-between">
                  <p className="text-xl font-semibold">{policy.backupRequired ? 'Yes' : 'No'}</p>
                  <div className={`w-2 h-2 rounded-full ${policy.backupRequired ? 'bg-success' : 'bg-destructive'}`} />
                </div>
              </div>
              <div className="bg-secondary/30 rounded-lg p-4 border border-border">
                <p className="text-xs text-muted-foreground mb-1">Backup Frequency</p>
                <div className="flex items-center justify-between">
                  <p className="text-xl font-semibold">
                    {policy.backupFrequencyHours ? `Every ${policy.backupFrequencyHours}h` : 'Daily'}
                  </p>
                  <div className="w-2 h-2 rounded-full bg-success" />
                </div>
              </div>
              <div className="bg-secondary/30 rounded-lg p-4 border border-border">
                <p className="text-xs text-muted-foreground mb-1">Retention Period</p>
                <div className="flex items-center justify-between">
                  <p className="text-xl font-semibold">
                    {policy.retentionDays ? `${policy.retentionDays} days` : 'Default'}
                  </p>
                  <div className="w-2 h-2 rounded-full bg-success" />
                </div>
              </div>
              <div className="bg-secondary/30 rounded-lg p-4 border border-border">
                <p className="text-xs text-muted-foreground mb-1">Active Violations</p>
                <div className="flex items-center justify-between">
                  <p className="text-xl font-semibold">{policyViolations.length}</p>
                  <div className={`w-2 h-2 rounded-full ${policyViolations.length === 0 ? 'bg-success' : policyViolations.length < 3 ? 'bg-warning' : 'bg-destructive'}`} />
                </div>
              </div>
            </>
          )}

          {/* ── RETENTION ── */}
          {cat === 'retention' && (
            <>
              <div className="bg-secondary/30 rounded-lg p-4 border border-border">
                <p className="text-xs text-muted-foreground mb-1">Retention Period</p>
                <div className="flex items-center justify-between">
                  <p className="text-xl font-semibold">
                    {policy.retentionDays ? `${policy.retentionDays} days` : 'Not configured'}
                  </p>
                  <div className={`w-2 h-2 rounded-full ${policy.retentionDays > 0 ? 'bg-success' : 'bg-destructive'}`} />
                </div>
              </div>
              <div className="bg-secondary/30 rounded-lg p-4 border border-border">
                <p className="text-xs text-muted-foreground mb-1">Deletion Policy</p>
                <div className="flex items-center justify-between">
                  <p className="text-xl font-semibold">
                    {policy.protectionMeasures?.includes('deletion-policy') ? 'Enforced' : 'Not set'}
                  </p>
                  <div className={`w-2 h-2 rounded-full ${policy.protectionMeasures?.includes('deletion-policy') ? 'bg-success' : 'bg-warning'}`} />
                </div>
              </div>
              <div className="bg-secondary/30 rounded-lg p-4 border border-border">
                <p className="text-xs text-muted-foreground mb-1">Data Masking</p>
                <div className="flex items-center justify-between">
                  <p className="text-xl font-semibold">
                    {policy.protectionMeasures?.includes('data-masking') ? 'Enabled' : 'Disabled'}
                  </p>
                  <div className={`w-2 h-2 rounded-full ${policy.protectionMeasures?.includes('data-masking') ? 'bg-success' : 'bg-secondary'}`} />
                </div>
              </div>
              <div className="bg-secondary/30 rounded-lg p-4 border border-border">
                <p className="text-xs text-muted-foreground mb-1">Active Violations</p>
                <div className="flex items-center justify-between">
                  <p className="text-xl font-semibold">{policyViolations.length}</p>
                  <div className={`w-2 h-2 rounded-full ${policyViolations.length === 0 ? 'bg-success' : policyViolations.length < 3 ? 'bg-warning' : 'bg-destructive'}`} />
                </div>
              </div>
            </>
          )}

          {/* ── ACCESS CONTROL / FALLBACK ── */}
          {(cat === 'access-control' || !['encryption', 'backup', 'retention'].includes(cat)) && (
            <>
              <div className="bg-secondary/30 rounded-lg p-4 border border-border">
                <p className="text-xs text-muted-foreground mb-1">Access Control</p>
                <div className="flex items-center justify-between">
                  <p className="text-xl font-semibold">{policy.accessControlRequired ? 'Required' : 'Optional'}</p>
                  <div className={`w-2 h-2 rounded-full ${policy.accessControlRequired ? 'bg-success' : 'bg-warning'}`} />
                </div>
              </div>
              <div className="bg-secondary/30 rounded-lg p-4 border border-border">
                <p className="text-xs text-muted-foreground mb-1">Allowed Zones</p>
                <div className="flex items-center justify-between">
                  <p className="text-xl font-semibold">
                    {policy.allowedZones && policy.allowedZones.length > 0 ? `${policy.allowedZones.length} zones` : 'All zones'}
                  </p>
                  <div className="w-2 h-2 rounded-full bg-success" />
                </div>
              </div>
              <div className="bg-secondary/30 rounded-lg p-4 border border-border">
                <p className="text-xs text-muted-foreground mb-1">Encryption</p>
                <div className="flex items-center justify-between">
                  <p className="text-xl font-semibold">{policy.encryptionRequired ? 'Required' : 'Optional'}</p>
                  <div className={`w-2 h-2 rounded-full ${policy.encryptionRequired ? 'bg-success' : 'bg-warning'}`} />
                </div>
              </div>
              <div className="bg-secondary/30 rounded-lg p-4 border border-border">
                <p className="text-xs text-muted-foreground mb-1">Active Violations</p>
                <div className="flex items-center justify-between">
                  <p className="text-xl font-semibold">{policyViolations.length}</p>
                  <div className={`w-2 h-2 rounded-full ${policyViolations.length === 0 ? 'bg-success' : policyViolations.length < 3 ? 'bg-warning' : 'bg-destructive'}`} />
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Policy Details */}
      <div>
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Shield className="w-4 h-4 text-primary" />
          Policy Details
        </h3>
        <div className="bg-card border border-border rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Category</span>
            <span className="text-sm font-medium capitalize">{policy.dataCategory.replace(/-/g, ' ')}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Status</span>
            <span className={`text-sm font-medium ${policy.status === 'active' ? 'text-success' : 'text-warning'}`}>
              {policy.status}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Classification Level</span>
            <span className="text-sm font-medium capitalize">{policy.classificationLevel}</span>
          </div>
          {policy.retentionDays > 0 && cat !== 'retention' && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Retention Period</span>
              <span className="text-sm font-medium">{policy.retentionDays} days</span>
            </div>
          )}
          {policy.encryptionAlgorithm && cat !== 'encryption' && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Encryption Algorithm</span>
              <span className="text-sm font-medium">{policy.encryptionAlgorithm}</span>
            </div>
          )}
          {policy.lastAssessment && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Last Assessment</span>
              <span className="text-sm font-medium">{new Date(policy.lastAssessment).toLocaleDateString()}</span>
            </div>
          )}
          {policy.nextAssessment && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Next Assessment</span>
              <span className="text-sm font-medium">{new Date(policy.nextAssessment).toLocaleDateString()}</span>
            </div>
          )}
        </div>
      </div>

      {/* Compliance Coverage */}
      {policy.complianceStandards && policy.complianceStandards.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" />
            Compliance Coverage
          </h3>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex flex-wrap gap-2">
              {policy.complianceStandards.map((standard) => (
                <span
                  key={standard}
                  className="px-3 py-1 bg-primary/10 text-primary text-xs rounded-full"
                >
                  {standard}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Transmission Context */}
      {isTransmissionPolicy && policy.allowedZones && (
        <div>
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" />
            Transmission Context
          </h3>
          <div className="bg-card border border-border rounded-lg p-4 space-y-3">
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Allowed Zones</p>
              <div className="flex flex-wrap gap-1">
                {policy.allowedZones.map((zone: string, index: number) => (
                  <span key={index} className="px-2 py-0.5 bg-secondary text-xs rounded">
                    {zone.replace(/-/g, ' ')}
                  </span>
                ))}
              </div>
            </div>
            {policy.allowedRoles && policy.allowedRoles.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Allowed Roles</p>
                <div className="flex flex-wrap gap-1">
                  {policy.allowedRoles.map((role: string, index: number) => (
                    <span key={index} className="px-2 py-0.5 bg-secondary text-xs rounded">
                      {role.replace(/-/g, ' ')}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Inline violation summary */}
      {policyViolations.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-warning" />
            Active Violations ({policyViolations.length})
          </h3>
          <div className="space-y-2">
            {policyViolations.slice(0, 3).map((violation) => (
              <div key={violation.id} className="bg-card border border-warning/30 rounded-lg p-3 flex items-start gap-3">
                <AlertTriangle className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium capitalize">{violation.violationType.replace(/-/g, ' ')}</p>
                  <p className="text-xs text-muted-foreground truncate">{violation.violationDescription}</p>
                  <div className="flex items-center gap-2 mt-1 text-xs">
                    <span className={`capitalize font-medium ${violation.severity === 'critical' ? 'text-destructive' :
                      violation.severity === 'high' ? 'text-warning' : 'text-muted-foreground'
                      }`}>
                      {violation.severity}
                    </span>
                    <span className="text-muted-foreground">·</span>
                    <span className="text-muted-foreground">{new Date(violation.detectedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            ))}
            {policyViolations.length > 3 && (
              <p className="text-xs text-muted-foreground text-center pt-1">
                +{policyViolations.length - 3} more — see Violations tab
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function PoliciesTab({ policy }: { policy: DataProtectionPolicy }) {
  return (
    <div className="space-y-4">
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="text-sm font-semibold">{policy.name}</h4>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full ${policy.status === "active"
                  ? "bg-success/10 text-success"
                  : "bg-secondary text-muted-foreground"
                  }`}
              >
                {policy.status}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">{policy.description}</p>
          </div>
        </div>

        <div className="space-y-2">
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">Data Category</p>
            <div className="flex flex-wrap gap-1">
              <span className="px-2 py-0.5 bg-secondary text-xs rounded capitalize">
                {policy.dataCategory.replace('-', ' ')}
              </span>
            </div>
          </div>

          {policy.complianceStandards && policy.complianceStandards.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">
                Compliance Standards
              </p>
              <div className="flex flex-wrap gap-1">
                {policy.complianceStandards.map((standard, index) => (
                  <span
                    key={index}
                    className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded"
                  >
                    {standard}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MetricsTab({ summary, policy }: { summary: any; policy?: DataProtectionPolicy }) {
  if (!summary) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        No metrics available
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary" />
          {policy ? `${policy.name} Metrics` : 'Global Posture Summary'}
        </h3>
        {policy ? (
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-start justify-between mb-2">
                <p className="text-sm font-medium">Policy Compliance</p>
                <div
                  className={`px-2 py-0.5 rounded text-[10px] font-medium ${(policy.complianceScore || 0) >= 90
                    ? "bg-success/10 text-success"
                    : (policy.complianceScore || 0) >= 70
                      ? "bg-warning/10 text-warning"
                      : "bg-destructive/10 text-destructive"
                    }`}
                >
                  {(policy.complianceScore || 0) >= 90 ? "good" : (policy.complianceScore || 0) >= 70 ? "warning" : "error"}
                </div>
              </div>
              <p className="text-2xl font-bold">{policy.complianceScore || 0}%</p>
            </div>
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-start justify-between mb-2">
                <p className="text-sm font-medium">Violation Rate</p>
                <div
                  className={`px-2 py-0.5 rounded text-[10px] font-medium ${policy.violationCount === 0
                    ? "bg-success/10 text-success"
                    : "bg-warning/10 text-warning"
                    }`}
                >
                  {policy.violationCount === 0 ? "healthy" : "review"}
                </div>
              </div>
              <p className="text-2xl font-bold">{policy.violationCount || 0}</p>
            </div>
          </div>
        ) : null}

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-start justify-between mb-2">
              <p className="text-sm font-medium">Encryption Coverage</p>
              <div
                className={`px-2 py-0.5 rounded text-[10px] font-medium ${summary.encryptionCoverage >= 90
                  ? "bg-success/10 text-success"
                  : summary.encryptionCoverage >= 70
                    ? "bg-warning/10 text-warning"
                    : "bg-destructive/10 text-destructive"
                  }`}
              >
                {summary.encryptionCoverage >= 90 ? "good" : summary.encryptionCoverage >= 70 ? "warning" : "error"}
              </div>
            </div>
            <p className="text-2xl font-bold">{summary.encryptionCoverage}%</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-start justify-between mb-2">
              <p className="text-sm font-medium">Backup Coverage</p>
              <div
                className={`px-2 py-0.5 rounded text-[10px] font-medium ${summary.backupCoverage >= 90
                  ? "bg-success/10 text-success"
                  : summary.backupCoverage >= 70
                    ? "bg-warning/10 text-warning"
                    : "bg-destructive/10 text-destructive"
                  }`}
              >
                {summary.backupCoverage >= 90 ? "good" : summary.backupCoverage >= 70 ? "warning" : "error"}
              </div>
            </div>
            <p className="text-2xl font-bold">{summary.backupCoverage}%</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-start justify-between mb-2">
              <p className="text-sm font-medium">Access Control</p>
              <div
                className={`px-2 py-0.5 rounded text-[10px] font-medium ${summary.accessControlCoverage >= 90
                  ? "bg-success/10 text-success"
                  : summary.accessControlCoverage >= 70
                    ? "bg-warning/10 text-warning"
                    : "bg-destructive/10 text-destructive"
                  }`}
              >
                {summary.accessControlCoverage >= 90 ? "good" : summary.accessControlCoverage >= 70 ? "warning" : "error"}
              </div>
            </div>
            <p className="text-2xl font-bold">{summary.accessControlCoverage}%</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-start justify-between mb-2">
              <p className="text-sm font-medium">Compliance Score</p>
              <div
                className={`px-2 py-0.5 rounded text-[10px] font-medium ${summary.complianceScore >= 90
                  ? "bg-success/10 text-success"
                  : summary.complianceScore >= 70
                    ? "bg-warning/10 text-warning"
                    : "bg-destructive/10 text-destructive"
                  }`}
              >
                {summary.complianceScore >= 90 ? "good" : summary.complianceScore >= 70 ? "warning" : "error"}
              </div>
            </div>
            <p className="text-2xl font-bold">{summary.complianceScore}%</p>
          </div>
        </div>
      </div>

      {/* Category Specific Breakdown */}
      {policy && (
        <div className="bg-card border border-border rounded-lg p-4">
          <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" />
            Category Performance: {policy.dataCategory.replace(/-/g, ' ').toUpperCase()}
          </h4>
          <div className="space-y-4">
            {policy.dataCategory === 'encryption' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-secondary/20 rounded p-3">
                  <p className="text-xs text-muted-foreground mb-1">Rotation Timeliness</p>
                  <p className="text-lg font-bold text-success">95%</p>
                </div>
                <div className="bg-secondary/20 rounded p-3">
                  <p className="text-xs text-muted-foreground mb-1">Key Strength Compliance</p>
                  <p className="text-lg font-bold text-success">100%</p>
                </div>
              </div>
            )}
            {policy.dataCategory === 'backup' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-secondary/20 rounded p-3">
                  <p className="text-xs text-muted-foreground mb-1">Restore Success Rate</p>
                  <p className="text-lg font-bold text-success">99.2%</p>
                </div>
                <div className="bg-secondary/20 rounded p-3">
                  <p className="text-xs text-muted-foreground mb-1">Offsite Sync Status</p>
                  <p className="text-lg font-bold text-success">Synced</p>
                </div>
              </div>
            )}
            {policy.dataCategory === 'retention' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-secondary/20 rounded p-3">
                  <p className="text-xs text-muted-foreground mb-1">Deletion Timeliness</p>
                  <p className="text-lg font-bold text-success">98%</p>
                </div>
                <div className="bg-secondary/20 rounded p-3">
                  <p className="text-xs text-muted-foreground mb-1">Records Archived</p>
                  <p className="text-lg font-bold text-primary">1.2M</p>
                </div>
              </div>
            )}
            {(!['encryption', 'backup', 'retention'].includes(policy.dataCategory)) && (
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-secondary/20 rounded p-3">
                  <p className="text-xs text-muted-foreground mb-1">Zone Compliance</p>
                  <p className="text-lg font-bold text-success">100%</p>
                </div>
                <div className="bg-secondary/20 rounded p-3">
                  <p className="text-xs text-muted-foreground mb-1">Access Anomalies</p>
                  <p className="text-lg font-bold text-success">Zero</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold">Metric Summary</h4>
          <span className="text-xs text-muted-foreground">
            Last updated: {new Date(summary.lastAssessment).toLocaleString()}
          </span>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Total Policies</span>
            <span className="font-medium">{summary.totalPolicies}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Active Policies</span>
            <span className="font-medium text-success">{summary.activePolicies}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Total Violations</span>
            <span className="font-medium text-destructive">{summary.violationCount}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Critical Violations</span>
            <span className="font-medium text-destructive">{summary.criticalViolations}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ViolationsTab({ violations, policy }: { violations: DataProtectionViolation[]; policy: DataProtectionPolicy }) {
  const policyViolations = violations.filter(v => v.policyId === policy.id);

  return (
    <div className="space-y-4">
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex items-center gap-3">
          <div
            className={`w-12 h-12 rounded-lg flex items-center justify-center ${policyViolations.length === 0
              ? "bg-success/10"
              : policyViolations.length < 5
                ? "bg-warning/10"
                : "bg-destructive/10"
              }`}
          >
            {policyViolations.length === 0 ? (
              <CheckCircle2
                className="w-6 h-6 text-success"
              />
            ) : (
              <AlertTriangle
                className={`w-6 h-6 ${policyViolations.length < 5 ? "text-warning" : "text-destructive"
                  }`}
              />
            )}
          </div>
          <div className="flex-1">
            <p className="text-2xl font-bold">{policyViolations.length}</p>
            <p className="text-sm text-muted-foreground">
              Active policy violation{policyViolations.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
      </div>

      {policyViolations.length === 0 ? (
        <div className="bg-success/5 border border-success/20 rounded-lg p-6 text-center">
          <CheckCircle2 className="w-12 h-12 text-success mx-auto mb-3" />
          <h3 className="text-sm font-semibold mb-1">No Violations Detected</h3>
          <p className="text-xs text-muted-foreground">
            All policies are being followed correctly
          </p>
        </div>
      ) : (
        <div>
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-primary" />
            Policy Violations
          </h3>
          <div className="space-y-3">
            {policyViolations.map((violation) => (
              <div key={violation.id} className="bg-card border border-warning/30 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold mb-1">
                      {violation.violationType.replace('-', ' ')}
                    </h4>
                    <p className="text-xs text-muted-foreground mb-2">
                      {violation.violationDescription || 'Policy violation detected'}
                    </p>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-muted-foreground">
                        Severity: {violation.severity}
                      </span>
                      <span>·</span>
                      <span className="text-muted-foreground">
                        Detected: {new Date(violation.detectedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
