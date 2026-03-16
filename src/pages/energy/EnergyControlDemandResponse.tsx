import { useState, useMemo, useEffect } from "react";
import { EMSPageShell } from "@/components/ems/EMSPageShell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { upstreamDemandResponseSignals, upstreamControllableLoads, type DemandResponseSignal, type ControllableLoad } from "@/data/mockData";
import { formatDistanceToNow } from "date-fns";
import { Clock, Zap, AlertTriangle, CheckCircle, XCircle, Building2, Cable } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { EnergyListFilter, EnergyFilterState } from "@/components/ems/EnergyListFilter";

export default function EnergyControlDemandResponse() {
  const { sector, subsector } = useApp();
  const isTransmission = sector === 'power' && subsector === 'Transmission';

  // Mock transmission DR events - in production, these would come from TransmissionProvider
  const transmissionDREvents: DemandResponseSignal[] = [
    {
      id: "dr-tx-001",
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      eventType: "peak_shaving",
      requestedReductionKw: 2500,
      durationMin: 120,
      status: "active"
    },
    {
      id: "dr-tx-002",
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      eventType: "emergency",
      requestedReductionKw: 5000,
      durationMin: 60,
      status: "completed"
    },
    {
      id: "dr-tx-003",
      timestamp: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
      eventType: "load_shifting",
      requestedReductionKw: 1800,
      durationMin: 90,
      status: "pending"
    }
  ];

  // Mock transmission controllable loads - in production, these would come from TransmissionProvider
  const transmissionControllableLoads: ControllableLoad[] = [
    {
      id: "load-tx-cap-01",
      name: "Capacitor Bank CB-01",
      assetId: "CAP-DXB-01",
      loadType: "capacitor_bank",
      currentKW: 800,
      maxShedMin: 240,
      minOffTimeMin: 15,
      sheddingPriority: 3,
      status: "available"
    },
    {
      id: "load-tx-cap-02",
      name: "Capacitor Bank CB-02",
      assetId: "CAP-JA-01",
      loadType: "capacitor_bank",
      currentKW: 600,
      maxShedMin: 240,
      minOffTimeMin: 15,
      sheddingPriority: 4,
      status: "available"
    },
    {
      id: "load-tx-tap-01",
      name: "Transformer Tap Changer T1",
      assetId: "TAP-DXB-T1",
      loadType: "transformer_tap",
      currentKW: 1200,
      maxShedMin: 180,
      minOffTimeMin: 30,
      sheddingPriority: 2,
      status: "available"
    },
    {
      id: "load-tx-hvac-01",
      name: "Substation HVAC System",
      assetId: "HVAC-DXB-01",
      loadType: "hvac",
      currentKW: 450,
      maxShedMin: 120,
      minOffTimeMin: 10,
      sheddingPriority: 5,
      status: "available"
    },
    {
      id: "load-tx-bess-01",
      name: "Battery Storage System",
      assetId: "BESS-AW-01",
      loadType: "battery_storage",
      currentKW: 2000,
      maxShedMin: 300,
      minOffTimeMin: 0,
      sheddingPriority: 1,
      status: "available"
    },
    {
      id: "load-tx-pump-01",
      name: "Cooling Pump Station",
      assetId: "PUMP-JA-01",
      loadType: "pump",
      currentKW: 350,
      maxShedMin: 90,
      minOffTimeMin: 20,
      sheddingPriority: 6,
      status: "maintenance"
    }
  ];

  // Select data source based on sector
  const rawDREvents = isTransmission ? transmissionDREvents : upstreamDemandResponseSignals;
  const controllableLoads = isTransmission ? transmissionControllableLoads : upstreamControllableLoads;

  const [selectedEvent, setSelectedEvent] = useState<DemandResponseSignal>(rawDREvents[0]);
  const [activeTab, setActiveTab] = useState("event-details");

  const [selectedLoads, setSelectedLoads] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<EnergyFilterState>({
    status: "",
    role: "",
    substationId: "",
    feederId: "",
    type: ""
  });

  const drEvents = useMemo(() => {
    let result = rawDREvents;

    // Search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(e => e.id.toLowerCase().includes(query) || e.eventType.toLowerCase().includes(query));
    }

    // Status
    if (filters.status) {
      result = result.filter(e => e.status.toLowerCase() === filters.status.toLowerCase());
    }

    // Event Type (using type filter)
    if (filters.type) {
      result = result.filter(e => e.eventType.toLowerCase() === filters.type.toLowerCase());
    }

    return result;
  }, [rawDREvents, searchQuery, filters]);

  // Update selection if filtered out
  useEffect(() => {
    if (drEvents.length > 0 && (!selectedEvent || !drEvents.find(e => e.id === selectedEvent.id))) {
      setSelectedEvent(drEvents[0]);
    }
  }, [drEvents, selectedEvent]);

  // Get suggested loads based on priority and event requirements
  const getSuggestedLoads = (event: DemandResponseSignal) => {
    if (!event) return [];

    // Sort by priority (lower number = higher priority for shedding)
    const sortedLoads = [...controllableLoads]
      .filter(load => load.status === 'available')
      .sort((a, b) => a.sheddingPriority - b.sheddingPriority);

    let totalReduction = 0;
    const suggested = [];

    for (const load of sortedLoads) {
      if (totalReduction < event.requestedReductionKw) {
        suggested.push(load);
        totalReduction += load.currentKW;
      }
    }

    return suggested;
  };

  const suggestedLoads = useMemo(() => getSuggestedLoads(selectedEvent), [selectedEvent, controllableLoads]);
  const totalSuggestedReduction = suggestedLoads.reduce((sum, load) => sum + load.currentKW, 0);

  // Helper function to get transmission context from asset ID
  const getTransmissionContext = (assetId: string) => {
    if (!isTransmission) return null;

    // Extract substation from asset ID pattern (e.g., CAP-DXB-01 -> Dubai Main)
    const substationMap: Record<string, string> = {
      'DXB': 'Dubai Main',
      'JA': 'Jebel Ali',
      'AW': 'Al Aweer',
      'SOUTH': 'Dubai South'
    };

    const match = assetId.match(/-(DXB|JA|AW|SOUTH)-/);
    const substationCode = match ? match[1] : null;
    const substationName = substationCode ? substationMap[substationCode] : 'Unknown';

    // Determine feeder if applicable
    const feederMap: Record<string, string> = {
      'CAP-DXB-01': 'FDR-OUT-01',
      'CAP-JA-01': 'FDR-OUT-02',
      'TAP-DXB-T1': 'FDR-INC-01',
      'HVAC-DXB-01': 'FDR-AUX-01',
      'BESS-AW-01': 'FDR-OUT-03',
      'PUMP-JA-01': 'FDR-AUX-02'
    };

    const feederCode = feederMap[assetId] || null;

    return {
      substation: substationName,
      feeder: feederCode
    };
  };

  // Helper function to validate transmission load shedding constraints
  const validateTransmissionConstraints = (selectedLoadIds: string[]) => {
    if (!isTransmission) return { valid: true, warnings: [] };

    const warnings: string[] = [];
    const selectedLoadsList = controllableLoads.filter(l => selectedLoadIds.includes(l.id));

    // Check feeder capacity constraints
    const feederLoads: Record<string, number> = {};
    selectedLoadsList.forEach(load => {
      const context = getTransmissionContext(load.assetId);
      if (context?.feeder) {
        feederLoads[context.feeder] = (feederLoads[context.feeder] || 0) + load.currentKW;
      }
    });

    // Validate feeder shed limits (max 40% of feeder capacity)
    Object.entries(feederLoads).forEach(([feeder, totalKW]) => {
      const feederCapacity = 5000; // Mock capacity - in production, fetch from TransmissionProvider
      const shedPercentage = (totalKW / feederCapacity) * 100;
      if (shedPercentage > 40) {
        warnings.push(`Feeder ${feeder}: Shed load (${totalKW.toFixed(0)} kW) exceeds 40% capacity limit`);
      }
    });

    // Check for coordinated shedding requirements
    const capacitorBanks = selectedLoadsList.filter(l => l.loadType === 'capacitor_bank');
    if (capacitorBanks.length === 1) {
      warnings.push('Single capacitor bank shedding may cause voltage imbalance. Consider shedding in pairs.');
    }

    // Check transformer tap changer constraints
    const tapChangers = selectedLoadsList.filter(l => l.loadType === 'transformer_tap');
    if (tapChangers.length > 0) {
      warnings.push('Transformer tap changer adjustment requires coordination with grid operator.');
    }

    return {
      valid: warnings.length === 0,
      warnings
    };
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-blue-600"><Zap className="w-3 h-3 mr-1" />Active</Badge>;
      case 'pending':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'completed':
        return <Badge variant="outline" className="text-green-600 border-green-600"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="text-red-600 border-red-600"><XCircle className="w-3 h-3 mr-1" />Cancelled</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getEventTypeBadge = (eventType: string) => {
    switch (eventType) {
      case 'emergency':
        return <Badge variant="destructive"><AlertTriangle className="w-3 h-3 mr-1" />Emergency</Badge>;
      case 'peak_shaving':
        return <Badge variant="default" className="bg-orange-600">Peak Shaving</Badge>;
      case 'load_shifting':
        return <Badge variant="outline">Load Shifting</Badge>;
      default:
        return <Badge variant="secondary">{eventType}</Badge>;
    }
  };

  const handleLoadToggle = (loadId: string) => {
    setSelectedLoads(prev =>
      prev.includes(loadId)
        ? prev.filter(id => id !== loadId)
        : [...prev, loadId]
    );
  };

  const handleApplyPlan = () => {
    // Validate transmission constraints if in transmission mode
    if (isTransmission) {
      const validation = validateTransmissionConstraints(selectedLoads);
      if (!validation.valid) {
        alert(`Transmission Constraint Violations:\n\n${validation.warnings.join('\n\n')}\n\nPlease adjust your selection.`);
        return;
      }
      if (validation.warnings.length > 0) {
        const proceed = confirm(`Transmission Warnings:\n\n${validation.warnings.join('\n\n')}\n\nDo you want to proceed?`);
        if (!proceed) return;
      }
    }

    // Mock functionality - in real implementation would send to control system
    const totalReduction = selectedLoads.reduce((sum, id) => {
      const load = controllableLoads.find(l => l.id === id);
      return sum + (load?.currentKW || 0);
    }, 0);

    const contextInfo = isTransmission
      ? '\n- Transmission grid coordination required'
      : '';

    alert(`Applied demand response plan:\n- Event: ${selectedEvent.id}\n- Loads to shed: ${selectedLoads.length}\n- Total reduction: ${totalReduction.toFixed(1)} kW${contextInfo}`);
  };

  const workPaneContent = selectedEvent ? (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">

        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="event-details">Event Details</TabsTrigger>
          <TabsTrigger value="shed-plan">Shed Plan</TabsTrigger>
          <TabsTrigger value="history">DR History</TabsTrigger>
        </TabsList>

        <TabsContent value="event-details" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Event Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Event Information
                  {getStatusBadge(selectedEvent.status)}
                </CardTitle>
                <CardDescription>
                  {isTransmission
                    ? 'Transmission grid demand response event details and requirements'
                    : 'Demand response event details and requirements'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Event ID</p>
                    <p className="text-lg font-mono">{selectedEvent.id}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Event Type</p>
                    <div className="mt-1">{getEventTypeBadge(selectedEvent.eventType)}</div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Requested Reduction</p>
                    <p className="text-lg font-semibold text-red-600">{selectedEvent.requestedReductionKw} kW</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Duration</p>
                    <p className="text-lg">{selectedEvent.durationMin} minutes</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm font-medium text-muted-foreground">Event Time</p>
                    <p className="text-lg">{new Date(selectedEvent.timestamp).toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(selectedEvent.timestamp), { addSuffix: true })}
                    </p>
                  </div>
                  {isTransmission && (
                    <div className="col-span-2 pt-2 border-t">
                      <p className="text-sm font-medium text-muted-foreground mb-2">Transmission Context</p>
                      <div className="flex gap-2">
                        <Badge variant="outline" className="text-xs">
                          <Building2 className="w-3 h-3 mr-1" />
                          Grid-wide event
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          <Cable className="w-3 h-3 mr-1" />
                          Multiple substations
                        </Badge>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Current System Status */}
            <Card>
              <CardHeader>
                <CardTitle>Current System Status</CardTitle>
                <CardDescription>
                  {isTransmission
                    ? 'Available controllable transmission equipment for demand response'
                    : 'Available controllable loads for demand response'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <div className="text-2xl font-bold text-green-600">
                      {controllableLoads.filter(l => l.status === 'available').length}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {isTransmission ? 'Available equipment' : 'Available loads'}
                    </p>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">
                      {controllableLoads.reduce((sum, load) => sum + load.currentKW, 0).toFixed(1)} kW
                    </div>
                    <p className="text-xs text-muted-foreground">Total controllable</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">
                    {isTransmission ? 'Equipment Types Available:' : 'Load Types Available:'}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {Array.from(new Set(controllableLoads.map(l => l.loadType))).map(type => (
                      <Badge key={type} variant="outline" className="text-xs">
                        {type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                      </Badge>
                    ))}
                  </div>
                </div>

                {isTransmission && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm font-medium mb-2">Grid Constraints</p>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <p>• Max feeder shed: 40% of capacity</p>
                      <p>• Capacitor banks: Shed in pairs for voltage balance</p>
                      <p>• Tap changers: Requires grid operator coordination</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Event Description and Context */}
          <Card>
            <CardHeader>
              <CardTitle>Event Context</CardTitle>
              <CardDescription>Additional information about this demand response event</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {selectedEvent.eventType === 'emergency' && (
                  <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-sm text-red-800 dark:text-red-200">
                      <AlertTriangle className="w-4 h-4 inline mr-2" />
                      {isTransmission
                        ? 'Emergency demand response event. Immediate load reduction required to maintain transmission grid stability.'
                        : 'Emergency demand response event. Immediate load reduction required to maintain grid stability.'}
                    </p>
                  </div>
                )}
                {selectedEvent.eventType === 'peak_shaving' && (
                  <div className="p-3 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                    <p className="text-sm text-orange-800 dark:text-orange-200">
                      {isTransmission
                        ? 'Peak shaving event to reduce transmission demand charges during high-cost periods.'
                        : 'Peak shaving event to reduce demand charges during high-cost periods.'}
                    </p>
                  </div>
                )}
                {selectedEvent.eventType === 'load_shifting' && (
                  <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      {isTransmission
                        ? 'Load shifting event to optimize transmission grid utilization and move consumption to lower-cost time periods.'
                        : 'Load shifting event to move consumption to lower-cost time periods.'}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Expected Savings</p>
                    <p className="text-lg font-semibold text-green-600">
                      ${(selectedEvent.requestedReductionKw * 0.15 * (selectedEvent.durationMin / 60)).toFixed(0)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Grid Impact
                    </p>
                    <p className="text-lg">
                      {selectedEvent.eventType === 'emergency' ? 'Critical' :
                        selectedEvent.eventType === 'peak_shaving' ? 'High' : 'Medium'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Participation</p>
                    <p className="text-lg text-blue-600">
                      {isTransmission ? 'Coordinated' : 'Voluntary'}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="shed-plan" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Suggested Shed List */}
            <Card>
              <CardHeader>
                <CardTitle>Suggested Shed List</CardTitle>
                <CardDescription>
                  Recommended {isTransmission ? 'equipment' : 'loads'} to shed based on priority (Total: {totalSuggestedReduction.toFixed(1)} kW)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {suggestedLoads.map((load) => {
                    const txContext = isTransmission ? getTransmissionContext(load.assetId) : null;
                    return (
                      <div key={load.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                        <Checkbox
                          id={load.id}
                          checked={selectedLoads.includes(load.id)}
                          onCheckedChange={() => handleLoadToggle(load.id)}
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className="font-medium">{load.name}</p>
                            <Badge variant="outline" className="text-xs">
                              Priority {load.sheddingPriority}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>{load.currentKW} kW</span>
                            <span>Max shed: {load.maxShedMin} min</span>
                            <span>Min off: {load.minOffTimeMin} min</span>
                          </div>
                          {isTransmission && txContext && (
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="secondary" className="text-xs">
                                <Building2 className="w-3 h-3 mr-1" />
                                {txContext.substation}
                              </Badge>
                              {txContext.feeder && (
                                <Badge variant="secondary" className="text-xs">
                                  <Cable className="w-3 h-3 mr-1" />
                                  {txContext.feeder}
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Shed Plan Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Shed Plan Summary</CardTitle>
                <CardDescription>Impact of selected load shedding plan</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Target Reduction</p>
                    <p className="text-2xl font-bold text-red-600">{selectedEvent.requestedReductionKw} kW</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Selected Reduction</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {selectedLoads.reduce((sum, id) => {
                        const load = controllableLoads.find(l => l.id === id);
                        return sum + (load?.currentKW || 0);
                      }, 0).toFixed(1)} kW
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {isTransmission ? 'Equipment Selected' : 'Loads Selected'}
                    </p>
                    <p className="text-2xl font-bold">{selectedLoads.length}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Coverage</p>
                    <p className="text-2xl font-bold text-green-600">
                      {selectedEvent.requestedReductionKw > 0
                        ? Math.min(100, (selectedLoads.reduce((sum, id) => {
                          const load = controllableLoads.find(l => l.id === id);
                          return sum + (load?.currentKW || 0);
                        }, 0) / selectedEvent.requestedReductionKw * 100)).toFixed(0)
                        : 0}%
                    </p>
                  </div>
                </div>

                {isTransmission && selectedLoads.length > 0 && (
                  <div className="pt-4 border-t">
                    <p className="text-sm font-medium text-muted-foreground mb-2">Constraint Validation</p>
                    {(() => {
                      const validation = validateTransmissionConstraints(selectedLoads);
                      return validation.warnings.length > 0 ? (
                        <div className="space-y-1">
                          {validation.warnings.map((warning, idx) => (
                            <div key={idx} className="text-xs text-orange-600 flex items-start gap-1">
                              <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                              <span>{warning}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-xs text-green-600 flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          <span>All transmission constraints satisfied</span>
                        </div>
                      );
                    })()}
                  </div>
                )}

                <div className="pt-4 border-t">
                  <Button
                    onClick={handleApplyPlan}
                    disabled={selectedLoads.length === 0}
                    className="w-full"
                    size="lg"
                  >
                    Apply Shed Plan
                  </Button>
                  <p className="text-xs text-muted-foreground text-center mt-2">
                    {isTransmission
                      ? 'This will initiate coordinated load shedding for selected transmission equipment'
                      : 'This will initiate load shedding for selected assets'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* All Available Loads */}
          <Card>
            <CardHeader>
              <CardTitle>
                {isTransmission ? 'All Available Equipment' : 'All Available Loads'}
              </CardTitle>
              <CardDescription>
                {isTransmission
                  ? 'Complete list of controllable transmission equipment for manual selection'
                  : 'Complete list of controllable loads for manual selection'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {controllableLoads.map((load) => {
                  const txContext = isTransmission ? getTransmissionContext(load.assetId) : null;
                  return (
                    <div key={load.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                      <Checkbox
                        id={`all-${load.id}`}
                        checked={selectedLoads.includes(load.id)}
                        onCheckedChange={() => handleLoadToggle(load.id)}
                        disabled={load.status !== 'available'}
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="font-medium">{load.name}</p>
                          <div className="flex gap-2">
                            <Badge variant="outline" className="text-xs">
                              {load.loadType.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                            </Badge>
                            <Badge
                              variant={load.status === 'available' ? 'default' : 'secondary'}
                              className="text-xs"
                            >
                              {load.status}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>{load.currentKW} kW</span>
                          <span>Priority {load.sheddingPriority}</span>
                          <span>Asset: {load.assetId}</span>
                        </div>
                        {isTransmission && txContext && (
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary" className="text-xs">
                              <Building2 className="w-3 h-3 mr-1" />
                              {txContext.substation}
                            </Badge>
                            {txContext.feeder && (
                              <Badge variant="secondary" className="text-xs">
                                <Cable className="w-3 h-3 mr-1" />
                                {txContext.feeder}
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Demand Response History</CardTitle>
              <CardDescription>
                {isTransmission
                  ? 'Recent transmission grid demand response events and participation'
                  : 'Recent demand response events and participation'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {drEvents.map((event) => (
                  <div
                    key={event.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${selectedEvent.id === event.id ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20' : 'hover:bg-muted/50'
                      }`}
                    onClick={() => setSelectedEvent(event)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div>
                          <p className="font-medium">{event.id}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(event.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getEventTypeBadge(event.eventType)}
                        {getStatusBadge(event.status)}
                      </div>
                    </div>
                    <div className="mt-2 grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Reduction: </span>
                        <span className="font-medium">{event.requestedReductionKw} kW</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Duration: </span>
                        <span className="font-medium">{event.durationMin} min</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Time: </span>
                        <span className="font-medium">
                          {formatDistanceToNow(new Date(event.timestamp), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  ) : null;

  const filterView = (
    <EnergyListFilter
      filters={filters}
      onFiltersChange={setFilters}
      statusOptions={[
        { label: "Active", value: "active" },
        { label: "Pending", value: "pending" },
        { label: "Completed", value: "completed" },
        { label: "Cancelled", value: "cancelled" }
      ]}
      typeOptions={[
        { label: "Peak Shaving", value: "peak_shaving" },
        { label: "Emergency", value: "emergency" },
        { label: "Load Shifting", value: "load_shifting" }
      ]}
      showRoleFilter={isTransmission}
      showSubstationFilter={isTransmission}
      showFeederFilter={isTransmission}
    />
  );


  const listItems = drEvents.map(event => ({
    id: event.id,
    name: event.id,
    subtitle: `${event.eventType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} • ${event.requestedReductionKw} kW`,
    status: event.status,
  }));

  return (
    <EMSPageShell
      title="Energy Control Advisory & Integration"
      featureSetName="Energy Control Advisory & Integration"
      featureName="Demand Response"
      listType="meters"
      listItems={listItems}
      selectedItem={selectedEvent}
      onItemSelect={(item) => {
        const event = drEvents.find(e => e.id === item.id);
        if (event) {
          setSelectedEvent(event);
          setActiveTab("event-details");
        }
      }}

      workPaneContent={workPaneContent}
      searchPlaceholder="Search DR events..."
      onSearch={setSearchQuery}
      listFilterContent={filterView}
    />
  );
}