import { useState, useMemo, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { ListPane } from "@/components/layout/ListPane";
import { ListPaneItem } from "@/components/layout/ListPaneItem";
import { WorkPane } from "@/components/layout/WorkPane";
import { LoadingState } from "@/components/shared/LoadingState";
import { EmptyState } from "@/components/shared/EmptyState";
import {
  Shield,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  TrendingUp,
  Settings,
  Package,
  Users,
  Calendar,
  Loader2,
  Filter,
  Search,
  Plus,
  Edit,
  TestTube,
  FileText,
  Target,
  Zap,
  Network,
  Lock,
  Eye,
  AlertCircle,
  Activity,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { IdentityOverview } from "@/components/security/IdentityOverview";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  PieChart, Pie, Cell, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend,
  Cell as RechartsCell
} from "recharts";
import { getSecurityControls, getSecurityControlsByStandard, getSecurityRisks } from "@/lib/complianceQueries";
import type { SecurityControl, ControlImplementation, ControlTestResult, SecurityRisk } from "@/types/security";

export function SecurityControlLibrary() {
  const { currentTenant } = useApp();
  const [securityControls, setSecurityControls] = useState<SecurityControl[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [standardFilter, setStandardFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState("effectiveness");

  const [selectedControlId, setSelectedControlId] = useState<string | null>(null);
  const [linkedRisks, setLinkedRisks] = useState<SecurityRisk[]>([]);

  // Load security controls from Supabase
  useEffect(() => {
    async function loadSecurityControls() {
      try {
        setLoading(true);
        setError(null);
        const controls = await getSecurityControls(currentTenant.id);
        setSecurityControls(controls);
      } catch (err) {
        console.error('Failed to load security controls:', err);
        setError('Failed to load security controls');
        setSecurityControls([]);
      } finally {
        setLoading(false);
      }
    }

    loadSecurityControls();
  }, [currentTenant.id]);

  // Load linked risks when selected control changes
  useEffect(() => {
    async function loadLinkedRisks() {
      if (!selectedControlId) {
        setLinkedRisks([]);
        return;
      }

      try {
        const allRisks = await getSecurityRisks(currentTenant.id);
        const filtered = allRisks.filter(r =>
          r.existingControls?.includes(selectedControlId)
        );
        setLinkedRisks(filtered);
      } catch (err) {
        console.error('Failed to load linked risks:', err);
        setLinkedRisks([]);
      }
    }

    loadLinkedRisks();
  }, [currentTenant.id, selectedControlId]);

  const selectedControl = securityControls.find((c) => c.id === selectedControlId);

  // Filter and sort controls
  const filteredAndSortedControls = useMemo(() => {
    let result = securityControls.filter((control) => {
      const matchesSearch =
        (control.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (control.code || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (control.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);

      const matchesCategory = categoryFilter === "all" || control.category === categoryFilter;
      const matchesStatus = statusFilter === "all" || control.implementationStatus === statusFilter;
      const matchesStandard = standardFilter === "all" ||
        (control.iec62443Mapping && standardFilter === "iec-62443") ||
        (control.nercCipMapping && standardFilter === "nerc-cip") ||
        (control.nistCsfMapping && standardFilter === "nist-csf");

      return matchesSearch && matchesCategory && matchesStatus && matchesStandard;
    });

    // Sort
    result.sort((a, b) => {
      if (sortBy === "effectiveness") return b.effectivenessScore - a.effectivenessScore;
      if (sortBy === "name") return a.title.localeCompare(b.title);
      if (sortBy === "code") return a.code.localeCompare(b.code);
      if (sortBy === "implementation") return (b.implementationPercentage || 0) - (a.implementationPercentage || 0);
      return 0;
    });

    return result;
  }, [securityControls, searchTerm, categoryFilter, statusFilter, standardFilter, sortBy]);

  // Calculate summary statistics
  const stats = useMemo(() => {
    const total = securityControls.length;
    const implemented = securityControls.filter((c) => c.implementationStatus === "implemented").length;
    const partial = securityControls.filter((c) => c.implementationStatus === "partial").length;
    const notImplemented = securityControls.filter((c) => c.implementationStatus === "planned").length;
    const avgEffectiveness = total > 0 ? Math.round(
      securityControls.reduce((sum, c) => sum + c.effectivenessScore, 0) / total
    ) : 0;
    return { total, implemented, partial, notImplemented, avgEffectiveness };
  }, [securityControls]);

  // Get unique categories for filtering
  const categories = useMemo(() => {
    const uniqueCategories = [...new Set(securityControls.map(c => c.category))];
    return uniqueCategories.sort();
  }, [securityControls]);

  const overviewData = {
    title: "Security Control Library Overview",
    description: "Comprehensive library of security controls mapped to IEC 62443, NERC CIP, and NIST CSF standards for power transmission systems.",
    metrics: [
      {
        title: "TOTAL CONTROLS",
        value: stats.total,
        icon: Shield,
        variant: "primary" as const
      },
      {
        title: "IMPLEMENTED",
        value: stats.implemented,
        icon: CheckCircle2,
        variant: "success" as const
      },
      {
        title: "PARTIAL",
        value: stats.partial,
        icon: AlertTriangle,
        variant: stats.partial > 0 ? "warning" as const : "default" as const
      },
      {
        title: "AVG EFFECTIVENESS",
        value: `${stats.avgEffectiveness}%`,
        icon: Activity,
        variant: stats.avgEffectiveness > 80 ? "success" as const : "warning" as const
      }
    ]
  };

  const statusColors: Record<string, string> = {
    implemented: "hsl(var(--success))",
    partial: "hsl(var(--warning))",
    planned: "hsl(var(--primary))",
    "not-applicable": "hsl(var(--muted-foreground))",
    "not-implemented": "hsl(var(--destructive))"
  };

  const statusData = useMemo(() => {
    const counts: Record<string, number> = {};
    securityControls.forEach(c => {
      const status = c.implementationStatus || 'unknown';
      counts[status] = (counts[status] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1).replace('-', ' '),
      value,
      color: statusColors[name] || "hsl(var(--muted))"
    }));
  }, [securityControls]);

  const domainData = useMemo(() => {
    const counts: Record<string, number> = {};
    securityControls.forEach(c => {
      const domain = c.domain || 'Uncategorized';
      counts[domain] = (counts[domain] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [securityControls]);

  const criticalGaps = useMemo(() => {
    return securityControls
      .filter(c =>
        (c.criticality === 'safety-critical' || c.criticality === 'production-critical' || c.upstreamRelevance === 'critical') &&
        c.implementationStatus !== 'implemented'
      )
      .sort((a, b) => b.effectivenessScore - a.effectivenessScore)
      .slice(0, 5);
  }, [securityControls]);

  const tabs = selectedControl
    ? [
      {
        id: "overview",
        label: "Overview",
        content: <ControlOverview control={selectedControl} linkedRisks={linkedRisks} />,
      },
      {
        id: "implementation",
        label: "Implementation",
        content: <ControlImplementation control={selectedControl} />,
      },
      {
        id: "testing",
        label: "Testing",
        content: <ControlTesting control={selectedControl} />,
      },
      {
        id: "evidence",
        label: "Evidence",
        content: <ControlEvidence control={selectedControl} />,
      },
    ]
    : [
      {
        id: "overview",
        label: "Overview",
        content: (
          <IdentityOverview {...overviewData}>
            <ControlLibraryOverview
              statusData={statusData}
              domainData={domainData}
              criticalGaps={criticalGaps}
              onControlSelect={(id) => setSelectedControlId(id)}
            />
          </IdentityOverview>
        ),
      }
    ];

  return (
    <>
      <ListPane
        title="Control Library"
        context="DEWA – Transmission"
        count={filteredAndSortedControls.length}
        searchPlaceholder="Search"
        onSearch={setSearchTerm}
        filters={[
          {
            key: "category",
            label: "Category",
            value: categoryFilter,
            onChange: setCategoryFilter,
            options: [
              { value: "all", label: "All Categories" },
              ...categories.map(c => ({ value: c, label: c })),
            ],
          },
          {
            key: "status",
            label: "Status",
            value: statusFilter,
            onChange: setStatusFilter,
            options: [
              { value: "all", label: "All Status" },
              { value: "implemented", label: "Implemented" },
              { value: "partial", label: "Partial" },
              { value: "not-implemented", label: "Not Implemented" },
              { value: "planned", label: "Planned" },
              { value: "not-applicable", label: "Not Applicable" },
            ],
          },
          {
            key: "standard",
            label: "Standard",
            value: standardFilter,
            onChange: setStandardFilter,
            options: [
              { value: "all", label: "All Standards" },
              { value: "iec-62443", label: "IEC 62443" },
              { value: "nerc-cip", label: "NERC CIP" },
              { value: "nist-csf", label: "NIST CSF" },
            ],
          },
        ]}
        sortOptions={[
          { label: 'Effectiveness', value: 'effectiveness' },
          { label: 'Control Name', value: 'name' },
          { label: 'Control Code', value: 'code' },
          { label: 'Implementation %', value: 'implementation' },
        ]}
        sortValue={sortBy}
        onSortChange={setSortBy}
      >
        <div className="space-y-1">
          {filteredAndSortedControls.length === 0 ? (
            <EmptyState
              icon={Shield}
              title="No Controls Found"
              description="No security controls match your current filters"
            />
          ) : (
            filteredAndSortedControls.map((control) => (
              <ListPaneItem
                key={control.id}
                title={control.title}
                description={`${control.code} • ${control.category}`}
                status={control.implementationStatus === 'implemented' ? 'online' : (control.implementationStatus === 'partial' ? 'maintenance' : 'offline')}
                category={control.domain || 'General'}
                value={`${control.effectivenessScore}%`}
                isSelected={selectedControlId === control.id}
                onClick={() => setSelectedControlId(control.id)}
              />
            ))
          )}
        </div>
      </ListPane>

      <WorkPane
        title={selectedControl ? selectedControl.title : "Security Control Library Overview"}
        subtitle={selectedControl ? `${selectedControl.code} • ${selectedControl.category}` : currentTenant?.name}
        tabs={tabs}
        actions={selectedControl ? (
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Edit className="w-4 h-4 mr-2" />
              Edit Control
            </Button>
            <Button variant="outline" size="sm">
              <TestTube className="w-4 h-4 mr-2" />
              Run Test
            </Button>
          </div>
        ) : undefined}
      />
    </>
  );
}

function ControlOverview({ control, linkedRisks = [] }: { control: SecurityControl; linkedRisks?: SecurityRisk[] }) {
  return (
    <div className="space-y-6">
      {/* Linked Risks Section - Highlighted */}
      {linkedRisks.length > 0 && (
        <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-6">
          <h4 className="text-sm font-semibold mb-4 flex items-center gap-2 text-destructive">
            <AlertCircle className="w-4 h-4" />
            Active Linked Risks ({linkedRisks.length})
          </h4>
          <div className="space-y-3">
            {linkedRisks.map((risk) => (
              <div key={risk.id} className="bg-card border border-border rounded-lg p-4 flex items-start justify-between">
                <div>
                  <p className="text-xs font-mono text-muted-foreground">{risk.riskId}</p>
                  <p className="text-sm font-medium">{risk.riskName}</p>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{risk.riskDescription}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Badge variant={
                    risk.inherentRiskLevel === 'critical' ? 'destructive' :
                      risk.inherentRiskLevel === 'high' ? 'destructive' : 'secondary'
                  } className="text-[10px]">
                    {risk.inherentRiskLevel}
                  </Badge>
                  <span className="text-[10px] text-muted-foreground">Score: {risk.inherentRiskScore}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Implementation Status Card */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" />
          Implementation Status
        </h4>
        <div className="flex items-center gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-4xl font-bold">{control.implementationPercentage}%</span>
              <Badge
                variant={
                  control.implementationStatus === "implemented"
                    ? "default"
                    : control.implementationStatus === "partial"
                      ? "secondary"
                      : "destructive"
                }
              >
                {control.implementationStatus}
              </Badge>
            </div>
            <div className="h-3 bg-secondary rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${control.implementationPercentage >= 80
                  ? "bg-success"
                  : control.implementationPercentage >= 60
                    ? "bg-warning"
                    : "bg-destructive"
                  }`}
                style={{ width: `${control.implementationPercentage}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Control Details */}
      <div>
        <h4 className="text-sm font-semibold mb-3">Control Details</h4>
        <div className="bg-card border border-border rounded-lg p-4 space-y-4">
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">Description</p>
            <p className="text-sm">{control.description || 'No description available'}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Control Type</p>
              <Badge variant="outline">{control.controlType}</Badge>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Domain</p>
              <Badge variant="outline">{control.domain || 'General'}</Badge>
            </div>
          </div>

          {control.criticality && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Criticality</p>
              <Badge
                variant={
                  control.criticality === 'safety-critical' ? 'destructive' :
                    control.criticality === 'production-critical' ? 'default' : 'secondary'
                }
              >
                {control.criticality}
              </Badge>
            </div>
          )}
        </div>
      </div>

      {/* Standard Mappings */}
      <div>
        <h4 className="text-sm font-semibold mb-3">Standard Mappings</h4>
        <div className="grid grid-cols-1 gap-3">
          {control.iec62443Mapping && (
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">IEC 62443</p>
                  <p className="text-xs text-muted-foreground">{control.iec62443Mapping}</p>
                </div>
              </div>
            </div>
          )}

          {control.nercCipMapping && (
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-warning" />
                </div>
                <div>
                  <p className="text-sm font-medium">NERC CIP</p>
                  <p className="text-xs text-muted-foreground">{control.nercCipMapping}</p>
                </div>
              </div>
            </div>
          )}

          {control.nistCsfMapping && (
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                  <Lock className="w-5 h-5 text-success" />
                </div>
                <div>
                  <p className="text-sm font-medium">NIST CSF</p>
                  <p className="text-xs text-muted-foreground">{control.nistCsfMapping}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div >

      {/* Effectiveness Tracking */}
      < div >
        <h4 className="text-sm font-semibold mb-3">Effectiveness Tracking</h4>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Effectiveness Score</p>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold">{control.effectivenessScore}%</span>
                <Badge variant={
                  control.effectiveness === 'effective' ? 'default' :
                    control.effectiveness === 'partially-effective' ? 'secondary' :
                      control.effectiveness === 'ineffective' ? 'destructive' : 'outline'
                }>
                  {control.effectiveness}
                </Badge>
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Last Assessment</p>
              <p className="text-sm">
                {control.lastAssessmentDate
                  ? new Date(control.lastAssessmentDate).toLocaleDateString()
                  : 'Not assessed'
                }
              </p>
            </div>
          </div>
        </div>
      </div >

      {/* Transmission Context */}
      < div >
        <h4 className="text-sm font-semibold mb-3">Transmission Context</h4>
        <div className="bg-card border border-border rounded-lg p-4 space-y-3">
          {control.appliesToAssetTypes && control.appliesToAssetTypes.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">Applicable Asset Types</p>
              <div className="flex flex-wrap gap-1">
                {control.appliesToAssetTypes.map((assetType, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {assetType.replace(/-/g, ' ')}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {control.appliesToZones && control.appliesToZones.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">Applicable Zones</p>
              <div className="flex flex-wrap gap-1">
                {control.appliesToZones.map((zone, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {zone.replace(/-/g, ' ')}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {control.appliesToProtocols && control.appliesToProtocols.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">Applicable Protocols</p>
              <div className="flex flex-wrap gap-1">
                {control.appliesToProtocols.map((protocol, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {protocol}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </div >
    </div >
  );
}

function ControlImplementation({ control }: { control: SecurityControl }) {
  // Mock implementation data - in real implementation, this would come from control_implementations table
  const mockImplementations = [
    {
      id: '1',
      implementationName: 'Substation A - MFA Implementation',
      siteId: 'site-1',
      status: 'implemented' as const,
      effectiveness: 'effective' as const,
      implementationDate: '2023-11-15',
      implementedBy: 'John Smith',
      technologyUsed: 'RSA SecurID, Active Directory',
      notes: 'Multi-factor authentication deployed for all substation control systems'
    },
    {
      id: '2',
      implementationName: 'Grid Station B - Partial MFA',
      siteId: 'site-2',
      status: 'partial' as const,
      effectiveness: 'partially-effective' as const,
      implementationDate: '2023-12-01',
      implementedBy: 'Jane Doe',
      technologyUsed: 'Microsoft Authenticator',
      notes: 'MFA implemented for SCADA access only, protection systems pending'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Implementation Approach */}
      <div>
        <h4 className="text-sm font-semibold mb-3">Implementation Approach</h4>
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">
            {control.implementationApproach || 'No implementation approach documented'}
          </p>
        </div>
      </div>

      {/* Implementation Timeline */}
      <div>
        <h4 className="text-sm font-semibold mb-3">Implementation Timeline</h4>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Implementation Date</p>
              <p className="text-sm">
                {control.implementationDate
                  ? new Date(control.implementationDate).toLocaleDateString()
                  : 'Not scheduled'
                }
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Responsible Party</p>
              <p className="text-sm">{control.responsibleParty || 'Not assigned'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Site Implementations */}
      <div>
        <h4 className="text-sm font-semibold mb-3">Site Implementations ({mockImplementations.length})</h4>
        <div className="space-y-3">
          {mockImplementations.map((impl) => (
            <div key={impl.id} className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-sm font-medium">{impl.implementationName}</p>
                  <p className="text-xs text-muted-foreground">
                    Implemented by {impl.implementedBy} on {new Date(impl.implementationDate).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Badge variant={
                    impl.status === 'implemented' ? 'default' :
                      impl.status === 'partial' ? 'secondary' : 'destructive'
                  }>
                    {impl.status}
                  </Badge>
                  <Badge variant={
                    impl.effectiveness === 'effective' ? 'default' :
                      impl.effectiveness === 'partially-effective' ? 'secondary' : 'destructive'
                  }>
                    {impl.effectiveness}
                  </Badge>
                </div>
              </div>

              <div className="space-y-2">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Technology Used</p>
                  <p className="text-sm">{impl.technologyUsed}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Notes</p>
                  <p className="text-sm">{impl.notes}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cost and Effort */}
      {(control.implementationCostEstimate || control.implementationEffortHours) && (
        <div>
          <h4 className="text-sm font-semibold mb-3">Cost and Effort</h4>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="grid grid-cols-2 gap-4">
              {control.implementationCostEstimate && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Estimated Cost</p>
                  <p className="text-sm font-medium">${control.implementationCostEstimate.toLocaleString()}</p>
                </div>
              )}
              {control.implementationEffortHours && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Effort Hours</p>
                  <p className="text-sm font-medium">{control.implementationEffortHours} hours</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Dependencies */}
      {(control.dependsOnControls && control.dependsOnControls.length > 0) && (
        <div>
          <h4 className="text-sm font-semibold mb-3">Dependencies</h4>
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-xs font-medium text-muted-foreground mb-2">Depends On Controls</p>
            <div className="flex flex-wrap gap-1">
              {control.dependsOnControls.map((depId, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {depId}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ControlTesting({ control }: { control: SecurityControl }) {
  // Mock test results - in real implementation, this would come from control_test_results table
  const mockTestResults = [
    {
      id: '1',
      testDate: '2024-01-15',
      testType: 'automated',
      testName: 'MFA Authentication Test',
      result: 'pass' as const,
      testerName: 'Security Team',
      findings: 'All authentication attempts properly validated with MFA',
      testDurationMinutes: 30
    },
    {
      id: '2',
      testDate: '2023-12-20',
      testType: 'manual',
      testName: 'Access Control Verification',
      result: 'partial' as const,
      testerName: 'John Smith',
      findings: 'Some legacy systems bypass MFA requirements',
      testDurationMinutes: 120
    },
    {
      id: '3',
      testDate: '2023-11-30',
      testType: 'penetration-test',
      testName: 'Authentication Bypass Test',
      result: 'pass' as const,
      testerName: 'External Auditor',
      findings: 'No authentication bypass vulnerabilities found',
      testDurationMinutes: 240
    },
    {
      id: '4',
      testDate: '2023-10-15',
      testType: 'manual',
      testName: 'Legacy Protocol Fuzzing',
      result: 'fail' as const,
      testerName: 'Penetration Tester',
      findings: 'Buffer overflow detected in DNP3 parser',
      testDurationMinutes: 180
    }
  ];

  return (
    <div className="space-y-6">
      {/* Testing Configuration */}
      <div>
        <h4 className="text-sm font-semibold mb-3">Testing Configuration</h4>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Testing Required</p>
              <Badge variant={control.testingRequired ? 'default' : 'secondary'}>
                {control.testingRequired ? 'Yes' : 'No'}
              </Badge>
            </div>
            {control.testingFrequencyDays && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Testing Frequency</p>
                <p className="text-sm">Every {control.testingFrequencyDays} days</p>
              </div>
            )}
          </div>

          {control.lastTested && (
            <div className="mt-4 pt-4 border-t border-border">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Last Tested</p>
                  <p className="text-sm">{new Date(control.lastTested).toLocaleDateString()}</p>
                </div>
                {control.nextTestDate && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">Next Test Due</p>
                    <p className="text-sm">{new Date(control.nextTestDate).toLocaleDateString()}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Test Results History */}
      <div>
        <h4 className="text-sm font-semibold mb-3">Test Results History ({mockTestResults.length})</h4>
        <div className="space-y-3">
          {mockTestResults.map((test) => (
            <div key={test.id} className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-sm font-medium">{test.testName}</p>
                  <p className="text-xs text-muted-foreground">
                    {test.testType} • {new Date(test.testDate).toLocaleDateString()} • {test.testDurationMinutes}min
                  </p>
                </div>
                <Badge variant={
                  test.result === 'pass' ? 'default' :
                    test.result === 'partial' ? 'secondary' :
                      test.result === 'fail' ? 'destructive' : 'outline'
                }>
                  {test.result}
                </Badge>
              </div>

              <div className="space-y-2">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Tester</p>
                  <p className="text-sm">{test.testerName}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Findings</p>
                  <p className="text-sm">{test.findings}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Test Results Summary */}
      <div>
        <h4 className="text-sm font-semibold mb-3">Test Results Summary</h4>
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">Passed</span>
              <CheckCircle2 className="w-4 h-4 text-success" />
            </div>
            <p className="text-2xl font-bold text-success">
              {mockTestResults.filter(t => t.result === 'pass').length}
            </p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">Partial</span>
              <Clock className="w-4 h-4 text-warning" />
            </div>
            <p className="text-2xl font-bold text-warning">
              {mockTestResults.filter(t => t.result === 'partial').length}
            </p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">Failed</span>
              <XCircle className="w-4 h-4 text-destructive" />
            </div>
            <p className="text-2xl font-bold text-destructive">
              {mockTestResults.filter(t => t.result === 'fail').length}
            </p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">Total</span>
              <TestTube className="w-4 h-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold text-muted-foreground">{mockTestResults.length}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ControlEvidence({ control }: { control: SecurityControl }) {
  return (
    <div className="space-y-6">
      {/* Evidence Requirements */}
      <div>
        <h4 className="text-sm font-semibold mb-3">Evidence Requirements</h4>
        <div className="bg-card border border-border rounded-lg p-4">
          {control.evidenceRequired && control.evidenceRequired.length > 0 ? (
            <div className="space-y-2">
              {control.evidenceRequired.map((evidence, index) => (
                <div key={index} className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">{evidence}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No evidence requirements specified</p>
          )}
        </div>
      </div>

      {/* Evidence Provided */}
      <div>
        <h4 className="text-sm font-semibold mb-3">Evidence Provided</h4>
        <div className="bg-card border border-border rounded-lg p-4">
          {control.evidenceProvided && control.evidenceProvided.length > 0 ? (
            <div className="space-y-2">
              {control.evidenceProvided.map((evidence, index) => (
                <div key={index} className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-success" />
                  <span className="text-sm">{evidence}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No evidence provided yet</p>
          )}
        </div>
      </div>

      {/* Validation Information */}
      <div>
        <h4 className="text-sm font-semibold mb-3">Validation Information</h4>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Validation Method</p>
              <p className="text-sm">{control.validationMethod || 'Not specified'}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Validation Frequency</p>
              <p className="text-sm">Every {control.validationFrequencyDays} days</p>
            </div>
          </div>

          {control.lastValidated && (
            <div className="mt-4 pt-4 border-t border-border">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Last Validated</p>
                  <p className="text-sm">{new Date(control.lastValidated).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Validated By</p>
                  <p className="text-sm">{control.validatedBy || 'Not specified'}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Evidence Gap Analysis */}
      <div>
        <h4 className="text-sm font-semibold mb-3">Evidence Gap Analysis</h4>
        <div className="bg-card border border-border rounded-lg p-4">
          {control.evidenceRequired && control.evidenceProvided ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Evidence Coverage</span>
                <span className="text-sm font-medium">
                  {Math.round((control.evidenceProvided.length / control.evidenceRequired.length) * 100)}%
                </span>
              </div>
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full"
                  style={{
                    width: `${Math.round((control.evidenceProvided.length / control.evidenceRequired.length) * 100)}%`
                  }}
                />
              </div>
              <div className="text-xs text-muted-foreground">
                {control.evidenceProvided.length} of {control.evidenceRequired.length} evidence items provided
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Evidence gap analysis not available - missing requirements or provided evidence data
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

interface OverviewChartData {
  name: string;
  value: number;
  color?: string;
}

function ControlLibraryOverview({
  statusData,
  domainData,
  criticalGaps,
  onControlSelect
}: {
  statusData: OverviewChartData[];
  domainData: OverviewChartData[];
  criticalGaps: SecurityControl[];
  onControlSelect: (id: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-8">
      {/* Implementation Status Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <PieChart className="w-4 h-4 text-primary" />
            Implementation Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
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
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Domain Breakdown Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <BarChart className="w-4 h-4 text-primary" />
            Top Domains by Control Count
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={domainData} layout="vertical" margin={{ left: 40, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} opacity={0.3} />
                <XAxis type="number" hide />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={150}
                  tick={{ fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <RechartsTooltip
                  cursor={{ fill: 'hsl(var(--muted)/0.1)' }}
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {domainData.map((_entry, index) => (
                    <RechartsCell key={`cell-${index}`} fill={`hsl(var(--primary) / ${1 - index * 0.1})`} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Critical Gaps List */}
      <Card className="lg:col-span-2">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2 text-destructive">
            <AlertTriangle className="w-4 h-4 animate-pulse" />
            Critical Control Gaps
          </CardTitle>
          <p className="text-xs text-muted-foreground">High-criticality controls that are not yet fully implemented.</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {criticalGaps.length > 0 ? (
              criticalGaps.map((control) => (
                <div
                  key={control.id}
                  className="group flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => onControlSelect(control.id)}
                >
                  <div className="flex items-start gap-3">
                    <div className="bg-destructive/10 p-2 rounded-lg">
                      <Shield className="w-4 h-4 text-destructive" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-muted-foreground">{control.code}</span>
                        <Badge variant="outline" className="text-[10px] uppercase">{control.criticality}</Badge>
                      </div>
                      <h5 className="text-sm font-medium">{control.title}</h5>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{control.domain} • Needs remediation</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-xs font-medium">{control.implementationPercentage}%</p>
                      <div className="w-16 h-1 mt-1 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-destructive/60"
                          style={{ width: `${control.implementationPercentage}%` }}
                        />
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Zap className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <CheckCircle2 className="w-8 h-8 text-success mx-auto mb-2 opacity-20" />
                <p className="text-sm italic">All highly critical controls are currently implemented.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
