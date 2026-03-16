import { useState, useMemo, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { ListPane } from "@/components/layout/ListPane";
import { ListPaneItem } from "@/components/layout/ListPaneItem";
import { WorkPane } from "@/components/layout/WorkPane";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { LoadingState } from "@/components/shared/LoadingState";
import { EmptyState } from "@/components/shared/EmptyState";
import {
  Shield,
  AlertTriangle,
  Network,
  Activity,
  Clock,
  Wifi,
  CheckCircle2,
  AlertCircle,
  Zap,
  MapPin,
  Filter,
} from "lucide-react";
import {
  getOTAssetSecurityWithAssets,
  getSecurityZones,
} from "@/lib/otSecurityQueries";
import { getDataBackend } from "@/lib/supabase";
import {
  getUpstreamOtAssetsByTenant,
  getUpstreamSecurityAlertsByTenant,
  getUpstreamSitesByTenant,
  getSecurityZonesByTenant,
} from "@/data/upstreamSecurityMockData";
import { IdentityOverview } from "@/components/security/IdentityOverview";
import {
  PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer,
  BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend,
  Cell as RechartsCell
} from "recharts";
import type {
  OTAssetSecurity,
  SecurityZone,
  TransmissionAssetType,
  OTAssetCriticality,
  OTAssetSecurityStatus,
  PatchStatus as OTAssetPatchStatus,
  NetworkExposure as OTAssetNetworkExposure
} from "@/types/security";

// Helper function to format asset type names
function formatAssetType(type: string): string {
  return type
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Transmission asset types for filtering
const TRANSMISSION_ASSET_TYPES: TransmissionAssetType[] = [
  'transformer',
  'circuit-breaker',
  'bay-controller',
  'protection-relay',
  'rtu',
  'scada-node',
  'meter',
  'switch',
  'capacitor-bank'
];

// Extended OT asset with asset details
interface OTAssetWithDetails extends OTAssetSecurity {
  asset?: {
    id: string;
    name: string;
    siteId?: string;
    properties?: {
      type?: string;
      siteName?: string;
      [key: string]: unknown;
    };
  };
}

export function OtAssetInventory() {
  const { currentTenant } = useApp();
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [criticalityFilter, setCriticalityFilter] = useState("all");
  const [zoneFilter, setZoneFilter] = useState("all");
  const [assetTypeFilter, setAssetTypeFilter] = useState("all");
  const [sortBy, setSortBy] = useState("risk");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State for Supabase data
  const [otAssets, setOtAssets] = useState<OTAssetWithDetails[]>([]);
  const [zones, setZones] = useState<SecurityZone[]>([]);

  // State for mock data (fallback)
  const [mockAssets, setMockAssets] = useState<any[]>([]);
  const [mockZones, setMockZones] = useState<any[]>([]);
  const [mockSites, setMockSites] = useState<any[]>([]);
  const [mockAlerts, setMockAlerts] = useState<any[]>([]);

  const dataBackend = getDataBackend();
  const useSupabase = dataBackend === 'supabase' || dataBackend === 'hybrid';

  // Fetch data on mount
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);

      try {
        if (useSupabase) {
          // Fetch from Supabase
          const [assetsData, zonesData] = await Promise.all([
            getOTAssetSecurityWithAssets(currentTenant.id),
            getSecurityZones(currentTenant.id)
          ]) as [any[], any[]];

          // Filter for transmission assets only
          const transmissionAssets = assetsData.filter(asset => {
            const assetType = asset.asset?.properties?.type as string;
            return assetType && TRANSMISSION_ASSET_TYPES.includes(assetType as TransmissionAssetType);
          });

          setOtAssets(transmissionAssets);
          setZones(zonesData);
        } else {
          // Fallback to mock data
          const assets = getUpstreamOtAssetsByTenant(currentTenant.id);
          const zones = getSecurityZonesByTenant(currentTenant.id);
          const sites = getUpstreamSitesByTenant(currentTenant.id);
          const alerts = getUpstreamSecurityAlertsByTenant(currentTenant.id);

          setMockAssets(assets);
          setMockZones(zones);
          setMockSites(sites);
          setMockAlerts(alerts);
        }
      } catch (err) {
        console.error('Error fetching OT asset security data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');

        // Fallback to mock data on error
        if (useSupabase) {
          const assets = getUpstreamOtAssetsByTenant(currentTenant.id);
          const zones = getSecurityZonesByTenant(currentTenant.id);
          const sites = getUpstreamSitesByTenant(currentTenant.id);
          const alerts = getUpstreamSecurityAlertsByTenant(currentTenant.id);

          setMockAssets(assets);
          setMockZones(zones);
          setMockSites(sites);
          setMockAlerts(alerts);
        }
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [currentTenant.id, useSupabase]);

  // Normalize data for unified handling
  const normalizedAssets = useMemo(() => {
    if (useSupabase && !error) {
      return otAssets.map(asset => ({
        id: asset.id,
        assetId: asset.assetId,
        name: asset.asset?.name || 'Unknown Asset',
        type: (asset.asset?.properties?.type as string) || 'unknown',
        siteId: asset.asset?.siteId || '',
        siteName: (asset.asset?.properties?.siteName as string) || 'Unknown Site',
        zoneId: asset.zoneId || '',
        criticality: asset.criticality,
        securityStatus: asset.securityStatus,
        vulnerabilityCount: asset.vulnerabilityCount,
        openAlerts: asset.openAlerts,
        riskScore: asset.riskScore,
        patchStatus: asset.patchStatus,
        networkExposure: asset.networkExposure,
        lastSecurityScan: asset.lastSecurityScan || new Date().toISOString(),
        manufacturer: asset.manufacturer || 'Unknown',
        model: asset.model || 'Unknown',
        firmwareVersion: asset.firmwareVersion || 'Unknown',
        inSafetyLoop: asset.inSafetyLoop || false,
        highPressure: asset.highPressure || false,
      }));
    } else {
      // Use mock data
      return mockAssets.map(asset => ({
        id: asset.id,
        assetId: asset.id,
        name: asset.name,
        type: asset.type,
        siteId: asset.siteId,
        siteName: mockSites.find(s => s.id === asset.siteId)?.name || 'Unknown Site',
        zoneId: asset.zoneId,
        criticality: asset.criticality,
        securityStatus: asset.securityStatus,
        vulnerabilityCount: asset.vulnerabilityCount,
        openAlerts: asset.openAlerts,
        riskScore: asset.riskScore,
        patchStatus: asset.patchStatus,
        networkExposure: asset.networkExposure,
        lastSecurityScan: asset.lastSecurityScan,
        manufacturer: asset.manufacturer,
        model: asset.model,
        firmwareVersion: asset.firmwareVersion,
        inSafetyLoop: asset.inSafetyLoop,
        highPressure: asset.highPressure,
      }));
    }
  }, [useSupabase, error, otAssets, mockAssets, mockSites]);

  const normalizedZones = useMemo(() => {
    if (useSupabase && !error) {
      return zones;
    } else {
      return mockZones;
    }
  }, [useSupabase, error, zones, mockZones]);

  // Filter and sort assets
  const filteredAndSortedAssets = useMemo(() => {
    let result = [...normalizedAssets];

    // Search
    if (searchTerm.trim()) {
      const query = searchTerm.toLowerCase();
      result = result.filter(
        (asset) =>
          asset.name.toLowerCase().includes(query) ||
          asset.type.toLowerCase().includes(query) ||
          asset.siteName.toLowerCase().includes(query) ||
          asset.manufacturer.toLowerCase().includes(query) ||
          asset.model.toLowerCase().includes(query)
      );
    }

    // Filter by criticality
    if (criticalityFilter !== "all") {
      result = result.filter((asset) => asset.criticality === criticalityFilter);
    }

    // Filter by zone
    if (zoneFilter !== "all") {
      result = result.filter((asset) => asset.zoneId === zoneFilter);
    }

    // Filter by type
    if (assetTypeFilter !== "all") {
      result = result.filter((asset) => asset.type === assetTypeFilter);
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === "risk") return b.riskScore - a.riskScore;
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "criticality") {
        const priority = { 'safety-critical': 0, 'production-critical': 1, 'high': 2, 'medium': 3, 'low': 4 };
        return (priority[a.criticality as keyof typeof priority] || 5) - (priority[b.criticality as keyof typeof priority] || 5);
      }
      return 0;
    });

    return result;
  }, [normalizedAssets, searchTerm, criticalityFilter, zoneFilter, assetTypeFilter, sortBy]);

  // Set initial selection
  /*
  useEffect(() => {
    if (!selectedAssetId && filteredAssets.length > 0) {
      setSelectedAssetId(filteredAssets[0].id);
    }
  }, [filteredAssets, selectedAssetId]);
  */

  const selectedAsset = normalizedAssets.find((a) => a.id === selectedAssetId);

  // Get unique asset types and zones for filters
  const assetTypes = useMemo(() =>
    [...new Set(normalizedAssets.map(asset => asset.type))],
    [normalizedAssets]
  );

  const zoneOptions = useMemo(() => [
    { value: "all", label: "All Zones" },
    ...normalizedZones.map(zone => ({
      value: zone.id,
      label: zone.name
    }))
  ], [normalizedZones]);

  const assetTypeOptions = useMemo(() => [
    { value: "all", label: "All Types" },
    ...assetTypes.map(type => ({
      value: type,
      label: formatAssetType(type)
    }))
  ], [assetTypes]);

  const criticalityOptions = [
    { value: "all", label: "All Criticality" },
    { value: "safety-critical", label: "Safety Critical" },
    { value: "production-critical", label: "Production Critical" },
    { value: "high", label: "High" },
    { value: "medium", label: "Medium" },
    { value: "low", label: "Low" },
  ];

  const filters = [
    {
      key: "criticality",
      label: "Criticality",
      value: criticalityFilter,
      onChange: setCriticalityFilter,
      options: criticalityOptions,
    },
    {
      key: "zone",
      label: "Zone",
      value: zoneFilter,
      onChange: setZoneFilter,
      options: zoneOptions,
    },
    {
      key: "type",
      label: "Asset Type",
      value: assetTypeFilter,
      onChange: setAssetTypeFilter,
      options: assetTypeOptions,
    },
  ];

  // Loading state
  if (loading) {
    return (
      <>
        <ListPane
          title="Transmission OT Assets"
          subtitle="Loading assets..."
          count={0}
          searchPlaceholder="Search assets..."
        >
          <LoadingState loadingText="Loading OT asset inventory..." />
        </ListPane>
        <WorkPane title="Loading..." subtitle="" tabs={[]} />
      </>
    );
  }

  // Error state with fallback
  if (error && normalizedAssets.length === 0) {
    return (
      <>
        <ListPane
          title="Transmission OT Assets"
          subtitle="Error loading assets"
          count={0}
          searchPlaceholder="Search assets..."
        >
          <EmptyState
            icon={AlertCircle}
            title="Failed to Load Assets"
            description={error}
          />
        </ListPane>
        <WorkPane title="Error" subtitle="" tabs={[]} />
      </>
    );
  }

  const overviewData = {
    title: "OT Asset Inventory Overview",
    description: "Comprehensive index of all operational technology assets, their criticality, and security posture.",
    metrics: [
      {
        title: "Total Assets",
        value: normalizedAssets.length,
        icon: Shield,
        variant: "primary" as const
      },
      {
        title: "Critical Assets",
        value: normalizedAssets.filter(a => a.criticality === 'safety-critical' || a.criticality === 'production-critical' || a.criticality === 'high').length,
        icon: AlertTriangle,
        variant: "destructive" as const
      },
      {
        title: "Vulnerable Assets",
        value: normalizedAssets.filter(a => a.securityStatus === 'vulnerable').length,
        icon: AlertCircle,
        variant: "warning" as const
      },
      {
        title: "Avg Risk Score",
        value: normalizedAssets.length > 0 ? Math.round(normalizedAssets.reduce((sum, a) => sum + a.riskScore, 0) / normalizedAssets.length) : 0,
        icon: Activity,
        variant: "default" as const
      }
    ]
  };

  const tabs = selectedAsset
    ? [
      {
        id: "security-info",
        label: "Security Info",
        content: <SecurityInfo asset={selectedAsset} zones={normalizedZones} />,
      },
      {
        id: "vulnerabilities",
        label: "Vulnerabilities",
        content: <Vulnerabilities asset={selectedAsset} />,
      },
      {
        id: "network",
        label: "Network",
        content: <NetworkInfo asset={selectedAsset} zones={normalizedZones} />,
      },
      {
        id: "risk",
        label: "Risk",
        content: <RiskAssessment asset={selectedAsset} />,
      },
    ]
    : [{
      id: "overview",
      label: "Overview",
      content: <OTAssetInventoryOverview assets={normalizedAssets} />,
    }];

  return (
    <div className="flex w-full h-full overflow-hidden">
      <ListPane
        title="Transmission OT Assets"
        context="DEWA – Transmission"
        count={filteredAndSortedAssets.length}
        searchPlaceholder="Search"
        onSearch={setSearchTerm}
        filters={filters}
        sortOptions={[
          { label: "Risk Score", value: "risk" },
          { label: "Asset Name", value: "name" },
          { label: "Criticality", value: "criticality" },
        ]}
        sortValue={sortBy}
        onSortChange={setSortBy}
      >
        <div className="space-y-1">
          {filteredAndSortedAssets.length === 0 ? (
            <EmptyState
              icon={Shield}
              title="No Assets Found"
              description="No transmission assets match your current filters"
            />
          ) : (
            filteredAndSortedAssets.map((asset) => {
              const zone = normalizedZones.find(z => z.id === asset.zoneId);
              return (
                <ListPaneItem
                  key={asset.id}
                  title={asset.name}
                  description={formatAssetType(asset.type)}
                  status={asset.securityStatus === 'secure' ? 'online' : (asset.securityStatus === 'vulnerable' ? 'offline' : 'pending')}
                  category={asset.siteName}
                  value={asset.criticality.replace(/-/g, ' ')}
                  isSelected={selectedAssetId === asset.id}
                  onClick={() => setSelectedAssetId(asset.id)}
                />
              );
            })
          )}
        </div>
      </ListPane>

      {selectedAsset ? (
        <WorkPane
          title={selectedAsset.name}
          subtitle={`${formatAssetType(selectedAsset.type)} • ${selectedAsset.siteName}`}
          tabs={tabs}
        />
      ) : (
        <WorkPane
          title="OT Asset Inventory Overview"
          subtitle="Comprehensive index of all operational technology assets"
          tabs={tabs}
        />
      )}
    </div>
  );
}

function SecurityInfo({ asset, zones }: { asset: any; zones: any[] }) {
  const zone = zones.find(z => z.id === asset.zoneId);
  return (
    <div className="space-y-6">
      {/* Security Status Card */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-start gap-4">
          <div
            className={`w-16 h-16 rounded-lg flex items-center justify-center ${asset.securityStatus === "secure"
              ? "bg-success/10"
              : asset.securityStatus === "at-risk"
                ? "bg-warning/10"
                : asset.securityStatus === "vulnerable"
                  ? "bg-destructive/10"
                  : "bg-secondary"
              }`}
          >
            <Shield
              className={`w-8 h-8 ${asset.securityStatus === "secure"
                ? "text-success"
                : asset.securityStatus === "at-risk"
                  ? "text-warning"
                  : asset.securityStatus === "vulnerable"
                    ? "text-destructive"
                    : "text-muted-foreground"
                }`}
            />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-semibold">{asset.name}</h3>
              {asset.inSafetyLoop && (
                <Zap className="w-5 h-5 text-destructive" />
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {formatAssetType(asset.type)} - {asset.siteName}
            </p>
            <p className="text-xs text-muted-foreground">
              {zone?.name || 'Unknown Zone'} • {asset.manufacturer} {asset.model}
            </p>
            <div className="flex items-center gap-4 mt-4">
              <StatusBadge status={asset.criticality} />
              <StatusBadge status={asset.securityStatus} />
              {asset.highPressure && (
                <span className="text-xs px-3 py-1 rounded-full bg-warning/10 text-warning">
                  High Pressure
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Security Metrics */}
      <div>
        <h4 className="text-sm font-semibold mb-3">Security Metrics</h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-xs text-muted-foreground mb-1">Risk Score</p>
            <div className="flex items-center gap-3">
              <p className="text-2xl font-bold">{asset.riskScore}</p>
              <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
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
            <p className="text-xs text-muted-foreground mt-2">
              {asset.riskScore >= 70 ? "High Risk" : asset.riskScore >= 40 ? "Medium Risk" : "Low Risk"}
            </p>
          </div>

          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-xs text-muted-foreground mb-1">Vulnerabilities</p>
            <p className="text-2xl font-bold">{asset.vulnerabilityCount}</p>
            <p className="text-xs text-muted-foreground mt-2">
              {asset.vulnerabilityCount === 0 ? "No vulnerabilities" : "Open vulnerabilities"}
            </p>
          </div>

          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-xs text-muted-foreground mb-1">Open Alerts</p>
            <p className="text-2xl font-bold">{asset.openAlerts}</p>
            <p className="text-xs text-muted-foreground mt-2">
              {asset.openAlerts === 0 ? "No active alerts" : "Active security alerts"}
            </p>
          </div>

          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-xs text-muted-foreground mb-1">Patch Status</p>
            <p className="text-sm font-medium mt-1">
              <StatusBadge status={asset.patchStatus} />
            </p>
          </div>
        </div>
      </div>

      {/* Asset Details */}
      <div>
        <h4 className="text-sm font-semibold mb-3">Asset Details</h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-3">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Last Security Scan</p>
                <p className="text-sm font-medium">
                  {new Date(asset.lastSecurityScan).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-3">
              <Shield className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Firmware Version</p>
                <p className="text-sm font-medium">{asset.firmwareVersion}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Network Exposure */}
      <div>
        <h4 className="text-sm font-semibold mb-3">Network Exposure</h4>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-3">
            <Wifi className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Exposure Level</p>
              <p className="text-sm font-medium">
                <StatusBadge
                  status={asset.networkExposure}
                />
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Vulnerabilities({ asset }: { asset: any }) {
  // Mock vulnerability data
  const vulnerabilities = Array.from({ length: asset.vulnerabilityCount }, (_, i) => ({
    id: `vuln-${asset.id}-${i + 1}`,
    cve: `CVE-2024-${1000 + i}`,
    severity: i === 0 ? "critical" : i === 1 ? "high" : "medium",
    title: `Vulnerability ${i + 1} in ${asset.type}`,
    description: "Security vulnerability requiring attention",
    cvssScore: 9.8 - i * 1.5,
    status: i === 0 ? "open" : "in-progress",
  }));

  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-sm font-semibold mb-3">
          Vulnerability Summary ({asset.vulnerabilityCount})
        </h4>
        {asset.vulnerabilityCount === 0 ? (
          <div className="bg-card border border-border rounded-lg p-8 text-center">
            <CheckCircle2 className="w-12 h-12 text-success mx-auto mb-3" />
            <p className="text-sm font-medium">No Vulnerabilities Detected</p>
            <p className="text-xs text-muted-foreground mt-1">
              This asset has no known security vulnerabilities
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {vulnerabilities.map((vuln) => (
              <div
                key={vuln.id}
                className="bg-card border border-border rounded-lg p-4 hover:border-primary/30 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <AlertTriangle
                      className={`w-4 h-4 ${vuln.severity === "critical"
                        ? "text-destructive"
                        : vuln.severity === "high"
                          ? "text-warning"
                          : "text-primary"
                        }`}
                    />
                    <h5 className="text-sm font-medium">{vuln.cve}</h5>
                  </div>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full ${vuln.severity === "critical"
                      ? "bg-destructive/10 text-destructive"
                      : vuln.severity === "high"
                        ? "bg-warning/10 text-warning"
                        : "bg-primary/10 text-primary"
                      }`}
                  >
                    {vuln.severity}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mb-3">{vuln.title}</p>
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-4">
                    <span className="text-muted-foreground">
                      CVSS: <span className="font-medium">{vuln.cvssScore.toFixed(1)}</span>
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded ${vuln.status === "open"
                        ? "bg-destructive/10 text-destructive"
                        : "bg-warning/10 text-warning"
                        }`}
                    >
                      {vuln.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function NetworkInfo({ asset, zones }: { asset: any; zones: any[] }) {
  const zone = zones.find(z => z.id === asset.zoneId);
  return (
    <div className="space-y-6">
      {/* Network Exposure */}
      <div>
        <h4 className="text-sm font-semibold mb-3">Network Exposure</h4>
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center gap-4 mb-4">
            <div
              className={`w-12 h-12 rounded-lg flex items-center justify-center ${asset.networkExposure === "internal"
                ? "bg-success/10"
                : asset.networkExposure === "dmz"
                  ? "bg-warning/10"
                  : "bg-destructive/10"
                }`}
            >
              <Network
                className={`w-6 h-6 ${asset.networkExposure === "internal"
                  ? "text-success"
                  : asset.networkExposure === "dmz"
                    ? "text-warning"
                    : "text-destructive"
                  }`}
              />
            </div>
            <div>
              <p className="text-sm font-medium capitalize">{asset.networkExposure} Network</p>
              <p className="text-xs text-muted-foreground mt-1">
                {asset.networkExposure === "internal"
                  ? "Protected internal network"
                  : asset.networkExposure === "dmz"
                    ? "Demilitarized zone - limited exposure"
                    : "External network - high exposure"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Zone Information */}
      <div>
        <h4 className="text-sm font-semibold mb-3">Zone Information</h4>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-3 mb-4">
            <Network className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">{zone?.name || 'Unknown Zone'}</p>
              <p className="text-xs text-muted-foreground">
                {zone?.zoneType?.toUpperCase() || 'UNKNOWN'} Zone • Level {zone?.securityLevel || 'N/A'}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Zone Compliance:</span>
              <p className="font-medium">
                <StatusBadge
                  status={zone?.complianceStatus || 'unknown'}
                />
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">Active Policies:</span>
              <p className="font-medium">{zone?.policies?.length || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Network Connections */}
      <div>
        <h4 className="text-sm font-semibold mb-3">Network Connections</h4>
        <div className="bg-card border border-border rounded-lg divide-y divide-border">
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Network className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Primary Network</p>
                <p className="text-xs text-muted-foreground">192.168.1.0/24</p>
              </div>
            </div>
            <CheckCircle2 className="w-4 h-4 text-success" />
          </div>
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Network className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Management Network</p>
                <p className="text-xs text-muted-foreground">10.0.0.0/24</p>
              </div>
            </div>
            <CheckCircle2 className="w-4 h-4 text-success" />
          </div>
        </div>
      </div>

      {/* Firewall Rules */}
      <div>
        <h4 className="text-sm font-semibold mb-3">Firewall Rules</h4>
        <div className="bg-card border border-border rounded-lg divide-y divide-border">
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium">Inbound Rules</p>
              <span className="text-xs text-muted-foreground">3 active</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Restricted access from management network only
            </p>
          </div>
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium">Outbound Rules</p>
              <span className="text-xs text-muted-foreground">2 active</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Limited to essential services only
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function RiskAssessment({
  asset,
}: {
  asset: any;
}) {
  // Mock alerts for this asset (in real implementation, would fetch from Supabase)
  const assetAlerts: any[] = [];

  return (
    <div className="space-y-6">
      {/* Risk Score Overview */}
      <div>
        <h4 className="text-sm font-semibold mb-3">Risk Score Overview</h4>
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center gap-4 mb-4">
            <div
              className={`w-16 h-16 rounded-lg flex items-center justify-center ${asset.riskScore >= 70
                ? "bg-destructive/10"
                : asset.riskScore >= 40
                  ? "bg-warning/10"
                  : "bg-success/10"
                }`}
            >
              <span
                className={`text-2xl font-bold ${asset.riskScore >= 70
                  ? "text-destructive"
                  : asset.riskScore >= 40
                    ? "text-warning"
                    : "text-success"
                  }`}
              >
                {asset.riskScore}
              </span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium mb-2">Overall Risk Score</p>
              <div className="h-3 bg-secondary rounded-full overflow-hidden">
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
              <p className="text-xs text-muted-foreground mt-2">
                {asset.riskScore >= 70
                  ? "High risk - immediate attention required"
                  : asset.riskScore >= 40
                    ? "Medium risk - monitor closely"
                    : "Low risk - normal operations"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Risk Factors */}
      <div>
        <h4 className="text-sm font-semibold mb-3">Risk Factors</h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-warning" />
              <p className="text-xs font-medium">Vulnerabilities</p>
            </div>
            <p className="text-2xl font-bold">{asset.vulnerabilityCount}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {asset.vulnerabilityCount === 0 ? "No vulnerabilities" : "Open vulnerabilities"}
            </p>
          </div>

          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-4 h-4 text-destructive" />
              <p className="text-xs font-medium">Active Alerts</p>
            </div>
            <p className="text-2xl font-bold">{asset.openAlerts}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {asset.openAlerts === 0 ? "No active alerts" : "Security alerts"}
            </p>
          </div>

          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-4 h-4 text-primary" />
              <p className="text-xs font-medium">Criticality</p>
            </div>
            <p className="text-sm font-medium capitalize">{asset.criticality}</p>
            <p className="text-xs text-muted-foreground mt-1">Asset importance level</p>
          </div>

          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Network className="w-4 h-4 text-muted-foreground" />
              <p className="text-xs font-medium">Network Exposure</p>
            </div>
            <p className="text-sm font-medium capitalize">{asset.networkExposure}</p>
            <p className="text-xs text-muted-foreground mt-1">Network accessibility</p>
          </div>
        </div>
      </div>

      {/* Related Security Alerts */}
      <div>
        <h4 className="text-sm font-semibold mb-3">
          Related Security Alerts ({assetAlerts.length})
        </h4>
        {assetAlerts.length === 0 ? (
          <div className="bg-card border border-border rounded-lg p-8 text-center">
            <CheckCircle2 className="w-12 h-12 text-success mx-auto mb-3" />
            <p className="text-sm font-medium">No Active Alerts</p>
            <p className="text-xs text-muted-foreground mt-1">
              This asset has no active security alerts
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {assetAlerts.map((alert) => (
              <div
                key={alert.id}
                className="bg-card border border-border rounded-lg p-4 hover:border-primary/30 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <AlertCircle
                      className={`w-4 h-4 ${alert.severity === "critical"
                        ? "text-destructive"
                        : alert.severity === "high"
                          ? "text-warning"
                          : "text-primary"
                        }`}
                    />
                    <h5 className="text-sm font-medium">{alert.title}</h5>
                  </div>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full ${alert.severity === "critical"
                      ? "bg-destructive/10 text-destructive"
                      : alert.severity === "high"
                        ? "bg-warning/10 text-warning"
                        : "bg-primary/10 text-primary"
                      }`}
                  >
                    {alert.severity}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mb-2">{alert.description}</p>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{new Date(alert.timestamp).toLocaleString()}</span>
                  <span>·</span>
                  <span
                    className={`${alert.status === "new"
                      ? "text-warning"
                      : alert.status === "resolved"
                        ? "text-success"
                        : "text-primary"
                      }`}
                  >
                    {alert.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recommendations */}
      <div>
        <h4 className="text-sm font-semibold mb-3">Security Recommendations</h4>
        <div className="bg-card border border-border rounded-lg divide-y divide-border">
          {asset.patchStatus !== "up-to-date" && (
            <div className="p-4 flex items-start gap-3">
              <AlertTriangle className="w-4 h-4 text-warning mt-0.5" />
              <div>
                <p className="text-sm font-medium">Apply Security Patches</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Security patches are {asset.patchStatus}. Update to latest version.
                </p>
              </div>
            </div>
          )}
          {asset.vulnerabilityCount > 0 && (
            <div className="p-4 flex items-start gap-3">
              <AlertTriangle className="w-4 h-4 text-destructive mt-0.5" />
              <div>
                <p className="text-sm font-medium">Address Vulnerabilities</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {asset.vulnerabilityCount} vulnerabilities require attention.
                </p>
              </div>
            </div>
          )}
          {asset.networkExposure === "external" && (
            <div className="p-4 flex items-start gap-3">
              <AlertTriangle className="w-4 h-4 text-destructive mt-0.5" />
              <div>
                <p className="text-sm font-medium">Review Network Exposure</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Asset is exposed to external network. Consider moving to internal network.
                </p>
              </div>
            </div>
          )}
          {asset.inSafetyLoop && (
            <div className="p-4 flex items-start gap-3">
              <Zap className="w-4 h-4 text-destructive mt-0.5" />
              <div>
                <p className="text-sm font-medium">Safety-Critical Asset</p>
                <p className="text-xs text-muted-foreground mt-1">
                  This asset is part of a safety loop. Extra security precautions required.
                </p>
              </div>
            </div>
          )}
          {asset.highPressure && (
            <div className="p-4 flex items-start gap-3">
              <AlertTriangle className="w-4 h-4 text-warning mt-0.5" />
              <div>
                <p className="text-sm font-medium">High Pressure System</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Asset operates under high pressure. Monitor for pressure anomalies.
                </p>
              </div>
            </div>
          )}
          {asset.patchStatus === "up-to-date" &&
            asset.vulnerabilityCount === 0 &&
            asset.networkExposure === "internal" && (
              <div className="p-4 flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-success mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Security Posture Good</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    No immediate security actions required. Continue monitoring.
                  </p>
                </div>
              </div>
            )}
        </div>
      </div>
    </div>
  );
}

function OTAssetInventoryOverview({ assets }: { assets: any[] }) {
  // Calculate metrics
  const totalAssets = assets.length;
  const criticalAssets = assets.filter(a =>
    a.criticality === 'safety-critical' ||
    a.criticality === 'production-critical' ||
    a.criticality === 'high'
  ).length;
  const vulnerableAssets = assets.filter(a => a.securityStatus === 'vulnerable').length;
  const avgRiskScore = assets.length > 0
    ? Math.round(assets.reduce((sum, a) => sum + a.riskScore, 0) / assets.length)
    : 0;

  // Assets by type
  const assetsByType = assets.reduce((acc, asset) => {
    const type = asset.type || 'unknown';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Assets by security status
  const assetsByStatus = assets.reduce((acc, asset) => {
    const status = asset.securityStatus || 'unknown';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Top vulnerable assets
  const topVulnerableAssets = [...assets]
    .filter(a => a.vulnerabilityCount > 0 || a.riskScore >= 50)
    .sort((a, b) => b.riskScore - a.riskScore)
    .slice(0, 5);

  // Prepare chart data
  const typeData = Object.entries(assetsByType)
    .map(([type, count]) => ({
      name: formatAssetType(type),
      value: count
    }))
    .sort((a, b) => (Number(b.value) || 0) - (Number(a.value) || 0))
    .slice(0, 5);

  const statusData = [
    { name: 'Secure', value: assetsByStatus['secure'] || 0, color: 'hsl(var(--success))' },
    { name: 'At Risk', value: assetsByStatus['at-risk'] || 0, color: 'hsl(var(--warning))' },
    { name: 'Vulnerable', value: assetsByStatus['vulnerable'] || 0, color: 'hsl(var(--destructive))' },
  ].filter(d => d.value > 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-8">
      {/* Assets by Type Chart */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <Shield className="w-4 h-4 text-primary" />
          Assets by Type
        </h4>
        <div className="h-[240px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <RechartsBarChart data={typeData} layout="vertical" margin={{ left: 120, right: 20 }}>
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
                {typeData.map((_entry, index) => (
                  <RechartsCell key={`cell-${index}`} fill={`hsl(var(--primary) / ${1 - index * 0.15})`} />
                ))}
              </Bar>
            </RechartsBarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Security Status Distribution Chart */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-primary" />
          Security Status Distribution
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
          <Shield className="w-4 h-4 text-primary" />
          Key Security Areas
        </h4>
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">Asset Criticality</p>
              <p className="text-xs text-muted-foreground">Identify and protect safety-critical and production-critical assets.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center shrink-0">
              <AlertCircle className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">Vulnerability Management</p>
              <p className="text-xs text-muted-foreground">Track and remediate vulnerabilities across OT assets.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">Patch Management</p>
              <p className="text-xs text-muted-foreground">Ensure timely patching of critical OT infrastructure.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Top Vulnerable Assets */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary" />
          Top Vulnerable Assets
        </h4>
        <div className="space-y-4">
          {topVulnerableAssets.length > 0 ? (
            topVulnerableAssets.map((asset) => (
              <div
                key={asset.id}
                className="group flex items-center justify-between p-2 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${asset.securityStatus === 'vulnerable' ? 'bg-destructive' :
                    asset.securityStatus === 'at-risk' ? 'bg-warning' : 'bg-success'
                    }`} />
                  <span className="text-sm font-medium truncate max-w-[150px]">{asset.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{asset.vulnerabilityCount} vuln</span>
                  <span className="text-xs font-bold text-destructive">Risk: {asset.riskScore}</span>
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs text-muted-foreground italic">All assets are secure with no critical vulnerabilities.</p>
          )}
          <div className="pt-2 border-t border-border mt-2">
            <p className="text-xs text-muted-foreground italic">Select an asset from the list to view detailed security information and vulnerabilities.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
