import { useState, useEffect, useMemo } from "react";
import { useApp } from "@/context/AppContext";
import { EMSPageShell } from "@/components/ems/EMSPageShell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { upstreamControllableLoads, type ControllableLoad } from "@/data/mockData";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from "recharts";
import { getTransmissionProvider } from "@/lib/data/providers/TransmissionProvider";
import type { TxFeeder, TxTransformer, TxEnergyMeterRegistry } from "@/types/transmission";
import { AlertCircle, TrendingUp, Zap } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { EnergyListFilter, EnergyFilterState } from "@/components/ems/EnergyListFilter";

// Transmission-specific interfaces
interface FeederLoadData {
  feeder_id: string;
  feeder_name: string;
  feeder_code: string;
  substation_name: string;
  current_load_kw: number;
  capacity_kw: number;
  utilization_pct: number;
  voltage_level_kv: number;
  meter_count: number;
}

interface TransformerLoadData {
  transformer_id: string;
  transformer_name: string;
  transformer_code: string;
  substation_name: string;
  current_load_kw: number;
  rated_capacity_kva: number;
  utilization_pct: number;
  primary_voltage_kv: number;
  secondary_voltage_kv: number;
}

interface LoadBalancingRecommendation {
  id: string;
  type: "feeder_transfer" | "transformer_rebalance" | "load_staggering" | "load_shifting" | "demand_optimization";
  description: string;
  from_entity: string;
  to_entity?: string;
  impact: string;
  priority: "High" | "Medium" | "Low";
  savings: string;
  capacity_validation: {
    valid: boolean;
    reason?: string;
  };
}

export default function EnergyControlLoadBalancing() {
  const { sector, subsector, currentTenant } = useApp();
  const tenantName = currentTenant?.name;
  const isTransmission = sector?.toLowerCase() === 'power' && subsector === 'Transmission';

  const [selectedLoad, setSelectedLoad] = useState<ControllableLoad>(upstreamControllableLoads[0]);
  const [simulationOpen, setSimulationOpen] = useState(false);

  // Transmission-specific state
  const [feeders, setFeeders] = useState<TxFeeder[]>([]);
  const [transformers, setTransformers] = useState<TxTransformer[]>([]);
  const [meters, setMeters] = useState<TxEnergyMeterRegistry[]>([]);
  const [feederLoadData, setFeederLoadData] = useState<FeederLoadData[]>([]);
  const [transformerLoadData, setTransformerLoadData] = useState<TransformerLoadData[]>([]);
  const [selectedFeeder, setSelectedFeeder] = useState<FeederLoadData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<EnergyFilterState>({
    status: "",
    role: "",
    substationId: "",
    feederId: "",
    type: ""
  });
  const [activeTab, setActiveTab] = useState("distribution");

  // Load transmission data when in transmission mode
  useEffect(() => {
    if (isTransmission) {
      loadTransmissionData();
    }
  }, [isTransmission]);

  const loadTransmissionData = async () => {
    setLoading(true);
    setError(null);

    try {
      const provider = getTransmissionProvider();

      // Load feeders, transformers, meters, and substations
      const [feedersData, transformersData, metersData, substationsData] = await Promise.all([
        provider.listTxFeeders({ active: true }),
        provider.listTxTransformers({ active: true }),
        provider.listEnergyMetersTxScoped({ active: true }),
        provider.listTxSubstations({ active: true })
      ]);

      setFeeders(feedersData);
      setTransformers(transformersData);
      setMeters(metersData);

      // Create substation lookup map
      const substationMap = new Map(substationsData.map(s => [s.id, s.name]));

      // Calculate feeder load data
      const feederLoads = calculateFeederLoads(feedersData, metersData, substationMap);
      setFeederLoadData(feederLoads);

      // Calculate transformer load data
      const transformerLoads = calculateTransformerLoads(transformersData, metersData, substationMap);
      setTransformerLoadData(transformerLoads);

      // Select first feeder by default
      if (feederLoads.length > 0) {
        setSelectedFeeder(feederLoads[0]);
      }
    } catch (err) {
      console.error('Failed to load transmission data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load transmission data');
    } finally {
      setLoading(false);
    }
  };

  const calculateFeederLoads = (
    feeders: TxFeeder[],
    meters: TxEnergyMeterRegistry[],
    substationMap: Map<string, string>
  ): FeederLoadData[] => {
    return feeders.map(feeder => {
      // Find meters associated with this feeder
      const feederMeters = meters.filter(m => m.feeder_id === feeder.id);

      // Sum current load from meters
      const currentLoad = feederMeters.reduce((sum, m) => sum + (m.current_kw || 0), 0);

      // Estimate capacity based on voltage level (simplified)
      // Typical feeder capacity: 132kV = 50MW, 220kV = 100MW, 400kV = 200MW
      const capacityMap: Record<number, number> = {
        132: 50000,
        220: 100000,
        400: 200000
      };
      const capacity = feeder.voltage_level_kv ? capacityMap[feeder.voltage_level_kv] || 10000 : 10000;

      const utilization = capacity > 0 ? (currentLoad / capacity) * 100 : 0;

      return {
        id: feeder.id,
        feeder_id: feeder.id,
        feeder_name: feeder.name,
        feeder_code: feeder.feeder_code,
        substation_name: substationMap.get(feeder.substation_id) || 'Unknown',
        current_load_kw: currentLoad,
        capacity_kw: capacity,
        utilization_pct: utilization,
        voltage_level_kv: feeder.voltage_level_kv || 0,
        meter_count: feederMeters.length
      };
    });
  };

  const calculateTransformerLoads = (
    transformers: TxTransformer[],
    meters: TxEnergyMeterRegistry[],
    substationMap: Map<string, string>
  ): TransformerLoadData[] => {
    return transformers.map(transformer => {
      // Find meters associated with this transformer
      const transformerMeters = meters.filter(m => m.transformer_id === transformer.id);

      // Sum current load from meters
      const currentLoad = transformerMeters.reduce((sum, m) => sum + (m.current_kw || 0), 0);

      // Use rated capacity from transformer data (convert MVA to kW, assuming power factor of 0.9)
      const capacity = transformer.rated_capacity_mva ? transformer.rated_capacity_mva * 1000 * 0.9 : 10000;
      const utilization = capacity > 0 ? (currentLoad / capacity) * 100 : 0;

      return {
        id: transformer.id,
        transformer_id: transformer.id,
        transformer_name: transformer.name,
        transformer_code: transformer.transformer_code,
        substation_name: substationMap.get(transformer.substation_id) || 'Unknown',
        current_load_kw: currentLoad,
        rated_capacity_kva: capacity,
        utilization_pct: utilization,
        primary_voltage_kv: transformer.primary_voltage_kv || 0,
        secondary_voltage_kv: transformer.secondary_voltage_kv || 0
      };
    });
  };

  const filteredFeeders = useMemo(() => {
    let result = feederLoadData;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(f =>
        f.feeder_name.toLowerCase().includes(q) ||
        f.feeder_code.toLowerCase().includes(q) ||
        f.substation_name.toLowerCase().includes(q)
      );
    }

    if (filters.feederId) {
      result = result.filter(f => f.feeder_id === filters.feederId);
    }

    return result;
  }, [feederLoadData, searchQuery, filters]);

  const filteredLoads = useMemo(() => {
    let result = upstreamControllableLoads;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(l => l.name.toLowerCase().includes(q) || l.assetId.toLowerCase().includes(q));
    }

    if (filters.status) {
      result = result.filter(l => l.status.toLowerCase() === filters.status.toLowerCase());
    }

    if (filters.type) {
      result = result.filter(l => l.loadType.toLowerCase() === filters.type.toLowerCase());
    }

    return result;
  }, [searchQuery, filters]);

  const listItems = useMemo(() => {
    if (isTransmission) {
      return filteredFeeders.map(f => ({
        ...f,
        id: f.feeder_id,
        name: f.feeder_name,
        scope: f.substation_name,
        currentKW: f.current_load_kw,
        status: f.utilization_pct > 80 ? 'Critical' : f.utilization_pct > 60 ? 'High' : 'Normal'
      }));
    }
    return filteredLoads;
  }, [isTransmission, filteredFeeders, filteredLoads]);

  // Generate transmission-specific load balancing recommendations
  const generateTransmissionRecommendations = (): LoadBalancingRecommendation[] => {
    const recommendations: LoadBalancingRecommendation[] = [];

    // Find overloaded feeders (>80% utilization)
    const overloadedFeeders = feederLoadData.filter(f => f.utilization_pct > 80);

    // Find underutilized feeders (<50% utilization)
    const underutilizedFeeders = feederLoadData.filter(f => f.utilization_pct < 50);

    // Generate feeder transfer recommendations
    overloadedFeeders.forEach((overloaded, idx) => {
      const targetFeeder = underutilizedFeeders.find(f =>
        f.substation_name === overloaded.substation_name &&
        f.voltage_level_kv === overloaded.voltage_level_kv
      );

      if (targetFeeder) {
        const transferAmount = overloaded.current_load_kw * 0.2; // Transfer 20% of load
        const newTargetLoad = targetFeeder.current_load_kw + transferAmount;
        const newTargetUtilization = (newTargetLoad / targetFeeder.capacity_kw) * 100;

        const isValid = newTargetUtilization < 90; // Keep target below 90%

        recommendations.push({
          id: `rec-feeder-${idx}`,
          type: "feeder_transfer",
          description: `Transfer ${transferAmount.toFixed(0)} kW from ${overloaded.feeder_name} to ${targetFeeder.feeder_name}`,
          from_entity: overloaded.feeder_name,
          to_entity: targetFeeder.feeder_name,
          impact: `Reduce ${overloaded.feeder_name} utilization from ${overloaded.utilization_pct.toFixed(1)}% to ${(overloaded.utilization_pct - 20).toFixed(1)}%`,
          priority: overloaded.utilization_pct > 90 ? "High" : "Medium",
          savings: "$2,500/month",
          capacity_validation: {
            valid: isValid,
            reason: isValid ? undefined : `Target feeder would exceed 90% capacity (${newTargetUtilization.toFixed(1)}%)`
          }
        });
      }
    });

    // Find overloaded transformers (>85% utilization)
    const overloadedTransformers = transformerLoadData.filter(t => t.utilization_pct > 85);

    overloadedTransformers.forEach((transformer, idx) => {
      recommendations.push({
        id: `rec-transformer-${idx}`,
        type: "transformer_rebalance",
        description: `Rebalance load on ${transformer.transformer_name} to reduce thermal stress`,
        from_entity: transformer.transformer_name,
        impact: `Reduce utilization from ${transformer.utilization_pct.toFixed(1)}% to target 75%`,
        priority: transformer.utilization_pct > 95 ? "High" : "Medium",
        savings: "$1,800/month",
        capacity_validation: {
          valid: true
        }
      });
    });

    // Add general optimization recommendations
    if (feederLoadData.length > 0) {
      const avgUtilization = feederLoadData.reduce((sum, f) => sum + f.utilization_pct, 0) / feederLoadData.length;

      if (avgUtilization < 40) {
        recommendations.push({
          id: "rec-consolidation",
          type: "demand_optimization",
          description: "Consolidate loads to fewer feeders during off-peak hours to improve efficiency",
          from_entity: "Multiple Feeders",
          impact: `Average utilization is ${avgUtilization.toFixed(1)}% - opportunity for consolidation`,
          priority: "Low",
          savings: "$3,200/month",
          capacity_validation: {
            valid: true
          }
        });
      }
    }

    return recommendations;
  };

  const transmissionRecommendations = isTransmission ? generateTransmissionRecommendations() : [];

  // Calculate load distribution data
  const loadDistributionData = upstreamControllableLoads.map(load => ({
    name: load.name.split(' ')[0], // Shortened name for chart
    currentKW: load.currentKW,
    priority: load.sheddingPriority,
    status: load.status
  }));

  // Calculate total load and distribution
  const totalLoad = upstreamControllableLoads.reduce((sum, load) => sum + load.currentKW, 0);
  const loadByType = upstreamControllableLoads.reduce((acc, load) => {
    acc[load.loadType] = (acc[load.loadType] || 0) + load.currentKW;
    return acc;
  }, {} as Record<string, number>);

  const pieData = Object.entries(loadByType).map(([type, value]) => ({
    name: type.charAt(0).toUpperCase() + type.slice(1),
    value: value,
    percentage: ((value / totalLoad) * 100).toFixed(1)
  }));

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  // Generate balancing recommendations
  const recommendations = [
    {
      id: 1,
      type: "Load Staggering",
      description: "Stagger ESP-07 and P-21 startup by 5 minutes to reduce peak demand",
      impact: "Reduce peak by 25 kW",
      priority: "High",
      savings: "$150/month"
    },
    {
      id: 2,
      type: "Load Shifting",
      description: "Move Camp HVAC load to off-peak hours (22:00-06:00)",
      impact: "Shift 35 kW to off-peak",
      priority: "Medium",
      savings: "$280/month"
    },
    {
      id: 3,
      type: "Demand Optimization",
      description: "Optimize GC-11 compressor cycling to maintain pressure with lower peak demand",
      impact: "Reduce average load by 15%",
      priority: "High",
      savings: "$420/month"
    }
  ];

  // Transmission work pane content
  const transmissionWorkPaneContent = (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading transmission data...</p>
        </div>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="distribution">Load Distribution</TabsTrigger>
            <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
            <TabsTrigger value="details">{selectedFeeder ? "Feeder Details" : "Details"}</TabsTrigger>
          </TabsList>


          <TabsContent value="distribution" className="space-y-6">
            {/* Feeder Load Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Feeder Load Distribution</CardTitle>
                  <CardDescription>Current load by feeder</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={feederLoadData.slice(0, 10)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="feeder_code" />
                      <YAxis />
                      <Tooltip
                        formatter={(value: number) => [`${value.toFixed(0)} kW`, 'Current Load']}
                        labelFormatter={(label) => `Feeder: ${label}`}
                      />
                      <Bar dataKey="current_load_kw" fill="#0088FE" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Feeder Utilization */}
              <Card>
                <CardHeader>
                  <CardTitle>Feeder Utilization</CardTitle>
                  <CardDescription>Capacity utilization by feeder</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={feederLoadData.slice(0, 10)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="feeder_code" />
                      <YAxis />
                      <Tooltip
                        formatter={(value: number) => [`${value.toFixed(1)}%`, 'Utilization']}
                        labelFormatter={(label) => `Feeder: ${label}`}
                      />
                      <Bar
                        dataKey="utilization_pct"
                        fill="#00C49F"
                        label={{ position: 'top', formatter: (value: number) => `${value.toFixed(0)}%` }}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Feeders</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{feederLoadData.length}</div>
                  <p className="text-xs text-muted-foreground">Active feeders</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Overloaded Feeders</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-destructive">
                    {feederLoadData.filter(f => f.utilization_pct > 80).length}
                  </div>
                  <p className="text-xs text-muted-foreground">&gt;80% capacity</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Avg Utilization</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-warning">
                    {feederLoadData.length > 0
                      ? (feederLoadData.reduce((sum, f) => sum + f.utilization_pct, 0) / feederLoadData.length).toFixed(1)
                      : 0}%
                  </div>
                  <p className="text-xs text-muted-foreground">Across all feeders</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Optimization Potential</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">
                    {transmissionRecommendations.length}
                  </div>
                  <p className="text-xs text-muted-foreground">Recommendations</p>
                </CardContent>
              </Card>
            </div>

            {/* Transformer Load Summary */}
            {transformerLoadData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Transformer Load Summary</CardTitle>
                  <CardDescription>Current transformer utilization</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {transformerLoadData.slice(0, 5).map((transformer) => (
                      <div key={transformer.transformer_id} className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-medium">{transformer.transformer_name}</div>
                          <div className="text-sm text-muted-foreground">
                            {transformer.substation_name} • {transformer.primary_voltage_kv}/{transformer.secondary_voltage_kv} kV
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="font-medium">{transformer.current_load_kw.toFixed(0)} kW</div>
                            <div className="text-sm text-muted-foreground">
                              {transformer.utilization_pct.toFixed(1)}% of {transformer.rated_capacity_kva.toFixed(0)} kVA
                            </div>
                          </div>
                          <Badge variant={transformer.utilization_pct > 85 ? 'destructive' : transformer.utilization_pct > 70 ? 'secondary' : 'default'}>
                            {transformer.utilization_pct > 85 ? 'High' : transformer.utilization_pct > 70 ? 'Medium' : 'Normal'}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="recommendations" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Load Balancing Recommendations</h3>
                <p className="text-sm text-muted-foreground">Optimize feeder and transformer load distribution</p>
              </div>
              <Dialog open={simulationOpen} onOpenChange={setSimulationOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Zap className="mr-2 h-4 w-4" />
                    Simulate Scenario
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Load Balancing Simulation</DialogTitle>
                    <DialogDescription>
                      Configure scenario parameters to simulate load balancing strategies
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="scenario" className="text-right">
                        Scenario
                      </Label>
                      <Select>
                        <SelectTrigger className="col-span-3">
                          <SelectValue placeholder="Select scenario" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="feeder-transfer">Feeder Load Transfer</SelectItem>
                          <SelectItem value="transformer-rebalance">Transformer Rebalancing</SelectItem>
                          <SelectItem value="emergency">Emergency Load Reduction</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="from-feeder" className="text-right">
                        From Feeder
                      </Label>
                      <Select>
                        <SelectTrigger className="col-span-3">
                          <SelectValue placeholder="Select feeder" />
                        </SelectTrigger>
                        <SelectContent>
                          {feederLoadData.map(f => (
                            <SelectItem key={f.feeder_id} value={f.feeder_id}>
                              {f.feeder_name} ({f.utilization_pct.toFixed(0)}%)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="transfer-amount" className="text-right">
                        Transfer (kW)
                      </Label>
                      <Input
                        id="transfer-amount"
                        placeholder="1000"
                        className="col-span-3"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setSimulationOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={() => setSimulationOpen(false)}>
                      Run Simulation
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="space-y-4">
              {transmissionRecommendations.length === 0 ? (
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center text-muted-foreground">
                      <TrendingUp className="mx-auto h-12 w-12 mb-2 opacity-50" />
                      <p>No load balancing recommendations at this time.</p>
                      <p className="text-sm">All feeders and transformers are operating within optimal ranges.</p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                transmissionRecommendations.map((rec) => (
                  <Card key={rec.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">{rec.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</CardTitle>
                        <Badge variant={rec.priority === 'High' ? 'destructive' : rec.priority === 'Medium' ? 'secondary' : 'default'}>
                          {rec.priority} Priority
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-3">{rec.description}</p>

                      {!rec.capacity_validation.valid && (
                        <Alert variant="destructive" className="mb-3">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            <strong>Capacity Constraint:</strong> {rec.capacity_validation.reason}
                          </AlertDescription>
                        </Alert>
                      )}

                      <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                        <div>
                          <span className="font-medium">From:</span> {rec.from_entity}
                        </div>
                        {rec.to_entity && (
                          <div>
                            <span className="font-medium">To:</span> {rec.to_entity}
                          </div>
                        )}
                        <div>
                          <span className="font-medium">Impact:</span> {rec.impact}
                        </div>
                        <div>
                          <span className="font-medium">Savings:</span> <span className="text-success">{rec.savings}</span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          View Details
                        </Button>
                        <Button size="sm" disabled={!rec.capacity_validation.valid}>
                          {rec.capacity_validation.valid ? 'Apply Recommendation' : 'Cannot Apply'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="details" className="space-y-6">
            {selectedFeeder ? (
              <Card>
                <CardHeader>
                  <CardTitle>{selectedFeeder.feeder_name}</CardTitle>
                  <CardDescription>
                    {selectedFeeder.substation_name} • {selectedFeeder.voltage_level_kv} kV • Code: {selectedFeeder.feeder_code}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div>
                      <Label className="text-sm font-medium">Current Load</Label>
                      <div className="text-2xl font-bold">{selectedFeeder.current_load_kw.toFixed(0)} kW</div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Capacity</Label>
                      <div className="text-2xl font-bold">{selectedFeeder.capacity_kw.toFixed(0)} kW</div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Utilization</Label>
                      <div className="text-2xl font-bold">{selectedFeeder.utilization_pct.toFixed(1)}%</div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Meters</Label>
                      <div className="text-2xl font-bold">{selectedFeeder.meter_count}</div>
                    </div>
                  </div>

                  <div className="mt-6">
                    <Label className="text-sm font-medium">Status</Label>
                    <div className="mt-2">
                      <Badge
                        variant={
                          selectedFeeder.utilization_pct > 80 ? 'destructive' :
                            selectedFeeder.utilization_pct > 60 ? 'secondary' : 'default'
                        }
                      >
                        {selectedFeeder.utilization_pct > 80 ? 'Overloaded' :
                          selectedFeeder.utilization_pct > 60 ? 'High Load' : 'Normal'}
                      </Badge>
                    </div>
                  </div>

                  <div className="mt-6 space-y-2">
                    <Label className="text-sm font-medium">Advisory Actions</Label>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" disabled={selectedFeeder.utilization_pct < 80}>
                        Transfer Load
                      </Button>
                      <Button size="sm" variant="outline">
                        View Load Profile
                      </Button>
                      <Button size="sm" variant="outline">
                        Schedule Maintenance
                      </Button>
                    </div>
                  </div>

                  {/* Capacity validation info */}
                  <div className="mt-6 p-4 bg-muted rounded-lg">
                    <h4 className="font-medium mb-2">Capacity Constraints</h4>
                    <div className="text-sm space-y-1">
                      <p>• Available capacity: {(selectedFeeder.capacity_kw - selectedFeeder.current_load_kw).toFixed(0)} kW</p>
                      <p>• Maximum safe load: {(selectedFeeder.capacity_kw * 0.9).toFixed(0)} kW (90% of capacity)</p>
                      <p>• Current margin: {((1 - selectedFeeder.utilization_pct / 100) * 100).toFixed(1)}%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="flex items-center justify-center h-64">
                <p className="text-muted-foreground">Select a feeder to view details</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );

  // Upstream work pane content (existing)
  const upstreamWorkPaneContent = selectedLoad ? (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="distribution">Load Distribution</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          <TabsTrigger value="details">{selectedLoad ? "Load Details" : "Details"}</TabsTrigger>
        </TabsList>


        <TabsContent value="distribution" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Current Load Distribution Bar Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Current Load Distribution</CardTitle>
                <CardDescription>Real-time load by controllable asset</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={loadDistributionData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip
                      formatter={(value: number) => [`${value} kW`, 'Current Load']}
                      labelFormatter={(label) => `Asset: ${label}`}
                    />
                    <Bar dataKey="currentKW" fill="#0088FE" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Load Type Distribution Pie Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Load by Type</CardTitle>
                <CardDescription>Distribution by equipment type</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percentage }) => `${name}: ${percentage}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => [`${value} kW`, 'Load']} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Load Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Controllable Load</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalLoad.toFixed(1)} kW</div>
                <p className="text-xs text-muted-foreground">Across {upstreamControllableLoads.length} assets</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Available for Shedding</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-success">
                  {upstreamControllableLoads.filter(l => l.status === 'available').length}
                </div>
                <p className="text-xs text-muted-foreground">Assets ready</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Peak Reduction Potential</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-warning">85 kW</div>
                <p className="text-xs text-muted-foreground">Max sheddable load</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Estimated Savings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">$850</div>
                <p className="text-xs text-muted-foreground">Monthly potential</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Balancing Recommendations</h3>
              <p className="text-sm text-muted-foreground">Optimize load distribution and reduce peak demand</p>
            </div>
            <Dialog open={simulationOpen} onOpenChange={setSimulationOpen}>
              <DialogTrigger asChild>
                <Button>
                  <span className="mr-2">🔬</span>
                  Simulate Scenario
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Load Balancing Simulation</DialogTitle>
                  <DialogDescription>
                    Configure scenario parameters to simulate load balancing strategies
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="scenario" className="text-right">
                      Scenario
                    </Label>
                    <Select>
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Select scenario" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="peak-shaving">Peak Shaving</SelectItem>
                        <SelectItem value="load-shifting">Load Shifting</SelectItem>
                        <SelectItem value="emergency">Emergency Reduction</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="target-reduction" className="text-right">
                      Target Reduction
                    </Label>
                    <Input
                      id="target-reduction"
                      placeholder="50"
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="duration" className="text-right">
                      Duration (min)
                    </Label>
                    <Input
                      id="duration"
                      placeholder="60"
                      className="col-span-3"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setSimulationOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={() => setSimulationOpen(false)}>
                    Run Simulation
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-4">
            {recommendations.map((rec) => (
              <Card key={rec.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{rec.type}</CardTitle>
                    <Badge variant={rec.priority === 'High' ? 'destructive' : 'secondary'}>
                      {rec.priority} Priority
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">{rec.description}</p>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Impact:</span> {rec.impact}
                    </div>
                    <div>
                      <span className="font-medium">Savings:</span> <span className="text-success">{rec.savings}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button size="sm" variant="outline">
                      View Details
                    </Button>
                    <Button size="sm">
                      Apply Recommendation
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="details" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{selectedLoad.name}</CardTitle>
              <CardDescription>Asset: {selectedLoad.assetId} • Type: {selectedLoad.loadType}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <Label className="text-sm font-medium">Current Load</Label>
                  <div className="text-2xl font-bold">{selectedLoad.currentKW} kW</div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Shedding Priority</Label>
                  <div className="text-2xl font-bold">{selectedLoad.sheddingPriority}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Min Off Time</Label>
                  <div className="text-2xl font-bold">{selectedLoad.minOffTimeMin} min</div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Max Shed Duration</Label>
                  <div className="text-2xl font-bold">{selectedLoad.maxShedMin} min</div>
                </div>
              </div>

              <div className="mt-6">
                <Label className="text-sm font-medium">Status</Label>
                <div className="mt-2">
                  <Badge
                    variant={
                      selectedLoad.status === 'available' ? 'default' :
                        selectedLoad.status === 'shedding' ? 'destructive' : 'secondary'
                    }
                  >
                    {selectedLoad.status.charAt(0).toUpperCase() + selectedLoad.status.slice(1)}
                  </Badge>
                </div>
              </div>

              <div className="mt-6 space-y-2">
                <Label className="text-sm font-medium">Control Actions</Label>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" disabled={selectedLoad.status !== 'available'}>
                    Shed Load
                  </Button>
                  <Button size="sm" variant="outline" disabled={selectedLoad.status !== 'shedding'}>
                    Restore Load
                  </Button>
                  <Button size="sm" variant="outline">
                    Schedule Maintenance
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  ) : (
    <div className="flex items-center justify-center h-64">
      <p className="text-muted-foreground">Select a controllable load to view details</p>
    </div>
  );

  return (
    <EMSPageShell
      title="Load Balancing"
      featureSetName="Energy Control Advisory & Integration"
      featureName="Load Balancing"
      listType={isTransmission ? "feeders" : "meters"}
      listItems={listItems}
      selectedItem={isTransmission ? selectedFeeder : selectedLoad}
      onItemSelect={isTransmission
        ? (item) => {
          setSelectedFeeder(item as FeederLoadData);
          setActiveTab("details");
        }
        : (item) => {
          setSelectedLoad(item as ControllableLoad);
          setActiveTab("details");
        }
      }

      workPaneContent={isTransmission ? transmissionWorkPaneContent : upstreamWorkPaneContent}
      searchPlaceholder={isTransmission ? "Search feeders..." : "Search controllable loads..."}
      onSearch={setSearchQuery}
      listFilterContent={
        <EnergyListFilter
          filters={filters}
          onFiltersChange={setFilters}
          showTypeFilter={!isTransmission}
          typeOptions={[
            { label: "Compressor", value: "compressor" },
            { label: "Pump", value: "pump" },
            { label: "HVAC", value: "hvac" },
            { label: "Lighting", value: "lighting" },
            { label: "Process", value: "process" }
          ]}
          showRoleFilter={isTransmission}
          showSubstationFilter={isTransmission}
          showFeederFilter={isTransmission}
        />
      }
      sector={sector}
      subsector={subsector}
      tenantName={tenantName}
    />
  );
}