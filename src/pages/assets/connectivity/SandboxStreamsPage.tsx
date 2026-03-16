/**
 * Sandbox Streams Page
 * Route: /assets/connectivity/sandbox
 * 
 * Lists sandbox stream configs (is_sandbox=true).
 * Client-side simulated telemetry generation.
 * "SANDBOX" badge on simulated data.
 * 
 * Requirements: 4.10
 */

import { useState, useEffect, useMemo } from 'react';
import { useDataProvider } from '@/hooks/useDataProvider';
import type { StreamConfig } from '@/types/transmission';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { LoadingState } from '@/components/shared/LoadingState';
import { EmptyState } from '@/components/shared/EmptyState';
import { Play, Pause, RefreshCw, AlertCircle, Database } from 'lucide-react';
import { ListPane } from '@/components/layout/ListPane';
import { WorkPane } from '@/components/layout/WorkPane';

interface SimulatedDataPoint {
  timestamp: string;
  metric: string;
  value: number;
  unit: string;
}

// Helper to format values based on unit type
const formatValue = (value: number, unit: string): string => {
  if (unit === 'bool') return value === 1 ? 'CLOSED' : 'OPEN';
  if (unit === 'count' || unit === 'step') return Math.round(value).toString();
  if (unit === '%' || unit === 'hPa' || unit === 'ppm') return value.toFixed(1);
  if (unit === 'ms') return Math.round(value).toString();
  return value.toFixed(2);
};

export default function SandboxStreamsPage() {
  const { provider } = useDataProvider();
  const [tenantId, setTenantId] = useState<string>('');
  const [sandboxConfigs, setSandboxConfigs] = useState<StreamConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedConfigId, setSelectedConfigId] = useState<string>('');
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulatedData, setSimulatedData] = useState<SimulatedDataPoint[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [profileFilter, setProfileFilter] = useState<string>('all');

  // Load tenant ID
  useEffect(() => {
    const loadTenant = async () => {
      try {
        const id = await provider.getDefaultTransmissionTenantId();
        setTenantId(id);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load tenant');
      }
    };
    loadTenant();
  }, [provider]);

  // Load sandbox stream configs
  useEffect(() => {
    if (!tenantId) return;

    const loadSandboxConfigs = async () => {
      setLoading(true);
      setError(null);
      try {
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Create rich mock sandbox data
        const mockSandboxConfigs: StreamConfig[] = [
          {
            id: 'sandbox-1',
            tenantId,
            name: 'High-Frequency Protection Monitoring',
            pollingInterval: 1000,
            retention: '7d',
            profile: 'high-frequency',
            assetTypes: ['circuit-breaker', 'relay'],
            isSandbox: true,
            description: 'Real-time monitoring for critical protection devices with 1-second polling',
            createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          },
          {
            id: 'sandbox-2',
            tenantId,
            name: 'Transformer Health Analytics',
            pollingInterval: 15000,
            retention: '30d',
            profile: 'standard',
            assetTypes: ['transformer'],
            isSandbox: true,
            description: 'Standard monitoring for transformer temperature, load, and oil quality',
            createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
          },
          {
            id: 'sandbox-3',
            tenantId,
            name: 'Substation Environmental Monitoring',
            pollingInterval: 300000,
            retention: '90d',
            profile: 'low-frequency',
            assetTypes: ['sensor'],
            isSandbox: true,
            description: 'Long-term environmental data collection for ambient conditions',
            createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          },
          {
            id: 'sandbox-4',
            tenantId,
            name: 'SCADA Integration Test Stream',
            pollingInterval: 5000,
            retention: '30d',
            profile: 'standard',
            assetTypes: ['rtu', 'ied'],
            isSandbox: true,
            description: 'Testing SCADA data integration with 5-second polling interval',
            createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          },
          {
            id: 'sandbox-5',
            tenantId,
            name: 'Voltage Regulator Performance',
            pollingInterval: 10000,
            retention: '30d',
            profile: 'standard',
            assetTypes: ['voltage-regulator'],
            isSandbox: true,
            description: 'Monitoring tap position, load current, and voltage levels',
            createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          },
        ];

        setSandboxConfigs(mockSandboxConfigs);
        if (mockSandboxConfigs.length > 0 && !selectedConfigId) {
          setSelectedConfigId(mockSandboxConfigs[0].id);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load sandbox configs');
      } finally {
        setLoading(false);
      }
    };

    loadSandboxConfigs();
  }, [provider, tenantId]);

  // Filter configs
  const filteredConfigs = useMemo(() => {
    let filtered = sandboxConfigs;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (config) =>
          config.name.toLowerCase().includes(query) ||
          config.profile.toLowerCase().includes(query)
      );
    }

    if (profileFilter !== 'all') {
      filtered = filtered.filter((config) => config.profile === profileFilter);
    }

    return filtered;
  }, [sandboxConfigs, searchQuery, profileFilter]);

  // Set initial selected config
  useMemo(() => {
    if (filteredConfigs.length > 0 && !selectedConfigId) {
      setSelectedConfigId(filteredConfigs[0].id);
    }
  }, [filteredConfigs, selectedConfigId]);

  const selectedConfig = sandboxConfigs.find((c) => c.id === selectedConfigId);

  // Simulate data generation with varied metrics based on config
  useEffect(() => {
    if (!isSimulating || !selectedConfigId) return;

    const config = sandboxConfigs.find((c) => c.id === selectedConfigId);
    if (!config) return;

    // Define metrics based on config name/type
    const getMetricsForConfig = (configName: string): Array<{ metric: string; baseValue: number; variance: number; unit: string }> => {
      if (configName.includes('Protection')) {
        return [
          { metric: 'Breaker Status', baseValue: 1, variance: 0, unit: 'bool' },
          { metric: 'Trip Coil Current', baseValue: 0.5, variance: 0.1, unit: 'A' },
          { metric: 'Phase A Voltage', baseValue: 138, variance: 2, unit: 'kV' },
          { metric: 'Phase B Voltage', baseValue: 138, variance: 2, unit: 'kV' },
          { metric: 'Phase C Voltage', baseValue: 138, variance: 2, unit: 'kV' },
        ];
      } else if (configName.includes('Transformer')) {
        return [
          { metric: 'Top Oil Temperature', baseValue: 65, variance: 5, unit: '°C' },
          { metric: 'Winding Temperature', baseValue: 75, variance: 8, unit: '°C' },
          { metric: 'Load Current', baseValue: 450, variance: 50, unit: 'A' },
          { metric: 'Oil Level', baseValue: 95, variance: 2, unit: '%' },
          { metric: 'Dissolved Gas (H2)', baseValue: 120, variance: 15, unit: 'ppm' },
        ];
      } else if (configName.includes('Environmental')) {
        return [
          { metric: 'Ambient Temperature', baseValue: 22, variance: 3, unit: '°C' },
          { metric: 'Humidity', baseValue: 55, variance: 10, unit: '%' },
          { metric: 'Atmospheric Pressure', baseValue: 1013, variance: 5, unit: 'hPa' },
        ];
      } else if (configName.includes('SCADA')) {
        return [
          { metric: 'RTU Communication Status', baseValue: 1, variance: 0, unit: 'bool' },
          { metric: 'Data Quality', baseValue: 98, variance: 2, unit: '%' },
          { metric: 'Message Latency', baseValue: 45, variance: 15, unit: 'ms' },
          { metric: 'Active Alarms', baseValue: 2, variance: 1, unit: 'count' },
        ];
      } else if (configName.includes('Voltage Regulator')) {
        return [
          { metric: 'Tap Position', baseValue: 8, variance: 2, unit: 'step' },
          { metric: 'Load Current', baseValue: 180, variance: 25, unit: 'A' },
          { metric: 'Primary Voltage', baseValue: 13.2, variance: 0.3, unit: 'kV' },
          { metric: 'Secondary Voltage', baseValue: 12.47, variance: 0.2, unit: 'kV' },
        ];
      }
      return [
        { metric: 'Generic Metric', baseValue: 100, variance: 10, unit: 'units' },
      ];
    };

    const metrics = getMetricsForConfig(config.name);
    let metricIndex = 0;

    const interval = setInterval(() => {
      const currentMetric = metrics[metricIndex % metrics.length];
      const value = currentMetric.unit === 'bool' 
        ? Math.random() > 0.95 ? 0 : 1
        : currentMetric.unit === 'count'
        ? Math.max(0, Math.round(currentMetric.baseValue + (Math.random() * 2 - 1) * currentMetric.variance))
        : currentMetric.baseValue + (Math.random() * 2 - 1) * currentMetric.variance;

      const newDataPoint: SimulatedDataPoint = {
        timestamp: new Date().toISOString(),
        metric: currentMetric.metric,
        value: value,
        unit: currentMetric.unit,
      };
      
      setSimulatedData((prev) => [newDataPoint, ...prev].slice(0, 50));
      metricIndex++;
    }, config.pollingInterval);

    return () => clearInterval(interval);
  }, [isSimulating, selectedConfigId, sandboxConfigs]);

  const handleStartSimulation = () => {
    setIsSimulating(true);
    setSimulatedData([]);
  };

  const handleStopSimulation = () => {
    setIsSimulating(false);
  };

  const handleClearData = () => {
    setSimulatedData([]);
  };

  const formatPollingInterval = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${ms / 1000}s`;
    return `${ms / 60000}m`;
  };

  if (loading) {
    return <LoadingState isLoading={true} loadingText="Loading sandbox streams..." />;
  }

  if (error) {
    return (
      <>
        <ListPane title="Sandbox Streams" subtitle="Error loading data" count={0}>
          <EmptyState title="Error" description={error} />
        </ListPane>
        <WorkPane title="Sandbox Streams" subtitle="Error loading data" tabs={[]} />
      </>
    );
  }

  if (sandboxConfigs.length === 0) {
    return (
      <>
        <ListPane title="Sandbox Streams" subtitle="No sandbox streams available" count={0}>
          <EmptyState
            title="No sandbox streams found"
            description="Create a stream config with sandbox mode enabled to simulate telemetry data"
          />
        </ListPane>
        <WorkPane title="Sandbox Streams" subtitle="No data available" tabs={[]} />
      </>
    );
  }

  const tabs = selectedConfig
    ? [
      {
        id: 'simulation',
        label: 'Simulation',
        content: (
          <SimulationTab
            config={selectedConfig}
            isSimulating={isSimulating}
            simulatedData={simulatedData}
            onStart={handleStartSimulation}
            onStop={handleStopSimulation}
            onClear={handleClearData}
          />
        ),
      },
      {
        id: 'info',
        label: 'Information',
        content: <InfoTab config={selectedConfig} />,
      },
    ]
    : [];

  return (
    <>
      <ListPane
        title="Sandbox Streams"
        subtitle={`${filteredConfigs.length} total sandbox streams`}
        count={filteredConfigs.length}
        searchPlaceholder="Search sandbox streams..."
        onSearch={setSearchQuery}
        showExpandableFilters={true}
        filters={[
          {
            key: 'profile',
            label: 'Profile',
            value: profileFilter,
            onChange: setProfileFilter,
            options: [
              { value: 'all', label: 'All Profiles' },
              { value: 'high-frequency', label: 'High Frequency' },
              { value: 'standard', label: 'Standard' },
              { value: 'low-frequency', label: 'Low Frequency' },
            ],
          },
        ]}
      >
        {filteredConfigs.length === 0 ? (
          <EmptyState
            title="No sandbox streams found"
            description="Adjust your search or create new sandbox streams"
          />
        ) : (
          filteredConfigs.map((config) => (
            <div
              key={config.id}
              onClick={() => setSelectedConfigId(config.id)}
              className={`p-3 rounded-lg border cursor-pointer transition-all ${selectedConfigId === config.id
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/30 bg-card'
                }`}
            >
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Database className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium truncate min-w-0 flex-1">{config.name}</p>
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 shrink-0">
                      SANDBOX
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {config.profile} • {formatPollingInterval(config.pollingInterval)}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 shrink-0">
                      {config.retention}
                    </Badge>
                    {selectedConfigId === config.id && isSimulating && (
                      <Badge variant="default" className="text-[10px] px-1.5 py-0 shrink-0">
                        Simulating
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </ListPane>

      {selectedConfig && (
        <WorkPane
          title={selectedConfig.name}
          subtitle={
            <div className="flex items-center gap-2">
              <Badge variant="secondary">SANDBOX</Badge>
              <span>Simulated telemetry stream</span>
            </div>
          }
          tabs={tabs}
        />
      )}
    </>
  );
}

function SimulationTab({
  config,
  isSimulating,
  simulatedData,
  onStart,
  onStop,
  onClear,
}: {
  config: StreamConfig;
  isSimulating: boolean;
  simulatedData: SimulatedDataPoint[];
  onStart: () => void;
  onStop: () => void;
  onClear: () => void;
}) {
  const formatPollingInterval = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${ms / 1000}s`;
    return `${ms / 60000}m`;
  };

  return (
    <div className="space-y-6">
      <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
            <div>
              <p className="font-medium text-yellow-900 dark:text-yellow-100">
                Sandbox Environment
              </p>
              <p className="text-sm text-yellow-800 dark:text-yellow-200 mt-1">
                All data shown here is simulated for demo and testing purposes. This data is
                generated client-side and is not persisted.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Simulation Controls</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            {!isSimulating ? (
              <Button onClick={onStart}>
                <Play className="mr-2 h-4 w-4" />
                Start Simulation
              </Button>
            ) : (
              <Button onClick={onStop} variant="destructive">
                <Pause className="mr-2 h-4 w-4" />
                Stop Simulation
              </Button>
            )}
            <Button onClick={onClear} variant="outline" disabled={simulatedData.length === 0}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Clear Data
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Polling interval: {formatPollingInterval(config.pollingInterval)}
          </p>
        </CardContent>
      </Card>

      {simulatedData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Simulated Telemetry Data
              <Badge variant="secondary">SANDBOX</Badge>
              <Badge variant="outline" className="ml-auto">
                {simulatedData.length} points
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4 p-3 bg-muted rounded-lg">
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Data Points</p>
                  <p className="font-semibold">{simulatedData.length}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Unique Metrics</p>
                  <p className="font-semibold">
                    {new Set(simulatedData.map(d => d.metric)).size}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Update Rate</p>
                  <p className="font-semibold">{formatPollingInterval(config.pollingInterval)}</p>
                </div>
              </div>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Metric</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Unit</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {simulatedData.map((point, index) => (
                  <TableRow key={index} className={index === 0 ? 'bg-primary/5' : ''}>
                    <TableCell className="font-mono text-xs">
                      {new Date(point.timestamp).toLocaleTimeString()}
                    </TableCell>
                    <TableCell className="font-medium">{point.metric}</TableCell>
                    <TableCell className="font-mono">
                      {formatValue(point.value, point.unit)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {point.unit}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <p className="text-sm text-muted-foreground mt-4">
              Showing {simulatedData.length} most recent data points • Auto-scrolling enabled
            </p>
          </CardContent>
        </Card>
      )}

      {simulatedData.length === 0 && !isSimulating && (
        <Card>
          <CardContent className="pt-6">
            <EmptyState
              title="No simulation data yet"
              description="Click 'Start Simulation' to begin generating telemetry data"
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function InfoTab({ config }: { config: StreamConfig }) {
  const formatPollingInterval = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${ms / 1000}s`;
    return `${ms / 60000}m`;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Stream Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Name</p>
              <p className="text-sm">{config.name}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Profile</p>
              <Badge variant="outline">{config.profile}</Badge>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Polling Interval</p>
              <p className="text-sm">{formatPollingInterval(config.pollingInterval)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Retention</p>
              <Badge variant="outline">{config.retention}</Badge>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Asset Types</p>
              <div className="flex flex-wrap gap-1">
                {config.assetTypes.map((type) => (
                  <Badge key={type} variant="secondary" className="text-xs">
                    {type}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Created</p>
              <p className="text-sm">{new Date(config.createdAt).toLocaleDateString()}</p>
            </div>
            {config.description && (
              <div className="col-span-2">
                <p className="text-sm font-medium text-muted-foreground">Description</p>
                <p className="text-sm">{config.description}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Simulated Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3">
            This sandbox stream generates realistic telemetry data for the following metrics:
          </p>
          <div className="space-y-2">
            {config.name.includes('Protection') && (
              <>
                <div className="flex items-center justify-between p-2 bg-muted rounded">
                  <span className="text-sm">Breaker Status</span>
                  <Badge variant="outline">bool</Badge>
                </div>
                <div className="flex items-center justify-between p-2 bg-muted rounded">
                  <span className="text-sm">Trip Coil Current</span>
                  <Badge variant="outline">A</Badge>
                </div>
                <div className="flex items-center justify-between p-2 bg-muted rounded">
                  <span className="text-sm">Phase Voltages (A, B, C)</span>
                  <Badge variant="outline">kV</Badge>
                </div>
              </>
            )}
            {config.name.includes('Transformer') && (
              <>
                <div className="flex items-center justify-between p-2 bg-muted rounded">
                  <span className="text-sm">Top Oil Temperature</span>
                  <Badge variant="outline">°C</Badge>
                </div>
                <div className="flex items-center justify-between p-2 bg-muted rounded">
                  <span className="text-sm">Winding Temperature</span>
                  <Badge variant="outline">°C</Badge>
                </div>
                <div className="flex items-center justify-between p-2 bg-muted rounded">
                  <span className="text-sm">Load Current</span>
                  <Badge variant="outline">A</Badge>
                </div>
                <div className="flex items-center justify-between p-2 bg-muted rounded">
                  <span className="text-sm">Oil Level</span>
                  <Badge variant="outline">%</Badge>
                </div>
                <div className="flex items-center justify-between p-2 bg-muted rounded">
                  <span className="text-sm">Dissolved Gas (H2)</span>
                  <Badge variant="outline">ppm</Badge>
                </div>
              </>
            )}
            {config.name.includes('Environmental') && (
              <>
                <div className="flex items-center justify-between p-2 bg-muted rounded">
                  <span className="text-sm">Ambient Temperature</span>
                  <Badge variant="outline">°C</Badge>
                </div>
                <div className="flex items-center justify-between p-2 bg-muted rounded">
                  <span className="text-sm">Humidity</span>
                  <Badge variant="outline">%</Badge>
                </div>
                <div className="flex items-center justify-between p-2 bg-muted rounded">
                  <span className="text-sm">Atmospheric Pressure</span>
                  <Badge variant="outline">hPa</Badge>
                </div>
              </>
            )}
            {config.name.includes('SCADA') && (
              <>
                <div className="flex items-center justify-between p-2 bg-muted rounded">
                  <span className="text-sm">RTU Communication Status</span>
                  <Badge variant="outline">bool</Badge>
                </div>
                <div className="flex items-center justify-between p-2 bg-muted rounded">
                  <span className="text-sm">Data Quality</span>
                  <Badge variant="outline">%</Badge>
                </div>
                <div className="flex items-center justify-between p-2 bg-muted rounded">
                  <span className="text-sm">Message Latency</span>
                  <Badge variant="outline">ms</Badge>
                </div>
                <div className="flex items-center justify-between p-2 bg-muted rounded">
                  <span className="text-sm">Active Alarms</span>
                  <Badge variant="outline">count</Badge>
                </div>
              </>
            )}
            {config.name.includes('Voltage Regulator') && (
              <>
                <div className="flex items-center justify-between p-2 bg-muted rounded">
                  <span className="text-sm">Tap Position</span>
                  <Badge variant="outline">step</Badge>
                </div>
                <div className="flex items-center justify-between p-2 bg-muted rounded">
                  <span className="text-sm">Load Current</span>
                  <Badge variant="outline">A</Badge>
                </div>
                <div className="flex items-center justify-between p-2 bg-muted rounded">
                  <span className="text-sm">Primary Voltage</span>
                  <Badge variant="outline">kV</Badge>
                </div>
                <div className="flex items-center justify-between p-2 bg-muted rounded">
                  <span className="text-sm">Secondary Voltage</span>
                  <Badge variant="outline">kV</Badge>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>About Sandbox Streams</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Sandbox streams allow you to test and demonstrate data collection without connecting
            to real devices. Features include:
          </p>
          <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
            <li>Client-side data generation based on configured polling intervals</li>
            <li>Simulated telemetry values with realistic variations</li>
            <li>Multiple metric types (voltage, current, temperature, status, etc.)</li>
            <li>No persistence - data is cleared when you stop the simulation</li>
            <li>Clearly marked with SANDBOX badges to avoid confusion</li>
            <li>Perfect for demos, training, and integration testing</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
