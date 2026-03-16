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
  Cpu,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Activity,
  Wifi,
  Lock,
  Zap,
  Clock,
  TrendingUp,
  AlertCircle,
  HardDrive,
  Network,
} from "lucide-react";
import {
  getUpstreamSitesByTenant,
  getSecurityZonesByTenant,
} from "@/data/upstreamSecurityMockData";
import {
  getOTAssetSecurityWithAssets,
  getSecurityZones,
} from "@/lib/otSecurityQueries";
import { IdentityOverview } from "@/components/security/IdentityOverview";
import {
  PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer,
  BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend,
  Cell as RechartsCell
} from "recharts";
import type { TransmissionAssetType } from "@/types/security";

// IoT field device types for transmission
type IotDeviceType =
  | 'protection-relay'
  | 'meter'
  | 'rtu'
  | 'ied'
  | 'sensor'
  | 'actuator'
  | 'gateway';

type DeviceSecurityStatus =
  | 'secure'
  | 'at-risk'
  | 'vulnerable'
  | 'unknown';

type VulnerabilitySeverity =
  | 'critical'
  | 'high'
  | 'medium'
  | 'low';

// IoT field device interface
interface IotFieldDevice {
  id: string;
  tenantId: string;
  siteId: string;
  siteName: string;
  zoneId: string;
  zoneName: string;
  name: string;
  deviceType: IotDeviceType;
  manufacturer: string;
  model: string;
  firmwareVersion: string;
  latestFirmware: string;
  securityStatus: DeviceSecurityStatus;
  vulnerabilityCount: number;
  criticalVulnerabilities: number;
  highVulnerabilities: number;
  mediumVulnerabilities: number;
  lowVulnerabilities: number;
  securityScore: number; // 0-100
  patchStatus: 'up-to-date' | 'pending' | 'outdated';
  lastSecurityScan: string;
  lastSeen: string;
  ipAddress: string;
  macAddress: string;
  protocol: string;
  encryptionEnabled: boolean;
  authenticationMethod: string;
  certificateExpiry?: string;
  baselineCompliance: number; // 0-100
  anomalyDetected: boolean;
  openAlerts: number;
}

// Device vulnerability interface
interface DeviceVulnerability {
  id: string;
  cveId: string;
  severity: VulnerabilitySeverity;
  title: string;
  description: string;
  cvssScore: number;
  affectedComponent: string;
  patchAvailable: boolean;
  patchVersion?: string;
  detectedAt: string;
  status: 'open' | 'patching' | 'mitigated' | 'accepted';
}

// Mock IoT device data generator
function generateMockIotDevices(tenantId: string, sites: any[], zones: any[]): IotFieldDevice[] {
  const deviceTypes: IotDeviceType[] = ['protection-relay', 'meter', 'rtu', 'ied', 'sensor', 'actuator', 'gateway'];
  const manufacturers = ['Siemens', 'ABB', 'Schneider Electric', 'GE', 'SEL', 'Schweitzer'];
  const models = ['7SA', 'REL670', 'Micom P14x', 'Multilin', 'SEL-351', 'SEL-421'];
  const protocols = ['IEC-61850', 'DNP3', 'Modbus-TCP', 'IEC-60870-5-104'];
  const authMethods = ['Certificate', 'Password', 'MFA', 'Token'];

  const devices: IotFieldDevice[] = [];

  sites.forEach((site, siteIndex) => {
    const siteZones = zones.filter((z: any) => z.siteId === site.id);
    const deviceCount = 8 + (siteIndex * 3); // 8-20 devices per site

    for (let i = 0; i < deviceCount; i++) {
      const deviceType = deviceTypes[i % deviceTypes.length];
      const manufacturer = manufacturers[i % manufacturers.length];
      const model = models[i % models.length];
      const zone = siteZones[i % siteZones.length];

      const isVulnerable = (siteIndex + i) % 7 === 0;
      const isAtRisk = (siteIndex + i) % 4 === 0 && !isVulnerable;
      const hasAnomalies = (siteIndex + i) % 5 === 0;
      const isPatchOutdated = (siteIndex + i) % 6 === 0;

      const criticalVulns = isVulnerable ? 1 + Math.floor(Math.random() * 2) : 0;
      const highVulns = isVulnerable || isAtRisk ? 1 + Math.floor(Math.random() * 3) : 0;
      const mediumVulns = isAtRisk ? 1 + Math.floor(Math.random() * 2) : 0;
      const lowVulns = Math.floor(Math.random() * 2);
      const totalVulns = criticalVulns + highVulns + mediumVulns + lowVulns;

      const securityScore = isVulnerable ? 35 + Math.floor(Math.random() * 20) :
        isAtRisk ? 60 + Math.floor(Math.random() * 15) :
          85 + Math.floor(Math.random() * 15);

      devices.push({
        id: `iot-device-${site.id}-${i + 1}`,
        tenantId,
        siteId: site.id,
        siteName: site.name,
        zoneId: zone?.id || '',
        zoneName: zone?.name || 'Unknown Zone',
        name: `${deviceType.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')} ${i + 1}`,
        deviceType,
        manufacturer,
        model,
        firmwareVersion: isPatchOutdated ? '2.1.0' : '2.4.1',
        latestFirmware: '2.4.1',
        securityStatus: isVulnerable ? 'vulnerable' : isAtRisk ? 'at-risk' : 'secure',
        vulnerabilityCount: totalVulns,
        criticalVulnerabilities: criticalVulns,
        highVulnerabilities: highVulns,
        mediumVulnerabilities: mediumVulns,
        lowVulnerabilities: lowVulns,
        securityScore,
        patchStatus: isPatchOutdated ? 'outdated' : (i % 2 === 0 ? 'up-to-date' : 'pending'),
        lastSecurityScan: new Date(Date.now() - (i * 3600000)).toISOString(),
        lastSeen: new Date(Date.now() - (i * 1800000)).toISOString(),
        ipAddress: `10.${100 + siteIndex}.${10 + Math.floor(i / 10)}.${10 + (i % 10)}`,
        macAddress: `00:1A:2B:${(siteIndex * 10 + i).toString(16).padStart(2, '0').toUpperCase()}:${Math.floor(Math.random() * 256).toString(16).padStart(2, '0').toUpperCase()}:${Math.floor(Math.random() * 256).toString(16).padStart(2, '0').toUpperCase()}`,
        protocol: protocols[i % protocols.length],
        encryptionEnabled: i % 3 !== 0,
        authenticationMethod: authMethods[i % authMethods.length],
        certificateExpiry: i % 2 === 0 ? new Date(Date.now() + ((90 - i * 5) * 24 * 3600000)).toISOString() : undefined,
        baselineCompliance: securityScore,
        anomalyDetected: hasAnomalies,
        openAlerts: isVulnerable ? 2 + Math.floor(Math.random() * 3) : isAtRisk ? 1 : 0,
      });
    }
  });

  return devices;
}

export function IotFieldDeviceSecurity() {
  const { currentTenant } = useApp();
  const [selectedDevice, setSelectedDevice] = useState<IotFieldDevice | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [deviceTypeFilter, setDeviceTypeFilter] = useState<string>("all");
  const [siteFilter, setSiteFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("status");
  // State for data
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [devices, setDevices] = useState<IotFieldDevice[]>([]);
  const [sites, setSites] = useState<any[]>([]);

  // IoT device types to filter for
  const IOT_DEVICE_TYPES = ['sensor', 'actuator', 'meter', 'gateway', 'rtu', 'ied'];

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError(null);

      try {
        const [assetsData, zonesData] = await Promise.all([
          getOTAssetSecurityWithAssets(currentTenant.id),
          getSecurityZones(currentTenant.id)
        ]);

        // Filter and map to IotFieldDevice
        const iotDevices: IotFieldDevice[] = assetsData
          .filter(asset => {
            const type = (asset.asset as any)?.properties?.type?.toLowerCase();
            // Check if it's an IoT device type or if explicitly marked as such
            return type && (IOT_DEVICE_TYPES.includes(type) || (asset.asset as any)?.properties?.category === 'iot');
          })
          .map(asset => {
            const props = (asset.asset as any)?.properties || {};
            const siteId = (asset.asset as any)?.siteId;
            const zone = zonesData.find((z: any) => z.id === asset.zoneId);

            return {
              id: asset.id,
              tenantId: asset.tenantId,
              siteId: siteId || '',
              siteName: (asset.asset as any)?.properties?.siteName || 'Unknown Site',
              zoneId: asset.zoneId || '',
              zoneName: zone?.name || 'Unknown Zone',
              name: (asset.asset as any)?.name || 'Unknown Device',
              deviceType: (props.deviceType || props.type || 'sensor') as IotDeviceType,
              manufacturer: asset.manufacturer || props.manufacturer || 'Unknown',
              model: asset.model || props.model || 'Unknown',
              firmwareVersion: asset.firmwareVersion || props.firmware_version || 'Unknown',
              latestFirmware: 'Latest', // Placeholder
              securityStatus: (asset.securityStatus as DeviceSecurityStatus) || 'unknown',
              vulnerabilityCount: asset.vulnerabilityCount || 0,
              criticalVulnerabilities: 0, // Mock detail for now
              highVulnerabilities: 0,
              mediumVulnerabilities: 0,
              lowVulnerabilities: 0,
              securityScore: asset.riskScore ? (100 - asset.riskScore) : 0, // Invert risk
              patchStatus: (asset.patchStatus as any) || 'unknown',
              lastSecurityScan: asset.lastSecurityScan || new Date().toISOString(),
              lastSeen: new Date().toISOString(), // Mock if not in DB
              ipAddress: '192.168.1.100', // Mock
              macAddress: '00:00:00:00:00:00', // Mock
              protocol: props.protocol || 'Unknown',
              encryptionEnabled: true,
              authenticationMethod: props.authentication || 'Unknown',
              certificateExpiry: undefined,
              baselineCompliance: asset.riskScore ? (100 - asset.riskScore) : 0,
              anomalyDetected: false,
              openAlerts: asset.openAlerts || 0,
            };
          });

        setDevices(iotDevices);

        // Extract sites
        const uniqueSites: any[] = [];
        const seenSiteIds = new Set();
        assetsData.forEach(a => {
          const sId = (a.asset as any)?.siteId;
          const sName = (a.asset as any)?.properties?.siteName;
          if (sId && !seenSiteIds.has(sId)) {
            seenSiteIds.add(sId);
            uniqueSites.push({ id: sId, name: sName || 'Unknown Site' });
          }
        });
        setSites(uniqueSites);

      } catch (err) {
        console.error('Error loading IoT security data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [currentTenant.id]);

  // Filter and sort devices
  const filteredAndSortedDevices = useMemo(() => {
    let result = [...devices];

    // Apply search filter
    if (searchTerm.trim()) {
      const query = searchTerm.toLowerCase();
      result = result.filter(
        (device) =>
          device.name.toLowerCase().includes(query) ||
          device.deviceType.toLowerCase().includes(query) ||
          device.siteName.toLowerCase().includes(query)
      );
    }

    if (statusFilter !== "all") {
      result = result.filter(device => device.securityStatus === statusFilter);
    }

    if (deviceTypeFilter !== "all") {
      result = result.filter(device => device.deviceType === deviceTypeFilter);
    }

    if (siteFilter !== "all") {
      result = result.filter(device => device.siteId === siteFilter);
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === "status") {
        const order = { vulnerable: 0, 'at-risk': 1, secure: 2, unknown: 3 };
        return order[(a.securityStatus as any)] - order[(b.securityStatus as any)];
      }
      if (sortBy === "score") {
        return b.securityScore - a.securityScore;
      }
      if (sortBy === "name") {
        return a.name.localeCompare(b.name);
      }
      return 0;
    });

    return result;
  }, [devices, searchTerm, statusFilter, deviceTypeFilter, siteFilter, sortBy]);

  // Set initial selection
  /*
  useEffect(() => {
    if (!selectedDevice && filteredDevices.length > 0) {
      setSelectedDevice(filteredDevices[0]);
    }
  }, [filteredDevices, selectedDevice]);
  */

  const statusOptions = [
    { value: "all", label: "All Status" },
    { value: "secure", label: "Secure" },
    { value: "at-risk", label: "At Risk" },
    { value: "vulnerable", label: "Vulnerable" },
    { value: "unknown", label: "Unknown" },
  ];

  const deviceTypeOptions = [
    { value: "all", label: "All Device Types" },
    { value: "protection-relay", label: "Protection Relay" },
    { value: "meter", label: "Meter" },
    { value: "rtu", label: "RTU" },
    { value: "ied", label: "IED" },
    { value: "sensor", label: "Sensor" },
    { value: "actuator", label: "Actuator" },
    { value: "gateway", label: "Gateway" },
  ];

  const siteOptions = [
    { value: "all", label: "All Sites" },
    ...sites.map(site => ({ value: site.id, label: site.name }))
  ];

  const filters = [
    {
      key: "status",
      label: "Security Status",
      value: statusFilter,
      onChange: setStatusFilter,
      options: statusOptions,
    },
    {
      key: "deviceType",
      label: "Device Type",
      value: deviceTypeFilter,
      onChange: setDeviceTypeFilter,
      options: deviceTypeOptions,
    },
    {
      key: "site",
      label: "Site",
      value: siteFilter,
      onChange: setSiteFilter,
      options: siteOptions,
    },
  ];

  // Calculate summary stats
  const vulnerableDevices = devices.filter(d => d.securityStatus === 'vulnerable').length;
  const atRiskDevices = devices.filter(d => d.securityStatus === 'at-risk').length;
  const outdatedDevices = devices.filter(d => d.patchStatus === 'outdated').length;
  const avgSecurityScore = devices.length > 0 ? Math.floor(devices.reduce((sum, d) => sum + d.securityScore, 0) / devices.length) : 0;

  const tabs = selectedDevice ? [
    {
      id: "overview",
      label: "Device Overview",
      content: <DeviceOverview device={selectedDevice} />,
    },
    {
      id: "vulnerabilities",
      label: "Vulnerabilities",
      content: <DeviceVulnerabilities device={selectedDevice} />,
    },
    {
      id: "baseline",
      label: "Security Baseline",
      content: <DeviceBaseline device={selectedDevice} />,
    },
    {
      id: "monitoring",
      label: "Monitoring",
      content: <DeviceMonitoring device={selectedDevice} />,
    },
    {
      id: "monitoring",
      label: "Monitoring",
      content: <DeviceMonitoring device={selectedDevice} />,
    },
  ] : [
    {
      id: "overview",
      label: "Overview",
      content: <IotDeviceSecurityOverview devices={filteredAndSortedDevices} />,
    }
  ];



  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <LoadingState loadingText="Loading device security data..." />
      </div>
    );
  }

  return (
    <>
      <ListPane
        title="IoT Field Devices"
        context="DEWA – Transmission"
        count={filteredAndSortedDevices.length}
        searchPlaceholder="Search"
        onSearch={setSearchTerm}
        filters={[
          {
            key: "status", label: "Security Status", value: statusFilter, options: [
              { label: "All Status", value: "all" },
              { label: "Secure", value: "secure" },
              { label: "At Risk", value: "at-risk" },
              { label: "Vulnerable", value: "vulnerable" },
              { label: "Unknown", value: "unknown" },
            ], onChange: setStatusFilter
          },
          {
            key: "deviceType", label: "Device Type", value: deviceTypeFilter, options: [
              { label: "All Device Types", value: "all" },
              { label: "Protection Relay", value: "protection-relay" },
              { label: "Meter", value: "meter" },
              { label: "RTU", value: "rtu" },
              { label: "IED", value: "ied" },
              { label: "Sensor", value: "sensor" },
              { label: "Actuator", value: "actuator" },
              { label: "Gateway", value: "gateway" },
            ], onChange: setDeviceTypeFilter
          },
          {
            key: "site", label: "Site", value: siteFilter, options: [
              { label: "All Sites", value: "all" },
              ...sites.map(site => ({ value: site.id, label: site.name }))
            ], onChange: setSiteFilter
          }
        ]}
        sortOptions={[
          { label: "Security Status", value: "status" },
          { label: "Security Score", value: "score" },
          { label: "Device Name", value: "name" },
        ]}
        sortValue={sortBy}
        onSortChange={setSortBy}
      >
        {filteredAndSortedDevices.length === 0 ? (
          <EmptyState
            icon={Cpu}
            title="No Devices Found"
            description="No IoT field devices match the selected filters"
          />
        ) : (
          filteredAndSortedDevices.map((device) => (
            <ListPaneItem
              key={device.id}
              title={device.name}
              description={`${device.deviceType.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')} • ${device.manufacturer}`}
              status={device.securityStatus === 'secure' ? 'online' : (device.securityStatus === 'vulnerable' ? 'offline' : (device.securityStatus === 'at-risk' ? 'maintenance' : 'pending'))}
              category={device.siteName}
              value={`${device.securityScore}%`}
              isSelected={selectedDevice?.id === device.id}
              onClick={() => setSelectedDevice(device)}
            />
          ))
        )}
      </ListPane>

      {selectedDevice ? (
        <WorkPane
          title={selectedDevice.name}
          subtitle={`${selectedDevice.deviceType.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')} • ${selectedDevice.siteName}`}
          tabs={tabs}
        />
      ) : (
        <WorkPane
          title="IoT Field Devices Overview"
          subtitle="Monitor and manage security for all IoT field devices"
          tabs={tabs}
        />
      )}
    </>
  );
}

function DeviceOverview({ device }: { device: IotFieldDevice }) {
  const daysUntilCertExpiry = device.certificateExpiry
    ? Math.floor((new Date(device.certificateExpiry).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div className="space-y-6">
      {/* Device KPIs */}
      <div className="grid grid-cols-4 gap-4">
        <KPICard
          title="Security Score"
          value={`${device.securityScore}%`}
          subtitle={device.securityStatus}
          icon={Shield}
          variant={
            device.securityScore >= 80 ? "success" :
              device.securityScore >= 60 ? "warning" : "destructive"
          }
        />
        <KPICard
          title="Vulnerabilities"
          value={device.vulnerabilityCount}
          subtitle={`${device.criticalVulnerabilities} critical`}
          icon={device.vulnerabilityCount > 0 ? AlertTriangle : CheckCircle2}
          variant={device.vulnerabilityCount > 0 ? "destructive" : "success"}
        />
        <KPICard
          title="Baseline Compliance"
          value={`${device.baselineCompliance}%`}
          subtitle={device.baselineCompliance >= 90 ? "Compliant" : "Non-compliant"}
          icon={device.baselineCompliance >= 90 ? CheckCircle2 : XCircle}
          variant={device.baselineCompliance >= 90 ? "success" : "warning"}
        />
        <KPICard
          title="Patch Status"
          value={device.patchStatus}
          subtitle={`Current: ${device.firmwareVersion}`}
          icon={Clock}
        />
      </div>

      {/* Device Information */}
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-3">Device Details</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Device Type:</span>
              <span className="font-medium">
                {device.deviceType.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Manufacturer:</span>
              <span>{device.manufacturer}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Model:</span>
              <span>{device.model}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Firmware:</span>
              <span className="font-mono text-xs">{device.firmwareVersion}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Latest Available:</span>
              <span className="font-mono text-xs">{device.latestFirmware}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Site:</span>
              <span>{device.siteName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Zone:</span>
              <span>{device.zoneName}</span>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-3">Network Configuration</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">IP Address:</span>
              <span className="font-mono text-xs">{device.ipAddress}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">MAC Address:</span>
              <span className="font-mono text-xs">{device.macAddress}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Protocol:</span>
              <span>{device.protocol}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Encryption:</span>
              <span className={device.encryptionEnabled ? "text-success" : "text-destructive"}>
                {device.encryptionEnabled ? "Enabled" : "Disabled"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Authentication:</span>
              <span>{device.authenticationMethod}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Last Seen:</span>
              <span>{new Date(device.lastSeen).toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Certificate Status */}
      {device.certificateExpiry && (
        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-3">Certificate Status</h3>
          <div className="flex items-center gap-4">
            <Lock className={`w-8 h-8 ${daysUntilCertExpiry && daysUntilCertExpiry < 30 ? 'text-destructive' :
              daysUntilCertExpiry && daysUntilCertExpiry < 60 ? 'text-warning' : 'text-success'
              }`} />
            <div className="flex-1">
              <p className="text-sm font-medium">
                Certificate expires in {daysUntilCertExpiry} days
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Expiry date: {new Date(device.certificateExpiry).toLocaleDateString()}
              </p>
              {daysUntilCertExpiry && daysUntilCertExpiry < 30 && (
                <p className="text-xs text-destructive mt-2">
                  ⚠️ Certificate renewal required soon
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Security Alerts */}
      {device.openAlerts > 0 && (
        <div className="bg-card border border-destructive/20 rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-destructive" />
            Active Security Alerts ({device.openAlerts})
          </h3>
          <div className="space-y-2">
            {Array.from({ length: Math.min(device.openAlerts, 3) }, (_, i) => (
              <div key={i} className="flex items-start gap-2 text-sm">
                <AlertCircle className="w-4 h-4 text-destructive mt-0.5" />
                <div>
                  <p className="font-medium">Security Alert {i + 1}</p>
                  <p className="text-xs text-muted-foreground">
                    Detected {Math.floor(Math.random() * 24)} hours ago
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Anomaly Detection */}
      {device.anomalyDetected && (
        <div className="bg-card border border-warning/20 rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-warning" />
            Anomaly Detected
          </h3>
          <p className="text-sm text-muted-foreground">
            Unusual behavior patterns detected in device communication. Recommend investigation.
          </p>
        </div>
      )}
    </div>
  );
}

function DeviceVulnerabilities({ device }: { device: IotFieldDevice }) {
  // Mock vulnerability data
  const vulnerabilities: DeviceVulnerability[] = [];

  // Generate critical vulnerabilities
  for (let i = 0; i < device.criticalVulnerabilities; i++) {
    vulnerabilities.push({
      id: `vuln-crit-${i}`,
      cveId: `CVE-2024-${10000 + i}`,
      severity: 'critical',
      title: `Critical Security Vulnerability ${i + 1}`,
      description: `Critical vulnerability in ${device.deviceType} firmware allowing remote code execution`,
      cvssScore: 9.0 + (Math.random() * 0.9),
      affectedComponent: 'Firmware',
      patchAvailable: true,
      patchVersion: device.latestFirmware,
      detectedAt: new Date(Date.now() - (i * 24 * 3600000)).toISOString(),
      status: 'open',
    });
  }

  // Generate high vulnerabilities
  for (let i = 0; i < device.highVulnerabilities; i++) {
    vulnerabilities.push({
      id: `vuln-high-${i}`,
      cveId: `CVE-2024-${20000 + i}`,
      severity: 'high',
      title: `High Priority Vulnerability ${i + 1}`,
      description: `Authentication bypass vulnerability in ${device.protocol} implementation`,
      cvssScore: 7.0 + (Math.random() * 1.9),
      affectedComponent: 'Protocol Stack',
      patchAvailable: i % 2 === 0,
      patchVersion: i % 2 === 0 ? device.latestFirmware : undefined,
      detectedAt: new Date(Date.now() - ((i + 5) * 24 * 3600000)).toISOString(),
      status: i % 3 === 0 ? 'patching' : 'open',
    });
  }

  // Generate medium vulnerabilities
  for (let i = 0; i < device.mediumVulnerabilities; i++) {
    vulnerabilities.push({
      id: `vuln-med-${i}`,
      cveId: `CVE-2024-${30000 + i}`,
      severity: 'medium',
      title: `Medium Priority Vulnerability ${i + 1}`,
      description: `Information disclosure vulnerability in web interface`,
      cvssScore: 4.0 + (Math.random() * 2.9),
      affectedComponent: 'Web Interface',
      patchAvailable: true,
      patchVersion: device.latestFirmware,
      detectedAt: new Date(Date.now() - ((i + 10) * 24 * 3600000)).toISOString(),
      status: i % 2 === 0 ? 'mitigated' : 'open',
    });
  }

  return (
    <div className="space-y-6">
      {/* Vulnerability Summary */}
      <div>
        <h4 className="text-sm font-semibold mb-3">Vulnerability Summary</h4>
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-destructive" />
              <p className="text-xs font-medium">Critical</p>
            </div>
            <p className="text-2xl font-bold">{device.criticalVulnerabilities}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-warning" />
              <p className="text-xs font-medium">High</p>
            </div>
            <p className="text-2xl font-bold">{device.highVulnerabilities}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-4 h-4 text-primary" />
              <p className="text-xs font-medium">Medium</p>
            </div>
            <p className="text-2xl font-bold">{device.mediumVulnerabilities}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-4 h-4 text-muted-foreground" />
              <p className="text-xs font-medium">Low</p>
            </div>
            <p className="text-2xl font-bold">{device.lowVulnerabilities}</p>
          </div>
        </div>
      </div>

      {/* Vulnerability List */}
      <div>
        <h4 className="text-sm font-semibold mb-3">
          Detected Vulnerabilities ({device.vulnerabilityCount})
        </h4>
        {device.vulnerabilityCount === 0 ? (
          <div className="bg-card border border-border rounded-lg p-8 text-center">
            <CheckCircle2 className="w-12 h-12 text-success mx-auto mb-3" />
            <p className="text-sm font-medium">No Vulnerabilities Detected</p>
            <p className="text-xs text-muted-foreground mt-1">
              This device has no known security vulnerabilities
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
                      className={`w-4 h-4 ${vuln.severity === 'critical' ? 'text-destructive' :
                        vuln.severity === 'high' ? 'text-warning' :
                          vuln.severity === 'medium' ? 'text-primary' : 'text-muted-foreground'
                        }`}
                    />
                    <h5 className="text-sm font-medium">{vuln.cveId}</h5>
                  </div>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full ${vuln.severity === 'critical' ? 'bg-destructive/10 text-destructive' :
                      vuln.severity === 'high' ? 'bg-warning/10 text-warning' :
                        vuln.severity === 'medium' ? 'bg-primary/10 text-primary' :
                          'bg-secondary text-muted-foreground'
                      }`}
                  >
                    {vuln.severity}
                  </span>
                </div>
                <p className="text-sm font-medium mb-1">{vuln.title}</p>
                <p className="text-xs text-muted-foreground mb-3">{vuln.description}</p>
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-4">
                    <span className="text-muted-foreground">
                      CVSS: <span className="font-medium">{vuln.cvssScore.toFixed(1)}</span>
                    </span>
                    <span className="text-muted-foreground">
                      Component: <span className="font-medium">{vuln.affectedComponent}</span>
                    </span>
                    {vuln.patchAvailable && (
                      <span className="text-success">
                        Patch available: {vuln.patchVersion}
                      </span>
                    )}
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded ${vuln.status === 'open' ? 'bg-destructive/10 text-destructive' :
                      vuln.status === 'patching' ? 'bg-warning/10 text-warning' :
                        vuln.status === 'mitigated' ? 'bg-success/10 text-success' :
                          'bg-secondary text-muted-foreground'
                      }`}
                  >
                    {vuln.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function DeviceBaseline({ device }: { device: IotFieldDevice }) {
  // Mock baseline checks
  const baselineChecks = [
    {
      category: 'Configuration',
      checks: [
        { name: 'Default passwords changed', status: 'pass', severity: 'critical' },
        { name: 'Unused services disabled', status: device.securityScore < 70 ? 'fail' : 'pass', severity: 'high' },
        { name: 'Secure boot enabled', status: 'pass', severity: 'high' },
        { name: 'Debug mode disabled', status: device.securityScore < 80 ? 'fail' : 'pass', severity: 'medium' },
      ]
    },
    {
      category: 'Network Security',
      checks: [
        { name: 'Encryption enabled', status: device.encryptionEnabled ? 'pass' : 'fail', severity: 'critical' },
        { name: 'Strong authentication', status: device.authenticationMethod !== 'Password' ? 'pass' : 'fail', severity: 'high' },
        { name: 'Firewall configured', status: 'pass', severity: 'high' },
        { name: 'Port security enabled', status: device.securityScore >= 80 ? 'pass' : 'fail', severity: 'medium' },
      ]
    },
    {
      category: 'Software Security',
      checks: [
        { name: 'Firmware up to date', status: device.patchStatus === 'up-to-date' ? 'pass' : 'fail', severity: 'critical' },
        { name: 'Security patches applied', status: device.patchStatus !== 'outdated' ? 'pass' : 'fail', severity: 'high' },
        { name: 'Code signing verified', status: 'pass', severity: 'high' },
        { name: 'Anti-malware enabled', status: device.securityScore >= 75 ? 'pass' : 'fail', severity: 'medium' },
      ]
    },
    {
      category: 'Access Control',
      checks: [
        { name: 'Role-based access control', status: 'pass', severity: 'high' },
        { name: 'Session timeout configured', status: 'pass', severity: 'medium' },
        { name: 'Audit logging enabled', status: 'pass', severity: 'high' },
        { name: 'Failed login lockout', status: device.securityScore >= 70 ? 'pass' : 'fail', severity: 'medium' },
      ]
    },
  ];

  const totalChecks = baselineChecks.reduce((sum, cat) => sum + cat.checks.length, 0);
  const passedChecks = baselineChecks.reduce((sum, cat) =>
    sum + cat.checks.filter(c => c.status === 'pass').length, 0);

  return (
    <div className="space-y-6">
      {/* Baseline Compliance Score */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-sm font-semibold mb-4">Baseline Compliance Score</h3>
        <div className="flex items-center gap-4">
          <div className={`w-20 h-20 rounded-lg flex items-center justify-center ${device.baselineCompliance >= 90 ? 'bg-success/10' :
            device.baselineCompliance >= 70 ? 'bg-warning/10' : 'bg-destructive/10'
            }`}>
            <span className={`text-3xl font-bold ${device.baselineCompliance >= 90 ? 'text-success' :
              device.baselineCompliance >= 70 ? 'text-warning' : 'text-destructive'
              }`}>
              {device.baselineCompliance}
            </span>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium mb-2">
              {device.baselineCompliance >= 90 ? 'Compliant' :
                device.baselineCompliance >= 70 ? 'Partially Compliant' : 'Non-Compliant'}
            </p>
            <div className="h-3 bg-secondary rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${device.baselineCompliance >= 90 ? 'bg-success' :
                  device.baselineCompliance >= 70 ? 'bg-warning' : 'bg-destructive'
                  }`}
                style={{ width: `${device.baselineCompliance}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {passedChecks} of {totalChecks} baseline checks passed
            </p>
          </div>
        </div>
      </div>

      {/* Baseline Checks by Category */}
      {baselineChecks.map((category, catIndex) => (
        <div key={catIndex}>
          <h4 className="text-sm font-semibold mb-3">{category.category}</h4>
          <div className="space-y-2">
            {category.checks.map((check, checkIndex) => (
              <div
                key={checkIndex}
                className="bg-card border border-border rounded-lg p-3 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  {check.status === 'pass' ? (
                    <CheckCircle2 className="w-4 h-4 text-success" />
                  ) : (
                    <XCircle className="w-4 h-4 text-destructive" />
                  )}
                  <div>
                    <p className="text-sm font-medium">{check.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Severity: {check.severity}
                    </p>
                  </div>
                </div>
                <span
                  className={`text-xs px-3 py-1 rounded-full ${check.status === 'pass'
                    ? 'bg-success/10 text-success'
                    : 'bg-destructive/10 text-destructive'
                    }`}
                >
                  {check.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function DeviceMonitoring({ device }: { device: IotFieldDevice }) {
  // Mock monitoring metrics
  const metrics = {
    cpuUsage: 35 + Math.floor(Math.random() * 40),
    memoryUsage: 45 + Math.floor(Math.random() * 35),
    networkTraffic: 50 + Math.floor(Math.random() * 150), // Kbps
    uptime: 30 + Math.floor(Math.random() * 300), // days
    messageRate: 10 + Math.floor(Math.random() * 90), // messages/sec
    errorRate: Math.random() * 2, // percentage
  };

  return (
    <div className="space-y-6">
      {/* Performance Metrics */}
      <div>
        <h4 className="text-sm font-semibold mb-3">Performance Metrics</h4>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Cpu className="w-4 h-4 text-primary" />
              <p className="text-xs font-medium">CPU Usage</p>
            </div>
            <p className="text-2xl font-bold">{metrics.cpuUsage}%</p>
            <div className="mt-2 h-2 bg-secondary rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${metrics.cpuUsage > 80 ? 'bg-destructive' :
                  metrics.cpuUsage > 60 ? 'bg-warning' : 'bg-success'
                  }`}
                style={{ width: `${metrics.cpuUsage}%` }}
              />
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <HardDrive className="w-4 h-4 text-primary" />
              <p className="text-xs font-medium">Memory Usage</p>
            </div>
            <p className="text-2xl font-bold">{metrics.memoryUsage}%</p>
            <div className="mt-2 h-2 bg-secondary rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${metrics.memoryUsage > 80 ? 'bg-destructive' :
                  metrics.memoryUsage > 60 ? 'bg-warning' : 'bg-success'
                  }`}
                style={{ width: `${metrics.memoryUsage}%` }}
              />
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Network className="w-4 h-4 text-primary" />
              <p className="text-xs font-medium">Network Traffic</p>
            </div>
            <p className="text-2xl font-bold">{metrics.networkTraffic}</p>
            <p className="text-xs text-muted-foreground mt-1">Kbps</p>
          </div>
        </div>
      </div>

      {/* Communication Metrics */}
      <div>
        <h4 className="text-sm font-semibold mb-3">Communication Metrics</h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-4 h-4 text-success" />
              <p className="text-xs font-medium">Message Rate</p>
            </div>
            <p className="text-2xl font-bold">{metrics.messageRate}</p>
            <p className="text-xs text-muted-foreground mt-1">messages/sec</p>
          </div>

          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-warning" />
              <p className="text-xs font-medium">Error Rate</p>
            </div>
            <p className="text-2xl font-bold">{metrics.errorRate.toFixed(2)}%</p>
            <p className="text-xs text-muted-foreground mt-1">
              {metrics.errorRate < 1 ? 'Normal' : 'Elevated'}
            </p>
          </div>
        </div>
      </div>

      {/* Uptime & Availability */}
      <div className="bg-card border border-border rounded-lg p-4">
        <h3 className="text-sm font-semibold mb-3">Uptime & Availability</h3>
        <div className="flex items-center gap-4">
          <Clock className="w-8 h-8 text-success" />
          <div className="flex-1">
            <p className="text-sm font-medium">
              {metrics.uptime} days uptime
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              99.{Math.floor(95 + Math.random() * 4)}% availability
            </p>
            <div className="mt-3 h-2 bg-secondary rounded-full overflow-hidden">
              <div className="h-full bg-success rounded-full" style={{ width: '99.9%' }} />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Events */}
      <div>
        <h4 className="text-sm font-semibold mb-3">Recent Monitoring Events</h4>
        <div className="space-y-2">
          {device.vulnerabilityCount > 0 && (
            <div className="bg-card border border-destructive/20 rounded-lg p-3">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-4 h-4 text-destructive mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-destructive">
                    {device.vulnerabilityCount} Vulnerabilities Detected
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Last scan: {new Date(device.lastSecurityScan).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          )}

          {device.patchStatus === 'outdated' && (
            <div className="bg-card border border-warning/20 rounded-lg p-3">
              <div className="flex items-start gap-3">
                <Clock className="w-4 h-4 text-warning mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-warning">Firmware Update Available</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Version {device.latestFirmware} available (current: {device.firmwareVersion})
                  </p>
                </div>
              </div>
            </div>
          )}

          {device.anomalyDetected && (
            <div className="bg-card border border-warning/20 rounded-lg p-3">
              <div className="flex items-start gap-3">
                <TrendingUp className="w-4 h-4 text-warning mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-warning">Anomaly Detected</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Unusual communication patterns detected
                  </p>
                </div>
              </div>
            </div>
          )}

          {device.securityStatus === 'secure' && device.vulnerabilityCount === 0 && !device.anomalyDetected && (
            <div className="bg-card border border-success/20 rounded-lg p-3">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-success mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-success">All Systems Operational</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    No monitoring issues detected
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function IotDeviceSecurityOverview({ devices }: { devices: IotFieldDevice[] }) {
  const devicesByType = devices.reduce((acc, device) => {
    const type = device.deviceType || 'unknown';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const devicesByStatus = devices.reduce((acc, device) => {
    const status = device.securityStatus || 'unknown';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topVulnerableDevices = [...devices]
    .filter(d => d.vulnerabilityCount > 0)
    .sort((a, b) => b.vulnerabilityCount - a.vulnerabilityCount)
    .slice(0, 5);

  const typeData = Object.entries(devicesByType)
    .map(([type, count]) => ({
      name: type.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
      value: count
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  const statusData = [
    { name: 'Secure', value: devicesByStatus['secure'] || 0, color: 'hsl(var(--success))' },
    { name: 'At Risk', value: devicesByStatus['at-risk'] || 0, color: 'hsl(var(--warning))' },
    { name: 'Vulnerable', value: devicesByStatus['vulnerable'] || 0, color: 'hsl(var(--destructive))' },
  ].filter(d => d.value > 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-8">
      <div className="bg-card border border-border rounded-lg p-6">
        <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <Shield className="w-4 h-4 text-primary" />
          Security Status Distribution
        </h4>
        <div className="h-[240px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <RechartsPieChart>
              <Pie data={statusData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <RechartsTooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
              <Legend layout="vertical" align="right" verticalAlign="middle" />
            </RechartsPieChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="bg-card border border-border rounded-lg p-6">
        <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <Cpu className="w-4 h-4 text-primary" />
          Devices by Type
        </h4>
        <div className="h-[240px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <RechartsBarChart data={typeData} layout="vertical" margin={{ left: 100, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} opacity={0.3} />
              <XAxis type="number" hide domain={[0, 'auto']} />
              <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <RechartsTooltip cursor={{ fill: 'hsl(var(--muted)/0.1)' }} contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {typeData.map((_entry, index) => (
                  <RechartsCell key={`cell-${index}`} fill={`hsl(var(--primary) / ${1 - index * 0.15})`} />
                ))}
              </Bar>
            </RechartsBarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="bg-card border border-border rounded-lg p-6">
        <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <Shield className="w-4 h-4 text-primary" />
          Key Security Areas
        </h4>
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center shrink-0">
              <Wifi className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">Device Authentication</p>
              <p className="text-xs text-muted-foreground">Ensure all IoT devices use strong authentication methods.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center shrink-0">
              <Lock className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">Encryption</p>
              <p className="text-xs text-muted-foreground">Enable encryption for all device communications.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">Firmware Management</p>
              <p className="text-xs text-muted-foreground">Keep device firmware up-to-date with latest security patches.</p>
            </div>
          </div>
        </div>
      </div>
      <div className="bg-card border border-border rounded-lg p-6">
        <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary" />
          Top Vulnerable Devices
        </h4>
        <div className="space-y-4">
          {topVulnerableDevices.length > 0 ? (
            topVulnerableDevices.map((device) => (
              <div key={device.id} className="group flex items-center justify-between p-2 border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${device.securityStatus === 'vulnerable' ? 'bg-destructive' : 'bg-warning'}`} />
                  <span className="text-sm font-medium truncate max-w-[120px]">{device.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{device.vulnerabilityCount} vuln</span>
                  <span className="text-xs font-bold">{device.securityScore}%</span>
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs text-muted-foreground italic">All devices are secure with no vulnerabilities.</p>
          )}
          <div className="pt-2 border-t border-border mt-2">
            <p className="text-xs text-muted-foreground italic">Select a device from the list to view detailed security information.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
