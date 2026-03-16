import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { 
  X, 
  Play, 
  RotateCcw, 
  TrendingDown,
  Zap,
  Clock,
  Target,
  AlertCircle
} from "lucide-react";
import { ControllableLoad } from "@/data/mockData";

interface LoadBalancingSimulationPopPaneProps {
  loads: ControllableLoad[];
  onClose: () => void;
  onSimulate?: (scenario: SimulationScenario) => void;
}

interface SimulationScenario {
  targetReduction: number;
  duration: number;
  selectedLoads: string[];
  strategy: "priority" | "proportional" | "manual";
  allowCascading: boolean;
}

interface SimulationResult {
  achievedReduction: number;
  affectedLoads: number;
  estimatedSavings: number;
  riskLevel: "Low" | "Medium" | "High";
  warnings: string[];
}

export function LoadBalancingSimulationPopPane({ 
  loads, 
  onClose, 
  onSimulate 
}: LoadBalancingSimulationPopPaneProps) {
  const [activeTab, setActiveTab] = useState("scenario");
  const [scenario, setScenario] = useState<SimulationScenario>({
    targetReduction: 100,
    duration: 60,
    selectedLoads: [],
    strategy: "priority",
    allowCascading: false
  });
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  const availableLoads = loads.filter(load => load.status === "available");
  const totalAvailableCapacity = availableLoads.reduce((sum, load) => sum + load.currentKW, 0);

  const handleLoadToggle = (loadId: string) => {
    setScenario(prev => ({
      ...prev,
      selectedLoads: prev.selectedLoads.includes(loadId)
        ? prev.selectedLoads.filter(id => id !== loadId)
        : [...prev.selectedLoads, loadId]
    }));
  };

  const runSimulation = async () => {
    setIsSimulating(true);
    setActiveTab("results");

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Mock simulation logic
    const selectedLoadObjects = availableLoads.filter(load => 
      scenario.selectedLoads.includes(load.id)
    );
    
    let achievedReduction = 0;
    const warnings: string[] = [];

    if (scenario.strategy === "priority") {
      // Sort by shedding priority and shed highest priority first
      const sortedLoads = selectedLoadObjects.sort((a, b) => a.sheddingPriority - b.sheddingPriority);
      for (const load of sortedLoads) {
        if (achievedReduction < scenario.targetReduction) {
          const reductionAmount = Math.min(load.currentKW, scenario.targetReduction - achievedReduction);
          achievedReduction += reductionAmount;
          
          if (load.loadType === "compressor" && reductionAmount > load.currentKW * 0.5) {
            warnings.push(`${load.name}: Significant compressor load reduction may affect gas processing`);
          }
        }
      }
    } else if (scenario.strategy === "proportional") {
      // Reduce all selected loads proportionally
      const totalSelectedCapacity = selectedLoadObjects.reduce((sum, load) => sum + load.currentKW, 0);
      const reductionRatio = Math.min(scenario.targetReduction / totalSelectedCapacity, 1);
      
      achievedReduction = totalSelectedCapacity * reductionRatio;
      
      selectedLoadObjects.forEach(load => {
        const loadReduction = load.currentKW * reductionRatio;
        if (load.loadType === "pump" && loadReduction > load.currentKW * 0.7) {
          warnings.push(`${load.name}: High pump load reduction may affect production`);
        }
      });
    } else {
      // Manual selection - shed selected loads completely
      achievedReduction = selectedLoadObjects.reduce((sum, load) => sum + load.currentKW, 0);
      
      selectedLoadObjects.forEach(load => {
        if (load.loadType === "compressor") {
          warnings.push(`${load.name}: Complete compressor shutdown will halt gas processing`);
        }
      });
    }

    // Calculate risk level
    let riskLevel: "Low" | "Medium" | "High" = "Low";
    if (warnings.length > 2 || achievedReduction > totalAvailableCapacity * 0.5) {
      riskLevel = "High";
    } else if (warnings.length > 0 || achievedReduction > totalAvailableCapacity * 0.3) {
      riskLevel = "Medium";
    }

    // Add duration-based warnings
    if (scenario.duration > 120) {
      warnings.push("Extended load shedding duration may require manual intervention");
    }

    const result: SimulationResult = {
      achievedReduction: Math.round(achievedReduction),
      affectedLoads: selectedLoadObjects.length,
      estimatedSavings: Math.round(achievedReduction * 0.12 * (scenario.duration / 60)), // $0.12/kWh
      riskLevel,
      warnings
    };

    setSimulationResult(result);
    setIsSimulating(false);
  };

  const resetScenario = () => {
    setScenario({
      targetReduction: 100,
      duration: 60,
      selectedLoads: [],
      strategy: "priority",
      allowCascading: false
    });
    setSimulationResult(null);
    setActiveTab("scenario");
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "High": return "destructive";
      case "Medium": return "secondary";
      case "Low": return "default";
      default: return "outline";
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <Zap className="h-5 w-5" />
            <div>
              <h2 className="text-xl font-semibold">Load Balancing Simulation</h2>
              <p className="text-sm text-muted-foreground">
                Configure and simulate load shedding scenarios
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
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="scenario">Scenario Setup</TabsTrigger>
              <TabsTrigger value="loads">Load Selection</TabsTrigger>
              <TabsTrigger value="results">Results</TabsTrigger>
            </TabsList>

            <TabsContent value="scenario" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Simulation Parameters
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Target Reduction (kW)</Label>
                      <div className="space-y-2">
                        <Slider
                          value={[scenario.targetReduction]}
                          onValueChange={(value) => setScenario(prev => ({ ...prev, targetReduction: value[0] }))}
                          max={totalAvailableCapacity}
                          step={10}
                          className="w-full"
                        />
                        <div className="flex justify-between text-sm text-muted-foreground">
                          <span>0 kW</span>
                          <span className="font-medium">{scenario.targetReduction} kW</span>
                          <span>{Math.round(totalAvailableCapacity)} kW max</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Duration (minutes)</Label>
                      <Input
                        type="number"
                        value={scenario.duration}
                        onChange={(e) => setScenario(prev => ({ ...prev, duration: parseInt(e.target.value) || 60 }))}
                        min={15}
                        max={480}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Label>Load Shedding Strategy</Label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {[
                        { value: "priority", label: "Priority-Based", desc: "Shed loads by priority ranking" },
                        { value: "proportional", label: "Proportional", desc: "Reduce all loads proportionally" },
                        { value: "manual", label: "Manual Selection", desc: "Manually select specific loads" }
                      ].map((strategy) => (
                        <Card 
                          key={strategy.value}
                          className={`cursor-pointer transition-colors ${
                            scenario.strategy === strategy.value ? 'ring-2 ring-primary' : ''
                          }`}
                          onClick={() => setScenario(prev => ({ ...prev, strategy: strategy.value as any }))}
                        >
                          <CardContent className="p-4">
                            <h4 className="font-medium">{strategy.label}</h4>
                            <p className="text-sm text-muted-foreground">{strategy.desc}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="cascading"
                      checked={scenario.allowCascading}
                      onCheckedChange={(checked) => setScenario(prev => ({ ...prev, allowCascading: checked }))}
                    />
                    <Label htmlFor="cascading">Allow cascading load adjustments</Label>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="loads" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Available Controllable Loads</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Select loads to include in the simulation scenario
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {availableLoads.map((load) => (
                      <div 
                        key={load.id}
                        className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors ${
                          scenario.selectedLoads.includes(load.id) ? 'bg-primary/5 border-primary' : 'border-border'
                        }`}
                        onClick={() => handleLoadToggle(load.id)}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={scenario.selectedLoads.includes(load.id)}
                            onChange={() => handleLoadToggle(load.id)}
                            className="rounded"
                          />
                          <div>
                            <p className="font-medium">{load.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {load.loadType} • Priority {load.sheddingPriority}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{load.currentKW} kW</p>
                          <p className="text-sm text-muted-foreground">
                            Max shed: {load.maxShedMin}min
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="results" className="space-y-4">
              {isSimulating ? (
                <Card>
                  <CardContent className="flex items-center justify-center p-8">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                      <p className="text-sm text-muted-foreground">Running simulation...</p>
                    </div>
                  </CardContent>
                </Card>
              ) : simulationResult ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                          <TrendingDown className="h-4 w-4" />
                          Achieved Reduction
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{simulationResult.achievedReduction} kW</div>
                        <p className="text-xs text-muted-foreground">
                          {Math.round((simulationResult.achievedReduction / scenario.targetReduction) * 100)}% of target
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                          <Zap className="h-4 w-4" />
                          Affected Loads
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{simulationResult.affectedLoads}</div>
                        <p className="text-xs text-muted-foreground">
                          of {availableLoads.length} available
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Estimated Savings</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">${simulationResult.estimatedSavings}</div>
                        <p className="text-xs text-muted-foreground">For {scenario.duration} minutes</p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                          <AlertCircle className="h-4 w-4" />
                          Risk Level
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Badge variant={getRiskColor(simulationResult.riskLevel)}>
                          {simulationResult.riskLevel}
                        </Badge>
                      </CardContent>
                    </Card>
                  </div>

                  {simulationResult.warnings.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-amber-600">
                          <AlertCircle className="h-4 w-4" />
                          Warnings & Considerations
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {simulationResult.warnings.map((warning, idx) => (
                            <li key={idx} className="text-sm flex items-start gap-2">
                              <span className="text-amber-500 mt-0.5">•</span>
                              {warning}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}
                </>
              ) : (
                <Card>
                  <CardContent className="flex items-center justify-center p-8">
                    <div className="text-center">
                      <Play className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        Configure your scenario and run simulation to see results
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>

          {/* Action Buttons */}
          <div className="flex gap-2 mt-6 pt-4 border-t border-border">
            <Button 
              onClick={runSimulation} 
              disabled={scenario.selectedLoads.length === 0 || isSimulating}
              className="flex items-center gap-2"
            >
              <Play className="h-4 w-4" />
              Run Simulation
            </Button>
            <Button variant="outline" onClick={resetScenario}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
            {simulationResult && (
              <Button 
                variant="outline" 
                onClick={() => onSimulate?.(scenario)}
                className="ml-auto"
              >
                Apply Scenario
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}