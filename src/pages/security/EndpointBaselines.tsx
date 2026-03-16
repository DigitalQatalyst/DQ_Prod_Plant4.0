import { useState, useMemo, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { ListPane } from "@/components/layout/ListPane";
import { ListPaneItem } from "@/components/layout/ListPaneItem";
import { WorkPane } from "@/components/layout/WorkPane";
import { KPICard } from "@/components/shared/KPICard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { LoadingState } from "@/components/shared/LoadingState";
import { EmptyState } from "@/components/shared/EmptyState";
import {
  Shield,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Activity,
  Settings,
  FileCheck,
  TrendingUp,
  Clock,
  Target,
  AlertCircle,
} from "lucide-react";
import {
  getUpstreamSitesByTenant,
  getSecurityZonesByTenant,
} from "@/data/upstreamSecurityMockData";
import type {
  EndpointBaseline,
  EndpointCompliance,
  BaselineDeviation,
  BaselineStatus,
  DeviationSeverity,
  BaselineCategory,
  TransmissionAssetType,
} from "@/types/security";

// Mock baseline data generator
function generateMockBaselines(tenantId: string, sites: any[]): EndpointBaseline[] {
  const assetTypes: TransmissionAssetType[] = [
    'protection-relay',
    'rtu',
    'bay-controller',
    'scada-node',
    'meter',
  ];

  const categories: BaselineCategory[] = [
    'configuration',
    'software',
    'network',
    'security',
  ];

  const baselines: EndpointBaseline[] = [];

  assetTypes.forEach((assetType, index) => {
    categories.forEach((category, catIndex) => {
      const totalEndpoints = 10 + (index * 5) + (catIndex * 2);
      const compliantEndpoints = Math.floor(totalEndpoints * (0.6 + Math.random() * 0.3));
      const deviatingEndpoints = totalEndpoints - compliantEndpoints;
      const criticalDeviations = Math.floor(deviatingEndpoints * 0.2);
      const highDeviations = Math.floor(deviatingEndpoints * 0.3);
      const mediumDeviations = Math.floor(deviatingEndpoints * 0.3);
      const lowDeviations = deviatingEndpoints - criticalDeviations - highDeviations - mediumDeviations;

      const complianceScore = Math.floor((compliantEndpoints / totalEndpoints) * 100);
      const status: BaselineStatus =
        complianceScore >= 95 ? 'compliant' :
          complianceScore >= 80 ? 'deviation-detected' : 'non-compliant';

      baselines.push({
        id: `baseline-${assetType}-${category}-${index}-${catIndex}`,
        tenantId,
        name: `${assetType.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')} ${category.charAt(0).toUpperCase() + category.slice(1)} Baseline`,
        description: `Security baseline for ${assetType} ${category} configuration`,
        assetType,
        category,
        baselineVersion: `v${1 + catIndex}.${index}`,
        status,
        complianceScore,
        totalEndpoints,
        compliantEndpoints,
        deviatingEndpoints,
        criticalDeviations,
        highDeviations,
        mediumDeviations,
        lowDeviations,
        baselineRules: [],
        applicableZones: [],
        applicableSites: sites.slice(0, 2 + index).map(s => s.id),
        lastAssessment: new Date(Date.now() - (index * 24 + catIndex * 6) * 3600000).toISOString(),
        nextAssessment: new Date(Date.now() + (7 - index) * 24 * 3600000).toISOString(),
        createdBy: 'system',
        approvedBy: 'Security Manager',
        approvedAt: new Date(Date.now() - 30 * 24 * 3600000).toISOString(),
        createdAt: new Date(Date.now() - 60 * 24 * 3600000).toISOString(),
        updatedAt: new Date(Date.now() - (index * 24) * 3600000).toISOString(),
      });
    });
  });

  return baselines;
}

import { getEndpointBaselines } from "@/lib/identityQueries";
import { IdentityOverview } from "@/components/security/IdentityOverview";
import {
  PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer,
  BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend,
  Cell as RechartsCell
} from "recharts";

export function EndpointBaselines() {
  const { currentTenant } = useApp();
  const [selectedBaseline, setSelectedBaseline] = useState<EndpointBaseline | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [assetTypeFilter, setAssetTypeFilter] = useState<string>("all");
  const [baselines, setBaselines] = useState<EndpointBaseline[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<string>("status");

  // Load endpoint baselines
  useEffect(() => {
    async function loadBaselines() {
      try {
        setLoading(true);
        setError(null);

        const data = await getEndpointBaselines(currentTenant.id);
        setBaselines(data);
      } catch (err) {
        console.error('Failed to load endpoint baselines:', err);
        setError(err instanceof Error ? err.message : 'Failed to load baselines');
      } finally {
        setLoading(false);
      }
    }

    loadBaselines();
  }, [currentTenant.id]);

  // Filter and sort baselines
  const filteredAndSortedBaselines = useMemo(() => {
    let result = baselines.filter(baseline => {
      const matchesSearch =
        (baseline.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (baseline.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (baseline.assetType || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (baseline.category || '').toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === "all" || baseline.status === statusFilter;
      const matchesCategory = categoryFilter === "all" || baseline.category === categoryFilter;
      const matchesAssetType = assetTypeFilter === "all" || baseline.assetType === assetTypeFilter;

      return matchesSearch && matchesStatus && matchesCategory && matchesAssetType;
    });

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'status': {
          const statusOrder: Record<string, number> = { 'non-compliant': 0, 'deviation-detected': 1, 'compliant': 2, 'not-assessed': 3 };
          const statusDiff = (statusOrder[a.status] ?? 4) - (statusOrder[b.status] ?? 4);
          if (statusDiff !== 0) return statusDiff;
          return a.complianceScore - b.complianceScore;
        }
        case 'name':
          return (a.name || '').localeCompare(b.name || '');
        case 'score':
          return b.complianceScore - a.complianceScore;
        case 'deviations':
          return b.deviatingEndpoints - a.deviatingEndpoints;
        case 'impact':
          return (b.criticalDeviations || 0) * 10 + (b.highDeviations || 0) - ((a.criticalDeviations || 0) * 10 + (a.highDeviations || 0));
        default:
          return 0;
      }
    });

    return result;
  }, [baselines, searchTerm, statusFilter, categoryFilter, assetTypeFilter, sortBy]);

  // Set initial selection
  /*
  useEffect(() => {
    if (!selectedBaseline && filteredBaselines.length > 0) {
      setSelectedBaseline(filteredBaselines[0]);
    }
  }, [filteredBaselines, selectedBaseline]);
  */

  // Get sites and zones (leaving these as mock for now as they are used for context)
  const sites = useMemo(() => getUpstreamSitesByTenant(currentTenant.id), [currentTenant.id]);
  const zones = useMemo(() => getSecurityZonesByTenant(currentTenant.id), [currentTenant.id]);

  const statusOptions = [
    { value: "all", label: "All Status" },
    { value: "compliant", label: "Compliant" },
    { value: "deviation-detected", label: "Deviation Detected" },
    { value: "non-compliant", label: "Non-Compliant" },
    { value: "not-assessed", label: "Not Assessed" },
  ];

  const categoryOptions = [
    { value: "all", label: "All Categories" },
    { value: "configuration", label: "Configuration" },
    { value: "software", label: "Software" },
    { value: "network", label: "Network" },
    { value: "security", label: "Security" },
    { value: "performance", label: "Performance" },
  ];

  const assetTypeOptions = [
    { value: "all", label: "All Asset Types" },
    { value: "protection-relay", label: "Protection Relay" },
    { value: "rtu", label: "RTU" },
    { value: "bay-controller", label: "Bay Controller" },
    { value: "scada-node", label: "SCADA Node" },
    { value: "meter", label: "Meter" },
  ];

  const filters = [
    {
      key: "status",
      label: "Status",
      value: statusFilter,
      onChange: setStatusFilter,
      options: statusOptions,
    },
    {
      key: "category",
      label: "Category",
      value: categoryFilter,
      onChange: setCategoryFilter,
      options: categoryOptions,
    },
    {
      key: "assetType",
      label: "Asset Type",
      value: assetTypeFilter,
      onChange: setAssetTypeFilter,
      options: assetTypeOptions,
    },
  ];

  const overviewData = {
    title: "Endpoint Baselines Overview",
    description: "Manage security configuration baselines, deviations, and compliance across all endpoints.",
    metrics: [
      {
        title: "Total Baselines",
        value: baselines.length,
        icon: FileCheck,
        variant: "primary" as const
      },
      {
        title: "Non-Compliant",
        value: baselines.filter(b => b.status === 'non-compliant').length,
        icon: XCircle,
        variant: "destructive" as const
      },
      {
        title: "Deviations",
        value: baselines.reduce((sum, b) => sum + b.deviatingEndpoints, 0),
        icon: AlertTriangle,
        variant: "warning" as const
      },
      {
        title: "Avg Compliance",
        value: baselines.length > 0 ? Math.floor(baselines.reduce((sum, b) => sum + b.complianceScore, 0) / baselines.length) + "%" : "0%",
        icon: Target,
        variant: "success" as const
      }
    ]
  };

  const tabs = selectedBaseline ? [
    {
      id: "overview",
      label: "Baseline Overview",
      content: <BaselineOverview baseline={selectedBaseline} sites={sites} />,
    },
    {
      id: "compliance",
      label: "Compliance Status",
      content: <ComplianceStatus baseline={selectedBaseline} />,
    },
    {
      id: "deviations",
      label: "Deviations",
      content: <DeviationsList baseline={selectedBaseline} />,
    },
    {
      id: "rules",
      label: "Baseline Rules",
      content: <BaselineRules baseline={selectedBaseline} />,
    },
  ] : [
    {
      id: "overview",
      label: "Overview",
      content: <EndpointBaselinesOverview baselines={baselines} />,
    }
  ];

  // Calculate summary stats
  const totalBaselines = baselines.length;
  const nonCompliantBaselines = baselines.filter(b => b.status === 'non-compliant').length;
  const deviationBaselines = baselines.filter(b => b.status === 'deviation-detected').length;
  const avgComplianceScore = Math.floor(baselines.reduce((sum, b) => sum + b.complianceScore, 0) / baselines.length);

  if (loading) {
    return <LoadingState loadingText="Scanning endpoint configurations..." />;
  }

  return (
    <div className="flex w-full h-full overflow-hidden">
      <ListPane
        title="Configuration Baselines"
        context="DEWA – Transmission"
        count={filteredAndSortedBaselines.length}
        searchPlaceholder="Search"
        onSearch={setSearchTerm}
        filters={filters}
        sortOptions={[
          { label: 'Status (Non-Compliant First)', value: 'status' },
          { label: 'Baseline Name', value: 'name' },
          { label: 'Compliance Score', value: 'score' },
          { label: 'Total Deviations', value: 'deviations' },
          { label: 'Security Impact', value: 'impact' },
        ]}
        sortValue={sortBy}
        onSortChange={setSortBy}
      >
        <div className="space-y-1">
          {filteredAndSortedBaselines.length === 0 ? (
            <EmptyState
              icon={Shield}
              title="No Baselines Found"
              description="No endpoint baselines match your current filters"
            />
          ) : (
            filteredAndSortedBaselines.map((baseline) => (
              <ListPaneItem
                key={baseline.id}
                title={baseline.name}
                description={`${baseline.assetType.toUpperCase()} • ${baseline.category.toUpperCase()}`}
                status={baseline.status === 'compliant' ? 'online' : (baseline.status === 'not-assessed' ? 'maintenance' : 'offline')}
                category={baseline.baselineVersion}
                value={`${baseline.complianceScore}%`}
                isSelected={selectedBaseline?.id === baseline.id}
                onClick={() => setSelectedBaseline(baseline)}
              />
            ))
          )}
        </div>
      </ListPane>

      <WorkPane
        title={selectedBaseline ? selectedBaseline.name : "Endpoint Baselines Overview"}
        subtitle={
          selectedBaseline
            ? `${selectedBaseline.category.charAt(0).toUpperCase() + selectedBaseline.category.slice(1)} Baseline • ${selectedBaseline.baselineVersion}`
            : "Manage security configuration baselines and compliance"
        }
        tabs={tabs}
      />
    </div>
  );
}

function BaselineOverview({ baseline, sites }: { baseline: EndpointBaseline; sites: any[] }) {
  const applicableSiteNames = sites
    .filter(s => baseline.applicableSites.includes(s.id))
    .map(s => s.name);

  return (
    <div className="space-y-6">
      {/* Baseline KPIs */}
      <div className="grid grid-cols-4 gap-4">
        <KPICard
          title="Compliance Score"
          value={`${baseline.complianceScore}%`}
          subtitle={baseline.status}
          icon={Target}
          variant={
            baseline.complianceScore >= 95 ? "success" :
              baseline.complianceScore >= 80 ? "warning" : "destructive"
          }
        />
        <KPICard
          title="Total Endpoints"
          value={baseline.totalEndpoints}
          subtitle={`${baseline.compliantEndpoints} compliant`}
          icon={Activity}
          variant="primary"
        />
        <KPICard
          title="Deviations"
          value={baseline.deviatingEndpoints}
          subtitle={`${baseline.criticalDeviations} critical`}
          icon={baseline.deviatingEndpoints > 0 ? AlertTriangle : CheckCircle2}
          variant={baseline.deviatingEndpoints > 0 ? "destructive" : "success"}
        />
        <KPICard
          title="Last Assessment"
          value={new Date(baseline.lastAssessment || '').toLocaleDateString()}
          subtitle={`Next: ${new Date(baseline.nextAssessment || '').toLocaleDateString()}`}
          icon={Clock}
        />
      </div>

      {/* Baseline Information */}
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-3">Baseline Details</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Asset Type:</span>
              <span className="font-medium">
                {baseline.assetType.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Category:</span>
              <span>{baseline.category.charAt(0).toUpperCase() + baseline.category.slice(1)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Version:</span>
              <span className="font-mono text-xs">{baseline.baselineVersion}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Created By:</span>
              <span>{baseline.createdBy}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Approved By:</span>
              <span>{baseline.approvedBy}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Approved:</span>
              <span>{new Date(baseline.approvedAt || '').toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-3">Compliance Breakdown</h3>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">Compliant</span>
                <span className="font-medium text-success">{baseline.compliantEndpoints}</span>
              </div>
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-success rounded-full"
                  style={{ width: `${(baseline.compliantEndpoints / baseline.totalEndpoints) * 100}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">Deviating</span>
                <span className="font-medium text-destructive">{baseline.deviatingEndpoints}</span>
              </div>
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-destructive rounded-full"
                  style={{ width: `${(baseline.deviatingEndpoints / baseline.totalEndpoints) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Deviation Severity Breakdown */}
      <div>
        <h4 className="text-sm font-semibold mb-3">Deviation Severity</h4>
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-destructive" />
              <p className="text-xs font-medium">Critical</p>
            </div>
            <p className="text-2xl font-bold">{baseline.criticalDeviations}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-warning" />
              <p className="text-xs font-medium">High</p>
            </div>
            <p className="text-2xl font-bold">{baseline.highDeviations}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-4 h-4 text-primary" />
              <p className="text-xs font-medium">Medium</p>
            </div>
            <p className="text-2xl font-bold">{baseline.mediumDeviations}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-4 h-4 text-muted-foreground" />
              <p className="text-xs font-medium">Low</p>
            </div>
            <p className="text-2xl font-bold">{baseline.lowDeviations}</p>
          </div>
        </div>
      </div>

      {/* Applicable Sites */}
      <div>
        <h4 className="text-sm font-semibold mb-3">Applicable Sites ({applicableSiteNames.length})</h4>
        <div className="flex flex-wrap gap-2">
          {applicableSiteNames.map((siteName, index) => (
            <span
              key={index}
              className="text-xs px-3 py-1 rounded-full bg-primary/10 text-primary"
            >
              {siteName}
            </span>
          ))}
        </div>
      </div>

      {/* Description */}
      {baseline.description && (
        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-2">Description</h3>
          <p className="text-sm text-muted-foreground">{baseline.description}</p>
        </div>
      )}
    </div>
  );
}

function ComplianceStatus({ baseline }: { baseline: EndpointBaseline }) {
  // Mock endpoint compliance data
  const endpointCompliance: EndpointCompliance[] = Array.from(
    { length: Math.min(baseline.totalEndpoints, 10) },
    (_, i) => {
      const isCompliant = i < baseline.compliantEndpoints;
      const complianceScore = isCompliant ? 95 + Math.floor(Math.random() * 5) : 50 + Math.floor(Math.random() * 30);
      const totalRules = 15 + Math.floor(Math.random() * 10);
      const passedRules = Math.floor((complianceScore / 100) * totalRules);
      const failedRules = totalRules - passedRules;

      return {
        id: `compliance-${baseline.id}-${i}`,
        tenantId: baseline.tenantId,
        assetId: `asset-${i}`,
        assetName: `${baseline.assetType.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')} ${i + 1}`,
        assetType: baseline.assetType,
        baselineId: baseline.id,
        baselineName: baseline.name,
        siteName: `Substation ${Math.floor(i / 3) + 1}`,
        zoneName: `Zone ${(i % 3) + 1}`,
        status: isCompliant ? 'compliant' : (complianceScore > 70 ? 'deviation-detected' : 'non-compliant'),
        complianceScore,
        totalRules,
        passedRules,
        failedRules,
        deviations: [],
        lastChecked: new Date(Date.now() - (i * 3600000)).toISOString(),
        nextCheck: new Date(Date.now() + ((24 - i) * 3600000)).toISOString(),
        autoRemediation: i % 2 === 0,
        remediationStatus: failedRules > 0 ? (i % 3 === 0 ? 'in-progress' : 'pending') : undefined,
        metadata: {},
        createdAt: new Date(Date.now() - 30 * 24 * 3600000).toISOString(),
        updatedAt: new Date(Date.now() - (i * 3600000)).toISOString(),
      };
    }
  );

  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-sm font-semibold mb-3">
          Endpoint Compliance Status ({endpointCompliance.length} of {baseline.totalEndpoints})
        </h4>
        <div className="space-y-3">
          {endpointCompliance.map((endpoint) => (
            <div
              key={endpoint.id}
              className="bg-card border border-border rounded-lg p-4 hover:border-primary/30 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${endpoint.status === 'compliant' ? 'bg-success/10' :
                    endpoint.status === 'deviation-detected' ? 'bg-warning/10' : 'bg-destructive/10'
                    }`}>
                    {endpoint.status === 'compliant' ? (
                      <CheckCircle2 className="w-5 h-5 text-success" />
                    ) : endpoint.status === 'deviation-detected' ? (
                      <AlertTriangle className="w-5 h-5 text-warning" />
                    ) : (
                      <XCircle className="w-5 h-5 text-destructive" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{endpoint.assetName}</p>
                    <p className="text-xs text-muted-foreground">
                      {endpoint.siteName} • {endpoint.zoneName}
                    </p>
                  </div>
                </div>
                <StatusBadge
                  status={endpoint.status}
                />
              </div>

              <div className="grid grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Compliance Score</p>
                  <p className="text-lg font-bold">{endpoint.complianceScore}%</p>
                  <div className="mt-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${endpoint.complianceScore >= 95 ? 'bg-success' :
                        endpoint.complianceScore >= 80 ? 'bg-warning' : 'bg-destructive'
                        }`}
                      style={{ width: `${endpoint.complianceScore}%` }}
                    />
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Rules Passed</p>
                  <p className="text-lg font-bold text-success">{endpoint.passedRules}/{endpoint.totalRules}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Rules Failed</p>
                  <p className="text-lg font-bold text-destructive">{endpoint.failedRules}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Last Checked</p>
                  <p className="text-xs">{new Date(endpoint.lastChecked).toLocaleString()}</p>
                </div>
              </div>

              {endpoint.remediationStatus && (
                <div className="mt-3 pt-3 border-t border-border">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <Settings className="w-3 h-3 text-primary" />
                      <span className="text-muted-foreground">Remediation:</span>
                      <StatusBadge
                        status={endpoint.remediationStatus}
                      />
                    </div>
                    {endpoint.autoRemediation && (
                      <span className="text-xs text-primary">Auto-remediation enabled</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function DeviationsList({ baseline }: { baseline: EndpointBaseline }) {
  // Mock deviation data
  const deviations: BaselineDeviation[] = [];

  const severities: DeviationSeverity[] = ['critical', 'high', 'medium', 'low'];
  const categories: BaselineCategory[] = ['configuration', 'software', 'network', 'security'];
  const statuses: Array<'open' | 'acknowledged' | 'remediated' | 'accepted'> = ['open', 'acknowledged', 'remediated', 'accepted'];

  // Generate critical deviations
  for (let i = 0; i < baseline.criticalDeviations; i++) {
    deviations.push({
      id: `dev-crit-${i}`,
      ruleId: `rule-${i}`,
      ruleName: `Critical Security Configuration ${i + 1}`,
      category: categories[i % categories.length],
      severity: 'critical',
      expectedValue: 'Enabled',
      actualValue: 'Disabled',
      deviationDescription: `Critical security feature is disabled on endpoint`,
      detectedAt: new Date(Date.now() - (i * 3600000)).toISOString(),
      status: statuses[i % statuses.length],
      remediationAction: 'Enable security feature and verify configuration',
      remediationDeadline: new Date(Date.now() + (24 - i) * 3600000).toISOString(),
      assignedTo: i % 2 === 0 ? 'Security Team' : undefined,
      acknowledgedBy: i > 0 ? 'Security Manager' : undefined,
      acknowledgedAt: i > 0 ? new Date(Date.now() - (i * 1800000)).toISOString() : undefined,
      complianceImpact: ['IEC 62443', 'NERC CIP'],
    });
  }

  // Generate high deviations
  for (let i = 0; i < Math.min(baseline.highDeviations, 5); i++) {
    deviations.push({
      id: `dev-high-${i}`,
      ruleId: `rule-h-${i}`,
      ruleName: `High Priority Configuration ${i + 1}`,
      category: categories[i % categories.length],
      severity: 'high',
      expectedValue: 'v2.3.1',
      actualValue: 'v2.1.0',
      deviationDescription: `Firmware version is outdated`,
      detectedAt: new Date(Date.now() - ((i + 5) * 3600000)).toISOString(),
      status: statuses[i % statuses.length],
      remediationAction: 'Update firmware to latest version',
      assignedTo: i % 2 === 0 ? 'Operations Team' : undefined,
      complianceImpact: ['IEC 62443'],
    });
  }

  // Generate medium deviations
  for (let i = 0; i < Math.min(baseline.mediumDeviations, 3); i++) {
    deviations.push({
      id: `dev-med-${i}`,
      ruleId: `rule-m-${i}`,
      ruleName: `Medium Priority Setting ${i + 1}`,
      category: categories[i % categories.length],
      severity: 'medium',
      expectedValue: '300',
      actualValue: '600',
      deviationDescription: `Timeout value exceeds recommended setting`,
      detectedAt: new Date(Date.now() - ((i + 10) * 3600000)).toISOString(),
      status: statuses[i % statuses.length],
      remediationAction: 'Adjust timeout to recommended value',
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-sm font-semibold mb-3">
          Active Deviations ({deviations.filter(d => d.status === 'open' || d.status === 'acknowledged').length})
        </h4>
        {deviations.length === 0 ? (
          <div className="bg-card border border-border rounded-lg p-8 text-center">
            <CheckCircle2 className="w-12 h-12 text-success mx-auto mb-3" />
            <p className="text-sm font-medium">No Deviations Detected</p>
            <p className="text-xs text-muted-foreground mt-1">
              All endpoints are compliant with baseline requirements
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {deviations.map((deviation) => (
              <div
                key={deviation.id}
                className="bg-card border border-border rounded-lg p-4 hover:border-primary/30 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <AlertTriangle
                      className={`w-4 h-4 ${deviation.severity === 'critical' ? 'text-destructive' :
                        deviation.severity === 'high' ? 'text-warning' :
                          deviation.severity === 'medium' ? 'text-primary' : 'text-muted-foreground'
                        }`}
                    />
                    <h5 className="text-sm font-medium">{deviation.ruleName}</h5>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full ${deviation.severity === 'critical' ? 'bg-destructive/10 text-destructive' :
                        deviation.severity === 'high' ? 'bg-warning/10 text-warning' :
                          deviation.severity === 'medium' ? 'bg-primary/10 text-primary' :
                            'bg-secondary text-muted-foreground'
                        }`}
                    >
                      {deviation.severity}
                    </span>
                    <StatusBadge
                      status={deviation.status}
                    />
                  </div>
                </div>

                <p className="text-xs text-muted-foreground mb-3">{deviation.deviationDescription}</p>

                <div className="grid grid-cols-2 gap-4 text-xs mb-3">
                  <div>
                    <span className="text-muted-foreground">Expected:</span>
                    <span className="ml-2 font-mono">{deviation.expectedValue}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Actual:</span>
                    <span className="ml-2 font-mono text-destructive">{deviation.actualValue}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Category:</span>
                    <span className="ml-2">{deviation.category.charAt(0).toUpperCase() + deviation.category.slice(1)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Detected:</span>
                    <span className="ml-2">{new Date(deviation.detectedAt).toLocaleString()}</span>
                  </div>
                </div>

                {deviation.remediationAction && (
                  <div className="bg-secondary/50 rounded p-3 text-xs">
                    <p className="font-medium mb-1">Remediation Action:</p>
                    <p className="text-muted-foreground">{deviation.remediationAction}</p>
                    {deviation.remediationDeadline && (
                      <p className="text-muted-foreground mt-2">
                        Deadline: {new Date(deviation.remediationDeadline).toLocaleString()}
                      </p>
                    )}
                  </div>
                )}

                {deviation.assignedTo && (
                  <div className="mt-3 pt-3 border-t border-border flex items-center justify-between text-xs">
                    <div>
                      <span className="text-muted-foreground">Assigned to:</span>
                      <span className="ml-2 font-medium">{deviation.assignedTo}</span>
                    </div>
                    {deviation.acknowledgedBy && (
                      <div>
                        <span className="text-muted-foreground">Acknowledged by:</span>
                        <span className="ml-2 font-medium">{deviation.acknowledgedBy}</span>
                      </div>
                    )}
                  </div>
                )}

                {deviation.complianceImpact && deviation.complianceImpact.length > 0 && (
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Compliance Impact:</span>
                    <div className="flex gap-1">
                      {deviation.complianceImpact.map((standard, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] px-2 py-0.5 rounded-full bg-warning/10 text-warning"
                        >
                          {standard}
                        </span>
                      ))}
                    </div>
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

function BaselineRules({ baseline }: { baseline: EndpointBaseline }) {
  // Mock baseline rules
  const rules = [
    {
      id: 'rule-1',
      ruleId: 'SEC-001',
      name: 'Firewall Enabled',
      description: 'Firewall must be enabled on all endpoints',
      category: 'security' as BaselineCategory,
      severity: 'critical' as DeviationSeverity,
      expectedValue: 'Enabled',
      checkType: 'exact' as const,
      enabled: true,
      mandatory: true,
      complianceStandards: ['IEC 62443', 'NERC CIP'],
    },
    {
      id: 'rule-2',
      ruleId: 'CONF-001',
      name: 'Firmware Version',
      description: 'Firmware must be at minimum version 2.3.0',
      category: 'software' as BaselineCategory,
      severity: 'high' as DeviationSeverity,
      expectedValue: '>=2.3.0',
      checkType: 'version' as const,
      enabled: true,
      mandatory: true,
      complianceStandards: ['IEC 62443'],
    },
    {
      id: 'rule-3',
      ruleId: 'NET-001',
      name: 'TLS Version',
      description: 'TLS 1.2 or higher must be enabled',
      category: 'network' as BaselineCategory,
      severity: 'high' as DeviationSeverity,
      expectedValue: '>=1.2',
      checkType: 'version' as const,
      enabled: true,
      mandatory: true,
      complianceStandards: ['IEC 62443', 'NERC CIP'],
    },
    {
      id: 'rule-4',
      ruleId: 'CONF-002',
      name: 'Session Timeout',
      description: 'Session timeout should be 300 seconds or less',
      category: 'configuration' as BaselineCategory,
      severity: 'medium' as DeviationSeverity,
      expectedValue: '<=300',
      checkType: 'range' as const,
      enabled: true,
      mandatory: false,
      complianceStandards: ['IEC 62443'],
    },
    {
      id: 'rule-5',
      ruleId: 'SEC-002',
      name: 'Audit Logging',
      description: 'Audit logging must be enabled',
      category: 'security' as BaselineCategory,
      severity: 'high' as DeviationSeverity,
      expectedValue: 'Enabled',
      checkType: 'exact' as const,
      enabled: true,
      mandatory: true,
      complianceStandards: ['IEC 62443', 'NERC CIP'],
    },
    {
      id: 'rule-6',
      ruleId: 'NET-002',
      name: 'Unused Ports Disabled',
      description: 'All unused network ports must be disabled',
      category: 'network' as BaselineCategory,
      severity: 'medium' as DeviationSeverity,
      expectedValue: 'Disabled',
      checkType: 'exact' as const,
      enabled: true,
      mandatory: false,
      complianceStandards: ['IEC 62443'],
    },
  ];

  const enabledRules = rules.filter(r => r.enabled);
  const mandatoryRules = rules.filter(r => r.mandatory);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-xs text-muted-foreground mb-1">Total Rules</p>
          <p className="text-2xl font-bold">{rules.length}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-xs text-muted-foreground mb-1">Enabled Rules</p>
          <p className="text-2xl font-bold text-success">{enabledRules.length}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-xs text-muted-foreground mb-1">Mandatory Rules</p>
          <p className="text-2xl font-bold text-warning">{mandatoryRules.length}</p>
        </div>
      </div>

      <div>
        <h4 className="text-sm font-semibold mb-3">Baseline Rules</h4>
        <div className="space-y-3">
          {rules.map((rule) => (
            <div
              key={rule.id}
              className="bg-card border border-border rounded-lg p-4 hover:border-primary/30 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${rule.severity === 'critical' ? 'bg-destructive/10' :
                    rule.severity === 'high' ? 'bg-warning/10' :
                      rule.severity === 'medium' ? 'bg-primary/10' : 'bg-secondary'
                    }`}>
                    <Shield className={`w-4 h-4 ${rule.severity === 'critical' ? 'text-destructive' :
                      rule.severity === 'high' ? 'text-warning' :
                        rule.severity === 'medium' ? 'text-primary' : 'text-muted-foreground'
                      }`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h5 className="text-sm font-medium">{rule.name}</h5>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground font-mono">
                        {rule.ruleId}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{rule.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {rule.mandatory && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-warning/10 text-warning">
                      Mandatory
                    </span>
                  )}
                  <StatusBadge
                    status={rule.enabled ? 'enabled' : 'disabled'}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 text-xs mt-3">
                <div>
                  <span className="text-muted-foreground">Category:</span>
                  <span className="ml-2">{rule.category.charAt(0).toUpperCase() + rule.category.slice(1)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Severity:</span>
                  <span className={`ml-2 ${rule.severity === 'critical' ? 'text-destructive' :
                    rule.severity === 'high' ? 'text-warning' :
                      rule.severity === 'medium' ? 'text-primary' : 'text-muted-foreground'
                    }`}>
                    {rule.severity.charAt(0).toUpperCase() + rule.severity.slice(1)}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Check Type:</span>
                  <span className="ml-2">{rule.checkType}</span>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-border">
                <div className="flex items-center justify-between text-xs">
                  <div>
                    <span className="text-muted-foreground">Expected Value:</span>
                    <span className="ml-2 font-mono">{rule.expectedValue}</span>
                  </div>
                  {rule.complianceStandards && rule.complianceStandards.length > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Standards:</span>
                      <div className="flex gap-1">
                        {rule.complianceStandards.map((standard, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary"
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
          ))}
        </div>
      </div>
    </div>
  );
}

function EndpointBaselinesOverview({ baselines }: { baselines: EndpointBaseline[] }) {
  // Calculate metrics
  const totalBaselines = baselines.length;
  const nonCompliantBaselines = baselines.filter(b => b.status === 'non-compliant').length;
  const deviationBaselines = baselines.filter(b => b.status === 'deviation-detected').length;
  const compliantBaselines = baselines.filter(b => b.status === 'compliant').length;

  // Baselines by category
  const baselinesByCategory = baselines.reduce((acc, baseline) => {
    const category = baseline.category || 'unknown';
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Baselines by status
  const baselinesByStatus = baselines.reduce((acc, baseline) => {
    const status = baseline.status || 'unknown';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Recent baseline violations (non-compliant and deviation-detected)
  const recentViolations = [...baselines]
    .filter(b => b.status === 'non-compliant' || b.status === 'deviation-detected')
    .sort((a, b) => a.complianceScore - b.complianceScore)
    .slice(0, 5);

  // Prepare chart data
  const categoryData = Object.entries(baselinesByCategory)
    .map(([category, count]) => ({
      name: category.charAt(0).toUpperCase() + category.slice(1),
      value: count
    }))
    .sort((a, b) => b.value - a.value);

  const statusData = [
    { name: 'Compliant', value: baselinesByStatus['compliant'] || 0, color: 'hsl(var(--success))' },
    { name: 'Deviation', value: baselinesByStatus['deviation-detected'] || 0, color: 'hsl(var(--warning))' },
    { name: 'Non-Compliant', value: baselinesByStatus['non-compliant'] || 0, color: 'hsl(var(--destructive))' },
  ].filter(d => d.value > 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-8">
      {/* Compliance Status Chart */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <Target className="w-4 h-4 text-primary" />
          Compliance Status
        </h4>
        <div className="h-[240px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <RechartsPieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <RechartsTooltip
                contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
              />
              <Legend layout="vertical" align="right" verticalAlign="middle" />
            </RechartsPieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Baselines by Category Chart */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <FileCheck className="w-4 h-4 text-primary" />
          Baselines by Category
        </h4>
        <div className="h-[240px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <RechartsBarChart data={categoryData} layout="vertical" margin={{ left: 80, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} opacity={0.3} />
              <XAxis type="number" hide domain={[0, 'auto']} />
              <YAxis
                dataKey="name"
                type="category"
                width={100}
                tick={{ fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <RechartsTooltip
                cursor={{ fill: 'hsl(var(--muted)/0.1)' }}
                contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
              />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {categoryData.map((_entry, index) => (
                  <RechartsCell key={`cell-${index}`} fill={`hsl(var(--primary) / ${1 - index * 0.15})`} />
                ))}
              </Bar>
            </RechartsBarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Key Compliance Areas */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <Shield className="w-4 h-4 text-primary" />
          Key Compliance Areas
        </h4>
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center shrink-0">
              <Settings className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">Configuration Hardening</p>
              <p className="text-xs text-muted-foreground">Enforce secure configuration baselines across all endpoints.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">Baseline Enforcement</p>
              <p className="text-xs text-muted-foreground">Continuously monitor and enforce compliance with approved baselines.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">Drift Detection</p>
              <p className="text-xs text-muted-foreground">Detect and remediate configuration drift from approved baselines.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Baseline Violations */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary" />
          Recent Baseline Violations
        </h4>
        <div className="space-y-4">
          {recentViolations.length > 0 ? (
            recentViolations.map((baseline) => (
              <div
                key={baseline.id}
                className="group flex items-center justify-between p-2 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${baseline.status === 'non-compliant' ? 'bg-destructive' : 'bg-warning'
                    }`} />
                  <span className="text-sm font-medium truncate max-w-[150px]">{baseline.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{baseline.deviatingEndpoints} dev</span>
                  <span className="text-xs font-bold">{baseline.complianceScore}%</span>
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs text-muted-foreground italic">All baselines are compliant with no violations.</p>
          )}
          <div className="pt-2 border-t border-border mt-2">
            <p className="text-xs text-muted-foreground italic">Select a baseline from the list to view detailed compliance status and deviations.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
