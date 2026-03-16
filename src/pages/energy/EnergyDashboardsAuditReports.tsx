import { useState, useMemo, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { EMSPageShell } from "@/components/ems/EMSPageShell";
import { ExportPanel } from "@/components/ems/widgets/ExportPanel";
import { ReportBuilderShell } from "@/components/ems/widgets/ReportBuilderShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  FileText,
  Download,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  Package,
  Shield,
  Zap,
  Leaf,
  BarChart3,
  Settings,
  Plus,
  History,
  MapPin,
  GitBranch,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getTransmissionProvider } from "@/lib/data/providers/TransmissionProvider";
import type { TxSubstation, TxFeeder } from "@/types/transmission";
import { EnergyListFilter, EnergyFilterState } from "@/components/ems/EnergyListFilter";

interface ExportJob {
  id: string;
  dataset: string;
  format: "csv" | "pdf" | "xlsx";
  requestedAt: string;
  status: "pending" | "processing" | "completed" | "failed";
  deliveredAt?: string;
  fileSize?: string;
  downloadUrl?: string;
}

interface ExportPack {
  id: string;
  name: string;
  description: string;
  datasets: string[];
  formats: string[];
  category: "energy" | "emissions" | "compliance" | "cost";
  icon: any;
  lastGenerated?: string;
}

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  frequency: "daily" | "weekly" | "monthly" | "quarterly";
  lastRunAt?: string;
  category: "energy" | "emissions" | "compliance" | "cost";
}

// Mock export packs for audit reports - Extended with transmission packs
const mockExportPacks: ExportPack[] = [
  {
    id: "pack-energy-audit",
    name: "Energy Audit Pack",
    description: "Comprehensive energy consumption, efficiency, and cost analysis",
    datasets: ["Energy Consumption", "Load Profiles", "Peak Demand", "Efficiency KPIs", "Cost Analysis"],
    formats: ["pdf", "xlsx", "csv"],
    category: "energy",
    icon: Zap,
    lastGenerated: "2024-12-15T09:30:00Z"
  },
  {
    id: "pack-emissions-audit",
    name: "Emissions Audit Pack",
    description: "CO2 emissions tracking, intensity metrics, and sustainability reporting",
    datasets: ["CO2 Emissions", "Energy Intensity", "Scope 1/2 Breakdown", "Benchmarks"],
    formats: ["pdf", "xlsx"],
    category: "emissions",
    icon: Leaf,
    lastGenerated: "2024-12-14T14:20:00Z"
  },
  {
    id: "pack-pq-compliance",
    name: "Power Quality Compliance Pack",
    description: "Power quality events, compliance status, and regulatory reporting",
    datasets: ["Power Quality Events", "Compliance Status", "THD Analysis", "Voltage Events"],
    formats: ["pdf", "csv"],
    category: "compliance",
    icon: Shield,
    lastGenerated: "2024-12-13T11:15:00Z"
  },
  {
    id: "pack-cost-audit",
    name: "Cost Audit Pack",
    description: "Energy cost breakdown, variance analysis, and budget tracking",
    datasets: ["Cost Breakdown", "Budget vs Actual", "Cost per BBL", "Tariff Analysis"],
    formats: ["pdf", "xlsx"],
    category: "cost",
    icon: BarChart3,
    lastGenerated: "2024-12-12T16:45:00Z"
  }
];

// Transmission-specific export packs - Requirements 25.1, 25.2, 25.3
const transmissionExportPacks: ExportPack[] = [
  {
    id: "pack-tx-grid-audit",
    name: "Grid Performance Audit Pack",
    description: "Transmission grid performance, losses, load factors, and system efficiency by substation and feeder",
    datasets: ["Grid Topology", "Substation Performance", "Feeder Loads", "System Losses", "Load Factors", "Voltage Profiles"],
    formats: ["pdf", "xlsx", "csv"],
    category: "energy",
    icon: Activity,
    lastGenerated: "2024-12-15T10:00:00Z"
  },
  {
    id: "pack-tx-compliance",
    name: "Transmission Compliance Pack",
    description: "Regulatory compliance reports, grid code adherence, and transmission standards documentation",
    datasets: ["Grid Code Compliance", "Voltage Compliance", "Frequency Events", "Regulatory Reports", "Compliance Evidence"],
    formats: ["pdf", "xlsx"],
    category: "compliance",
    icon: Shield,
    lastGenerated: "2024-12-14T15:30:00Z"
  },
  {
    id: "pack-tx-pq-audit",
    name: "Transmission Power Quality Audit",
    description: "Voltage-level-specific power quality analysis, THD events, and grid stability metrics",
    datasets: ["PQ Events by Voltage Level", "THD Analysis", "Voltage Sags/Swells", "Frequency Deviations", "Grid Stability"],
    formats: ["pdf", "csv"],
    category: "compliance",
    icon: Zap,
    lastGenerated: "2024-12-13T12:00:00Z"
  },
  {
    id: "pack-tx-delivery-audit",
    name: "Delivery Context Audit Pack",
    description: "MWh delivered, grid losses, interchange tracking, and transmission efficiency metrics",
    datasets: ["MWh Delivered", "Grid Losses Analysis", "Interchange Records", "Delivery Efficiency", "Loss Breakdown"],
    formats: ["pdf", "xlsx"],
    category: "energy",
    icon: GitBranch,
    lastGenerated: "2024-12-12T17:00:00Z"
  },
  {
    id: "pack-tx-emissions-audit",
    name: "Transmission Emissions Audit",
    description: "Emissions per MWh delivered, grid efficiency impact on carbon footprint, and sustainability metrics",
    datasets: ["Emissions per MWh Delivered", "Grid Efficiency Impact", "Carbon Intensity", "Renewable Integration"],
    formats: ["pdf", "xlsx"],
    category: "emissions",
    icon: Leaf,
    lastGenerated: "2024-12-11T14:00:00Z"
  },
  {
    id: "pack-tx-substation-audit",
    name: "Substation Performance Audit",
    description: "Detailed substation-level performance, equipment status, and operational metrics",
    datasets: ["Substation KPIs", "Transformer Performance", "Bay Status", "Equipment Health", "Maintenance Records"],
    formats: ["pdf", "xlsx"],
    category: "energy",
    icon: MapPin,
    lastGenerated: "2024-12-10T11:30:00Z"
  }
];

// Mock export jobs from mockData.ts
const mockExportJobs: ExportJob[] = [
  {
    id: "exp-001",
    dataset: "Energy Consumption Data",
    format: "csv",
    requestedAt: "2024-12-16T10:30:00Z",
    status: "completed",
    deliveredAt: "2024-12-16T10:35:00Z",
    fileSize: "2.3 MB",
    downloadUrl: "#"
  },
  {
    id: "exp-002",
    dataset: "Emissions Report",
    format: "pdf",
    requestedAt: "2024-12-16T09:15:00Z",
    status: "completed",
    deliveredAt: "2024-12-16T09:22:00Z",
    fileSize: "1.8 MB",
    downloadUrl: "#"
  },
  {
    id: "exp-003",
    dataset: "Power Quality Events",
    format: "xlsx",
    requestedAt: "2024-12-16T11:45:00Z",
    status: "processing"
  },
  {
    id: "exp-004",
    dataset: "Cost Analysis",
    format: "csv",
    requestedAt: "2024-12-16T08:20:00Z",
    status: "failed"
  },
  {
    id: "exp-005",
    dataset: "Anomaly Investigation",
    format: "pdf",
    requestedAt: "2024-12-15T16:30:00Z",
    status: "completed",
    deliveredAt: "2024-12-15T16:38:00Z",
    fileSize: "3.1 MB",
    downloadUrl: "#"
  },
  {
    id: "exp-006",
    dataset: "Energy Audit Pack",
    format: "pdf",
    requestedAt: "2024-12-15T09:30:00Z",
    status: "completed",
    deliveredAt: "2024-12-15T09:45:00Z",
    fileSize: "12.5 MB",
    downloadUrl: "#"
  },
  {
    id: "exp-007",
    dataset: "Emissions Audit Pack",
    format: "xlsx",
    requestedAt: "2024-12-14T14:20:00Z",
    status: "completed",
    deliveredAt: "2024-12-14T14:35:00Z",
    fileSize: "4.7 MB",
    downloadUrl: "#"
  }
];

// Mock report templates from mockData.ts - Extended with transmission templates
const mockReportTemplates: ReportTemplate[] = [
  {
    id: "rpt-energy-daily",
    name: "Daily Energy Summary",
    description: "Daily energy consumption and cost summary by meter and asset",
    frequency: "daily",
    lastRunAt: "2024-12-16T06:00:00Z",
    category: "energy"
  },
  {
    id: "rpt-emissions-monthly",
    name: "Monthly Emissions Report",
    description: "CO2 emissions breakdown by scope and energy type",
    frequency: "monthly",
    lastRunAt: "2024-12-01T08:00:00Z",
    category: "emissions"
  },
  {
    id: "rpt-compliance-quarterly",
    name: "Quarterly Compliance Report",
    description: "Energy compliance status and regulatory reporting",
    frequency: "quarterly",
    lastRunAt: "2024-10-01T09:00:00Z",
    category: "compliance"
  },
  {
    id: "rpt-cost-weekly",
    name: "Weekly Cost Analysis",
    description: "Energy cost breakdown and variance analysis",
    frequency: "weekly",
    lastRunAt: "2024-12-09T07:00:00Z",
    category: "cost"
  },
  {
    id: "rpt-intensity-monthly",
    name: "Energy Intensity Scorecard",
    description: "kWh/BBL and CO2/BBL intensity metrics with benchmarks",
    frequency: "monthly",
    lastRunAt: "2024-12-01T08:30:00Z",
    category: "energy"
  },
  {
    id: "rpt-pq-weekly",
    name: "Power Quality Summary",
    description: "Power quality events and compliance metrics",
    frequency: "weekly",
    lastRunAt: "2024-12-09T07:30:00Z",
    category: "compliance"
  }
];

// Transmission-specific report templates - Requirements 25.2, 25.3
const transmissionReportTemplates: ReportTemplate[] = [
  {
    id: "rpt-tx-grid-daily",
    name: "Daily Grid Performance Report",
    description: "Daily transmission grid performance by substation and feeder with losses and load factors",
    frequency: "daily",
    lastRunAt: "2024-12-16T06:00:00Z",
    category: "energy"
  },
  {
    id: "rpt-tx-compliance-monthly",
    name: "Monthly Transmission Compliance Report",
    description: "Grid code compliance, voltage compliance, and regulatory adherence by substation",
    frequency: "monthly",
    lastRunAt: "2024-12-01T08:00:00Z",
    category: "compliance"
  },
  {
    id: "rpt-tx-delivery-weekly",
    name: "Weekly Delivery Context Report",
    description: "MWh delivered, grid losses, and interchange tracking with efficiency metrics",
    frequency: "weekly",
    lastRunAt: "2024-12-09T07:00:00Z",
    category: "energy"
  },
  {
    id: "rpt-tx-pq-daily",
    name: "Daily Power Quality Report",
    description: "Voltage-level-specific power quality events and grid stability metrics",
    frequency: "daily",
    lastRunAt: "2024-12-16T06:30:00Z",
    category: "compliance"
  },
  {
    id: "rpt-tx-substation-monthly",
    name: "Monthly Substation Performance Report",
    description: "Detailed substation performance, transformer efficiency, and equipment health",
    frequency: "monthly",
    lastRunAt: "2024-12-01T09:00:00Z",
    category: "energy"
  },
  {
    id: "rpt-tx-emissions-monthly",
    name: "Monthly Transmission Emissions Report",
    description: "Emissions per MWh delivered with grid efficiency impact on carbon footprint",
    frequency: "monthly",
    lastRunAt: "2024-12-01T08:30:00Z",
    category: "emissions"
  },
  {
    id: "rpt-tx-regulatory-quarterly",
    name: "Quarterly Regulatory Compliance Report",
    description: "Comprehensive regulatory compliance documentation with evidence and audit trails",
    frequency: "quarterly",
    lastRunAt: "2024-10-01T09:00:00Z",
    category: "compliance"
  }
];

export function EnergyDashboardsAuditReports() {
  const {
    energyMeters,
    energyTelemetry,
    sector,
    subsector,
    currentTenant
  } = useApp();

  // Sector context check - Requirement 25.1
  const isTransmission = sector === 'power' && subsector === 'Transmission';

  // Transmission-specific state - Requirements 25.3, 25.4
  const [txSubstations, setTxSubstations] = useState<TxSubstation[]>([]);
  const [txFeeders, setTxFeeders] = useState<TxFeeder[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<EnergyFilterState>({
    status: "",
    role: "",
    substationId: "",
    feederId: "",
    type: ""
  });

  // Determine which export packs and templates to use based on sector
  const exportPacks = isTransmission
    ? [...transmissionExportPacks, ...mockExportPacks]
    : mockExportPacks;

  const reportTemplates = isTransmission
    ? [...transmissionReportTemplates, ...mockReportTemplates]
    : mockReportTemplates;

  const [selectedPack, setSelectedPack] = useState<ExportPack | null>(exportPacks[0]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("export-packs");
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);

  // Load transmission topology data - Requirement 25.4
  useEffect(() => {
    if (!isTransmission || !currentTenant) return;

    const loadTransmissionData = async () => {
      try {
        setLoading(true);
        const provider = getTransmissionProvider();

        const [substationsData, feedersData] = await Promise.all([
          provider.listTxSubstations({ org_id: currentTenant.id }),
          provider.listTxFeeders({ org_id: currentTenant.id })
        ]);

        setTxSubstations(substationsData);
        setTxFeeders(feedersData);
      } catch (error) {
        console.error('Failed to load transmission data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTransmissionData();
  }, [isTransmission, currentTenant]);

  const filteredPacks = useMemo(() => {
    let result = exportPacks;

    // Search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (pack) =>
          pack.name.toLowerCase().includes(query) ||
          pack.description.toLowerCase().includes(query) ||
          pack.datasets.some(dataset => dataset.toLowerCase().includes(query))
      );
    }

    // Category (using type filter)
    if (filters.type) {
      result = result.filter(p => p.category.toLowerCase() === filters.type.toLowerCase());
    }

    return result;
  }, [searchQuery, exportPacks, filters.type]);

  // Update selection if filtered out
  useEffect(() => {
    if (filteredPacks.length > 0 && (!selectedPack || !filteredPacks.find(p => p.id === selectedPack.id))) {
      setSelectedPack(filteredPacks[0]);
    }
  }, [filteredPacks, selectedPack]);

  const packsByCategory = useMemo(() => {
    return {
      energy: filteredPacks.filter(p => p.category === "energy"),
      emissions: filteredPacks.filter(p => p.category === "emissions"),
      compliance: filteredPacks.filter(p => p.category === "compliance"),
      cost: filteredPacks.filter(p => p.category === "cost")
    };
  }, [filteredPacks]);

  const handleExport = (dataset: string, format: string) => {
    console.log(`Exporting ${dataset} as ${format}`);
    // Mock export functionality
  };

  const handleScheduleExport = () => {
    setIsScheduleDialogOpen(true);
  };

  const handleDownload = (job: ExportJob) => {
    console.log(`Downloading ${job.dataset}`);
    // Mock download functionality
  };

  const handleExportPack = (pack: ExportPack) => {
    console.log(`Exporting pack: ${pack.name}`);
    // Mock export pack functionality
  };

  const tabs = [
    {
      id: "export-packs",
      label: "Export Packs",
      content: (
        <ExportPacksView
          packs={packsByCategory}
          selectedPack={selectedPack}
          onExportPack={handleExportPack}
          isTransmission={isTransmission}
          txSubstations={txSubstations}
          txFeeders={txFeeders}
          selectedSubstation={filters.substationId || 'all'}
          selectedFeeder={filters.feederId || 'all'}
          onSubstationChange={(val) => setFilters(prev => ({ ...prev, substationId: val === 'all' ? '' : val, feederId: '' }))}
          onFeederChange={(val) => setFilters(prev => ({ ...prev, feederId: val === 'all' ? '' : val }))}
        />
      ),
    },
    {
      id: "export-panel",
      label: "Data Export",
      content: (
        <ExportPanel
          exportHistory={mockExportJobs}
          exportPacks={exportPacks}
          onExport={handleExport}
          onScheduleExport={handleScheduleExport}
          onDownload={handleDownload}
        />
      ),
    },
    {
      id: "report-templates",
      label: "Report Templates",
      content: (
        <ReportTemplatesView
          templates={reportTemplates}
          onSchedule={handleScheduleExport}
          isTransmission={isTransmission}
          txSubstations={txSubstations}
        />
      ),
    },
    {
      id: "export-history",
      label: "Export History",
      content: (
        <ExportHistoryView
          jobs={mockExportJobs}
          onDownload={handleDownload}
        />
      ),
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
    <>
      <EMSPageShell
        title="Audit Reports"
        featureSetName="Energy Dashboards & Reporting"
        featureName="Audit Reports"
        listType="reports"
        listItems={filteredPacks}
        selectedItem={selectedPack}
        onItemSelect={(item) => {
          setSelectedPack(item as ExportPack);
          setActiveTab("export-packs");
        }}
        searchPlaceholder="Search export packs..."
        onSearch={setSearchQuery}
        listFilterContent={filterView}
        workPaneContent={
          <div className="space-y-6">
            {/* Transmission Context Banner - Requirement 25.4 */}
            {isTransmission && (
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <Activity className="w-5 h-5 text-primary" />
                    <div className="flex-1">
                      <h4 className="text-sm font-medium">Transmission Grid Context</h4>
                      <p className="text-xs text-muted-foreground">
                        Reports include grid topology context with substation and feeder performance metrics
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {txSubstations.length} Substations • {txFeeders.length} Feeders
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            )}

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4">
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
              <History className="w-4 h-4" />
              History
            </Button>
            <Button variant="outline" size="sm" className="gap-2" onClick={handleScheduleExport}>
              <Calendar className="w-4 h-4" />
              Schedule
            </Button>
            <Button size="sm" className="gap-2">
              <Download className="w-4 h-4" />
              Export Now
            </Button>
          </div>
        }
      />

      {/* Schedule Export Dialog */}
      <Dialog open={isScheduleDialogOpen} onOpenChange={setIsScheduleDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Schedule Export</DialogTitle>
          </DialogHeader>
          <ReportBuilderShell
            templates={reportTemplates}
            onSchedule={(config) => {
              console.log("Scheduling export:", config);
              setIsScheduleDialogOpen(false);
            }}
            isPopPane={true}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}

interface ExportPackListItemProps {
  pack: ExportPack;
  isSelected: boolean;
  onClick: () => void;
}

function ExportPackListItem({ pack, isSelected, onClick }: ExportPackListItemProps) {
  const Icon = pack.icon;

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "energy": return "bg-blue-500/20 text-blue-400";
      case "emissions": return "bg-green-500/20 text-green-400";
      case "compliance": return "bg-orange-500/20 text-orange-400";
      case "cost": return "bg-purple-500/20 text-purple-400";
      default: return "bg-gray-500/20 text-gray-400";
    }
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-start gap-3 p-3 rounded-lg text-left transition-all duration-200",
        isSelected
          ? "bg-primary/10 border border-primary/30"
          : "hover:bg-secondary/50 border border-transparent"
      )}
    >
      <div
        className={cn(
          "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
          isSelected ? "bg-primary/20" : "bg-secondary"
        )}
      >
        <Icon className={cn("w-5 h-5", isSelected ? "text-primary" : "text-muted-foreground")} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className={cn("text-sm font-medium", isSelected ? "text-primary" : "text-foreground")}>
            {pack.name}
          </span>
        </div>
        <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{pack.description}</p>
        <div className="flex items-center justify-between text-xs">
          <Badge className={getCategoryColor(pack.category)}>
            {pack.category}
          </Badge>
          <span className="text-muted-foreground">{pack.datasets.length} datasets</span>
        </div>
      </div>
    </button>
  );
}

interface ExportPacksViewProps {
  packs: {
    energy: ExportPack[];
    emissions: ExportPack[];
    compliance: ExportPack[];
    cost: ExportPack[];
  };
  selectedPack: ExportPack | null;
  onExportPack: (pack: ExportPack) => void;
  isTransmission: boolean;
  txSubstations: TxSubstation[];
  txFeeders: TxFeeder[];
  selectedSubstation: string;
  selectedFeeder: string;
  onSubstationChange: (value: string) => void;
  onFeederChange: (value: string) => void;
}

function ExportPacksView({
  packs,
  selectedPack,
  onExportPack,
  isTransmission,
  txSubstations,
  txFeeders,
  selectedSubstation,
  selectedFeeder,
  onSubstationChange,
  onFeederChange
}: ExportPacksViewProps) {
  // Filter feeders by selected substation
  const filteredFeeders = useMemo(() => {
    if (selectedSubstation === 'all' || !selectedSubstation) return txFeeders;
    return txFeeders.filter(f => f.substation_id === selectedSubstation);
  }, [selectedSubstation, txFeeders]);

  return (
    <div className="space-y-6">
      {/* Selected Pack Details */}
      {selectedPack && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center">
                  <selectedPack.icon className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-xl">{selectedPack.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">{selectedPack.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="gap-2">
                  <Settings className="w-4 h-4" />
                  Configure
                </Button>
                <Button size="sm" className="gap-2" onClick={() => onExportPack(selectedPack)}>
                  <Download className="w-4 h-4" />
                  Export Pack
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Transmission Grid Topology Filters - Requirement 25.4 */}
            {isTransmission && (
              <div className="mb-6 p-4 bg-secondary/30 rounded-lg">
                <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Grid Topology Context
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Substation</label>
                    <select
                      value={selectedSubstation}
                      onChange={(e) => onSubstationChange(e.target.value)}
                      className="w-full px-3 py-2 bg-background border rounded-md text-sm"
                    >
                      <option value="all">All Substations</option>
                      {txSubstations.map((sub) => (
                        <option key={sub.id} value={sub.id}>
                          {sub.name} ({sub.code})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Feeder</label>
                    <select
                      value={selectedFeeder}
                      onChange={(e) => onFeederChange(e.target.value)}
                      className="w-full px-3 py-2 bg-background border rounded-md text-sm"
                      disabled={selectedSubstation === 'all' || !selectedSubstation}
                    >
                      <option value="all">All Feeders</option>
                      {filteredFeeders.map((feeder) => (
                        <option key={feeder.id} value={feeder.id}>
                          {feeder.name} ({feeder.feeder_code})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Reports will include data scoped to the selected grid topology
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Included Datasets */}
              <div>
                <h4 className="text-sm font-medium mb-3">Included Datasets</h4>
                <div className="space-y-2">
                  {selectedPack.datasets.map((dataset, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-secondary/30 rounded-lg">
                      <FileText className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">{dataset}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Available Formats */}
              <div>
                <h4 className="text-sm font-medium mb-3">Available Formats</h4>
                <div className="flex gap-2">
                  {selectedPack.formats.map((format) => (
                    <Badge key={format} variant="outline" className="text-xs">
                      {format.toUpperCase()}
                    </Badge>
                  ))}
                </div>
                {selectedPack.lastGenerated && (
                  <div className="mt-4">
                    <p className="text-xs text-muted-foreground">
                      Last generated: {new Date(selectedPack.lastGenerated).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Export Packs by Category */}
      <div className="space-y-6">
        {Object.entries(packs).map(([category, categoryPacks]) => (
          <div key={category}>
            <h3 className="text-lg font-semibold capitalize mb-4">{category} Audit Packs</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categoryPacks.map((pack) => (
                <ExportPackCard
                  key={pack.id}
                  pack={pack}
                  isSelected={selectedPack?.id === pack.id}
                  onSelect={() => onExportPack(pack)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ExportPackCard({ pack, isSelected, onSelect }: { pack: ExportPack, isSelected: boolean, onSelect: () => void }) {
  const Icon = pack.icon;
  return (
    <Card
      className={cn(
        "cursor-pointer hover:border-primary transition-colors",
        isSelected && "border-primary bg-primary/5"
      )}
      onClick={onSelect}
    >
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center shrink-0">
            <Icon className="w-5 h-5 text-muted-foreground" />
          </div>
          <div>
            <h4 className="font-medium text-sm">{pack.name}</h4>
            <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{pack.description}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ReportTemplatesView({ templates, onSchedule, isTransmission, txSubstations }: {
  templates: ReportTemplate[],
  onSchedule: (template: ReportTemplate) => void,
  isTransmission: boolean,
  txSubstations: TxSubstation[]
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {templates.map((template) => (
        <Card key={template.id}>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                  <FileText className="w-5 h-5 text-muted-foreground" />
                </div>
                <div>
                  <h4 className="font-medium">{template.name}</h4>
                  <p className="text-xs text-muted-foreground capitalize">{template.frequency}</p>
                </div>
              </div>
              <Badge variant="outline" className="capitalize">{template.category}</Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-4">{template.description}</p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {template.lastRunAt ? `Last run: ${new Date(template.lastRunAt).toLocaleDateString()}` : "Never run"}
              </span>
              <Button size="sm" variant="outline" onClick={() => onSchedule(template)}>
                Configure
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function ExportHistoryView({ jobs, onDownload }: { jobs: ExportJob[], onDownload: (job: ExportJob) => void }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Export History</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {jobs.map((job) => (
            <div key={job.id} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                  <FileText className="w-5 h-5 text-muted-foreground" />
                </div>
                <div>
                  <h4 className="font-medium text-sm">{job.dataset}</h4>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{new Date(job.requestedAt).toLocaleString()}</span>
                    <span>{job.format.toUpperCase()}</span>
                    {job.fileSize && <span>{job.fileSize}</span>}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge
                  variant={job.status === "completed" ? "secondary" :
                    job.status === "failed" ? "destructive" : "outline"}
                  className="capitalize"
                >
                  {job.status}
                </Badge>
                {job.status === "completed" && (
                  <Button size="sm" variant="ghost" onClick={() => onDownload(job)}>
                    <Download className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}