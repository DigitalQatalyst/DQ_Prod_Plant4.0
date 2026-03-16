import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  X, 
  AlertTriangle, 
  TrendingUp, 
  Clock, 
  DollarSign,
  Zap,
  Activity,
  BarChart3
} from "lucide-react";
import { EnergyAnomaly } from "@/data/mockData";

interface AnomalyDrilldownPopPaneProps {
  anomaly: EnergyAnomaly;
  onClose: () => void;
}

export function AnomalyDrilldownPopPane({ anomaly, onClose }: AnomalyDrilldownPopPaneProps) {
  const [activeTab, setActiveTab] = useState("overview");

  // Mock telemetry data for the anomaly
  const telemetryData = {
    beforeAnomaly: [
      { time: "14:00", value: 145.2 },
      { time: "14:15", value: 147.1 },
      { time: "14:30", value: 146.8 },
    ],
    duringAnomaly: [
      { time: "14:45", value: 182.3 },
      { time: "15:00", value: 189.7 },
      { time: "15:15", value: 185.1 },
    ],
    afterAnomaly: [
      { time: "15:30", value: 148.2 },
      { time: "15:45", value: 146.9 },
      { time: "16:00", value: 145.8 },
    ]
  };

  const relatedEvents = [
    { time: "14:42", event: "ESP-07 Variable Drive Speed Increase", type: "operational" },
    { time: "14:45", event: "Power Factor Drop to 0.85", type: "power_quality" },
    { time: "14:48", event: "Voltage Sag Event (475V)", type: "power_quality" },
    { time: "15:20", event: "ESP-07 Speed Normalized", type: "operational" },
  ];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "Critical": return "destructive";
      case "High": return "destructive";
      case "Medium": return "secondary";
      case "Low": return "outline";
      default: return "outline";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "spike": return <TrendingUp className="h-4 w-4" />;
      case "baseline_drift": return <Activity className="h-4 w-4" />;
      case "power_quality": return <Zap className="h-4 w-4" />;
      case "standby_waste": return <BarChart3 className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            {getTypeIcon(anomaly.type)}
            <div>
              <h2 className="text-xl font-semibold">Anomaly Investigation</h2>
              <p className="text-sm text-muted-foreground">
                {anomaly.description}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="telemetry">Telemetry</TabsTrigger>
              <TabsTrigger value="events">Related Events</TabsTrigger>
              <TabsTrigger value="analysis">Analysis</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      Severity
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Badge variant={getSeverityColor(anomaly.severity)}>
                      {anomaly.severity}
                    </Badge>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Magnitude
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">+{anomaly.magnitudePct}%</div>
                    <p className="text-xs text-muted-foreground">Above baseline</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Duration
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">35</div>
                    <p className="text-xs text-muted-foreground">Minutes</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Cost Impact
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">${anomaly.estimatedCostImpact}</div>
                    <p className="text-xs text-muted-foreground">Estimated</p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Anomaly Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Meter ID</label>
                      <p className="text-sm">{anomaly.meterId}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Type</label>
                      <p className="text-sm capitalize">{anomaly.type.replace('_', ' ')}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Timestamp</label>
                      <p className="text-sm">{new Date(anomaly.timestamp).toLocaleString()}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Status</label>
                      <Badge variant={anomaly.resolved ? "default" : "secondary"}>
                        {anomaly.resolved ? "Resolved" : "Open"}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="telemetry" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Power Consumption Timeline</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium mb-2">Before Anomaly (Normal Operation)</h4>
                      <div className="grid grid-cols-3 gap-2 text-sm">
                        {telemetryData.beforeAnomaly.map((point, idx) => (
                          <div key={idx} className="flex justify-between p-2 bg-muted rounded">
                            <span>{point.time}</span>
                            <span>{point.value} kW</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium mb-2">During Anomaly (Elevated Consumption)</h4>
                      <div className="grid grid-cols-3 gap-2 text-sm">
                        {telemetryData.duringAnomaly.map((point, idx) => (
                          <div key={idx} className="flex justify-between p-2 bg-destructive/10 rounded">
                            <span>{point.time}</span>
                            <span className="font-bold text-destructive">{point.value} kW</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium mb-2">After Anomaly (Normalized)</h4>
                      <div className="grid grid-cols-3 gap-2 text-sm">
                        {telemetryData.afterAnomaly.map((point, idx) => (
                          <div key={idx} className="flex justify-between p-2 bg-muted rounded">
                            <span>{point.time}</span>
                            <span>{point.value} kW</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="events" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Correlated Events</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {relatedEvents.map((event, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-3 border border-border rounded">
                        <div className="text-sm font-mono text-muted-foreground">
                          {event.time}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm">{event.event}</p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {event.type.replace('_', ' ')}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analysis" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Root Cause Analysis</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium mb-2">Likely Cause</h4>
                    <p className="text-sm text-muted-foreground">
                      ESP-07 variable drive speed increase triggered by well conditions, 
                      causing elevated power consumption and power quality issues.
                    </p>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium mb-2">Contributing Factors</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Increased fluid viscosity requiring higher pump speed</li>
                      <li>• Power factor degradation due to variable drive operation</li>
                      <li>• Voltage sag from increased motor load</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium mb-2">Recommended Actions</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Review ESP-07 operating parameters and well conditions</li>
                      <li>• Consider power factor correction for variable drives</li>
                      <li>• Monitor voltage stability during high load periods</li>
                      <li>• Schedule preventive maintenance for ESP system</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              <div className="flex gap-2">
                <Button className="flex-1">
                  Mark as Resolved
                </Button>
                <Button variant="outline">
                  Create Work Order
                </Button>
                <Button variant="outline">
                  Export Report
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}