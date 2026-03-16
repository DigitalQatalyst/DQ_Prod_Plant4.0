import { useState, useEffect, useMemo } from "react";
import { WorkPane } from "@/components/layout/WorkPane";
import { DashboardView } from "@/components/dashboard/DashboardView";
import { useApp } from "@/context/AppContext";
import { KPICard } from "@/components/shared/KPICard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Activity, 
  TrendingUp, 
  TrendingDown, 
  Zap, 
  GitBranch, 
  MapPin,
  Gauge,
  BarChart3,
  AlertTriangle
} from "lucide-react";
import { getTransmissionProvider } from "@/lib/data/providers/TransmissionProvider";
import type { TxSubstation, TxFeeder, TxEnergyMeterRegistry } from "@/types/transmission";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from "recharts";

/**
 * EnergyDashboard Page
 * Displays dashboards specific to the energy feature area
 * Extended with transmission grid KPIs when sector is Power/Transmission
 * 
 * Requirements: 4.1, 4.3, 14.1, 23.1, 23.2, 23.3, 23.4, 23.5, 23.6
 */
export function EnergyDashboard() {
  const { sector, subsector, currentTenant } = useApp();
  
  // Sector context check
  const isTransmission = sector === 'power' && subsector === 'Transmission';
  
  // Transmission-specific state
  const [txSubstations, setTxSubstations] = useState<TxSubstation[]>([]);
  const [txFeeders, setTxFeeders] = useState<TxFeeder[]>([]);
  const [txMeters, setTxMeters] = useState<TxEnergyMeterRegistry[]>([]);
  const [txLoading, setTxLoading] = useState(false);
  const [txKPIs, setTxKPIs] = useState({
    gridLosses: 0,
    loadFactor: 0,
    systemEfficiency: 0,
    totalMWDelivered: 0,
    peakDemandMW: 0,
    activeSubstations: 0,
    activeFeeders: 0,
    criticalAlerts: 0
  });

  // Load transmission data when in transmission mode
  useEffect(() => {
    if (!isTransmission || !currentTenant) return;
    
    const loadTransmissionData = async () => {
      try {
        setTxLoading(true);
        const provider = getTransmissionProvider();
        
        const [substationsData, feedersData, metersData] = await Promise.all([
          provider.listTxSubstations({ org_id: currentTenant.id }),
          provider.listTxFeeders({ org_id: currentTenant.id }),
          provider.listEnergyMetersTxScoped({ org_id: currentTenant.id })
        ]);
        
        setTxSubstations(substationsData);
        setTxFeeders(feedersData);
        setTxMeters(metersData);
        
        // Calculate transmission KPIs
        calculateTransmissionKPIs(substationsData, feedersData, metersData);
      } catch (error) {
        console.error('Failed to load transmission data:', error);
      } finally {
        setTxLoading(false);
      }
    };
    
    loadTransmissionData();
  }, [isTransmission, currentTenant]);

  // Calculate transmission-specific KPIs
  const calculateTransmissionKPIs = (
    substations: TxSubstation[], 
    feeders: TxFeeder[], 
    meters: TxEnergyMeterRegistry[]
  ) => {
    // Active substations (with active meters)
    const activeSubstations = substations.filter(s => s.active).length;
    
    // Active feeders
    const activeFeeders = feeders.filter(f => f.active).length;
    
    // Calculate grid losses (simplified - would use actual telemetry in production)
    // Grid losses = (Energy In - Energy Out) / Energy In * 100
    const gridLosses = 3.2; // Mock value - would calculate from actual meter data
    
    // Load factor = Average Load / Peak Load
    const loadFactor = 0.72; // Mock value - would calculate from telemetry
    
    // System efficiency = (1 - Losses%) * 100
    const systemEfficiency = 96.8; // Mock value
    
    // Total MW delivered (sum of all outgoing feeders)
    const totalMWDelivered = 450.5; // Mock value
    
    // Peak demand
    const peakDemandMW = 625.0; // Mock value
    
    // Critical alerts (would query from alerts table)
    const criticalAlerts = 3; // Mock value
    
    setTxKPIs({
      gridLosses,
      loadFactor: loadFactor * 100,
      systemEfficiency,
      totalMWDelivered,
      peakDemandMW,
      activeSubstations,
      activeFeeders,
      criticalAlerts
    });
  };

  // Substation performance summary
  const substationPerformance = useMemo(() => {
    if (!isTransmission) return [];
    
    return txSubstations.slice(0, 5).map(substation => {
      // Mock performance data - would calculate from actual telemetry
      const metersInSubstation = txMeters.filter(m => m.substation_id === substation.id);
      const feedersInSubstation = txFeeders.filter(f => f.substation_id === substation.id);
      
      return {
        id: substation.id,
        name: substation.name,
        code: substation.code,
        meterCount: metersInSubstation.length,
        feederCount: feedersInSubstation.length,
        loadMW: Math.random() * 100 + 50, // Mock
        efficiency: Math.random() * 5 + 95, // Mock
        status: Math.random() > 0.8 ? 'warning' : 'normal'
      };
    });
  }, [isTransmission, txSubstations, txMeters, txFeeders]);

  // Feeder load distribution
  const feederLoadData = useMemo(() => {
    if (!isTransmission) return [];
    
    return txFeeders.slice(0, 10).map(feeder => ({
      name: feeder.feeder_code || feeder.name,
      load: Math.random() * 50 + 10, // Mock MW
      capacity: 60, // Mock capacity
      utilization: Math.random() * 80 + 10 // Mock %
    }));
  }, [isTransmission, txFeeders]);

  const tabs = [
    {
      id: "dashboard",
      label: "Dashboard",
      content: isTransmission ? (
        <TransmissionDashboard 
          kpis={txKPIs}
          substationPerformance={substationPerformance}
          feederLoadData={feederLoadData}
          loading={txLoading}
        />
      ) : (
        <DashboardView featureArea="energy" />
      ),
    },
  ];

  return (
    <WorkPane
      title={isTransmission ? "Transmission Grid Dashboard" : "Energy Dashboard"}
      subtitle={isTransmission 
        ? "Monitor transmission grid performance, losses, and system efficiency" 
        : "Monitor energy consumption, efficiency, and optimization"
      }
      tabs={tabs}
    />
  );
}

/**
 * TransmissionDashboard Component
 * Displays transmission-specific KPIs and grid topology overview
 * Requirements: 23.1, 23.2, 23.3, 23.4, 23.5, 23.6
 */
interface TransmissionDashboardProps {
  kpis: {
    gridLosses: number;
    loadFactor: number;
    systemEfficiency: number;
    totalMWDelivered: number;
    peakDemandMW: number;
    activeSubstations: number;
    activeFeeders: number;
    criticalAlerts: number;
  };
  substationPerformance: Array<{
    id: string;
    name: string;
    code: string;
    meterCount: number;
    feederCount: number;
    loadMW: number;
    efficiency: number;
    status: string;
  }>;
  feederLoadData: Array<{
    name: string;
    load: number;
    capacity: number;
    utilization: number;
  }>;
  loading: boolean;
}

function TransmissionDashboard({ 
  kpis, 
  substationPerformance, 
  feederLoadData,
  loading 
}: TransmissionDashboardProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <Activity className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading transmission grid data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Transmission Grid KPI Tiles - Requirement 23.1 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Grid Losses"
          value={`${kpis.gridLosses.toFixed(1)}%`}
          icon={TrendingDown}
          trend={kpis.gridLosses < 3.5 ? "down" : "up"}
          trendValue="0.3%"
          subtitle="Transmission system losses"
        />
        
        <KPICard
          title="Load Factor"
          value={`${kpis.loadFactor.toFixed(0)}%`}
          icon={Gauge}
          trend={kpis.loadFactor > 70 ? "up" : "down"}
          trendValue="2%"
          subtitle="Average to peak load ratio"
        />
        
        <KPICard
          title="System Efficiency"
          value={`${kpis.systemEfficiency.toFixed(1)}%`}
          icon={Zap}
          trend="up"
          trendValue="0.5%"
          subtitle="Overall grid efficiency"
        />
        
        <KPICard
          title="Total Delivered"
          value={`${kpis.totalMWDelivered.toFixed(0)} MW`}
          icon={Activity}
          trend="up"
          trendValue="12 MW"
          subtitle="Total power delivered"
        />
      </div>

      {/* Secondary KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Peak Demand</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.peakDemandMW.toFixed(0)} MW</div>
            <p className="text-xs text-muted-foreground">Today's peak load</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Substations</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.activeSubstations}</div>
            <p className="text-xs text-muted-foreground">Operational substations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Feeders</CardTitle>
            <GitBranch className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.activeFeeders}</div>
            <p className="text-xs text-muted-foreground">Operational feeders</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{kpis.criticalAlerts}</div>
            <p className="text-xs text-muted-foreground">Require immediate attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Substation Performance Summary - Requirement 23.2 */}
      <Card>
        <CardHeader>
          <CardTitle>Substation Performance Summary</CardTitle>
          <CardDescription>Top substations by load and efficiency</CardDescription>
        </CardHeader>
        <CardContent>
          {substationPerformance.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No substation data available
            </div>
          ) : (
            <div className="space-y-4">
              {substationPerformance.map((substation) => (
                <div 
                  key={substation.id} 
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{substation.name}</h4>
                      <Badge variant="outline" className="text-xs">
                        {substation.code}
                      </Badge>
                      {substation.status === 'warning' && (
                        <Badge variant="destructive" className="text-xs">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Warning
                        </Badge>
                      )}
                    </div>
                    <div className="flex gap-4 mt-1 text-sm text-muted-foreground">
                      <span>{substation.feederCount} feeders</span>
                      <span>{substation.meterCount} meters</span>
                    </div>
                  </div>
                  <div className="flex gap-6 items-center">
                    <div className="text-right">
                      <div className="text-sm font-medium">{substation.loadMW.toFixed(1)} MW</div>
                      <div className="text-xs text-muted-foreground">Load</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">{substation.efficiency.toFixed(1)}%</div>
                      <div className="text-xs text-muted-foreground">Efficiency</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Feeder Load Distribution - Requirement 23.3 */}
      <Card>
        <CardHeader>
          <CardTitle>Feeder Load Distribution</CardTitle>
          <CardDescription>Current load across transmission feeders</CardDescription>
        </CardHeader>
        <CardContent>
          {feederLoadData.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No feeder data available
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={feederLoadData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  fontSize={12}
                />
                <YAxis label={{ value: 'Load (MW)', angle: -90, position: 'insideLeft' }} />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-background border rounded-lg p-3 shadow-lg">
                          <p className="font-medium">{data.name}</p>
                          <p className="text-sm">Load: {data.load.toFixed(1)} MW</p>
                          <p className="text-sm">Capacity: {data.capacity} MW</p>
                          <p className="text-sm">Utilization: {data.utilization.toFixed(0)}%</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="load" radius={[4, 4, 0, 0]}>
                  {feederLoadData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.utilization > 80 ? '#ef4444' : entry.utilization > 60 ? '#f59e0b' : '#10b981'} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Grid Topology Overview - Requirement 23.3 */}
      <Card>
        <CardHeader>
          <CardTitle>Transmission Grid Topology Overview</CardTitle>
          <CardDescription>Network structure and connectivity status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="h-5 w-5 text-primary" />
                <h4 className="font-medium">Substations</h4>
              </div>
              <div className="text-2xl font-bold">{kpis.activeSubstations}</div>
              <p className="text-sm text-muted-foreground">Active nodes in grid</p>
            </div>
            
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <GitBranch className="h-5 w-5 text-primary" />
                <h4 className="font-medium">Feeders</h4>
              </div>
              <div className="text-2xl font-bold">{kpis.activeFeeders}</div>
              <p className="text-sm text-muted-foreground">Distribution circuits</p>
            </div>
            
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="h-5 w-5 text-primary" />
                <h4 className="font-medium">Meters</h4>
              </div>
              <div className="text-2xl font-bold">{substationPerformance.reduce((sum, s) => sum + s.meterCount, 0)}</div>
              <p className="text-sm text-muted-foreground">Monitoring points</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
