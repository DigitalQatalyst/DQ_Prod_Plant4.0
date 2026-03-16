import { useState, useMemo, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { EMSPageShell } from "@/components/ems/EMSPageShell";
import { EnergyListFilter, EnergyFilterState } from "@/components/ems/EnergyListFilter";
import { ReportBuilderShell } from "@/components/ems/widgets/ReportBuilderShell";
import { ExportPanel } from "@/components/ems/widgets/ExportPanel";
import { KPICard } from "@/components/shared/KPICard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Calendar,
  Download,
  Eye,
  Clock,
  CheckCircle,
  AlertTriangle,
  BarChart3,
  Leaf,
  DollarSign,
  Settings,
  Plus,
  Play,
  Pause,
  RefreshCw,
  Sparkles,
  Target,
  Filter,
  ArrowUpDown
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getTransmissionProvider } from "@/lib/data/providers/TransmissionProvider";
import type {
  TxSubstation,
  TxFeeder,
} from "@/types/transmission";

import { cn } from "@/lib/utils";

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  category: "esg" | "emissions" | "intensity" | "compliance";
  frequency: "daily" | "weekly" | "monthly" | "quarterly" | "annual";
  lastGenerated?: string;
  nextScheduled?: string;
  status: "active" | "paused" | "draft";
  format: "pdf" | "xlsx" | "csv";
  recipients: string[];
  sections: string[];
  estimatedPages: number;
}

interface ReportJob {
  id: string;
  templateId: string;
  templateName: string;
  requestedAt: string;
  status: "pending" | "processing" | "completed" | "failed";
  progress: number;
  format: "pdf" | "xlsx" | "csv";
  fileSize?: string;
  downloadUrl?: string;
  error?: string;
}

// Mock transmission-specific report templates
const mockTransmissionReportTemplates: ReportTemplate[] = [
  {
    id: "tx-esg-monthly",
    name: "Transmission ESG Monthly Report",
    description: "Comprehensive monthly ESG report for transmission operations including grid efficiency, emissions per MWh delivered, and renewable integration",
    category: "esg",
    frequency: "monthly",
    lastGenerated: "2024-11-30T09:00:00Z",
    nextScheduled: "2024-12-31T09:00:00Z",
    status: "active",
    format: "pdf",
    recipients: ["sustainability@company.com", "management@company.com", "grid-ops@company.com"],
    sections: ["Executive Summary", "Grid Performance", "Transmission Efficiency", "Emissions per MWh Delivered", "Grid Losses Analysis", "Renewable Integration", "Compliance Status"],
    estimatedPages: 28
  },
  {
    id: "tx-grid-efficiency",
    name: "Grid Efficiency & Losses Report",
    description: "Weekly transmission grid efficiency report with substation-level losses, load factors, and optimization opportunities",
    category: "intensity",
    frequency: "weekly",
    lastGenerated: "2024-12-09T08:00:00Z",
    nextScheduled: "2024-12-16T08:00:00Z",
    status: "active",
    format: "xlsx",
    recipients: ["grid-ops@company.com", "efficiency@company.com"],
    sections: ["Grid Overview", "Substation Efficiency", "Feeder Losses", "Load Factor Analysis", "Optimization Recommendations"],
    estimatedPages: 12
  },
  {
    id: "tx-renewable-integration",
    name: "Renewable Energy Integration Report",
    description: "Quarterly report on grid-connected renewable energy sources, PPA performance, and renewable energy certificates",
    category: "esg",
    frequency: "quarterly",
    lastGenerated: "2024-09-30T10:00:00Z",
    nextScheduled: "2024-12-31T10:00:00Z",
    status: "active",
    format: "pdf",
    recipients: ["sustainability@company.com", "renewable-energy@company.com"],
    sections: ["Renewable Generation Overview", "PPA Performance", "REC Tracking", "Grid Integration Metrics", "Future Capacity Planning"],
    estimatedPages: 20
  },
  {
    id: "tx-sustainability-annual",
    name: "Transmission Sustainability Annual Report",
    description: "Comprehensive annual sustainability report for transmission operations covering grid performance, emissions intensity, and regulatory compliance",
    category: "esg",
    frequency: "annual",
    lastGenerated: "2023-12-31T12:00:00Z",
    nextScheduled: "2024-12-31T12:00:00Z",
    status: "draft",
    format: "pdf",
    recipients: ["board@company.com", "investors@company.com", "regulatory@company.com"],
    sections: ["CEO Message", "Transmission Strategy", "Grid Performance Metrics", "Environmental Performance", "Emissions Intensity", "Renewable Integration", "Reliability & Resilience", "Future Commitments"],
    estimatedPages: 56
  },
  {
    id: "tx-compliance-monthly",
    name: "Transmission Regulatory Compliance Report",
    description: "Monthly regulatory compliance status for transmission operations including NERC standards, EPA reporting, and state regulations",
    category: "compliance",
    frequency: "monthly",
    lastGenerated: "2024-11-30T11:00:00Z",
    nextScheduled: "2024-12-31T11:00:00Z",
    status: "active",
    format: "xlsx",
    recipients: ["compliance@company.com", "legal@company.com", "regulatory-affairs@company.com"],
    sections: ["NERC Compliance Status", "EPA GHG Reporting", "State Regulations", "Grid Code Compliance", "Action Items", "Risk Assessment"],
    estimatedPages: 16
  }
];

// Mock upstream report templates
const mockReportTemplates: ReportTemplate[] = [
  {
    id: "esg-monthly",
    name: "ESG Monthly Report",
    description: "Comprehensive monthly ESG performance report including energy, emissions, and sustainability metrics",
    category: "esg",
    frequency: "monthly",
    lastGenerated: "2024-11-30T09:00:00Z",
    nextScheduled: "2024-12-31T09:00:00Z",
    status: "active",
    format: "pdf",
    recipients: ["sustainability@company.com", "management@company.com"],
    sections: ["Executive Summary", "Energy Performance", "Emissions Analysis", "Sustainability Initiatives", "Compliance Status"],
    estimatedPages: 24
  },
  {
    id: "emissions-summary",
    name: "Emissions Summary",
    description: "Weekly carbon emissions summary with Scope 1 & 2 breakdown and intensity metrics",
    category: "emissions",
    frequency: "weekly",
    lastGenerated: "2024-12-09T08:00:00Z",
    nextScheduled: "2024-12-16T08:00:00Z",
    status: "active",
    format: "xlsx",
    recipients: ["environmental@company.com"],
    sections: ["Emissions Overview", "Scope 1/2 Breakdown", "Production Intensity", "Trend Analysis"],
    estimatedPages: 8
  },
  {
    id: "intensity-scorecard",
    name: "Energy Intensity Scorecard",
    description: "Quarterly energy intensity performance scorecard with benchmarking and targets",
    category: "intensity",
    frequency: "quarterly",
    lastGenerated: "2024-09-30T10:00:00Z",
    nextScheduled: "2024-12-31T10:00:00Z",
    status: "active",
    format: "pdf",
    recipients: ["operations@company.com", "efficiency@company.com"],
    sections: ["Intensity Metrics", "Benchmark Comparison", "Target Performance", "Improvement Opportunities"],
    estimatedPages: 16
  },
  {
    id: "sustainability-annual",
    name: "Annual Sustainability Report",
    description: "Comprehensive annual sustainability report for stakeholders and regulatory compliance",
    category: "esg",
    frequency: "annual",
    lastGenerated: "2023-12-31T12:00:00Z",
    nextScheduled: "2024-12-31T12:00:00Z",
    status: "draft",
    format: "pdf",
    recipients: ["board@company.com", "investors@company.com", "regulatory@company.com"],
    sections: ["CEO Message", "Sustainability Strategy", "Environmental Performance", "Social Impact", "Governance", "Future Commitments"],
    estimatedPages: 48
  },
  {
    id: "compliance-monthly",
    name: "Regulatory Compliance Report",
    description: "Monthly regulatory compliance status report for environmental and energy regulations",
    category: "compliance",
    frequency: "monthly",
    lastGenerated: "2024-11-30T11:00:00Z",
    nextScheduled: "2024-12-31T11:00:00Z",
    status: "active",
    format: "xlsx",
    recipients: ["compliance@company.com", "legal@company.com"],
    sections: ["Compliance Status", "Regulatory Updates", "Action Items", "Risk Assessment"],
    estimatedPages: 12
  }
];

// Mock report jobs
const mockReportJobs: ReportJob[] = [
  {
    id: "job-001",
    templateId: "esg-monthly",
    templateName: "ESG Monthly Report",
    requestedAt: "2024-12-16T10:30:00Z",
    status: "completed",
    progress: 100,
    format: "pdf",
    fileSize: "2.4 MB",
    downloadUrl: "/reports/esg-monthly-2024-12.pdf"
  },
  {
    id: "job-002",
    templateId: "emissions-summary",
    templateName: "Emissions Summary",
    requestedAt: "2024-12-16T11:15:00Z",
    status: "processing",
    progress: 65,
    format: "xlsx"
  },
  {
    id: "job-003",
    templateId: "intensity-scorecard",
    templateName: "Energy Intensity Scorecard",
    requestedAt: "2024-12-16T09:45:00Z",
    status: "failed",
    progress: 0,
    format: "pdf",
    error: "Data validation failed: Missing production data for Q4"
  }
];

export function EnergySustainabilityESGReporting() {
  const {
    energyMeters,
    energyTelemetry,
    emissionFactors,
    sector,
    subsector,
    currentTenant
  } = useApp();

  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showReportBuilder, setShowReportBuilder] = useState(false);
  const [showScheduleForm, setShowScheduleForm] = useState(false);

  const [filters, setFilters] = useState<EnergyFilterState>({
    status: "",
    role: "",
    substationId: "",
    feederId: "",
    type: ""
  });
  const [isLoading, setIsLoading] = useState(false);

  // Check if we're in transmission context
  const isTransmission = sector === 'Power' && subsector === 'Transmission';




  // Select appropriate templates based on sector
  const sectorTemplates = isTransmission ? mockTransmissionReportTemplates : mockReportTemplates;

  const filteredTemplates = useMemo(() => {
    let currentTemplates = sectorTemplates;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      currentTemplates = currentTemplates.filter(
        (template) =>
          template.name.toLowerCase().includes(q) ||
          template.description.toLowerCase().includes(q) ||
          template.category.toLowerCase().includes(q)
      );
    }

    if (filters.status) {
      currentTemplates = currentTemplates.filter(t => t.status === filters.status);
    }

    if (filters.type) {
      currentTemplates = currentTemplates.filter(t => t.category === filters.type);
    }

    if (filters.role) {
      currentTemplates = currentTemplates.filter(t => t.frequency === filters.role);
    }

    return currentTemplates;
  }, [searchQuery, sectorTemplates, filters]);

  // Calculate report metrics
  const reportMetrics = useMemo(() => {
    const activeReports = sectorTemplates.filter(t => t.status === "active").length;
    const completedJobs = mockReportJobs.filter(j => j.status === "completed").length;
    const pendingJobs = mockReportJobs.filter(j => j.status === "processing" || j.status === "pending").length;
    const failedJobs = mockReportJobs.filter(j => j.status === "failed").length;

    return {
      activeReports,
      completedJobs,
      pendingJobs,
      failedJobs,
      totalJobs: mockReportJobs.length
    };
  }, [sectorTemplates]);

  const listItems = filteredTemplates.map(template => ({
    id: template.id,
    name: template.name,
    subtitle: `${template.frequency} • ${template.category.toUpperCase()}`,
    status: template.status,
    metadata: {
      category: template.category,
      frequency: template.frequency,
      lastGenerated: template.lastGenerated,
      estimatedPages: template.estimatedPages,
      sector: isTransmission ? 'Transmission' : 'Upstream'
    }
  }));

  const workPaneContent = selectedTemplate ? (
    <ReportTemplateDetails
      template={selectedTemplate}
      jobs={mockReportJobs.filter(job => job.templateId === selectedTemplate.id)}
      onShowReportBuilder={() => setShowReportBuilder(true)}
      onShowScheduleForm={() => setShowScheduleForm(true)}
      isTransmission={isTransmission}
    />
  ) : (
    <ESGReportingOverview
      templates={sectorTemplates}
      jobs={mockReportJobs}
      metrics={reportMetrics}
      sector={sector}
      subsector={subsector}
      isTransmission={isTransmission}
    />
  );

  const filterView = (
    <EnergyListFilter
      filters={filters}
      onFiltersChange={setFilters}
      showRoleFilter={true}
      showTypeFilter={true}
      statusOptions={[
        { label: "Active", value: "active" },
        { label: "Paused", value: "paused" },
        { label: "Draft", value: "draft" }
      ]}
      typeOptions={[
        { label: "ESG", value: "esg" },
        { label: "Emissions", value: "emissions" },
        { label: "Intensity", value: "intensity" },
        { label: "Compliance", value: "compliance" }
      ]}
      roleOptions={[
        { label: "Daily", value: "daily" },
        { label: "Weekly", value: "weekly" },
        { label: "Monthly", value: "monthly" },
        { label: "Quarterly", value: "quarterly" },
        { label: "Annual", value: "annual" }
      ]}
    />
  );

  return (

    <>
      <EMSPageShell
        title="ESG Reporting"
        featureSetName="Sustainability & Emissions Tracking"
        featureName="ESG Reporting"
        listType="reports"
        listItems={listItems}
        selectedItem={selectedTemplate}
        onItemSelect={(item) => {
          const template = sectorTemplates.find(t => t.id === item.id);
          setSelectedTemplate(template || null);
        }}
        workPaneContent={workPaneContent}
        searchPlaceholder="Search report templates..."
        listFilterContent={filterView}

        actions={
          <div className="flex flex-col gap-2">
            <Button size="sm" className="w-full gap-2">
              <Plus className="w-4 h-4" />
              New Template
            </Button>
            <Button variant="outline" size="sm" className="w-full gap-2">
              <Settings className="w-4 h-4" />
              Settings
            </Button>
          </div>
        }
      />

      {/* Report Builder PopPane */}
      {showReportBuilder && selectedTemplate && (
        <ReportBuilderShell
          template={{
            ...selectedTemplate,
            frequency: selectedTemplate.frequency === "annual" ? "quarterly" : selectedTemplate.frequency as "daily" | "weekly" | "monthly" | "quarterly",
            category: selectedTemplate.category === "intensity" ? "energy" : selectedTemplate.category as "energy" | "emissions" | "compliance"
          }}
          onClose={() => setShowReportBuilder(false)}
          onGenerate={(config) => {
            console.log("Generate report with config:", config);
            setShowReportBuilder(false);
          }}
        />
      )}

      {/* Schedule Form PopPane */}
      {showScheduleForm && selectedTemplate && (
        <ScheduleFormPopPane
          template={selectedTemplate}
          onClose={() => setShowScheduleForm(false)}
          onSchedule={(schedule) => {
            console.log("Schedule report:", schedule);
            setShowScheduleForm(false);
          }}
        />
      )}
    </>
  );
}

interface ReportTemplateListItemProps {
  template: ReportTemplate;
  isSelected: boolean;
  onClick: () => void;
}

function ReportTemplateListItem({ template, isSelected, onClick }: ReportTemplateListItemProps) {
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "esg": return <Leaf className="w-4 h-4" />;
      case "emissions": return <BarChart3 className="w-4 h-4" />;
      case "intensity": return <DollarSign className="w-4 h-4" />;
      case "compliance": return <CheckCircle className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getFrequencyColor = (frequency: string) => {
    switch (frequency) {
      case "daily": return "text-primary";
      case "weekly": return "text-success";
      case "monthly": return "text-warning";
      case "quarterly": return "text-destructive";
      case "annual": return "text-muted-foreground";
      default: return "text-muted-foreground";
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
        {getCategoryIcon(template.category)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className={cn("text-sm font-medium", isSelected ? "text-primary" : "text-foreground")}>
            {template.name}
          </span>
          <StatusBadge status={template.status} size="sm" />
        </div>
        <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{template.description}</p>
        <div className="flex items-center justify-between text-xs">
          <span className={getFrequencyColor(template.frequency)}>
            {template.frequency.charAt(0).toUpperCase() + template.frequency.slice(1)}
          </span>
          <span className="text-muted-foreground">{template.estimatedPages} pages</span>
        </div>
      </div>
    </button>
  );
}

interface ReportTemplateDetailsProps {
  template: ReportTemplate;
  jobs: ReportJob[];
  onShowReportBuilder: () => void;
  onShowScheduleForm: () => void;
  isTransmission: boolean;
}

function ReportTemplateDetails({ template, jobs, onShowReportBuilder, onShowScheduleForm, isTransmission }: ReportTemplateDetailsProps) {
  const getStatusVariant = (status: string) => {
    switch (status) {
      case "active": return "success";
      case "paused": return "warning";
      case "draft": return "default";
      default: return "default";
    }
  };

  const recentJobs = jobs.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Sector Badge for Transmission */}
      {isTransmission && (
        <div className="bg-primary/10 border border-primary/30 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-primary">Transmission Grid ESG Report</h4>
              <p className="text-xs text-muted-foreground">
                Includes grid efficiency metrics, emissions per MWh delivered, and transmission-specific compliance
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Template KPIs */}
      <div className="grid grid-cols-4 gap-4">
        <KPICard
          title="Status"
          value={template.status.charAt(0).toUpperCase() + template.status.slice(1)}
          subtitle="Template status"
          icon={template.status === "active" ? CheckCircle : template.status === "paused" ? Pause : FileText}
          variant={getStatusVariant(template.status) as any}
        />
        <KPICard
          title="Frequency"
          value={template.frequency.charAt(0).toUpperCase() + template.frequency.slice(1)}
          subtitle="Generation schedule"
          icon={Calendar}
          variant="primary"
        />
        <KPICard
          title="Recipients"
          value={template.recipients.length.toString()}
          subtitle="Email recipients"
          icon={FileText}
          variant="default"
        />
        <KPICard
          title="Estimated Size"
          value={`${template.estimatedPages} pages`}
          subtitle="Report length"
          icon={BarChart3}
          variant="default"
        />
      </div>

      {/* Template Information */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Template Information</h3>
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-3">
            <InfoRow label="Template ID" value={template.id} />
            <InfoRow label="Category" value={template.category.toUpperCase()} />
            <InfoRow label="Format" value={template.format.toUpperCase()} />
            <InfoRow label="Status" value={template.status} />
            {isTransmission && <InfoRow label="Sector" value="Power Transmission" />}
          </div>
          <div className="space-y-3">
            <InfoRow label="Frequency" value={template.frequency} />
            <InfoRow label="Last Generated" value={template.lastGenerated ? new Date(template.lastGenerated).toLocaleDateString() : "Never"} />
            <InfoRow label="Next Scheduled" value={template.nextScheduled ? new Date(template.nextScheduled).toLocaleDateString() : "Not scheduled"} />
            <InfoRow label="Recipients" value={`${template.recipients.length} recipients`} />
          </div>
        </div>
        <div className="mt-4">
          <p className="text-sm text-muted-foreground">{template.description}</p>
        </div>
      </div>

      {/* Transmission-Specific Metrics (when applicable) */}
      {isTransmission && (
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Transmission ESG Metrics Included</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-secondary/30 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">Grid Efficiency</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Transmission losses %, load factor, system efficiency by substation and feeder
              </p>
            </div>
            <div className="p-4 bg-secondary/30 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Leaf className="w-4 h-4 text-success" />
                <span className="text-sm font-medium">Emissions Intensity</span>
              </div>
              <p className="text-xs text-muted-foreground">
                kgCO2e per MWh delivered, emissions per MW peak, delivery context analysis
              </p>
            </div>
            <div className="p-4 bg-secondary/30 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-warning" />
                <span className="text-sm font-medium">Renewable Integration</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Grid-connected renewables, PPA performance, REC tracking, renewable percentage
              </p>
            </div>
            <div className="p-4 bg-secondary/30 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-4 h-4 text-destructive" />
                <span className="text-sm font-medium">Compliance Status</span>
              </div>
              <p className="text-xs text-muted-foreground">
                NERC standards, EPA GHG reporting, state regulations, grid code compliance
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Report Sections */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Report Sections</h3>
        <div className="grid grid-cols-2 gap-3">
          {template.sections.map((section, index) => (
            <div key={index} className="flex items-center gap-2 p-3 bg-secondary/30 rounded-lg">
              <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold text-xs">
                {index + 1}
              </div>
              <span className="text-sm font-medium">{section}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Generation Actions */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Report Generation</h3>
        <div className="flex gap-4">
          <Button onClick={onShowReportBuilder} className="gap-2">
            <Play className="w-4 h-4" />
            Generate Report
          </Button>
          <Button variant="outline" onClick={onShowScheduleForm} className="gap-2">
            <Calendar className="w-4 h-4" />
            Schedule
          </Button>
          <Button variant="outline" className="gap-2">
            <Eye className="w-4 h-4" />
            Preview
          </Button>
        </div>
      </div>

      {/* Recent Jobs */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Recent Generation Jobs</h3>
        {recentJobs.length > 0 ? (
          <div className="space-y-3">
            {recentJobs.map((job) => (
              <ReportJobItem key={job.id} job={job} />
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No generation jobs found</p>
          </div>
        )}
      </div>

      {/* Recipients */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Recipients</h3>
        <div className="space-y-2">
          {template.recipients.map((recipient, index) => (
            <div key={index} className="flex items-center justify-between p-2 bg-secondary/30 rounded">
              <span className="text-sm">{recipient}</span>
              <Badge variant="outline">Email</Badge>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

interface ESGReportingOverviewProps {
  templates: ReportTemplate[];
  jobs: ReportJob[];
  metrics: any;
  sector: string | null;
  subsector: string | null;
  isTransmission: boolean;
}

function ESGReportingOverview({ templates, jobs, metrics, sector, subsector, isTransmission }: ESGReportingOverviewProps) {
  const templatesByCategory = useMemo(() => {
    return templates.reduce((acc, template) => {
      if (!acc[template.category]) {
        acc[template.category] = [];
      }
      acc[template.category].push(template);
      return acc;
    }, {} as Record<string, ReportTemplate[]>);
  }, [templates]);

  return (
    <div className="space-y-6">
      {/* Sector Context Banner */}
      {isTransmission && (
        <div className="bg-gradient-to-r from-primary/10 to-success/10 border border-primary/30 rounded-lg p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold mb-2">Transmission Grid ESG Reporting</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Generate comprehensive ESG reports for transmission operations including grid efficiency metrics,
                emissions per MWh delivered, renewable integration, and regulatory compliance.
              </p>
              <div className="grid grid-cols-4 gap-3">
                <div className="flex items-center gap-2 text-xs">
                  <BarChart3 className="w-4 h-4 text-primary" />
                  <span>Grid Performance</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <Leaf className="w-4 h-4 text-success" />
                  <span>Emissions Intensity</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <Sparkles className="w-4 h-4 text-warning" />
                  <span>Renewable Integration</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <Target className="w-4 h-4 text-destructive" />
                  <span>Compliance Tracking</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Overview KPIs */}
      <div className="grid grid-cols-4 gap-4">
        <KPICard
          title="Active Templates"
          value={metrics.activeReports.toString()}
          subtitle="Scheduled reports"
          icon={FileText}
          variant="primary"
        />
        <KPICard
          title="Completed Jobs"
          value={metrics.completedJobs.toString()}
          subtitle="Successfully generated"
          icon={CheckCircle}
          variant="success"
        />
        <KPICard
          title="Pending Jobs"
          value={metrics.pendingJobs.toString()}
          subtitle="In progress"
          icon={Clock}
          variant="warning"
        />
        <KPICard
          title="Failed Jobs"
          value={metrics.failedJobs.toString()}
          subtitle="Require attention"
          icon={AlertTriangle}
          variant="destructive"
        />
      </div>

      {/* Report Categories */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Report Categories</h3>
        <div className="grid grid-cols-2 gap-6">
          {Object.entries(templatesByCategory).map(([category, categoryTemplates]) => (
            <div key={category} className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground capitalize">{category} Reports</h4>
              {categoryTemplates.map((template) => (
                <div key={template.id} className="p-3 bg-secondary/30 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">{template.name}</span>
                    <StatusBadge status={template.status} size="sm" />
                  </div>
                  <div className="text-xs text-muted-foreground">
                    <p>{template.frequency} • {template.format.toUpperCase()}</p>
                    <p>{template.estimatedPages} pages • {template.recipients.length} recipients</p>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Export Panel */}
      <ExportPanel
        exportPacks={
          isTransmission
            ? [
              { id: "all-reports", name: "All Report Templates", description: "Export all transmission ESG report template configurations", datasets: ["templates"], formats: ["csv", "xlsx", "json"] },
              { id: "job-history", name: "Generation History", description: "Export report generation job history", datasets: ["jobs"], formats: ["csv", "xlsx"] },
              { id: "schedule-config", name: "Schedule Configuration", description: "Export automated scheduling settings", datasets: ["schedules"], formats: ["json"] },
              { id: "grid-metrics", name: "Grid Performance Metrics", description: "Export transmission grid efficiency and performance data", datasets: ["grid_metrics"], formats: ["csv", "xlsx"] },
              { id: "emissions-intensity", name: "Emissions Intensity Data", description: "Export emissions per MWh delivered and delivery context", datasets: ["emissions"], formats: ["csv", "xlsx"] }
            ]
            : [
              { id: "all-reports", name: "All Report Templates", description: "Export all report template configurations", datasets: ["templates"], formats: ["csv", "xlsx", "json"] },
              { id: "job-history", name: "Generation History", description: "Export report generation job history", datasets: ["jobs"], formats: ["csv", "xlsx"] },
              { id: "schedule-config", name: "Schedule Configuration", description: "Export automated scheduling settings", datasets: ["schedules"], formats: ["json"] }
            ]
        }
        onExport={(dataset, format) => {
          console.log(`Export ${dataset} as ${format}`);
        }}
      />

      {/* Recent Activity */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Recent Generation Activity</h3>
        <div className="space-y-3">
          {jobs.slice(0, 5).map((job) => (
            <ReportJobItem key={job.id} job={job} />
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 gap-4">
          <Button className="h-auto p-4 flex-col gap-2">
            <Plus className="w-6 h-6" />
            <span>Create New Template</span>
            <span className="text-xs opacity-70">
              {isTransmission ? "Build custom transmission ESG report" : "Build custom ESG report"}
            </span>
          </Button>
          <Button variant="outline" className="h-auto p-4 flex-col gap-2">
            <RefreshCw className="w-6 h-6" />
            <span>Regenerate Failed</span>
            <span className="text-xs opacity-70">Retry failed report jobs</span>
          </Button>
        </div>
      </div>
    </div>
  );
}

interface ReportJobItemProps {
  job: ReportJob;
}

function ReportJobItem({ job }: ReportJobItemProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed": return <CheckCircle className="w-4 h-4 text-success" />;
      case "processing": return <RefreshCw className="w-4 h-4 text-primary animate-spin" />;
      case "pending": return <Clock className="w-4 h-4 text-warning" />;
      case "failed": return <AlertTriangle className="w-4 h-4 text-destructive" />;
      default: return <FileText className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "text-success";
      case "processing": return "text-primary";
      case "pending": return "text-warning";
      case "failed": return "text-destructive";
      default: return "text-muted-foreground";
    }
  };

  return (
    <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
      <div className="flex items-center gap-3">
        {getStatusIcon(job.status)}
        <div>
          <p className="text-sm font-medium">{job.templateName}</p>
          <p className="text-xs text-muted-foreground">
            {new Date(job.requestedAt).toLocaleString()} • {job.format.toUpperCase()}
          </p>
        </div>
      </div>
      <div className="text-right">
        <p className={cn("text-sm font-medium", getStatusColor(job.status))}>
          {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
        </p>
        {job.status === "processing" && (
          <p className="text-xs text-muted-foreground">{job.progress}% complete</p>
        )}
        {job.status === "completed" && job.fileSize && (
          <p className="text-xs text-muted-foreground">{job.fileSize}</p>
        )}
        {job.status === "failed" && job.error && (
          <p className="text-xs text-destructive">{job.error}</p>
        )}
      </div>
      {job.status === "completed" && job.downloadUrl && (
        <Button size="sm" variant="outline" className="ml-2 gap-1">
          <Download className="w-3 h-3" />
          Download
        </Button>
      )}
    </div>
  );
}

interface ScheduleFormPopPaneProps {
  template: ReportTemplate;
  onClose: () => void;
  onSchedule: (schedule: any) => void;
}

function ScheduleFormPopPane({ template, onClose, onSchedule }: ScheduleFormPopPaneProps) {
  const [frequency, setFrequency] = useState(template.frequency);
  const [time, setTime] = useState("09:00");
  const [recipients, setRecipients] = useState(template.recipients.join(", "));

  const handleSchedule = () => {
    onSchedule({
      frequency,
      time,
      recipients: recipients.split(",").map(r => r.trim())
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-card border border-border rounded-lg p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Schedule Report</h3>
          <Button variant="ghost" size="sm" onClick={onClose}>
            ×
          </Button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Template</label>
            <p className="text-sm text-muted-foreground">{template.name}</p>
          </div>

          <div>
            <label className="text-sm font-medium">Frequency</label>
            <select
              value={frequency}
              onChange={(e) => setFrequency(e.target.value as any)}
              className="w-full mt-1 p-2 border border-border rounded"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="annual">Annual</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium">Time</label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full mt-1 p-2 border border-border rounded"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Recipients</label>
            <textarea
              value={recipients}
              onChange={(e) => setRecipients(e.target.value)}
              placeholder="Enter email addresses separated by commas"
              className="w-full mt-1 p-2 border border-border rounded h-20"
            />
          </div>
        </div>

        <div className="flex gap-2 mt-6">
          <Button onClick={handleSchedule} className="flex-1">
            Schedule Report
          </Button>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}