import { useState, useMemo, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { ListPane } from "@/components/layout/ListPane";
import { ListPaneItem } from "@/components/layout/ListPaneItem";
import { WorkPane } from "@/components/layout/WorkPane";
import { EmptyState } from "@/components/shared/EmptyState";
import {
  Database,
  Clock,
  Shield,
  FileText,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Settings,
  Archive,
  HardDrive,
  Calendar,
  Scale,
  Gavel,
  Eye,
  Download,
  Trash2,
  Info,
  BarChart,
  PieChart,
} from "lucide-react";
import { IdentityOverview } from "@/components/security/IdentityOverview";
import { FeatureOverviewCharts } from "@/components/security/FeatureOverviewCharts";
import type { KeyArea, RecentActivity } from "@/components/security/FeatureOverviewCharts";
import { getLogRetentionPolicies } from "@/lib/loggingForensicsQueries";
import type { AuditRetentionPolicy as SupabasePolicy } from "@/types/security";

interface LogRetentionPolicy {
  id: string;
  tenantId: string;
  name: string;
  description: string;
  logTypes: string[];
  retentionPeriod: number; // in days
  retentionUnit: 'days' | 'months' | 'years';
  storageLocation: 'local' | 'cloud' | 'archive';
  compressionEnabled: boolean;
  encryptionEnabled: boolean;
  complianceStandards: string[];
  regulatoryRequirements: string[];
  status: 'active' | 'inactive' | 'pending';
  lastReview: string;
  nextReview: string;
  storageUsed: number; // in GB
  storageLimit: number; // in GB
  autoDelete: boolean;
  exportBeforeDelete: boolean;
  approvalRequired: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export function LogRetentionSettings() {
  const { currentTenant } = useApp();

  const [policies, setPolicies] = useState<LogRetentionPolicy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const mapSupabaseToFrontend = (s: SupabasePolicy): LogRetentionPolicy => {
    return {
      id: s.id,
      tenantId: s.tenantId,
      name: s.name,
      description: s.description || '',
      logTypes: (s.eventTypes as any[]) || [],
      retentionPeriod: s.retentionPeriodDays,
      retentionUnit: 'days',
      storageLocation: 'local',
      compressionEnabled: true,
      encryptionEnabled: true,
      complianceStandards: s.complianceStandards || [],
      regulatoryRequirements: [],
      status: s.active ? 'active' : 'inactive',
      lastReview: s.updatedAt,
      nextReview: new Date(new Date(s.updatedAt).getTime() + 180 * 24 * 60 * 60 * 1000).toISOString(),
      storageUsed: 15.5, // Mock value
      storageLimit: 100,
      autoDelete: true,
      exportBeforeDelete: true,
      approvalRequired: false,
      createdBy: s.createdBy || 'System',
      createdAt: s.createdAt,
      updatedAt: s.updatedAt
    };
  };

  useEffect(() => {
    async function fetchPolicies() {
      setLoading(true);
      setError(null);
      try {
        const result = await getLogRetentionPolicies(currentTenant.id);
        if (result.length > 0) {
          setPolicies(result.map(mapSupabaseToFrontend));
        } else {
          setPolicies([]);
        }
      } catch (err) {
        console.error("Error fetching policies:", err);
        setError("Failed to fetch policies");
      } finally {
        setLoading(false);
      }
    }
    fetchPolicies();
  }, [currentTenant.id]);

  const [selectedPolicyId, setSelectedPolicyId] = useState<string | undefined>(undefined);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [storageFilter, setStorageFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<string>("name");

  // Filter and sort policies
  const filteredAndSortedPolicies = useMemo(() => {
    let result = policies.filter((policy) => {
      const matchesSearch =
        (policy.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (policy.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (policy.logTypes || []).some(type => type.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (policy.complianceStandards || []).some(std => std.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesStatus = statusFilter === "all" || policy.status === statusFilter;

      let matchesStorage = true;
      if (storageFilter !== "all") {
        if (storageFilter === "near-limit") {
          matchesStorage = (policy.storageUsed / policy.storageLimit) > 0.8;
        } else if (storageFilter === "over-limit") {
          matchesStorage = policy.storageUsed > policy.storageLimit;
        } else {
          matchesStorage = policy.storageLocation === storageFilter;
        }
      }

      return matchesSearch && matchesStatus && matchesStorage;
    });

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return (a.name || '').localeCompare(b.name || '');
        case 'retention':
          return b.retentionPeriod - a.retentionPeriod;
        case 'storageUsed':
          return b.storageUsed - a.storageUsed;
        case 'utilization':
          return (b.storageUsed / b.storageLimit) - (a.storageUsed / a.storageLimit);
        default:
          return 0;
      }
    });

    return result;
  }, [policies, searchTerm, statusFilter, storageFilter, sortBy]);

  // Removed auto-selection to show overview
  /*
  useEffect(() => {
    if (filteredPolicies.length > 0 && !selectedPolicyId) {
      setSelectedPolicyId(filteredPolicies[0].id);
    }
  }, [filteredPolicies]);
  */

  const selectedPolicy = policies.find((p) => p.id === selectedPolicyId);

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    const totalPolicies = policies.length;
    if (totalPolicies === 0) return {
      totalPolicies: 0, activePolicies: 0, totalStorageUsed: 0,
      totalStorageLimit: 0, storageUtilization: 0, policiesNearLimit: 0
    };

    const activePolicies = policies.filter(p => p.status === "active").length;
    const totalStorageUsed = policies.reduce((sum, p) => sum + p.storageUsed, 0);
    const totalStorageLimit = policies.reduce((sum, p) => sum + p.storageLimit, 0);
    const policiesNearLimit = policies.filter(p =>
      (p.storageUsed / p.storageLimit) > 0.8
    ).length;

    return {
      totalPolicies,
      activePolicies,
      totalStorageUsed: Math.round(totalStorageUsed * 10) / 10,
      totalStorageLimit,
      storageUtilization: totalStorageLimit > 0 ? Math.round((totalStorageUsed / totalStorageLimit) * 100) : 0,
      policiesNearLimit,
    };
  }, [policies]);

  const tabs = selectedPolicy
    ? [
      {
        id: "details",
        label: "Policy Details",
        content: <PolicyDetails policy={selectedPolicy} />,
      },
      {
        id: "compliance",
        label: "Compliance",
        content: <ComplianceMapping policy={selectedPolicy} />,
      },
      {
        id: "storage",
        label: "Storage & Lifecycle",
        content: <StorageLifecycle policy={selectedPolicy} />,
      },
      {
        id: "settings",
        label: "Settings",
        content: <PolicySettings policy={selectedPolicy} />,
      },
    ]
    : [
      {
        id: "overview",
        label: "Overview",
        content: <RetentionOverview policies={policies} summaryStats={summaryStats} onPolicySelect={setSelectedPolicyId} />,
      }
    ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-success/10 text-success";
      case "inactive":
        return "bg-secondary text-muted-foreground";
      case "pending":
        return "bg-warning/10 text-warning";
      default:
        return "bg-secondary text-muted-foreground";
    }
  };

  const getStorageColor = (used: number, limit: number) => {
    const percentage = (used / limit) * 100;
    if (percentage > 90) return "text-destructive";
    if (percentage > 80) return "text-warning";
    return "text-success";
  };

  const getStorageIcon = (location: string) => {
    switch (location) {
      case "local":
        return HardDrive;
      case "cloud":
        return Database;
      case "archive":
        return Archive;
      default:
        return Database;
    }
  };

  return (
    <>
      <ListPane
        title="Log Retention Settings"
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
              { value: "pending", label: "Pending" },
            ],
            value: statusFilter,
            onChange: setStatusFilter,
          },
          {
            key: "storage",
            label: "Storage",
            options: [
              { value: "all", label: "All Storage" },
              { value: "local", label: "Local" },
              { value: "cloud", label: "Cloud" },
              { value: "archive", label: "Archive" },
              { value: "near-limit", label: "Near Limit" },
              { value: "over-limit", label: "Over Limit" },
            ],
            value: storageFilter,
            onChange: setStorageFilter,
          },
        ]}
        sortOptions={[
          { label: 'Policy Name', value: 'name' },
          { label: 'Retention Period', value: 'retention' },
          { label: 'Storage Used', value: 'storageUsed' },
          { label: 'Utilization', value: 'utilization' },
        ]}
        sortValue={sortBy}
        onSortChange={setSortBy}
      >
        <div className="space-y-1">
          {filteredAndSortedPolicies.length === 0 ? (
            <EmptyState
              icon={Database}
              title="No Policies Found"
              description="No retention policies match your current filters"
            />
          ) : (
            filteredAndSortedPolicies.map((policy) => (
              <ListPaneItem
                key={policy.id}
                title={policy.name}
                description={policy.description}
                status={policy.status === 'active' ? 'online' : (policy.status === 'pending' ? 'maintenance' : 'offline')}
                category={policy.storageLocation.toUpperCase()}
                value={`${policy.retentionPeriod} ${policy.retentionUnit.charAt(0).toUpperCase()}`}
                isSelected={selectedPolicyId === policy.id}
                onClick={() => setSelectedPolicyId(policy.id)}
              />
            ))
          )}
        </div>
      </ListPane>

      <WorkPane
        title={selectedPolicy ? selectedPolicy.name : "Log Retention Overview"}
        subtitle={selectedPolicy ? `${selectedPolicy.storageLocation} • ${selectedPolicy.retentionPeriod} ${selectedPolicy.retentionUnit}` : "Enterprise-wide log lifecycle management and compliance policy configuration"}
        tabs={tabs}
      />
    </>
  );
}

function RetentionOverview({
  policies,
  summaryStats,
  onPolicySelect
}: {
  policies: LogRetentionPolicy[];
  summaryStats: any;
  onPolicySelect: (id: string) => void;
}) {
  return (
    <IdentityOverview
      title="Retention & Lifecycle Overview"
      description="Manage the lifecycle of security and operational logs to ensure regulatory compliance and optimize storage costs."
      showTitleCard={false}
      metrics={[
        {
          title: "Active Policies",
          value: summaryStats.activePolicies,
          icon: Shield,
          variant: 'primary'
        },
        {
          title: "Storage Used",
          value: `${summaryStats.totalStorageUsed} GB`,
          icon: HardDrive,
          variant: summaryStats.storageUtilization > 80 ? 'warning' : 'primary'
        },
        {
          title: "Utilization",
          value: `${summaryStats.storageUtilization}%`,
          icon: PieChart,
          variant: summaryStats.storageUtilization > 90 ? 'destructive' : 'primary'
        },
        {
          title: "Near Limit",
          value: summaryStats.policiesNearLimit,
          icon: AlertTriangle,
          variant: summaryStats.policiesNearLimit > 0 ? 'warning' : 'success'
        }
      ]}
    >
      <FeatureOverviewCharts
        pieChartTitle="Storage Location Distribution"
        pieChartData={[
          { name: 'Local', value: policies.filter(p => p.storageLocation === 'local').length, color: 'hsl(var(--primary))' },
          { name: 'Cloud', value: policies.filter(p => p.storageLocation === 'cloud').length, color: 'hsl(var(--chart-2))' },
          { name: 'Archive', value: policies.filter(p => p.storageLocation === 'archive').length, color: 'hsl(var(--chart-3))' },
        ].filter(d => d.value > 0)}
        barChartTitle="Storage Usage by Policy (GB)"
        barChartData={policies
          .sort((a, b) => b.storageUsed - a.storageUsed)
          .slice(0, 5)
          .map(p => ({ name: p.name, value: p.storageUsed }))}
        keyAreasTitle="Key Retention Areas"
        keyAreas={[
          {
            icon: Gavel,
            title: "Regulatory Compliance",
            description: "Retention periods required by NERC CIP, SOC2, and industrial regulations."
          },
          {
            icon: HardDrive,
            title: "Storage Optimization",
            description: "Automated compression and lifecycle transitions to cost-effective storage."
          },
          {
            icon: Shield,
            title: "Data Privacy",
            description: "Encryption-at-rest and secure deletion of sensitive operational logs."
          },
          {
            icon: Archive,
            title: "Disaster Recovery",
            description: "Offsite archival and backup of critical forensic and audit trails."
          },
        ]}
        recentActivityTitle="Recent Policy Reviews"
        recentActivity={policies
          .sort((a, b) => new Date(b.lastReview).getTime() - new Date(a.lastReview).getTime())
          .slice(0, 3)
          .map(p => ({
            id: p.id,
            title: p.name,
            subtitle: `Reviewed on ${new Date(p.lastReview).toLocaleDateString()}`,
            status: p.status === 'active' ? 'success' : 'info',
            value: `${Math.round((p.storageUsed / p.storageLimit) * 100)}% cap.`
          }))}
        onActivityClick={onPolicySelect}
      />
    </IdentityOverview>
  );
}

function PolicyDetails({ policy }: { policy: LogRetentionPolicy }) {
  const StorageIcon = getStorageIcon(policy.storageLocation);

  return (
    <div className="space-y-6">
      {/* Policy Overview */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
            <StorageIcon className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold">{policy.name}</h3>
            <p className="text-sm text-muted-foreground mt-1">{policy.description}</p>
            <div className="flex items-center gap-4 mt-4">
              <span
                className={`text-xs px-3 py-1 rounded-full ${policy.status === "active"
                  ? "bg-success/10 text-success"
                  : policy.status === "pending"
                    ? "bg-warning/10 text-warning"
                    : "bg-secondary text-muted-foreground"
                  }`}
              >
                {policy.status.toUpperCase()}
              </span>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {policy.retentionPeriod} {policy.retentionUnit}
              </span>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <StorageIcon className="w-3 h-3" />
                {policy.storageLocation}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Policy Configuration */}
      <div>
        <h4 className="text-sm font-semibold mb-3">Policy Configuration</h4>
        <div className="bg-card border border-border rounded-lg divide-y divide-border">
          <div className="p-4 flex items-center gap-3">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Retention Period</p>
              <p className="text-sm font-medium">
                {policy.retentionPeriod} {policy.retentionUnit}
              </p>
            </div>
          </div>
          <div className="p-4 flex items-center gap-3">
            <StorageIcon className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Storage Location</p>
              <p className="text-sm font-medium capitalize">{policy.storageLocation}</p>
            </div>
          </div>
          <div className="p-4 flex items-center gap-3">
            <Archive className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Compression</p>
              <p className="text-sm font-medium">
                {policy.compressionEnabled ? "Enabled" : "Disabled"}
              </p>
            </div>
          </div>
          <div className="p-4 flex items-center gap-3">
            <Shield className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Encryption</p>
              <p className="text-sm font-medium">
                {policy.encryptionEnabled ? "Enabled" : "Disabled"}
              </p>
            </div>
          </div>
          <div className="p-4 flex items-center gap-3">
            <Trash2 className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Auto Delete</p>
              <p className="text-sm font-medium">
                {policy.autoDelete ? "Enabled" : "Disabled"}
              </p>
            </div>
          </div>
          <div className="p-4 flex items-center gap-3">
            <Download className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Export Before Delete</p>
              <p className="text-sm font-medium">
                {policy.exportBeforeDelete ? "Yes" : "No"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Log Types */}
      <div>
        <h4 className="text-sm font-semibold mb-3">Covered Log Types</h4>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex flex-wrap gap-2">
            {policy.logTypes.map((logType, index) => (
              <span
                key={index}
                className="text-xs px-2 py-1 bg-secondary text-muted-foreground rounded"
              >
                {logType}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Metadata */}
      <div>
        <h4 className="text-sm font-semibold mb-3">Policy Metadata</h4>
        <div className="bg-card border border-border rounded-lg divide-y divide-border">
          <div className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Created By</p>
            <p className="text-sm font-medium">{policy.createdBy}</p>
          </div>
          <div className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Created Date</p>
            <p className="text-sm font-medium">
              {new Date(policy.createdAt).toLocaleDateString()}
            </p>
          </div>
          <div className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Last Updated</p>
            <p className="text-sm font-medium">
              {new Date(policy.updatedAt).toLocaleDateString()}
            </p>
          </div>
          <div className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Last Review</p>
            <p className="text-sm font-medium">
              {new Date(policy.lastReview).toLocaleDateString()}
            </p>
          </div>
          <div className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Next Review</p>
            <p className="text-sm font-medium">
              {new Date(policy.nextReview).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ComplianceMapping({ policy }: { policy: LogRetentionPolicy }) {
  return (
    <div className="space-y-6">
      {/* Compliance Standards */}
      <div>
        <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Scale className="w-4 h-4 text-primary" />
          Compliance Standards
        </h4>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="space-y-3">
            {policy.complianceStandards.map((standard, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-success" />
                  <span className="text-sm font-medium">{standard}</span>
                </div>
                <span className="text-xs text-muted-foreground">Compliant</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Regulatory Requirements */}
      <div>
        <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Gavel className="w-4 h-4 text-primary" />
          Regulatory Requirements
        </h4>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="space-y-3">
            {policy.regulatoryRequirements.map((requirement, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-success" />
                  <span className="text-sm font-medium">{requirement}</span>
                </div>
                <span className="text-xs text-muted-foreground">Met</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Power Transmission-Specific Requirements */}
      <div>
        <h4 className="text-sm font-semibold mb-3">Power Transmission Requirements</h4>
        <div className="bg-card border border-border rounded-lg divide-y divide-border">
          <div className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Substation System Records</span>
              <span className="text-sm font-medium">
                {policy.name.includes('Safety') ? '10+ years' : 'N/A'}
              </span>
            </div>
          </div>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Grid Operational Data</span>
              <span className="text-sm font-medium">
                {policy.name.includes('Operational') ? '5+ years' : 'N/A'}
              </span>
            </div>
          </div>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">NERC CIP Audit Logs</span>
              <span className="text-sm font-medium">
                {policy.name.includes('Security') ? '7+ years' : 'N/A'}
              </span>
            </div>
          </div>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Equipment Maintenance Records</span>
              <span className="text-sm font-medium">
                {policy.name.includes('Maintenance') ? '15+ years' : 'N/A'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Compliance Status */}
      <div>
        <h4 className="text-sm font-semibold mb-3">Compliance Status</h4>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Overall Compliance</span>
              <span className="text-sm font-medium text-success">100%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Last Audit</span>
              <span className="text-sm font-medium">
                {new Date(policy.lastReview).toLocaleDateString()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Next Review</span>
              <span className="text-sm font-medium">
                {new Date(policy.nextReview).toLocaleDateString()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Risk Level</span>
              <span className="text-sm font-medium text-success">Low</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StorageLifecycle({ policy }: { policy: LogRetentionPolicy }) {
  const storagePercentage = (policy.storageUsed / policy.storageLimit) * 100;
  const StorageIcon = getStorageIcon(policy.storageLocation);

  return (
    <div className="space-y-6">
      {/* Storage Overview */}
      <div>
        <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <HardDrive className="w-4 h-4 text-primary" />
          Storage Overview
        </h4>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Storage Used</span>
              <span className="text-sm font-medium">
                {policy.storageUsed} GB of {policy.storageLimit} GB
              </span>
            </div>

            {/* Storage Progress Bar */}
            <div className="w-full bg-secondary rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${storagePercentage > 90 ? 'bg-destructive' :
                  storagePercentage > 80 ? 'bg-warning' : 'bg-success'
                  }`}
                style={{ width: `${Math.min(storagePercentage, 100)}%` }}
              />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Utilization</span>
              <span className={`text-sm font-medium ${storagePercentage > 90 ? 'text-destructive' :
                storagePercentage > 80 ? 'text-warning' : 'text-success'
                }`}>
                {Math.round(storagePercentage)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Lifecycle Stages */}
      <div>
        <h4 className="text-sm font-semibold mb-3">Data Lifecycle</h4>
        <div className="bg-card border border-border rounded-lg divide-y divide-border">
          <div className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-xs font-bold text-primary">1</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Active Storage</p>
                <p className="text-xs text-muted-foreground">
                  Logs stored in {policy.storageLocation} with {policy.compressionEnabled ? 'compression' : 'no compression'}
                </p>
              </div>
              <CheckCircle2 className="w-4 h-4 text-success" />
            </div>
          </div>

          <div className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-warning/10 flex items-center justify-center">
                <span className="text-xs font-bold text-warning">2</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Archive Transition</p>
                <p className="text-xs text-muted-foreground">
                  After 1 year, logs moved to long-term archive storage
                </p>
              </div>
              <Clock className="w-4 h-4 text-warning" />
            </div>
          </div>

          <div className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                <span className="text-xs font-bold text-muted-foreground">3</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Retention Expiry</p>
                <p className="text-xs text-muted-foreground">
                  After {policy.retentionPeriod} {policy.retentionUnit}, logs {policy.autoDelete ? 'automatically deleted' : 'marked for review'}
                </p>
              </div>
              {policy.autoDelete ? (
                <Trash2 className="w-4 h-4 text-muted-foreground" />
              ) : (
                <Eye className="w-4 h-4 text-muted-foreground" />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Storage Locations */}
      <div>
        <h4 className="text-sm font-semibold mb-3">Storage Locations</h4>
        <div className="bg-card border border-border rounded-lg divide-y divide-border">
          <div className="p-4 flex items-center gap-3">
            <StorageIcon className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Primary Storage</p>
              <p className="text-sm font-medium capitalize">{policy.storageLocation}</p>
            </div>
          </div>
          <div className="p-4 flex items-center gap-3">
            <Archive className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Archive Location</p>
              <p className="text-sm font-medium">Long-term Archive</p>
            </div>
          </div>
          <div className="p-4 flex items-center gap-3">
            <Shield className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Backup Location</p>
              <p className="text-sm font-medium">Offsite Backup</p>
            </div>
          </div>
        </div>
      </div>

      {/* Projected Growth */}
      <div>
        <h4 className="text-sm font-semibold mb-3">Storage Projections</h4>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Current Growth Rate</span>
              <span className="text-sm font-medium">2.5 GB/month</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Projected Full</span>
              <span className="text-sm font-medium">
                {Math.round((policy.storageLimit - policy.storageUsed) / 2.5)} months
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Recommended Action</span>
              <span className="text-sm font-medium">
                {storagePercentage > 80 ? 'Increase Limit' : 'Monitor'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PolicySettings({ policy }: { policy: LogRetentionPolicy }) {
  return (
    <div className="space-y-6">
      {/* Retention Settings */}
      <div>
        <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Settings className="w-4 h-4 text-primary" />
          Retention Settings
        </h4>
        <div className="bg-card border border-border rounded-lg divide-y divide-border">
          <div className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Retention Period</span>
              <span className="text-sm font-medium">
                {policy.retentionPeriod} {policy.retentionUnit}
              </span>
            </div>
          </div>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Auto Delete</span>
              <span className="text-sm font-medium">
                {policy.autoDelete ? 'Enabled' : 'Disabled'}
              </span>
            </div>
          </div>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Export Before Delete</span>
              <span className="text-sm font-medium">
                {policy.exportBeforeDelete ? 'Yes' : 'No'}
              </span>
            </div>
          </div>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Approval Required</span>
              <span className="text-sm font-medium">
                {policy.approvalRequired ? 'Yes' : 'No'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Storage Settings */}
      <div>
        <h4 className="text-sm font-semibold mb-3">Storage Settings</h4>
        <div className="bg-card border border-border rounded-lg divide-y divide-border">
          <div className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Storage Location</span>
              <span className="text-sm font-medium capitalize">{policy.storageLocation}</span>
            </div>
          </div>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Compression</span>
              <span className="text-sm font-medium">
                {policy.compressionEnabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>
          </div>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Encryption</span>
              <span className="text-sm font-medium">
                {policy.encryptionEnabled ? 'AES-256' : 'Disabled'}
              </span>
            </div>
          </div>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Storage Limit</span>
              <span className="text-sm font-medium">{policy.storageLimit} GB</span>
            </div>
          </div>
        </div>
      </div>

      {/* Review Settings */}
      <div>
        <h4 className="text-sm font-semibold mb-3">Review Settings</h4>
        <div className="bg-card border border-border rounded-lg divide-y divide-border">
          <div className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Review Frequency</span>
              <span className="text-sm font-medium">Annual</span>
            </div>
          </div>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Last Review</span>
              <span className="text-sm font-medium">
                {new Date(policy.lastReview).toLocaleDateString()}
              </span>
            </div>
          </div>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Next Review</span>
              <span className="text-sm font-medium">
                {new Date(policy.nextReview).toLocaleDateString()}
              </span>
            </div>
          </div>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Review Status</span>
              <span className="text-sm font-medium text-success">Up to Date</span>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button className="flex items-center gap-2 px-3 py-2 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90">
          <Settings className="w-3 h-3" />
          Edit Policy
        </button>
        <button className="flex items-center gap-2 px-3 py-2 text-xs border border-border rounded hover:bg-secondary">
          <Download className="w-3 h-3" />
          Export Settings
        </button>
        <button className="flex items-center gap-2 px-3 py-2 text-xs border border-border rounded hover:bg-secondary">
          <Calendar className="w-3 h-3" />
          Schedule Review
        </button>
      </div>
    </div>
  );
}

// Helper functions
function getStorageIcon(location: string) {
  switch (location) {
    case "local":
      return HardDrive;
    case "cloud":
      return Database;
    case "archive":
      return Archive;
    default:
      return Database;
  }
}