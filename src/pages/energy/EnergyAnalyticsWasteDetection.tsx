import { useState, useMemo, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { EMSPageShell } from "@/components/ems/EMSPageShell";
import { WasteDetectionList } from "@/components/ems/widgets/WasteDetectionList";
import { KPICard } from "@/components/shared/KPICard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertTriangle,
  TrendingDown,
  DollarSign,
  Zap,
  Download,
  Search,
  CheckCircle,
  Clock,
  Target,
  Activity,
  Building2,
  Cable,
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { getAnalyticsProvider } from "@/lib/data/providers/AnalyticsProvider";
import type { EnergyRecommendation } from "@/lib/data/providers/AnalyticsProvider";
import { EnergyListFilter, EnergyFilterState } from "@/components/ems/EnergyListFilter";

interface WasteCategory {
  id: string;
  name: string;
  type: "standby" | "inefficiency" | "leakage" | "oversizing" | "grid_losses" | "off_hours" | "scheduling";
  severity: "Low" | "Medium" | "High" | "Critical";
  costImpactPerMonth: number;
  energyWasteKWhPerDay: number;
  affectedAssets: string[];
  detectionConfidence: number;
  description: string;
  recommendations: string[];
  status: "Active" | "Investigating" | "Resolved";
  detectedAt: string;
  baselineKWhPerDay: number;
  currentKWhPerDay: number;
  // Transmission-specific fields
  substationName?: string;
  feederName?: string;
  voltageLevel?: number;
  lossesPercentage?: number;
  gridContext?: string;
  substation_id?: string;
  feeder_id?: string;
}

interface InvestigationChecklist {
  category: string;
  items: Array<{
    id: string;
    task: string;
    completed: boolean;
    priority: "High" | "Medium" | "Low";
  }>;
}

export function EnergyAnalyticsWasteDetection() {
  const {
    sector,
    subsector,
    currentTenant
  } = useApp();

  const [selectedCategory, setSelectedCategory] = useState<WasteCategory | null>(null);
  const [activeTab, setActiveTab] = useState("overview");

  const [investigationOpen, setInvestigationOpen] = useState(false);
  const [checklist, setChecklist] = useState<InvestigationChecklist | null>(null);
  const [recommendations, setRecommendations] = useState<EnergyRecommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<EnergyFilterState>({
    status: "",
    role: "",
    substationId: "",
    feederId: "",
    type: ""
  });

  // Determine if this is transmission context
  const isTransmission = sector === 'power' && subsector === 'Transmission';

  // Load transmission-specific recommendations
  useEffect(() => {
    if (isTransmission && currentTenant?.id) {
      loadTransmissionRecommendations();
    }
  }, [isTransmission, currentTenant?.id]);

  const loadTransmissionRecommendations = async () => {
    try {
      setLoading(true);
      const analyticsProvider = getAnalyticsProvider();
      const apiFilters = {
        org_id: currentTenant!.id,
        recommendation_type: 'waste' as const,
        status: 'pending' as const
      };

      const data = await analyticsProvider.getRecommendations(apiFilters);
      setRecommendations(data);
    } catch (error) {
      console.error('Failed to load transmission recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  // Generate waste categories from energy data
  const wasteCategories: WasteCategory[] = useMemo(() => {
    if (isTransmission) {
      return [
        {
          id: "grid-losses-main",
          name: "Excessive Grid Losses - Main",
          type: "grid_losses",
          severity: "Critical",
          costImpactPerMonth: 8500,
          energyWasteKWhPerDay: 650,
          affectedAssets: ["MAIN-TX-01", "MAIN-TX-02"],
          detectionConfidence: 94,
          description: "Grid losses exceeding 3.2% benchmark, indicating potential transformer inefficiencies or line losses",
          recommendations: [
            "Inspect transformer tap changer positions and optimize voltage regulation",
            "Conduct thermal imaging of high-voltage connections",
            "Review load balancing across parallel transformers",
            "Analyze power factor correction requirements"
          ],
          status: "Active",
          detectedAt: "2024-12-15T08:30:00Z",
          baselineKWhPerDay: 2800,
          currentKWhPerDay: 3450,
          substationName: "Main Substation",
          substation_id: "ss-central",
          feederName: "All Feeders",
          voltageLevel: 132,
          lossesPercentage: 3.2,
          gridContext: "Transmission losses above industry benchmark"
        },
        {
          id: "off-hours-consumption",
          name: "Off-Hours Consumption - Dist Hub",
          type: "off_hours",
          severity: "High",
          costImpactPerMonth: 4200,
          energyWasteKWhPerDay: 320,
          affectedAssets: ["DIST-F-07", "DIST-F-12"],
          detectionConfidence: 88,
          description: "Significant power consumption during off-peak hours (2-6 AM) when minimal load expected",
          recommendations: [
            "Implement automated load shedding for non-critical systems",
            "Review substation auxiliary power consumption patterns",
            "Install smart switching for lighting and HVAC systems",
            "Optimize transformer cooling system operation schedules"
          ],
          status: "Investigating",
          detectedAt: "2024-12-14T14:15:00Z",
          baselineKWhPerDay: 180,
          currentKWhPerDay: 500,
          substationName: "Distribution Hub",
          substation_id: "ss-north",
          feederName: "Feeder 07, Feeder 12",
          feeder_id: "feeder-220a",
          voltageLevel: 33,
          gridContext: "Off-hours consumption 180% above baseline"
        },
        {
          id: "transformer-inefficiency",
          name: "Transformer Operating Inefficiency",
          type: "inefficiency",
          severity: "Medium",
          costImpactPerMonth: 2800,
          energyWasteKWhPerDay: 210,
          affectedAssets: ["TX-WEST-03"],
          detectionConfidence: 85,
          description: "Transformer operating at suboptimal efficiency point due to loading conditions",
          recommendations: [
            "Optimize transformer loading to 75-85% of rated capacity",
            "Consider load transfer to parallel transformer",
            "Review tap changer settings for voltage optimization",
            "Schedule maintenance for cooling system inspection"
          ],
          status: "Active",
          detectedAt: "2024-12-13T10:45:00Z",
          baselineKWhPerDay: 1200,
          currentKWhPerDay: 1410,
          substationName: "West Substation",
          substation_id: "ss-east",
          feederName: "Primary Feeder",
          voltageLevel: 220,
          lossesPercentage: 1.8,
          gridContext: "Transformer efficiency below 98.5% target"
        },
        {
          id: "reactive-power-losses",
          name: "Reactive Power Inefficiency",
          type: "inefficiency",
          severity: "Medium",
          costImpactPerMonth: 1950,
          energyWasteKWhPerDay: 145,
          affectedAssets: ["CAP-BANK-A", "CAP-BANK-B"],
          detectionConfidence: 78,
          description: "Poor power factor leading to increased transmission losses and demand charges",
          recommendations: [
            "Optimize capacitor bank switching schedule",
            "Install automatic power factor correction",
            "Review reactive power compensation strategy",
            "Consider dynamic VAR compensation for variable loads"
          ],
          status: "Active",
          detectedAt: "2024-12-12T16:20:00Z",
          baselineKWhPerDay: 95,
          currentKWhPerDay: 240,
          substationName: "Industrial Substation",
          substation_id: "ss-south",
          feederName: "Heavy Load Feeder",
          voltageLevel: 132,
          lossesPercentage: 0.92,
          gridContext: "Power factor below 0.92 causing excess losses"
        }
      ];
    } else {
      return [
        {
          id: "standby-esp",
          name: "ESP Standby Power Waste",
          type: "standby",
          severity: "High",
          costImpactPerMonth: 2400,
          energyWasteKWhPerDay: 180,
          affectedAssets: ["ESP-07"],
          detectionConfidence: 92,
          description: "ESP pump consuming significant power during non-production periods",
          recommendations: [
            "Implement variable speed drive control",
            "Schedule pump operation based on production needs",
            "Install smart shutdown sequences"
          ],
          status: "Active",
          detectedAt: "2024-12-15T08:30:00Z",
          baselineKWhPerDay: 1200,
          currentKWhPerDay: 1380
        },
        {
          id: "compressor-inefficiency",
          name: "Compressor Inefficiency",
          type: "inefficiency",
          severity: "Critical",
          costImpactPerMonth: 4200,
          energyWasteKWhPerDay: 320,
          affectedAssets: ["GC-11"],
          detectionConfidence: 88,
          description: "Compressor operating at suboptimal efficiency point, consuming excess energy",
          recommendations: [
            "Optimize compressor loading sequence",
            "Check for fouling or mechanical issues",
            "Implement predictive maintenance schedule"
          ],
          status: "Investigating",
          detectedAt: "2024-12-14T14:15:00Z",
          baselineKWhPerDay: 2100,
          currentKWhPerDay: 2420
        },
        {
          id: "hvac-oversizing",
          name: "HVAC System Oversizing",
          type: "oversizing",
          severity: "Medium",
          costImpactPerMonth: 1800,
          energyWasteKWhPerDay: 135,
          affectedAssets: ["HVAC-CAMP"],
          detectionConfidence: 85,
          description: "HVAC system cycling frequently due to oversized capacity",
          recommendations: [
            "Install variable capacity controls",
            "Optimize temperature setpoints",
            "Implement occupancy-based scheduling"
          ],
          status: "Active",
          detectedAt: "2024-12-13T10:45:00Z",
          baselineKWhPerDay: 450,
          currentKWhPerDay: 585
        },
        {
          id: "pump-leakage",
          name: "Transfer Pump hydraulic Losses",
          type: "leakage",
          severity: "Medium",
          costImpactPerMonth: 950,
          energyWasteKWhPerDay: 72,
          affectedAssets: ["P-21"],
          detectionConfidence: 78,
          description: "Increased pump energy consumption indicating potential hydraulic losses",
          recommendations: [
            "Inspect pump seals and valves",
            "Check pipeline for leaks",
            "Verify pump operating point"
          ],
          status: "Active",
          detectedAt: "2024-12-12T16:20:00Z",
          baselineKWhPerDay: 300,
          currentKWhPerDay: 372
        }
      ];
    }
  }, [isTransmission]);

  const filteredCategories = useMemo(() => {
    let result = wasteCategories;

    // Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(c => c.name.toLowerCase().includes(q) || c.description.toLowerCase().includes(q));
    }

    // Status
    if (filters.status) {
      result = result.filter(c => c.status.toLowerCase() === filters.status.toLowerCase());
    }

    // Transmission filters
    if (isTransmission) {
      if (filters.substationId) result = result.filter(c => c.substation_id === filters.substationId);
      if (filters.feederId) result = result.filter(c => c.feeder_id === filters.feederId);
    } else {
      if (filters.type) result = result.filter(c => c.type === filters.type);
    }

    return result.sort((a, b) => b.costImpactPerMonth - a.costImpactPerMonth);
  }, [wasteCategories, searchQuery, filters, isTransmission]);

  // Update selection if filtered out
  useEffect(() => {
    if (filteredCategories.length > 0 && (!selectedCategory || !filteredCategories.find(c => c.id === selectedCategory.id))) {
      setSelectedCategory(filteredCategories[0]);
    }
  }, [filteredCategories, selectedCategory]);

  const totalWasteKWhPerDay = filteredCategories.reduce((sum, cat) => sum + cat.energyWasteKWhPerDay, 0);
  const totalCostImpactPerMonth = filteredCategories.reduce((sum, cat) => sum + cat.costImpactPerMonth, 0);
  const activeWasteCategories = filteredCategories.filter(cat => cat.status === "Active").length;
  const criticalWasteCategories = filteredCategories.filter(cat => cat.severity === "Critical").length;

  const beforeAfterData = useMemo(() => {
    if (!selectedCategory) return [];
    return Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      const isAfterDetection = i >= 15;
      const baseValue = selectedCategory.baselineKWhPerDay;
      const wasteValue = selectedCategory.currentKWhPerDay;
      return {
        date: date.toISOString().split('T')[0],
        baseline: baseValue + (Math.random() - 0.5) * 50,
        actual: isAfterDetection ? wasteValue + (Math.random() - 0.5) * 80 : baseValue + (Math.random() - 0.5) * 60,
        isDetectionPoint: i === 15
      };
    });
  }, [selectedCategory]);

  const generateChecklist = (category: WasteCategory): InvestigationChecklist => {
    const defaultCheck = [{ id: "1", task: "Initial inspection", completed: false, priority: "High" as const }];
    if (isTransmission) {
      const transmissionChecklists: Record<string, Array<{ id: string, task: string, completed: boolean, priority: "High" | "Medium" | "Low" }>> = {
        grid_losses: [
          { id: "check-1", task: "Inspect transformer tap changer positions", completed: false, priority: "High" },
          { id: "check-2", task: "Conduct thermal imaging of HV connections", completed: false, priority: "High" },
          { id: "check-3", task: "Review load balancing across transformers", completed: false, priority: "Medium" }
        ],
        off_hours: [
          { id: "check-1", task: "Review substation auxiliary load patterns", completed: false, priority: "High" },
          { id: "check-2", task: "Audit lighting and HVAC schedules", completed: false, priority: "High" }
        ]
      };
      return { category: category.name, items: transmissionChecklists[category.type] || defaultCheck };
    }
    return { category: category.name, items: defaultCheck };
  };

  const handleInvestigate = (category: WasteCategory) => {
    setSelectedCategory(category);
    setChecklist(generateChecklist(category));
    setInvestigationOpen(true);
  };

  const toggleChecklistItem = (itemId: string) => {
    if (!checklist) return;
    setChecklist({ ...checklist, items: checklist.items.map(item => item.id === itemId ? { ...item, completed: !item.completed } : item) });
  };

  const workPaneContent = selectedCategory ? (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        <KPICard title="Total Waste" value={totalWasteKWhPerDay.toFixed(0)} unit="kWh/day" icon={Zap} variant="destructive" />
        <KPICard title="Monthly Impact" value={`$${totalCostImpactPerMonth.toLocaleString()}`} icon={DollarSign} variant="warning" />
        <KPICard title="Active Sources" value={activeWasteCategories} icon={AlertTriangle} variant="destructive" />
        <KPICard title="Critical Issues" value={criticalWasteCategories} icon={Target} variant="destructive" />
      </div>

      <WasteDetectionList
        wasteCategories={filteredCategories.map(cat => ({
          id: cat.id,
          type: (cat.type === "leakage" ? "leak" : cat.type === "grid_losses" ? "inefficiency" : cat.type === "off_hours" ? "scheduling" : cat.type) as any,
          description: cat.name,
          location: isTransmission ? `${cat.substationName || 'Unknown'}` : cat.affectedAssets.join(", "),
          estimatedWasteKWh: cat.energyWasteKWhPerDay,
          costImpact: cat.costImpactPerMonth / 30,
          severity: cat.severity,
          detectedAt: cat.detectedAt,
          status: (cat.status === "Active" ? "new" : cat.status === "Investigating" ? "investigating" : "resolved") as any
        }))}
        onInvestigate={(category) => {
          const original = filteredCategories.find(cat => cat.id === category.id);
          if (original) handleInvestigate(original);
        }}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">

        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="comparison">Trend Analysis</TabsTrigger>
          <TabsTrigger value="recommendations">Action Plan</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">
          <Card>
            <CardHeader><CardTitle>Waste Categories by Cost Impact</CardTitle></CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={filteredCategories}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="name" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))' }} />
                    <Bar dataKey="costImpactPerMonth" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="comparison">
          <Card>
            <CardHeader><CardTitle>Before/After Baseline Comparison</CardTitle></CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={beforeAfterData}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="date" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip />
                    <Line type="monotone" dataKey="baseline" stroke="#10b981" strokeDasharray="5 5" dot={false} />
                    <Line type="monotone" dataKey="actual" stroke="#ef4444" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="recommendations">
          <div className="space-y-4">
            {selectedCategory.recommendations.map((rec, i) => (
              <div key={i} className="flex items-start gap-4 p-4 bg-secondary/30 rounded-lg">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">{i + 1}</div>
                <div className="flex-1">
                  <p className="font-medium">{rec}</p>
                  <div className="flex gap-2 mt-2">
                    <Button size="sm" variant="outline">Schedule</Button>
                    <Button size="sm">Assign</Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={investigationOpen} onOpenChange={setInvestigationOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Investigation: {checklist?.category}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            {checklist?.items.map(item => (
              <div key={item.id} className="flex items-center gap-3 p-3 border rounded-lg">
                <Checkbox checked={item.completed} onCheckedChange={() => toggleChecklistItem(item.id)} />
                <span className={item.completed ? "line-through text-muted-foreground" : ""}>{item.task}</span>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  ) : null;

  return (
    <EMSPageShell
      title="Waste Detection"
      featureSetName="Energy Analytics & Optimisation"
      featureName="Waste Detection"
      listType="scopes"
      listItems={filteredCategories}
      selectedItem={selectedCategory}
      onItemSelect={(item) => {
        setSelectedCategory(item as WasteCategory);
        setActiveTab("overview");
      }}

      workPaneContent={workPaneContent}
      searchPlaceholder="Search waste categories..."
      onSearch={setSearchQuery}
      listFilterContent={
        <EnergyListFilter
          filters={filters}
          onFiltersChange={setFilters}
          showTypeFilter={!isTransmission}
          showRoleFilter={isTransmission}
          showSubstationFilter={isTransmission}
          showFeederFilter={isTransmission}
        />
      }
      actions={
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-1" />
            Export
          </Button>
        </div>
      }
    />
  );
}

export default EnergyAnalyticsWasteDetection;