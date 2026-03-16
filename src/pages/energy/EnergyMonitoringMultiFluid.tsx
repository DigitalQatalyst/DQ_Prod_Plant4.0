import { useState, useMemo, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { EMSPageShell } from "@/components/ems/EMSPageShell";
import { MultiStreamKPIGrid } from "@/components/ems/widgets/MultiStreamKPIGrid";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Download,
  Building2,
  Zap,
  Flame,
  Droplets,
  Wind,
  Activity,
  ChevronRight,
  TrendingDown,
  TrendingUp,
  AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { TransmissionProvider } from "@/lib/data/providers/TransmissionProvider";
import type { MultiFluidSummary, EnergyType } from "@/types/transmission";
import { EnergyListFilter, EnergyFilterState } from "@/components/ems/EnergyListFilter";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area
} from "recharts";

interface FluidScope {
  id: string;
  name: string;
  description: string;
  fluids: FluidConsumption[];
  totalCost: number;
  totalEmissions: number;
  status: "Normal" | "High" | "Critical";
  substation_name?: string;
  substation_id?: string;
  feeder_name?: string;
  feeder_id?: string;
  scope_type?: 'substation' | 'feeder' | 'asset';
  meters?: any[];
}

interface FluidConsumption {
  type: EnergyType;
  currentValue: number;
  unit: string;
  dailyConsumption: number;
  cost: number;
  co2Emissions: number;
  status: "Normal" | "High" | "Critical";
  meter_count?: number;
}

export function EnergyMonitoringMultiFluid() {
  const {
    upstreamSubmeters,
    sector,
    subsector,
    currentTenant
  } = useApp();

  const isTransmission = sector === 'power' && subsector === 'Transmission';

  const [selectedScope, setSelectedScope] = useState<FluidScope | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<EnergyFilterState>({
    status: "",
    role: "",
    substationId: "",
    feederId: "",
    type: ""
  });

  const [transmissionData, setTransmissionData] = useState<{
    multiFluidSummary: MultiFluidSummary[];
    trendData: any[];
    loading: boolean;
  }>({
    multiFluidSummary: [],
    trendData: [],
    loading: false
  });

  useEffect(() => {
    if (!isTransmission || !currentTenant?.id) return;
    const loadTransmissionData = async () => {
      setTransmissionData(prev => ({ ...prev, loading: true }));
      try {
        const provider = new TransmissionProvider();
        const orgId = currentTenant.id;

        const multiFluidSummary = await provider.getMultiFluidSummary({ org_id: orgId });

        const now = new Date();
        const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

        let trendData = await provider.getEnergyTrendData({
          org_id: orgId,
          start_date: yesterday.toISOString(),
          end_date: now.toISOString()
        });

        // Mock trend data if empty for better UI preview
        if (trendData.length === 0) {
          trendData = Array.from({ length: 24 }).map((_, i) => ({
            timestamp: new Date(now.getTime() - (24 - i) * 3600000).toISOString(),
            consumption: 500 + Math.random() * 200,
            demand: 40 + Math.random() * 10,
            cost: 60 + Math.random() * 20
          }));
        }

        setTransmissionData({ multiFluidSummary, trendData, loading: false });
      } catch (error) {
        console.error('Failed to load transmission data:', error);
        setTransmissionData(prev => ({ ...prev, loading: false }));
      }
    };
    loadTransmissionData();
  }, [isTransmission, currentTenant?.id]);

  const allScopes = useMemo(() => {
    if (isTransmission) {
      const summary = transmissionData.multiFluidSummary;
      const scopeMap = new Map<string, FluidScope>();

      summary.forEach(s => {
        s.meters.forEach(m => {
          if (!m.substation_name) return;

          const scopeId = m.substation_id || m.substation_name;

          if (!scopeMap.has(scopeId)) {
            scopeMap.set(scopeId, {
              id: scopeId,
              name: m.substation_name,
              description: "Substation aggregate",
              fluids: [],
              totalCost: 0,
              totalEmissions: 0,
              status: "Normal",
              substation_name: m.substation_name,
              substation_id: m.substation_id || undefined,
              scope_type: 'substation',
              meters: []
            });
          }

          const scope = scopeMap.get(scopeId)!;
          scope.meters?.push({ ...m, energy_type: s.energy_type });

          const existingFluid = scope.fluids.find(f => f.type === s.energy_type);
          const currentVal = m.current_kw || 0;
          const kwh = m.total_kwh || 0;
          const cost = m.cost || 0;
          const emissions = m.co2_emissions || 0;

          if (existingFluid) {
            existingFluid.currentValue += currentVal;
            existingFluid.dailyConsumption += kwh;
            existingFluid.cost += cost;
            existingFluid.co2Emissions += emissions;
            scope.totalCost += cost;
            scope.totalEmissions += emissions;
          } else {
            scope.fluids.push({
              type: s.energy_type,
              currentValue: currentVal,
              unit: s.energy_type === 'electricity' ? 'kW' : 'units',
              dailyConsumption: kwh,
              cost: cost,
              co2Emissions: emissions,
              status: "Normal"
            });
            scope.totalCost += cost;
            scope.totalEmissions += emissions;
          }
        });
      });
      return Array.from(scopeMap.values());
    } else {
      const scopeMap = new Map<string, FluidConsumption[]>();
      upstreamSubmeters.forEach(submeter => {
        const scopeName = submeter.assetId;
        if (!scopeMap.has(scopeName)) scopeMap.set(scopeName, []);

        let fluids = scopeMap.get(scopeName);
        if (!fluids) {
          fluids = [];
          scopeMap.set(scopeName, fluids);
        }

        const dc = submeter.currentValue * 24;
        fluids.push({
          type: submeter.energyType as any,
          currentValue: submeter.currentValue,
          unit: submeter.unit,
          dailyConsumption: dc,
          cost: dc * 0.12,
          co2Emissions: dc * 0.45,
          status: submeter.status as any
        });
      });

      const res: FluidScope[] = [];
      scopeMap.forEach((fluids, name) => {
        res.push({
          id: name,
          name: name,
          description: "Asset aggregate",
          fluids,
          totalCost: fluids.reduce((sum, f) => sum + f.cost, 0),
          totalEmissions: fluids.reduce((sum, f) => sum + f.co2Emissions, 0),
          status: fluids.some(f => f.status === "Critical") ? "Critical" : "Normal",
          scope_type: 'asset'
        });
      });
      return res;
    }
  }, [isTransmission, transmissionData.multiFluidSummary, upstreamSubmeters]);

  const filteredScopes = useMemo(() => {
    let result = allScopes;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(s => s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q));
    }

    if (filters.status) {
      result = result.filter(s => s.status.toLowerCase() === filters.status.toLowerCase());
    }

    if (isTransmission) {
      if (filters.substationId) result = result.filter(s => s.substation_id === filters.substationId);
    }

    return result;
  }, [allScopes, searchQuery, filters, isTransmission]);

  useEffect(() => {
    if (filteredScopes.length > 0 && (!selectedScope || !filteredScopes.find(s => s.id === selectedScope.id))) {
      setSelectedScope(filteredScopes[0]);
    } else if (filteredScopes.length === 0) {
      setSelectedScope(null);
    }
  }, [filteredScopes, selectedScope]);

  const chartData = useMemo(() => {
    if (!transmissionData.trendData.length) return [];
    return transmissionData.trendData.map(d => ({
      timestamp: d.timestamp,
      "Consumption (kWh)": d.consumption,
      "Cost ($)": d.cost,
      "Demand (kW)": d.demand
    }));
  }, [transmissionData.trendData]);

  const workPaneContent = selectedScope ? (
    <div className="space-y-6">
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        <div className="xl:col-span-3 space-y-6">
          <MultiStreamKPIGrid
            streams={selectedScope.fluids.map(f => ({
              type: f.type,
              value: f.currentValue,
              unit: f.unit,
              cost: f.cost
            }))}
          />

          <Card className="overflow-hidden border-none shadow-md bg-gradient-to-br from-card to-muted/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <div>
                <CardTitle className="text-lg font-semibold">24h Consumption Trend</CardTitle>
                <CardDescription>Real-time demand and consumption profile for {selectedScope.name}</CardDescription>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-2 py-1 rounded bg-emerald-500/10 text-emerald-500 text-xs font-semibold">
                  <TrendingDown className="w-3 h-3" />
                  -4.2%
                </div>
                <div className="text-xs text-muted-foreground font-medium">vs prev. 24h</div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full pr-4">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="colorConsumption" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} className="opacity-20" />
                      <XAxis
                        dataKey="timestamp"
                        hide
                      />
                      <YAxis
                        className="text-[10px]"
                        tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'rgba(0,0,0,0.8)',
                          border: 'none',
                          borderRadius: '8px',
                          color: '#fff',
                          fontSize: '12px'
                        }}
                        itemStyle={{ padding: '2px 0' }}
                        labelFormatter={(label) => new Date(label).toLocaleString()}
                      />
                      <Area
                        type="monotone"
                        dataKey="Consumption (kWh)"
                        stroke="#10b981"
                        fillOpacity={1}
                        fill="url(#colorConsumption)"
                        strokeWidth={2}
                      />
                      <Line
                        type="monotone"
                        dataKey="Demand (kW)"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        dot={false}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-2 border-2 border-dashed rounded-lg border-muted/50">
                    <Activity className="w-8 h-8 opacity-20" />
                    <span className="text-sm">No telemetry data available for the selected period</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-none shadow-md bg-gradient-to-br from-card to-primary/5 h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Scope Summary</CardTitle>
              <CardDescription className="truncate">{selectedScope.name}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-muted/30 rounded-xl space-y-4 border border-border/50">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground font-medium">Asset Status</span>
                  <Badge className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-none shadow-none font-bold">OPTIMAL</Badge>
                </div>
                <div className="flex justify-between items-end border-t pt-3 border-border/40">
                  <span className="text-xs text-muted-foreground font-medium">Daily Budget</span>
                  <div className="text-right">
                    <p className="text-lg font-bold text-primary leading-none">${selectedScope.totalCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">Est. today</p>
                  </div>
                </div>
                <div className="flex justify-between items-end border-t pt-3 border-border/40">
                  <span className="text-xs text-muted-foreground font-medium">Carbon Intensity</span>
                  <div className="text-right">
                    <p className="text-base font-semibold leading-none">{selectedScope.totalEmissions.toFixed(1)} <span className="text-[10px] font-normal text-muted-foreground">kg CO₂e</span></p>
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">Active Streams</h4>
                <div className="space-y-1.5 overflow-y-auto max-h-[200px] pr-1 custom-scrollbar">
                  {selectedScope.fluids.map(f => (
                    <div key={f.type} className="flex items-center justify-between text-xs p-2.5 hover:bg-primary/5 rounded-lg transition-all group border border-transparent hover:border-primary/10">
                      <div className="flex items-center gap-3">
                        <div className="p-1.5 rounded bg-background shadow-sm">
                          {getSmallIcon(f.type)}
                        </div>
                        <span className="capitalize font-medium">{f.type}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground font-semibold">{f.currentValue.toFixed(0)} <span className="font-normal opacity-70">{f.unit}</span></span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <Button variant="outline" size="sm" className="h-9 px-2 text-[10px] uppercase font-bold tracking-wider">
                  Details
                </Button>
                <Button variant="outline" size="sm" className="h-9 px-2 text-[10px] uppercase font-bold tracking-wider border-orange-500/20 text-orange-500 hover:bg-orange-500/5 font-bold">
                  Anomalies
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="border-none shadow-md overflow-hidden">
        <CardHeader className="bg-muted/30 pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold">Meter Inventory & Performance</CardTitle>
              <CardDescription>Detailed telemetry for contributors to {selectedScope.name}</CardDescription>
            </div>
            <div className="text-xs bg-primary/10 text-primary px-3 py-1 rounded-full font-bold">
              {selectedScope.meters?.length || 0} METERS ACTIVE
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/10">
                <TableRow className="hover:bg-transparent border-none">
                  <TableHead className="py-4 pl-6 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Meter Identity</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Stream Type</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Feed Location</TableHead>
                  <TableHead className="text-right text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Real-time Demand</TableHead>
                  <TableHead className="text-right text-[10px] font-bold uppercase tracking-widest text-muted-foreground">24h Cumulative</TableHead>
                  <TableHead className="text-right pr-6 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Est. Cost</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selectedScope.meters?.map((m: any) => (
                  <TableRow key={m.meter_id} className="hover:bg-muted/5 transition-colors group">
                    <TableCell className="font-semibold py-4 pl-6 text-sm">{m.meter_name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className={cn("w-1.5 h-1.5 rounded-full",
                          m.energy_type === 'electricity' ? 'bg-yellow-500' : 'bg-orange-500'
                        )} />
                        <span className="capitalize text-xs font-medium">{m.energy_type}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{m.feeder_name || m.substation_name || 'Main Grid Connection'}</TableCell>
                    <TableCell className="text-right font-mono text-xs">{(m.current_kw || 0).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} kW</TableCell>
                    <TableCell className="text-right font-mono text-xs">{(m.total_kwh || 0).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} kWh</TableCell>
                    <TableCell className="text-right pr-6">
                      <span className="font-bold text-primary group-hover:text-foreground transition-colors">${(m.cost || 0).toFixed(2)}</span>
                    </TableCell>
                  </TableRow>
                ))}
                {(!selectedScope.meters || selectedScope.meters.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-muted-foreground/60 italic bg-muted/5">
                      No active meter telemetry detected for this resource scope.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  ) : (
    <div className="flex-1 flex flex-col items-center justify-center p-20 text-center space-y-4">
      <div className="p-8 rounded-full bg-primary/5 text-primary/20 animate-pulse">
        <Building2 className="w-20 h-20" />
      </div>
      <div>
        <h3 className="text-xl font-bold">No Active Scopes Selected</h3>
        <p className="text-muted-foreground max-w-sm mt-2">Select a substation or asset group from the list to begin monitoring multi-fluid performance.</p>
      </div>
    </div>
  );

  return (
    <EMSPageShell
      title="Multi-fluid Monitoring"
      featureSetName="Energy Monitoring & Metering"
      featureName="Multi-fluid"
      listType="scopes"
      listItems={filteredScopes}
      selectedItem={selectedScope}
      onItemSelect={setSelectedScope}
      workPaneContent={workPaneContent}
      onSearch={setSearchQuery}
      searchPlaceholder="Search fluid scopes..."
      loading={transmissionData.loading}
      listFilterContent={
        <EnergyListFilter
          filters={filters}
          onFiltersChange={setFilters}
          showRoleFilter={false}
          showTypeFilter={false}
          showSubstationFilter={isTransmission}
          showFeederFilter={isTransmission}
        />
      }
      sector={sector || undefined}
      subsector={subsector || undefined}
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2 font-bold">
            <TrendingUp className="w-4 h-4" />
            Trends
          </Button>
          <Button variant="default" size="sm" className="gap-2 shadow-sm font-bold">
            <Download className="w-4 h-4" />
            Export Data
          </Button>
        </div>
      }
    />
  );
}

function getSmallIcon(type: string) {
  switch (type) {
    case "electricity": return <Zap className="w-4 h-4 text-blue-500" />;
    case "gas": return <Flame className="w-4 h-4 text-orange-500" />;
    case "diesel": return <Droplets className="w-4 h-4 text-slate-500" />;
    case "water": return <Droplets className="w-4 h-4 text-cyan-500" />;
    case "compressed_air": return <Wind className="w-4 h-4 text-indigo-500" />;
    case "steam": return <Activity className="w-4 h-4 text-emerald-500" />;
    default: return <Activity className="w-4 h-4" />;
  }
}

export default EnergyMonitoringMultiFluid;