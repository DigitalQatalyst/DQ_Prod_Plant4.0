import { useState, useMemo, useEffect } from 'react';
import {
  Shield,
  Lock,
  Unlock,
  AlertTriangle,
  Server,
  Activity,
  FileText,
  Globe,
  Settings,
  MoreVertical,
  CheckCircle2,
  XCircle,
  History,
  AlertCircle,
  ArrowRight
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useTenant } from '@/lib/tenantContext';
import {
  getProtocolPolicies,
  getProtocolViolations,
  getProtocolMonitoringStats
} from '../../lib/protocolSecurityQueries';
import { ListPane } from "@/components/layout/ListPane";
import { ListPaneItem } from "@/components/layout/ListPaneItem";
import { WorkPane } from "@/components/layout/WorkPane";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { LoadingState } from "@/components/shared/LoadingState";
import { EmptyState } from "@/components/shared/EmptyState";
import {
  PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer,
  BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend,
  Cell as RechartsCell
} from "recharts";
import type {
  ProtocolPolicy,
  ProtocolViolation,
  ProtocolMonitoring
} from '../../types/security';

export function EncryptionProtocolPolicy() {
  const { tenant } = useTenant();
  const [policies, setPolicies] = useState<ProtocolPolicy[]>([]);
  const [violations, setViolations] = useState<ProtocolViolation[]>([]);
  const [monitoringStats, setMonitoringStats] = useState<Record<string, ProtocolMonitoring>>({});

  const [isLoading, setIsLoading] = useState(true);
  const [selectedPolicyId, setSelectedPolicyId] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [filterProtocol, setFilterProtocol] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState('compliance');

  // Fetch data
  const loadData = async () => {
    if (!tenant) return;

    try {
      setIsLoading(true);

      // Fetch policies
      const fetchedPolicies = await getProtocolPolicies(tenant.id);
      setPolicies(fetchedPolicies);

      setPolicies(fetchedPolicies);

      /*
      if (fetchedPolicies.length > 0 && !selectedPolicyId) {
        setSelectedPolicyId(fetchedPolicies[0].id);
      }
      */

      // Fetch violations
      const fetchedViolations = await getProtocolViolations(tenant.id);
      setViolations(fetchedViolations);

      // Fetch stats for each unique protocol
      const distinctProtocols = Array.from(new Set(fetchedPolicies.map(p => p.protocol)));
      const statsMap: Record<string, ProtocolMonitoring> = {};

      await Promise.all(distinctProtocols.map(async (proto) => {
        const stats = await getProtocolMonitoringStats(tenant.id, proto);
        if (stats) {
          statsMap[proto] = stats;
        }
      }));

      setMonitoringStats(statsMap);
    } catch (error) {
      console.error('Error loading encryption protocol data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenant]);

  // Filter and sort policies
  const filteredAndSortedPolicies = useMemo(() => {
    let result = policies.filter(policy => {
      const query = searchTerm.toLowerCase();
      const matchesSearch =
        policy.name.toLowerCase().includes(query) ||
        (policy.description && policy.description.toLowerCase().includes(query)) ||
        policy.protocol.toLowerCase().includes(query);

      const matchesProtocol = filterProtocol === 'all' || policy.protocol === filterProtocol;
      const matchesStatus = filterStatus === 'all' || policy.status === filterStatus;

      return matchesSearch && matchesProtocol && matchesStatus;
    });

    // Sort
    result.sort((a, b) => {
      if (sortBy === 'compliance') return (b.complianceScore || 0) - (a.complianceScore || 0);
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'protocol') return a.protocol.localeCompare(b.protocol);
      return 0;
    });

    return result;
  }, [policies, searchTerm, filterProtocol, filterStatus, sortBy]);

  const selectedPolicy = policies.find(p => p.id === selectedPolicyId);

  // Filter Options for ListPane
  const protocolOptions = useMemo(() => {
    const protocols = Array.from(new Set(policies.map(p => p.protocol)));
    return [
      { value: 'all', label: 'All Protocols' },
      ...protocols.map(p => ({ value: p, label: p }))
    ];
  }, [policies]);

  const statusOptions = [
    { value: 'all', label: 'All Statuses' },
    { value: 'secure', label: 'Secure' },
    { value: 'at-risk', label: 'At Risk' },
    { value: 'vulnerable', label: 'Vulnerable' },
    { value: 'non-compliant', label: 'Non-Compliant' }
  ];

  const filters = [
    {
      key: 'protocol',
      label: 'Protocol',
      value: filterProtocol,
      onChange: setFilterProtocol,
      options: protocolOptions
    },
    {
      key: 'status',
      label: 'Status',
      value: filterStatus,
      onChange: setFilterStatus,
      options: statusOptions
    }
  ];

  // Helper to get severity color for badge
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'secure': return 'success';
      case 'compliant': return 'success';
      case 'at-risk': return 'warning';
      case 'vulnerable': return 'destructive';
      case 'non-compliant': return 'destructive';
      default: return 'secondary';
    }
  };

  if (isLoading && policies.length === 0) {
    return <LoadingState loadingText="Loading encryption policies..." />;
  }

  // Define tabs for WorkPane
  const tabs = selectedPolicy ? [
    {
      id: 'overview',
      label: 'Overview',
      content: <PolicyOverview policy={selectedPolicy} stats={monitoringStats[selectedPolicy.protocol]} />
    },
    {
      id: 'violations',
      label: 'Violations',
      content: <PolicyViolations violations={violations.filter(v => v.policyId === selectedPolicy.id)} />
    },
    {
      id: 'monitoring',
      label: 'Live Monitoring',
      content: <PolicyMonitoringView stats={monitoringStats[selectedPolicy.protocol]} policy={selectedPolicy} />
    }
  ] : [
    {
      id: "overview",
      label: "Overview",
      content: <EncryptionProtocolOverview policies={policies} violations={violations} />,
    }
  ];

  return (
    <>
      <ListPane
        title="Encryption"
        context="DEWA – Transmission"
        count={filteredAndSortedPolicies.length}
        searchPlaceholder="Search"
        onSearch={setSearchTerm}
        filters={filters}
        sortOptions={[
          { label: "Compliance Score", value: "compliance" },
          { label: "Policy Name", value: "name" },
          { label: "Protocol", value: "protocol" },
        ]}
        sortValue={sortBy}
        onSortChange={setSortBy}
      >
        <div className="space-y-1">
          {filteredAndSortedPolicies.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No policies found"
              description="Try adjusting your filters or search query"
            />
          ) : (
            filteredAndSortedPolicies.map(policy => (
              <ListPaneItem
                key={policy.id}
                title={policy.name}
                description={`${policy.protocol} • ${policy.version}`}
                status={policy.status === 'secure' ? 'online' : (policy.status === 'at-risk' ? 'maintenance' : 'offline')}
                category={policy.protocol}
                value={`${policy.complianceScore || 0}%`}
                isSelected={selectedPolicyId === policy.id}
                onClick={() => setSelectedPolicyId(policy.id)}
              />
            ))
          )}
        </div>
      </ListPane>

      {selectedPolicy ? (
        <WorkPane
          title={selectedPolicy.name}
          subtitle={
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs">{selectedPolicy.protocol}</span>
              <span className="text-muted-foreground">•</span>
              <span className="text-xs">{selectedPolicy.description}</span>
            </div>
          }
          tabs={tabs}
          actions={
            <button className="p-2 hover:bg-secondary rounded-full transition-colors">
              <MoreVertical size={16} className="text-muted-foreground" />
            </button>
          }
        />
      ) : (
        <WorkPane
          title="Encryption Protocols Overview"
          subtitle="Manage encryption standards and compliance"
          tabs={tabs}
        />
      )}
    </>
  );
}

function PolicyOverview({ policy, stats }: { policy: ProtocolPolicy, stats?: ProtocolMonitoring }) {
  return (
    <div className="space-y-6">
      {/* Configuration Section */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Settings size={20} className="text-primary" />
          Configuration
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
          <div className="flex justify-between py-2 border-b border-border/50">
            <span className="text-sm text-muted-foreground">Protocol</span>
            <span className="text-sm font-medium font-mono">{policy.protocol}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-border/50">
            <span className="text-sm text-muted-foreground">Encryption Required</span>
            <span className={`text-sm font-medium ${policy.encryptionRequired ? 'text-success' : 'text-warning'}`}>
              {policy.encryptionRequired ? 'Yes' : 'No'}
            </span>
          </div>
          <div className="flex justify-between py-2 border-b border-border/50">
            <span className="text-sm text-muted-foreground">Algorithm</span>
            <span className="text-sm font-medium">{policy.encryptionAlgorithm || 'N/A'}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-border/50">
            <span className="text-sm text-muted-foreground">Min. TLS Version</span>
            <span className="text-sm font-medium">{policy.minimumTlsVersion || 'Any'}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-border/50">
            <span className="text-sm text-muted-foreground">Certificate Auth</span>
            <span className={`text-sm font-medium ${policy.certificateRequired ? 'text-success' : 'text-muted-foreground'}`}>
              {policy.certificateRequired ? 'Required' : 'Optional'}
            </span>
          </div>

        </div>
      </div>

      {/* Scope Section */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Globe size={20} className="text-primary" />
          Applicable Scope
        </h3>
        <div className="flex flex-wrap gap-2">
          {policy.applicableZones.map((zone, i) => (
            <span key={i} className="px-3 py-1 bg-secondary rounded-full text-xs font-medium border border-border">
              {zone}
            </span>
          ))}
          {policy.applicableAssetTypes.map((type, i) => (
            <span key={`asset-${i}`} className="px-3 py-1 bg-secondary/50 rounded-full text-xs text-muted-foreground border border-border/50">
              {type.replace('_', ' ')}
            </span>
          ))}
        </div>
      </div>

      {/* Compliance Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-xs text-muted-foreground mb-1">Compliance Score</div>
          <div className="text-2xl font-bold flex items-end gap-2">
            <span className={policy.complianceScore >= 90 ? 'text-success' : policy.complianceScore >= 70 ? 'text-warning' : 'text-destructive'}>
              {policy.complianceScore}%
            </span>
            {stats && (
              <span className={`text-xs mb-1 ${stats.trend === 'improving' ? 'text-success' : 'text-destructive'}`}>
                {stats.trend === 'improving' ? '↑' : '↓'}
              </span>
            )}
          </div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-xs text-muted-foreground mb-1">Total Assets</div>
          <div className="text-2xl font-bold">{policy.totalAssets}</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-xs text-muted-foreground mb-1">Active Violations</div>
          <div className="text-2xl font-bold text-destructive">{policy.violationCount}</div>
        </div>
      </div>
    </div>
  );
}

function PolicyViolations({ violations }: { violations: ProtocolViolation[] }) {
  if (violations.length === 0) {
    return (
      <EmptyState
        icon={CheckCircle2}
        title="No Active Violations"
        description="This policy is currently fully compliant across all monitored assets."
      />
    );
  }

  return (
    <div className="space-y-4">
      {violations.map(violation => (
        <div key={violation.id} className="bg-card border border-border rounded-lg p-4 hover:border-primary/50 transition-colors">
          <div className="flex justify-between items-start">
            <div>
              <div className="font-semibold text-sm">{violation.assetName}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{violation.description}</div>
            </div>
            <StatusBadge status={violation.severity} />
          </div>
          <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Activity size={12} />
              <span>Detected: {new Date(violation.detectedAt).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-1">
              <Server size={12} />
              <span>Asset ID: {violation.assetId.substring(0, 8)}...</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function PolicyMonitoringView({ stats, policy }: { stats?: ProtocolMonitoring, policy: ProtocolPolicy }) {
  if (!stats) {
    return (
      <EmptyState
        icon={Activity}
        title="No Monitoring Data"
        description="Live traffic monitoring is not available for this protocol."
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-lg p-6 text-center">
          <div className="text-sm text-muted-foreground mb-2">Secure Connections</div>
          <div className="text-3xl font-bold text-success">{stats.secureConnections}</div>
          <div className="text-xs text-muted-foreground mt-1">
            {Math.round((stats.secureConnections / stats.totalConnections) * 100)}% of total
          </div>
        </div>
        <div className="bg-card border border-border rounded-lg p-6 text-center">
          <div className="text-sm text-muted-foreground mb-2">Insecure Connections</div>
          <div className="text-3xl font-bold text-destructive">{stats.insecureConnections}</div>
          <div className="text-xs text-muted-foreground mt-1">
            Requires remediation
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Traffic Analysis</h3>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Encrypted Traffic</span>
              <span>{stats.encryptedTraffic}%</span>
            </div>
            <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
              <div className="bg-success h-full transition-all duration-500" style={{ width: `${stats.encryptedTraffic}%` }} />
            </div>
          </div>
          {/* Add more metrics if available in stats */}
          <div className="pt-4 border-t border-border/50 grid grid-cols-2 gap-4">
            <div>
              <span className="text-xs text-muted-foreground">Total Analyzed Packets</span>
              <div className="text-lg font-mono">{stats.totalConnections * 124 /* Mock multiplier for packets */}</div>
            </div>
            <div>
              <span className="text-xs text-muted-foreground">Avg. Latency</span>
              <div className="text-lg font-mono">24ms</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function EncryptionProtocolOverview({ policies, violations }: { policies: ProtocolPolicy[], violations: ProtocolViolation[] }) {
  // Calculate metrics
  const totalPolicies = policies.length;
  const totalViolations = violations.length;
  const nonCompliantCount = policies.filter(p => p.complianceStatus === 'non-compliant' || p.status === 'vulnerable').length;
  const secureCount = policies.filter(p => p.status === 'secure' || p.complianceStatus === 'compliant').length;

  // Policies by protocol
  const policiesByProtocol = policies.reduce((acc, policy) => {
    acc[policy.protocol] = (acc[policy.protocol] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Prepare chart data
  const protocolData = Object.entries(policiesByProtocol)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  const statusData = [
    { name: 'Secure', value: secureCount, color: 'hsl(var(--success))' },
    { name: 'Non-Compliant', value: nonCompliantCount, color: 'hsl(var(--destructive))' },
    { name: 'At Risk', value: policies.filter(p => p.status === 'at-risk').length, color: 'hsl(var(--warning))' },
  ].filter(d => d.value > 0);

  // Top violations
  const topViolations = [...violations]
    .sort((a, b) => {
      const severityMap = { 'critical': 4, 'high': 3, 'medium': 2, 'low': 1 };
      return (severityMap[b.severity as keyof typeof severityMap] || 0) - (severityMap[a.severity as keyof typeof severityMap] || 0);
    })
    .slice(0, 5);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-8">
      {/* Policies by Protocol Chart */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <Globe className="w-4 h-4 text-primary" />
          Policies by Protocol
        </h4>
        <div className="h-[240px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <RechartsBarChart data={protocolData} layout="vertical" margin={{ left: 60, right: 20 }}>
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
                {protocolData.map((_entry, index) => (
                  <RechartsCell key={`cell-${index}`} fill={`hsl(var(--primary) / ${1 - index * 0.15})`} />
                ))}
              </Bar>
            </RechartsBarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Policy Status Distribution */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <Shield className="w-4 h-4 text-primary" />
          Policy Status Distribution
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

      {/* Key Security Areas */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <Lock className="w-4 h-4 text-primary" />
          Key Security Areas
        </h4>
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center shrink-0">
              <Shield className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">Protocol Compliance</p>
              <p className="text-xs text-muted-foreground">Ensure all OT communication uses approved secure protocols.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center shrink-0">
              <Lock className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">Encryption Enforcement</p>
              <p className="text-xs text-muted-foreground">Mandate encryption for sensitive data flows across zones.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">Violation Monitoring</p>
              <p className="text-xs text-muted-foreground">Track and remediate protocol security violations.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity & Violations */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <History className="w-4 h-4 text-primary" />
          Recent Activity & Violations
        </h4>
        <div className="space-y-4">
          {topViolations.length > 0 ? (
            topViolations.map((violation) => (
              <div
                key={violation.id}
                className="group flex items-center justify-between p-2 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${violation.severity === 'critical' ? 'bg-destructive/10 text-destructive' :
                    violation.severity === 'high' ? 'bg-orange-500/10 text-orange-500' :
                      'bg-warning/10 text-warning'
                    }`}>
                    <AlertCircle className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-sm font-medium block truncate max-w-[150px]">{violation.assetName}</span>
                    <span className="text-[10px] text-muted-foreground">{new Date(violation.detectedAt).toLocaleDateString()} - {violation.violationType}</span>
                  </div>
                </div>
                <StatusBadge status={violation.severity} />
              </div>
            ))
          ) : (
            <p className="text-xs text-muted-foreground italic">No active violations detected.</p>
          )}
          <div className="pt-2 border-t border-border mt-2 flex justify-between items-center">
            <p className="text-[10px] text-muted-foreground italic">Tracking 24h activity logs...</p>
            <Button variant="ghost" size="sm" className="h-7 text-[10px] gap-1">
              View All Logs <ArrowRight className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EncryptionProtocolPolicy;
