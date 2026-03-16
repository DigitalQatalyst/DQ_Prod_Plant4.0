import { useMemo, useState, useEffect } from "react";
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
  Network,
  Lock,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  ArrowLeftRight,
  Zap,
  MapPin,
  Database,
  Activity,
} from "lucide-react";
import {
  getSecurityZones,
  getSecurityConduits,
  getConduitsForZone,
  getOTAssetSecurityByZone,
} from "@/lib/otSecurityQueries";
import { getDataBackend } from "@/lib/supabase";
import {
  PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer,
  BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend,
  Cell as RechartsCell
} from "recharts";
import type { SecurityZone, SecurityConduit, OTAssetSecurity } from "@/types/security";

const zoneTypeLabels: Record<string, string> = {
  'process-zone': 'Process Zone',
  'control-zone': 'Control Zone',
  'management-zone': 'Management Zone',
  'enterprise-zone': 'Enterprise Zone',
  'dmz': 'Industrial DMZ',
  'safety-zone': 'Safety Zone',
};

export function ZoneConduitModel() {
  const { currentTenant } = useApp();
  const [selectedZone, setSelectedZone] = useState<SecurityZone | null>(null);
  const [siteFilter, setSiteFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<string>("level");

  // State for Supabase data
  const [zones, setZones] = useState<SecurityZone[]>([]);
  const [conduits, setConduits] = useState<SecurityConduit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dataBackend, setDataBackend] = useState<'supabase' | 'mock' | 'hybrid'>('mock');

  // Load data from Supabase
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError(null);

      try {
        const backend = getDataBackend();
        setDataBackend(backend);

        if (backend === 'supabase' || backend === 'hybrid') {
          // Load zones and conduits from Supabase
          const [zonesData, conduitsData] = await Promise.all([
            getSecurityZones(currentTenant.id),
            getSecurityConduits(currentTenant.id),
          ]);

          setZones(zonesData);
          setConduits(conduitsData);
        } else {
          // No-op for mock mode
          setZones([]);
          setConduits([]);
        }
      } catch (err) {
        console.error('Error loading zone/conduit data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');

        // Fail silently or handle error
        console.error('Error loading data:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [currentTenant.id]);

  // Filter and sort zones
  const filteredAndSortedZones = useMemo(() => {
    let result = zones.filter(zone => {
      const matchesSite = siteFilter === "all" || zone.siteId === siteFilter;
      const matchesSearch = zone.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (zoneTypeLabels[zone.zoneType] || zone.zoneType).toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSite && matchesSearch;
    });

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'level':
          return b.securityLevel - a.securityLevel;
        case 'name':
          return a.name.localeCompare(b.name);
        case 'assets':
          return (b.assetCount || 0) - (a.assetCount || 0);
        default:
          return 0;
      }
    });

    return result;
  }, [zones, siteFilter, searchTerm, sortBy]);


  // Get unique sites from zones
  const sites = useMemo(() => {
    const siteIds = new Set(zones.map(z => z.siteId).filter(Boolean));
    return Array.from(siteIds).map(id => ({
      id: id!,
      name: `Site ${id!.substring(0, 8)}`, // Simplified site name
    }));
  }, [zones]);

  // Get zone-specific data when a zone is selected
  const zoneData = useMemo(() => {
    if (!selectedZone) return null;

    const site = sites.find(s => s.id === selectedZone.siteId);
    const inboundConduits = conduits.filter(conduit => conduit.targetZoneId === selectedZone.id);
    const outboundConduits = conduits.filter(conduit => conduit.sourceZoneId === selectedZone.id);
    const allConduits = [...inboundConduits, ...outboundConduits];

    const policyCompliantConduits = allConduits.filter(conduit => conduit.policyCompliant);
    const encryptedConduits = allConduits.filter(conduit => conduit.encrypted);

    return {
      site,
      inboundConduits,
      outboundConduits,
      allConduits,
      policyCompliantConduits,
      encryptedConduits,
    };
  }, [selectedZone, sites, conduits]);



  const siteOptions = [
    { value: "all", label: "All Sites" },
    ...sites.map(site => ({ value: site.id, label: site.name }))
  ];

  const filters = [
    {
      key: "site",
      label: "Site",
      value: siteFilter,
      onChange: setSiteFilter,
      options: siteOptions,
    },
  ];

  const overviewData = {
    title: "Zone & Conduit Model Overview",
    description: "Manage and monitor security zones, network segmentation, and secure conduits across the transmission ICS/OT infrastructure.",
    metrics: [
      {
        title: "Total Zones",
        value: zones.length,
        icon: Network,
        variant: "primary" as const
      },
      {
        title: "Total Conduits",
        value: conduits.length,
        icon: ArrowLeftRight,
        variant: "primary" as const
      },
      {
        title: "Average Security Level",
        value: zones.length > 0 ? Math.round(zones.reduce((sum, z) => sum + z.securityLevel, 0) / zones.length) : 0,
        icon: Shield,
        variant: "success" as const
      },
      {
        title: "Compliance Status",
        value: `${zones.filter(z => z.iec62443Compliant).length}/${zones.length}`,
        icon: CheckCircle2,
        variant: zones.every(z => z.iec62443Compliant) ? "success" as const : "warning" as const
      }
    ]
  };

  const tabs = selectedZone ? [
    {
      id: "topology",
      label: "Network Topology",
      content: <ZoneTopology zone={selectedZone} data={zoneData} />,
    },
    {
      id: "conduits",
      label: "Conduits",
      content: <ZoneConduits zone={selectedZone} data={zoneData} />,
    },
    {
      id: "assets",
      label: "Zone Assets",
      content: <ZoneAssets zone={selectedZone} tenantId={currentTenant.id} dataBackend={dataBackend} />,
    },
    {
      id: "policies",
      label: "Security Policies",
      content: <ZonePolicies zone={selectedZone} />,
    },
    {
      id: "compliance",
      label: "IEC 62443 Compliance",
      content: <ZoneCompliance zone={selectedZone} data={zoneData} />,
    },
  ] : [
    {
      id: "overview",
      label: "Overview",
      content: <ZoneConduitOverview zones={zones} conduits={conduits} />,
    }
  ];

  if (loading) {
    return <LoadingState loadingText="Analysing network topology..." />;
  }

  if (error && zones.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <EmptyState
          icon={AlertTriangle}
          title="Error Loading Data"
          description={error}
        />
      </div>
    );
  }

  return (
    <div className="flex w-full h-full overflow-hidden">
      <ListPane
        title="Security Zones"
        context="DEWA – Transmission"
        count={filteredAndSortedZones.length}
        searchPlaceholder="Search"
        onSearch={setSearchTerm}
        filters={[
          {
            key: "site",
            label: "Site",
            options: [
              { label: "All Sites", value: "all" },
              ...sites.map(site => ({ value: site.id, label: site.name }))
            ],
            value: siteFilter,
            onChange: setSiteFilter,
          },
        ]}
        sortOptions={[
          { label: 'Security Level', value: 'level' },
          { label: 'Name', value: 'name' },
          { label: 'Asset Count', value: 'assets' },
        ]}
        sortValue={sortBy}
        onSortChange={setSortBy}
      >
        <div className="space-y-1">
          {filteredAndSortedZones.length === 0 ? (
            <EmptyState
              icon={Network}
              title="No Security Zones"
              description="No security zones found for the selected filters"
            />
          ) : (
            filteredAndSortedZones.map((zone) => {
              const site = sites.find(s => s.id === zone.siteId);
              const siteName = site?.name || `Site ${zone.siteId?.substring(0, 8)}`;

              return (
                <ListPaneItem
                  key={zone.id}
                  title={zone.name}
                  description={`${zoneTypeLabels[zone.zoneType] || zone.zoneType} • ${siteName}`}
                  status={zone.complianceStatus === 'compliant' ? 'online' : (zone.complianceStatus === 'non-compliant' ? 'offline' : 'maintenance')}
                  category={zone.zoneType}
                  value={`Level ${zone.securityLevel}`}
                  isSelected={selectedZone?.id === zone.id}
                  onClick={() => setSelectedZone(zone)}
                />
              );
            })
          )}
        </div>
      </ListPane>

      <WorkPane
        title={selectedZone ? selectedZone.name : "Zone & Conduit Model Overview"}
        subtitle={
          selectedZone && zoneData?.site
            ? `${zoneTypeLabels[selectedZone.zoneType] || selectedZone.zoneType} • ${zoneData.site.name} • Level ${selectedZone.securityLevel}`
            : selectedZone
              ? `${zoneTypeLabels[selectedZone.zoneType] || selectedZone.zoneType} • Level ${selectedZone.securityLevel}`
              : currentTenant?.name
        }
        tabs={tabs}
      />
    </div>
  );
}

function ZoneTopology({ zone, data }: { zone: SecurityZone; data: any }) {
  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Zone KPIs */}
      <div className="grid grid-cols-4 gap-4">
        <KPICard
          title="Zone Assets"
          value={zone.assetCount}
          subtitle="Total assets in zone"
          icon={Shield}
          variant="default"
        />
        <KPICard
          title="Total Conduits"
          value={data.allConduits.length}
          subtitle={`${data.inboundConduits.length} inbound, ${data.outboundConduits.length} outbound`}
          icon={Network}
          variant="default"
        />
        <KPICard
          title="Policy Compliance"
          value={`${Math.round((data.policyCompliantConduits.length / Math.max(data.allConduits.length, 1)) * 100)}%`}
          subtitle={`${data.policyCompliantConduits.length}/${data.allConduits.length} compliant`}
          icon={CheckCircle2}
          variant="success"
        />
        <KPICard
          title="Encryption Rate"
          value={`${Math.round((data.encryptedConduits.length / Math.max(data.allConduits.length, 1)) * 100)}%`}
          subtitle={`${data.encryptedConduits.length}/${data.allConduits.length} encrypted`}
          icon={Lock}
          variant="warning"
        />
      </div>

      {/* Zone Information */}
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-3">Zone Details</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Type:</span>
              <span className="font-medium">{zone.zoneType.toUpperCase()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Security Level:</span>
              <span className="font-medium">Level {zone.securityLevel}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Asset Count:</span>
              <span>{zone.assetCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Compliance Status:</span>
              <StatusBadge status={zone.complianceStatus} />
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Active Policies:</span>
              <span>{zone.policies.length}</span>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-3">Network Connections</h3>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">Inbound Conduits</span>
                <span className="font-medium">{data.inboundConduits.length}</span>
              </div>
              <div className="space-y-1">
                {data.inboundConduits.slice(0, 3).map((conduit: SecurityConduit) => (
                  <div key={conduit.id} className="flex items-center gap-2 text-xs">
                    <ArrowRight className="w-3 h-3 text-primary" />
                    <span className="text-muted-foreground">{conduit.name}</span>
                  </div>
                ))}
                {data.inboundConduits.length > 3 && (
                  <div className="text-xs text-muted-foreground">
                    +{data.inboundConduits.length - 3} more
                  </div>
                )}
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">Outbound Conduits</span>
                <span className="font-medium">{data.outboundConduits.length}</span>
              </div>
              <div className="space-y-1">
                {data.outboundConduits.slice(0, 3).map((conduit: SecurityConduit) => (
                  <div key={conduit.id} className="flex items-center gap-2 text-xs">
                    <ArrowRight className="w-3 h-3 text-primary" />
                    <span className="text-muted-foreground">{conduit.name}</span>
                  </div>
                ))}
                {data.outboundConduits.length > 3 && (
                  <div className="text-xs text-muted-foreground">
                    +{data.outboundConduits.length - 3} more
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ZoneAssets({ zone, tenantId, dataBackend }: { zone: SecurityZone; tenantId: string; dataBackend: 'supabase' | 'mock' | 'hybrid' }) {
  const [assets, setAssets] = useState<OTAssetSecurity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAssets() {
      setLoading(true);
      try {
        if (dataBackend === 'supabase' || dataBackend === 'hybrid') {
          const assetData = await getOTAssetSecurityByZone(tenantId, zone.id);
          setAssets(assetData);
        } else {
          setAssets([]);
        }
      } catch (err) {
        console.error('Error loading zone assets:', err);
        setAssets([]);
      } finally {
        setLoading(false);
      }
    }

    loadAssets();
  }, [zone.id, tenantId, dataBackend]);

  if (loading) {
    return <LoadingState />;
  }

  return (
    <div className="space-y-4">
      {assets.length === 0 ? (
        <EmptyState
          icon={Shield}
          title="No Assets"
          description="No assets found in this security zone"
        />
      ) : (
        <div className="border border-border rounded-lg overflow-hidden">
          <table className="data-table">
            <thead className="bg-secondary/30">
              <tr>
                <th>Asset ID</th>
                <th>Criticality</th>
                <th>Security Status</th>
                <th>Risk Score</th>
                <th>Vulnerabilities</th>
                <th>Patch Status</th>
                <th>Safety Loop</th>
              </tr>
            </thead>
            <tbody>
              {assets.map((asset) => (
                <tr key={asset.id}>
                  <td className="font-medium">{asset.assetId.substring(0, 8)}...</td>
                  <td>
                    <StatusBadge status={asset.criticality} />
                  </td>
                  <td>
                    <StatusBadge status={asset.securityStatus} />
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{asset.riskScore}</span>
                      <div className="w-16 h-1.5 bg-secondary rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${asset.riskScore >= 70
                            ? "bg-destructive"
                            : asset.riskScore >= 40
                              ? "bg-warning"
                              : "bg-success"
                            }`}
                          style={{ width: `${asset.riskScore}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center gap-1">
                      {asset.vulnerabilityCount > 0 ? (
                        <>
                          <AlertTriangle className="w-4 h-4 text-destructive" />
                          <span className="text-destructive">{asset.vulnerabilityCount}</span>
                        </>
                      ) : (
                        <span className="text-success">0</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <StatusBadge status={asset.patchStatus} />
                  </td>
                  <td>
                    {asset.inSafetyLoop ? (
                      <Zap className="w-4 h-4 text-destructive" />
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function ZoneConduits({ zone, data }: { zone: SecurityZone; data: any }) {
  if (!data) return null;

  return (
    <div className="space-y-4">
      {data.allConduits.length === 0 ? (
        <EmptyState
          icon={Network}
          title="No Conduits"
          description="No conduits connected to this zone"
        />
      ) : (
        <div className="border border-border rounded-lg overflow-hidden">
          <table className="data-table">
            <thead className="bg-secondary/30">
              <tr>
                <th>Conduit Name</th>
                <th>Direction</th>
                <th>Protocol</th>
                <th>Data Flow</th>
                <th>Encrypted</th>
                <th>Policy Compliant</th>
              </tr>
            </thead>
            <tbody>
              {data.allConduits.map((conduit: SecurityConduit) => {
                const isInbound = conduit.targetZoneId === zone.id;
                return (
                  <tr key={conduit.id}>
                    <td className="font-medium">{conduit.name}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        {isInbound ? (
                          <ArrowRight className="w-4 h-4 text-success" />
                        ) : (
                          <ArrowRight className="w-4 h-4 text-primary rotate-180" />
                        )}
                        <span className="text-muted-foreground">
                          {isInbound ? "Inbound" : "Outbound"}
                        </span>
                      </div>
                    </td>
                    <td className="text-muted-foreground">{conduit.protocol}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        {conduit.dataFlowDirection === "bidirectional" ? (
                          <ArrowLeftRight className="w-4 h-4 text-primary" />
                        ) : (
                          <ArrowRight className="w-4 h-4 text-primary" />
                        )}
                        <span className="text-muted-foreground">
                          {conduit.dataFlowDirection}
                        </span>
                      </div>
                    </td>
                    <td>
                      {conduit.encrypted ? (
                        <div className="flex items-center gap-2">
                          <Lock className="w-4 h-4 text-success" />
                          <span className="text-success">Yes</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-destructive" />
                          <span className="text-destructive">No</span>
                        </div>
                      )}
                    </td>
                    <td>
                      <StatusBadge
                        status={conduit.policyCompliant ? "compliant" : "non-compliant"}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function ZonePolicies({ zone }: { zone: SecurityZone }) {
  return (
    <div className="space-y-4">
      {zone.policies.length === 0 ? (
        <EmptyState
          icon={Lock}
          title="No Policies"
          description="No security policies applied to this zone"
        />
      ) : (
        <div className="grid gap-4">
          {zone.policies.map((policy, index) => (
            <div key={index} className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="text-sm font-medium">{String(policy || '').replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}</h4>
                  <p className="text-xs text-muted-foreground">
                    Applied to {zone.zoneType.toUpperCase()} zone
                  </p>
                </div>
                <StatusBadge
                  status="active"
                />
              </div>
              <div className="text-xs text-muted-foreground">
                Security policy enforced at zone level {zone.securityLevel}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ZoneCompliance({ zone, data }: { zone: SecurityZone; data: any }) {
  if (!data) return null;

  // IEC 62443 compliance checks
  const complianceChecks = [
    {
      id: 'sl-assignment',
      name: 'Security Level Assignment',
      description: 'Zone has appropriate IEC 62443 security level (1-4)',
      status: zone.securityLevel >= 1 && zone.securityLevel <= 4 ? 'pass' : 'fail',
      details: `Security Level ${zone.securityLevel}`,
    },
    {
      id: 'conduit-encryption',
      name: 'Conduit Encryption',
      description: 'All conduits use encrypted communication',
      status: data.allConduits.length === data.encryptedConduits.length ? 'pass' : 'warning',
      details: `${data.encryptedConduits.length}/${data.allConduits.length} encrypted`,
    },
    {
      id: 'policy-compliance',
      name: 'Policy Compliance',
      description: 'All conduits comply with security policies',
      status: data.allConduits.length === data.policyCompliantConduits.length ? 'pass' : 'fail',
      details: `${data.policyCompliantConduits.length}/${data.allConduits.length} compliant`,
    },
    {
      id: 'zone-segmentation',
      name: 'Zone Segmentation',
      description: 'Zone is properly segmented with defined boundaries',
      status: data.allConduits.length > 0 ? 'pass' : 'warning',
      details: `${data.allConduits.length} conduits defined`,
    },
    {
      id: 'access-control',
      name: 'Access Control',
      description: 'Zone has active security policies',
      status: zone.policies.length > 0 ? 'pass' : 'fail',
      details: `${zone.policies.length} policies active`,
    },
  ];

  const passedChecks = complianceChecks.filter(c => c.status === 'pass').length;
  const overallScore = Math.round((passedChecks / complianceChecks.length) * 100);

  return (
    <div className="space-y-6">
      {/* Compliance Score */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold">IEC 62443 Compliance Score</h3>
            <p className="text-sm text-muted-foreground">
              Based on {complianceChecks.length} security requirements
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">{overallScore}%</div>
            <StatusBadge status={zone.complianceStatus} />
          </div>
        </div>
        <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full ${overallScore >= 80
              ? "bg-success"
              : overallScore >= 60
                ? "bg-warning"
                : "bg-destructive"
              }`}
            style={{ width: `${overallScore}%` }}
          />
        </div>
      </div>

      {/* Compliance Checks */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold">Compliance Requirements</h3>
        {complianceChecks.map((check) => (
          <div
            key={check.id}
            className="bg-card border border-border rounded-lg p-4"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  {check.status === 'pass' ? (
                    <CheckCircle2 className="w-4 h-4 text-success" />
                  ) : check.status === 'warning' ? (
                    <AlertTriangle className="w-4 h-4 text-warning" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-destructive" />
                  )}
                  <h4 className="text-sm font-medium">{check.name}</h4>
                </div>
                <p className="text-xs text-muted-foreground mb-2">
                  {check.description}
                </p>
                <p className="text-xs font-medium">{check.details}</p>
              </div>
              <StatusBadge
                status={check.status}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Recommendations */}
      {overallScore < 100 && (
        <div className="bg-warning/10 border border-warning/30 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold mb-2">Compliance Recommendations</h4>
              <ul className="text-xs space-y-1 text-muted-foreground">
                {complianceChecks
                  .filter(c => c.status !== 'pass')
                  .map(check => (
                    <li key={check.id}>• Address {check.name}: {check.description}</li>
                  ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ZoneConduitOverview({ zones, conduits }: { zones: SecurityZone[], conduits: SecurityConduit[] }) {
  // Calculate metrics
  const totalZones = zones.length;
  const totalConduits = conduits.length;
  const avgSecurityLevel = zones.length > 0
    ? Math.round(zones.reduce((sum, z) => sum + z.securityLevel, 0) / zones.length)
    : 0;

  // Zones by type
  const zonesByType = zones.reduce((acc, zone) => {
    const type = zone.type || 'unknown';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Conduits by status
  const conduitsByStatus = conduits.reduce((acc, conduit) => {
    const status = conduit.status || 'unknown';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Top zones by asset count
  const topZones = [...zones]
    .sort((a, b) => b.assetCount - a.assetCount)
    .slice(0, 5);

  // Prepare chart data
  const zoneTypeData = Object.entries(zonesByType)
    .map(([type, count]) => ({
      name: type.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
      value: count
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  const conduitStatusData = [
    { name: 'Active', value: conduitsByStatus['active'] || 0, color: 'hsl(var(--success))' },
    { name: 'Inactive', value: conduitsByStatus['inactive'] || 0, color: 'hsl(var(--muted))' },
    { name: 'Pending', value: conduitsByStatus['pending'] || 0, color: 'hsl(var(--warning))' },
  ].filter(d => d.value > 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-8">
      {/* Zones by Type Chart */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <Network className="w-4 h-4 text-primary" />
          Zones by Type
        </h4>
        <div className="h-[240px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <RechartsBarChart data={zoneTypeData} layout="vertical" margin={{ left: 100, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} opacity={0.3} />
              <XAxis type="number" hide domain={[0, 'auto']} />
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
                {zoneTypeData.map((_entry, index) => (
                  <RechartsCell key={`cell-${index}`} fill={`hsl(var(--primary) / ${1 - index * 0.15})`} />
                ))}
              </Bar>
            </RechartsBarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Conduit Status Chart */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <ArrowLeftRight className="w-4 h-4 text-primary" />
          Conduit Status Distribution
        </h4>
        <div className="h-[240px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <RechartsPieChart>
              <Pie
                data={conduitStatusData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {conduitStatusData.map((entry, index) => (
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
          <Shield className="w-4 h-4 text-primary" />
          Key Security Areas
        </h4>
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center shrink-0">
              <Network className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">Network Segmentation</p>
              <p className="text-xs text-muted-foreground">Isolate critical zones from less secure networks.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center shrink-0">
              <Lock className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">Secure Conduits</p>
              <p className="text-xs text-muted-foreground">Enforce encrypted communication between zones.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">IEC 62443 Compliance</p>
              <p className="text-xs text-muted-foreground">Maintain compliance with industrial security standards.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Top Zones by Asset Count */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary" />
          Top Zones by Asset Count
        </h4>
        <div className="space-y-4">
          {topZones.length > 0 ? (
            topZones.map((zone) => (
              <div
                key={zone.id}
                className="group flex items-center justify-between p-2 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full bg-primary`} />
                  <span className="text-sm font-medium truncate max-w-[150px]">{zone.name}</span>
                </div>
                <span className="text-xs font-bold">{zone.assetCount} assets</span>
              </div>
            ))
          ) : (
            <p className="text-xs text-muted-foreground italic">No zones configured.</p>
          )}
          <div className="pt-2 border-t border-border mt-2">
            <p className="text-xs text-muted-foreground italic">Select a zone from the list to view detailed topology, conduits, and compliance.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
