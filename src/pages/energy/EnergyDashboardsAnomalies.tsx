import { useState, useMemo, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { EMSPageShell } from "@/components/ems/EMSPageShell";
import { KPICard } from "@/components/shared/KPICard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Zap,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Download,
  Filter,
  Search,
  BarChart3,
  Activity,
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { cn } from "@/lib/utils";
import { EnergyListFilter, EnergyFilterState } from "@/components/ems/EnergyListFilter";

interface Anomaly {
  id: string;
  meterId: string;
  meterName: string;
  timestamp: string;
  type: "spike" | "baseline_drift" | "power_quality" | "standby_waste" | "grid_losses" | "voltage_deviation" | "load_imbalance";
  magnitudePct: number;
  severity: "Low" | "Medium" | "High" | "Critical";
  description: string;
  resolved: boolean;
  estimatedCostImpact?: number;
  telemetrySnapshot?: {
    before: number[];
    during: number[];
    after: number[];
    timestamps: string[];
  };
  // Transmission-specific context
  substationName?: string;
  substationId?: string;
  feederName?: string;
  feederId?: string;
  voltageLevel?: number;
}

// Component for displaying anomaly overview statistics
function AnomaliesOverview({ anomalies, stats, isTransmission }: {
  anomalies: Anomaly[],
  stats: { total: number, active: number, critical: number, totalCostImpact: number },
  isTransmission: boolean
}) {
  const severityDistribution = {
    Critical: anomalies.filter(a => a.severity === "Critical" && !a.resolved).length,
    High: anomalies.filter(a => a.severity === "High" && !a.resolved).length,
    Medium: anomalies.filter(a => a.severity === "Medium" && !a.resolved).length,
    Low: anomalies.filter(a => a.severity === "Low" && !a.resolved).length,
  };

  const typeDistribution = isTransmission ? {
    grid_losses: anomalies.filter(a => a.type === "grid_losses" && !a.resolved).length,
    voltage_deviation: anomalies.filter(a => a.type === "voltage_deviation" && !a.resolved).length,
    load_imbalance: anomalies.filter(a => a.type === "load_imbalance" && !a.resolved).length,
    power_quality: anomalies.filter(a => a.type === "power_quality" && !a.resolved).length,
    spike: anomalies.filter(a => a.type === "spike" && !a.resolved).length,
  } : {
    spike: anomalies.filter(a => a.type === "spike" && !a.resolved).length,
    baseline_drift: anomalies.filter(a => a.type === "baseline_drift" && !a.resolved).length,
    power_quality: anomalies.filter(a => a.type === "power_quality" && !a.resolved).length,
    standby_waste: anomalies.filter(a => a.type === "standby_waste" && !a.resolved).length,
  };

  return (
    <div className="space-y-6">
      {/* Summary KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KPICard
          title="Total Anomalies"
          value={stats.total.toString()}
          subtitle="All time"
          icon={AlertTriangle}
        />
        <KPICard
          title="Active Anomalies"
          value={stats.active.toString()}
          subtitle="Requiring attention"
          icon={Activity}
          trend={stats.active > 0 ? "up" : "neutral"}
        />
        <KPICard
          title="Critical Issues"
          value={stats.critical.toString()}
          subtitle="High priority"
          icon={XCircle}
          trend={stats.critical > 0 ? "up" : "neutral"}
        />
        <KPICard
          title="Cost Impact"
          value={`$${stats.totalCostImpact.toLocaleString()}`}
          subtitle="Estimated monthly"
          icon={DollarSign}
          trend={stats.totalCostImpact > 0 ? "up" : "neutral"}
        />
      </div>

      {/* Distribution Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Severity Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(severityDistribution).map(([severity, count]) => (
                <div key={severity} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={severity === "Critical" ? "destructive" :
                        severity === "High" ? "destructive" :
                          severity === "Medium" ? "secondary" : "outline"}
                    >
                      {severity}
                    </Badge>
                    <span className="text-sm">{severity}</span>
                  </div>
                  <span className="font-medium">{count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Type Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(typeDistribution).map(([type, count]) => (
                <div key={type} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "w-3 h-3 rounded-full",
                      type === "spike" && "bg-red-500",
                      type === "baseline_drift" && "bg-orange-500",
                      type === "power_quality" && "bg-yellow-500",
                      type === "standby_waste" && "bg-blue-500",
                      type === "grid_losses" && "bg-purple-500",
                      type === "voltage_deviation" && "bg-pink-500",
                      type === "load_imbalance" && "bg-indigo-500"
                    )} />
                    <span className="text-sm capitalize">{type.replace(/_/g, ' ')}</span>
                  </div>
                  <span className="font-medium">{count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Component for displaying anomalies in a table format
function AnomaliesTable({ anomalies, onSelect, isTransmission }: {
  anomalies: Anomaly[],
  onSelect: (anomaly: Anomaly) => void,
  isTransmission: boolean
}) {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "Critical": return "text-red-500";
      case "High": return "text-orange-500";
      case "Medium": return "text-yellow-500";
      case "Low": return "text-blue-500";
      default: return "text-gray-500";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "spike": return <TrendingUp className="w-4 h-4 text-red-500" />;
      case "baseline_drift": return <TrendingDown className="w-4 h-4 text-orange-500" />;
      case "power_quality": return <Zap className="w-4 h-4 text-yellow-500" />;
      case "standby_waste": return <Clock className="w-4 h-4 text-blue-500" />;
      case "grid_losses": return <Activity className="w-4 h-4 text-red-500" />;
      case "voltage_deviation": return <Zap className="w-4 h-4 text-orange-500" />;
      case "load_imbalance": return <BarChart3 className="w-4 h-4 text-yellow-500" />;
      default: return <AlertTriangle className="w-4 h-4" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Anomaly Details</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {anomalies.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No anomalies found matching the current filters.
            </div>
          ) : (
            anomalies.map((anomaly) => (
              <div
                key={anomaly.id}
                className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={() => onSelect(anomaly)}
              >
                <div className="flex items-center gap-3 flex-1">
                  {getTypeIcon(anomaly.type)}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{anomaly.meterName}</span>
                      {isTransmission && (anomaly.substationName || anomaly.feederName) && (
                        <span className="text-xs text-muted-foreground">
                          {anomaly.substationName && `@ ${anomaly.substationName}`}
                          {anomaly.feederName && ` / ${anomaly.feederName}`}
                          {anomaly.voltageLevel && ` (${anomaly.voltageLevel}kV)`}
                        </span>
                      )}
                      <Badge variant={anomaly.resolved ? "outline" : "secondary"}>
                        {anomaly.resolved ? "Resolved" : "Active"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{anomaly.description}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                      <span>{new Date(anomaly.timestamp).toLocaleString()}</span>
                      <span>Magnitude: {anomaly.magnitudePct}%</span>
                      {anomaly.estimatedCostImpact && (
                        <span>Impact: ${anomaly.estimatedCostImpact}</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={cn("text-sm font-medium", getSeverityColor(anomaly.severity))}>
                    {anomaly.severity}
                  </span>
                  <Button variant="ghost" size="sm">
                    <Eye className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Component for displaying detailed anomaly information
function AnomalyDetails({ anomaly }: { anomaly: Anomaly }) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Anomaly Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Anomaly ID</label>
              <p className="font-mono text-sm">{anomaly.id}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Meter</label>
              <p>{anomaly.meterName}</p>
            </div>
            {anomaly.substationName && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Substation</label>
                <p>{anomaly.substationName}</p>
              </div>
            )}
            {anomaly.feederName && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Feeder</label>
                <p>{anomaly.feederName}</p>
              </div>
            )}
            {anomaly.voltageLevel && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Voltage Level</label>
                <p>{anomaly.voltageLevel} kV</p>
              </div>
            )}
            <div>
              <label className="text-sm font-medium text-muted-foreground">Type</label>
              <p className="capitalize">{anomaly.type.replace('_', ' ')}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Severity</label>
              <Badge
                variant={anomaly.severity === "Critical" ? "destructive" :
                  anomaly.severity === "High" ? "destructive" :
                    anomaly.severity === "Medium" ? "secondary" : "outline"}
              >
                {anomaly.severity}
              </Badge>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Timestamp</label>
              <p>{new Date(anomaly.timestamp).toLocaleString()}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Magnitude</label>
              <p>{anomaly.magnitudePct}%</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Status</label>
              <Badge variant={anomaly.resolved ? "outline" : "secondary"}>
                {anomaly.resolved ? "Resolved" : "Active"}
              </Badge>
            </div>
            {anomaly.estimatedCostImpact && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Cost Impact</label>
                <p>${anomaly.estimatedCostImpact.toLocaleString()}</p>
              </div>
            )}
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">Description</label>
            <p className="mt-1">{anomaly.description}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recommended Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {anomaly.type === "spike" && (
              <>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                  <div>
                    <p className="font-medium">Investigate Equipment Startup</p>
                    <p className="text-sm text-muted-foreground">Check if spike correlates with equipment startup procedures</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                  <div>
                    <p className="font-medium">Review Load Scheduling</p>
                    <p className="text-sm text-muted-foreground">Consider staggered startup to reduce peak demand</p>
                  </div>
                </div>
              </>
            )}
            {anomaly.type === "baseline_drift" && (
              <>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                  <div>
                    <p className="font-medium">Equipment Efficiency Check</p>
                    <p className="text-sm text-muted-foreground">Inspect equipment for degraded performance</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                  <div>
                    <p className="font-medium">Baseline Recalibration</p>
                    <p className="text-sm text-muted-foreground">Update baseline if operational changes are permanent</p>
                  </div>
                </div>
              </>
            )}
            {anomaly.type === "power_quality" && (
              <>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                  <div>
                    <p className="font-medium">Power Factor Correction</p>
                    <p className="text-sm text-muted-foreground">Install or adjust capacitor banks</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                  <div>
                    <p className="font-medium">Harmonic Analysis</p>
                    <p className="text-sm text-muted-foreground">Investigate sources of harmonic distortion</p>
                  </div>
                </div>
              </>
            )}
            {anomaly.type === "standby_waste" && (
              <>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                  <div>
                    <p className="font-medium">Standby Load Audit</p>
                    <p className="text-sm text-muted-foreground">Identify unnecessary equipment running during off-hours</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                  <div>
                    <p className="font-medium">Automated Scheduling</p>
                    <p className="text-sm text-muted-foreground">Implement automatic shutdown for non-critical loads</p>
                  </div>
                </div>
              </>
            )}
            {anomaly.type === "grid_losses" && (
              <>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                  <div>
                    <p className="font-medium">Inspect Transmission Line</p>
                    <p className="text-sm text-muted-foreground">Check for conductor degradation, loose connections, or insulation issues</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                  <div>
                    <p className="font-medium">Transformer Load Analysis</p>
                    <p className="text-sm text-muted-foreground">Verify transformer loading is within optimal efficiency range</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                  <div>
                    <p className="font-medium">Review Load Distribution</p>
                    <p className="text-sm text-muted-foreground">Consider load balancing across feeders to reduce losses</p>
                  </div>
                </div>
              </>
            )}
            {anomaly.type === "voltage_deviation" && (
              <>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                  <div>
                    <p className="font-medium">Adjust Transformer Tap Settings</p>
                    <p className="text-sm text-muted-foreground">Optimize tap changer position to maintain voltage within limits</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                  <div>
                    <p className="font-medium">Reactive Power Compensation</p>
                    <p className="text-sm text-muted-foreground">Deploy capacitor banks or SVCs to improve voltage regulation</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                  <div>
                    <p className="font-medium">Load Flow Analysis</p>
                    <p className="text-sm text-muted-foreground">Perform network analysis to identify voltage drop causes</p>
                  </div>
                </div>
              </>
            )}
            {anomaly.type === "load_imbalance" && (
              <>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                  <div>
                    <p className="font-medium">Redistribute Phase Loads</p>
                    <p className="text-sm text-muted-foreground">Balance single-phase loads across all three phases</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                  <div>
                    <p className="font-medium">Inspect Phase Connections</p>
                    <p className="text-sm text-muted-foreground">Verify all phase connections are secure and properly configured</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                  <div>
                    <p className="font-medium">Monitor Neutral Current</p>
                    <p className="text-sm text-muted-foreground">Check for excessive neutral current indicating severe imbalance</p>
                  </div>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Component for displaying telemetry analysis with charts
function TelemetryAnalysis({ anomaly }: { anomaly: Anomaly }) {
  if (!anomaly.telemetrySnapshot) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">
            No telemetry data available for this anomaly.
          </div>
        </CardContent>
      </Card>
    );
  }

  const { before, during, after, timestamps } = anomaly.telemetrySnapshot;

  // Combine all data points for the chart
  const chartData = timestamps.map((timestamp, index) => {
    let value: number;
    let phase: string;

    if (index < before.length) {
      value = before[index];
      phase = "Before";
    } else if (index < before.length + during.length) {
      value = during[index - before.length];
      phase = "During";
    } else {
      value = after[index - before.length - during.length];
      phase = "After";
    }

    return {
      timestamp: new Date(timestamp).toLocaleTimeString(),
      value,
      phase
    };
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Telemetry Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="timestamp"
                  tick={{ fontSize: 12 }}
                  interval="preserveStartEnd"
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  labelFormatter={(label) => `Time: ${label}`}
                  formatter={(value: number, name: string) => [
                    `${value.toFixed(1)} kW`,
                    "Power"
                  ]}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#8884d8"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Before Anomaly</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Average:</span>
                <span className="font-medium">
                  {(before.reduce((a, b) => a + b, 0) / before.length).toFixed(1)} kW
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Min:</span>
                <span className="font-medium">{Math.min(...before).toFixed(1)} kW</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Max:</span>
                <span className="font-medium">{Math.max(...before).toFixed(1)} kW</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">During Anomaly</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Average:</span>
                <span className="font-medium text-red-500">
                  {(during.reduce((a, b) => a + b, 0) / during.length).toFixed(1)} kW
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Min:</span>
                <span className="font-medium">{Math.min(...during).toFixed(1)} kW</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Max:</span>
                <span className="font-medium">{Math.max(...during).toFixed(1)} kW</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">After Anomaly</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Average:</span>
                <span className="font-medium">
                  {(after.reduce((a, b) => a + b, 0) / after.length).toFixed(1)} kW
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Min:</span>
                <span className="font-medium">{Math.min(...after).toFixed(1)} kW</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Max:</span>
                <span className="font-medium">{Math.max(...after).toFixed(1)} kW</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function EnergyDashboardsAnomalies() {
  const {
    energyMeters,
    upstreamEnergyAnomalies,
    transmissionEnergyAnomalies,
    sector,
    subsector,
    currentTenant
  } = useApp();

  const [selectedAnomaly, setSelectedAnomaly] = useState<Anomaly | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<EnergyFilterState>({
    status: "active",
    role: "",
    substationId: "",
    feederId: "",
    type: ""
  });

  // Determine if we're in transmission context
  const isTransmission = sector === 'power' && subsector === 'Transmission';

  // Select appropriate anomaly data based on sector
  const rawAnomalies = isTransmission ? transmissionEnergyAnomalies : upstreamEnergyAnomalies;

  // Enhance anomalies with meter names and telemetry
  const enhancedAnomalies: Anomaly[] = useMemo(() => {
    return rawAnomalies.map(anomaly => {
      const meter = energyMeters.find(m => m.id === anomaly.meterId);

      // Generate mock telemetry snapshot
      const generateTelemetrySnapshot = () => {
        const baseValue = 100;
        const anomalyMagnitude = anomaly.magnitudePct / 100;

        const before = Array.from({ length: 12 }, () =>
          baseValue + (Math.random() - 0.5) * 10
        );
        const during = Array.from({ length: 6 }, () =>
          baseValue * (1 + anomalyMagnitude) + (Math.random() - 0.5) * 15
        );
        const after = Array.from({ length: 12 }, () =>
          baseValue + (Math.random() - 0.5) * 10
        );

        const timestamps = Array.from({ length: 30 }, (_, i) => {
          const date = new Date(anomaly.timestamp);
          date.setMinutes(date.getMinutes() - (29 - i) * 5);
          return date.toISOString();
        });

        return {
          before,
          during,
          after,
          timestamps
        };
      };

      return {
        ...anomaly,
        meterName: meter?.name || "Unknown Meter",
        telemetrySnapshot: generateTelemetrySnapshot()
      };
    });
  }, [rawAnomalies, energyMeters]);

  const filteredAnomalies = useMemo(() => {
    let filtered = enhancedAnomalies;

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (anomaly) =>
          anomaly.meterName.toLowerCase().includes(query) ||
          anomaly.description.toLowerCase().includes(query) ||
          anomaly.type.toLowerCase().includes(query)
      );
    }

    // Filter by type
    if (filters.type) {
      filtered = filtered.filter(a => a.type === filters.type);
    }

    // Filter by status
    if (filters.status) {
      if (filters.status === "active") {
        filtered = filtered.filter(a => !a.resolved);
      } else if (filters.status === "resolved") {
        filtered = filtered.filter(a => a.resolved);
      }
    }

    // Transmission filters
    if (isTransmission) {
      if (filters.substationId) {
        filtered = filtered.filter(a => a.substationId === filters.substationId);
      }
      if (filters.feederId) {
        filtered = filtered.filter(a => a.feederId === filters.feederId);
      }
    }

    return filtered;
  }, [enhancedAnomalies, searchQuery, filters, isTransmission]);

  const anomalyStats = useMemo(() => {
    const total = enhancedAnomalies.length;
    const active = enhancedAnomalies.filter(a => !a.resolved).length;
    const critical = enhancedAnomalies.filter(a => a.severity === "Critical" && !a.resolved).length;
    const totalCostImpact = enhancedAnomalies
      .filter(a => !a.resolved)
      .reduce((sum, a) => sum + (a.estimatedCostImpact || 0), 0);

    return { total, active, critical, totalCostImpact };
  }, [enhancedAnomalies]);

  // Update selection if filtered out
  useEffect(() => {
    if (filteredAnomalies.length > 0 && (!selectedAnomaly || !filteredAnomalies.find(a => a.id === selectedAnomaly.id))) {
      setSelectedAnomaly(filteredAnomalies[0]);
    }
  }, [filteredAnomalies, selectedAnomaly]);

  const [activeTab, setActiveTab] = useState(selectedAnomaly ? "details" : "overview");

  // Sync activeTab when selectedAnomaly changes significantly (e.g. from null to exists)
  useEffect(() => {
    if (selectedAnomaly) {
      setActiveTab("details");
    } else {
      setActiveTab("overview");
    }
  }, [selectedAnomaly?.id]);

  const tabs = selectedAnomaly ? [
    {
      id: "details",
      label: "Anomaly Details",
      content: <AnomalyDetails anomaly={selectedAnomaly} />,
    },
    {
      id: "telemetry",
      label: "Telemetry Analysis",
      content: <TelemetryAnalysis anomaly={selectedAnomaly} />,
    },
  ] : [
    {
      id: "overview",
      label: "Overview",
      content: <AnomaliesOverview anomalies={filteredAnomalies} stats={anomalyStats} isTransmission={isTransmission} />,
    },
    {
      id: "table",
      label: "Anomaly Table",
      content: <AnomaliesTable anomalies={filteredAnomalies} onSelect={setSelectedAnomaly} isTransmission={isTransmission} />,
    },
  ];

  const filterView = (
    <EnergyListFilter
      filters={filters}
      onFiltersChange={setFilters}
      showTypeFilter={true}
    />
  );

  return (
    <EMSPageShell
      title="Anomalies & Waste Detection"
      featureSetName="Energy Dashboards & Reporting"
      featureName="Anomaly Detection"
      listType="alerts"
      listItems={filteredAnomalies}
      selectedItem={selectedAnomaly}
      onItemSelect={(item) => {
        setSelectedAnomaly(item as Anomaly);
        setActiveTab("details");
      }}
      searchPlaceholder="Search anomalies..."
      onSearch={setSearchQuery}
      listFilterContent={filterView}
      workPaneContent={
        <div className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              {tabs.map((tab) => (
                <TabsTrigger key={tab.id} value={tab.id}>
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
            {tabs.map((tab) => (
              <TabsContent key={tab.id} value={tab.id} className="mt-6">
                {tab.content}
              </TabsContent>
            ))}
          </Tabs>
        </div>
      }
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="w-4 h-4" />
            Export Report
          </Button>
        </div>
      }
    />
  );
}