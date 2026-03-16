import { useState, useMemo, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { EMSPageShell } from "@/components/ems/EMSPageShell";
import { KPICard } from "@/components/shared/KPICard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Shield,
  CheckCircle,
  AlertTriangle,
  XCircle,
  FileText,
  Download,
  Calendar,
  Clock,
  Eye,
  Settings,
  RefreshCw,
  Zap,
  Gauge,
  Leaf,
  BarChart3,
  AlertCircle,
  Info,
  Building2,
  Cable,
  Filter,
  ArrowUpDown
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getTransmissionProvider } from "@/lib/data/providers/TransmissionProvider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  TxSubstation,
  TxFeeder,
  TxComplianceRequirement,
  TxComplianceEvidence,
  TxComplianceSummary
} from "@/types/transmission";

import { EnergyListFilter, EnergyFilterState } from "@/components/ems/EnergyListFilter";


interface ComplianceCheck {
  id: string;
  name: string;
  category: "power_quality" | "emissions" | "reporting" | "safety" | "environmental";
  regulation: string;
  description: string;
  status: "pass" | "watch" | "fail";
  lastChecked: string;
  nextCheck: string;
  threshold: {
    value: number;
    unit: string;
    operator: ">" | "<" | "=" | ">=" | "<=";
  };
  currentValue: number;
  compliance: number; // percentage
  priority: "low" | "medium" | "high" | "critical";
  actions: string[];
}

interface ComplianceException {
  id: string;
  checkId: string;
  checkName: string;
  reason: string;
  rationale: string;
  approvedBy: string;
  approvedAt: string;
  expiresAt: string;
  status: "active" | "expired" | "revoked";
}

interface CompliancePack {
  id: string;
  name: string;
  description: string;
  checks: string[];
  format: "pdf" | "xlsx" | "zip";
  lastGenerated?: string;
  fileSize?: string;
}

// Mock compliance checks
const mockComplianceChecks: ComplianceCheck[] = [
  {
    id: "pq-voltage",
    name: "Voltage Regulation Compliance",
    category: "power_quality",
    regulation: "IEEE 519-2014",
    description: "Voltage must remain within ±5% of nominal voltage",
    status: "pass",
    lastChecked: "2024-12-16T08:00:00Z",
    nextCheck: "2024-12-16T20:00:00Z",
    threshold: { value: 5, unit: "%", operator: "<=" },
    currentValue: 2.1,
    compliance: 95.8,
    priority: "medium",
    actions: ["Monitor voltage regulators", "Check transformer taps"]
  },
  {
    id: "pq-thd",
    name: "Total Harmonic Distortion",
    category: "power_quality",
    regulation: "IEEE 519-2014",
    description: "THD must not exceed 5% for voltage and 8% for current",
    status: "watch",
    lastChecked: "2024-12-16T08:00:00Z",
    nextCheck: "2024-12-16T20:00:00Z",
    threshold: { value: 5, unit: "%", operator: "<=" },
    currentValue: 4.2,
    compliance: 84.0,
    priority: "medium",
    actions: ["Install harmonic filters", "Review non-linear loads"]
  },
  {
    id: "emissions-scope1",
    name: "Scope 1 Emissions Threshold",
    category: "emissions",
    regulation: "EPA GHG Reporting",
    description: "Annual Scope 1 emissions must be reported if >25,000 tCO2e",
    status: "pass",
    lastChecked: "2024-12-15T00:00:00Z",
    nextCheck: "2024-12-17T00:00:00Z",
    threshold: { value: 25000, unit: "tCO2e/year", operator: "<" },
    currentValue: 18500,
    compliance: 100,
    priority: "high",
    actions: ["Continue monitoring", "Prepare annual report"]
  },
  {
    id: "emissions-intensity",
    name: "Carbon Intensity Limit",
    category: "emissions",
    regulation: "State Environmental Code",
    description: "Carbon intensity must not exceed 30 kg CO2/BBL",
    status: "fail",
    lastChecked: "2024-12-16T06:00:00Z",
    nextCheck: "2024-12-16T18:00:00Z",
    threshold: { value: 30, unit: "kg CO2/BBL", operator: "<=" },
    currentValue: 32.5,
    compliance: 72.3,
    priority: "critical",
    actions: ["Implement efficiency measures", "Review energy sources", "Submit mitigation plan"]
  },
  {
    id: "reporting-monthly",
    name: "Monthly Energy Reporting",
    category: "reporting",
    regulation: "DOE Form EIA-914",
    description: "Monthly production and energy consumption must be reported by 30th",
    status: "pass",
    lastChecked: "2024-11-30T23:59:00Z",
    nextCheck: "2024-12-30T23:59:00Z",
    threshold: { value: 30, unit: "days", operator: "<=" },
    currentValue: 15,
    compliance: 100,
    priority: "medium",
    actions: ["Prepare December report", "Verify data accuracy"]
  },
  {
    id: "safety-electrical",
    name: "Electrical Safety Standards",
    category: "safety",
    regulation: "NFPA 70E",
    description: "Electrical equipment must meet arc flash and shock protection requirements",
    status: "pass",
    lastChecked: "2024-12-10T00:00:00Z",
    nextCheck: "2025-01-10T00:00:00Z",
    threshold: { value: 100, unit: "%", operator: ">=" },
    currentValue: 98.5,
    compliance: 98.5,
    priority: "high",
    actions: ["Complete quarterly inspection", "Update arc flash labels"]
  },
  {
    id: "env-spill-prevention",
    name: "Spill Prevention Control",
    category: "environmental",
    regulation: "40 CFR 112",
    description: "Spill prevention and containment systems must be maintained",
    status: "watch",
    lastChecked: "2024-12-14T00:00:00Z",
    nextCheck: "2024-12-21T00:00:00Z",
    threshold: { value: 95, unit: "%", operator: ">=" },
    currentValue: 92.0,
    compliance: 92.0,
    priority: "medium",
    actions: ["Inspect containment systems", "Review spill response procedures"]
  }
];

// Mock compliance exceptions
const mockComplianceExceptions: ComplianceException[] = [
  {
    id: "exc-001",
    checkId: "emissions-intensity",
    checkName: "Carbon Intensity Limit",
    reason: "Temporary equipment malfunction",
    rationale: "Compressor efficiency degraded due to scheduled maintenance delay. Mitigation measures implemented.",
    approvedBy: "Environmental Manager",
    approvedAt: "2024-12-15T10:00:00Z",
    expiresAt: "2024-12-20T23:59:00Z",
    status: "active"
  },
  {
    id: "exc-002",
    checkId: "pq-thd",
    checkName: "Total Harmonic Distortion",
    reason: "Equipment upgrade in progress",
    rationale: "Harmonic filter installation scheduled for next maintenance window. Temporary exceedance approved.",
    approvedBy: "Operations Manager",
    approvedAt: "2024-12-10T14:00:00Z",
    expiresAt: "2024-12-25T23:59:00Z",
    status: "active"
  }
];

// Mock compliance packs
const mockCompliancePacks: CompliancePack[] = [
  {
    id: "pack-pq",
    name: "Power Quality Compliance Pack",
    description: "Complete power quality compliance documentation including IEEE 519 analysis",
    checks: ["pq-voltage", "pq-thd"],
    format: "pdf",
    lastGenerated: "2024-12-15T09:00:00Z",
    fileSize: "1.8 MB"
  },
  {
    id: "pack-emissions",
    name: "Emissions Compliance Pack",
    description: "Comprehensive emissions compliance report for EPA and state regulations",
    checks: ["emissions-scope1", "emissions-intensity"],
    format: "xlsx",
    lastGenerated: "2024-12-14T16:00:00Z",
    fileSize: "2.3 MB"
  },
  {
    id: "pack-full",
    name: "Complete Compliance Package",
    description: "Full compliance documentation package for all regulations and standards",
    checks: mockComplianceChecks.map(c => c.id),
    format: "zip",
    lastGenerated: "2024-12-01T12:00:00Z",
    fileSize: "8.7 MB"
  }
];



export function EnergySustainabilityCompliance() {
  const {
    energyMeters,
    energyTelemetry,
    emissionFactors,
    sector,
    subsector,
    currentTenant
  } = useApp();

  const isTransmission = sector === 'Power' && subsector === 'Transmission';

  const [selectedCheck, setSelectedCheck] = useState<ComplianceCheck | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [filters, setFilters] = useState<EnergyFilterState>({
    status: "",
    role: "",
    substationId: "",
    feederId: "",
    type: ""
  });

  // Transmission-specific state
  const [txRequirements, setTxRequirements] = useState<TxComplianceRequirement[]>([]);
  const [txEvidence, setTxEvidence] = useState<TxComplianceEvidence[]>([]);
  const [txSummary, setTxSummary] = useState<TxComplianceSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Substation/Feeder lists for filters
  const [txSubstations, setTxSubstations] = useState<TxSubstation[]>([]);
  const [txFeeders, setTxFeeders] = useState<TxFeeder[]>([]);



  // Unified filtering logic for Upstream
  const filteredChecks = useMemo(() => {
    let result = mockComplianceChecks;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.regulation.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q)
      );
    }

    if (filters.status) {
      result = result.filter(c => c.status === filters.status);
    }

    if (filters.type) {
      result = result.filter(c => c.category === filters.type);
    }

    return result;
  }, [searchQuery, filters]);

  // Unified filtering logic for Transmission
  const filteredTxRequirements = useMemo(() => {
    let result = txRequirements;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(req =>
        req.requirement_name.toLowerCase().includes(q) ||
        (req.standard_reference && req.standard_reference.toLowerCase().includes(q))
      );
    }

    if (filters.status) {
      const statusMap: Record<string, string> = {
        "pass": "compliant",
        "watch": "pending",
        "fail": "non_compliant"
      };
      const activeStatus = statusMap[filters.status] || filters.status;
      result = result.filter(req => req.compliance_status === activeStatus);
    }

    if (filters.type) {
      result = result.filter(req => req.compliance_category === filters.type);
    }

    return result;
  }, [txRequirements, searchQuery, filters]);


  // Load transmission compliance data
  useEffect(() => {
    if (isTransmission && currentTenant?.id) {
      loadTransmissionCompliance();
    }
  }, [isTransmission, currentTenant?.id]);

  const loadTransmissionCompliance = async () => {
    if (!currentTenant?.id) return;

    setLoading(true);
    setError(null);

    try {
      const provider = getTransmissionProvider();

      // Load requirements
      const requirements = await provider.listTxComplianceRequirements({
        org_id: currentTenant.id,
        active: true
      });
      setTxRequirements(requirements);

      // Load evidence for all requirements
      const evidence = await provider.listTxComplianceEvidence({
        org_id: currentTenant.id
      });
      setTxEvidence(evidence);

      // Load summary
      const summary = await provider.getTxComplianceSummary(currentTenant.id);
      setTxSummary(summary);

      // Load topology for filters
      const [substations, feeders] = await Promise.all([
        provider.listTxSubstations({ org_id: currentTenant.id, active: true }),
        provider.listTxFeeders({ active: true })
      ]);
      setTxSubstations(substations || []);
      setTxFeeders(feeders || []);
    } catch (err) {
      console.error('Failed to load transmission compliance data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load compliance data');
    } finally {
      setLoading(false);
    }
  };



  // Calculate compliance metrics
  const complianceMetrics = useMemo(() => {
    if (isTransmission && txSummary) {
      // Use transmission summary data
      return {
        totalChecks: txSummary.total_requirements,
        passCount: txSummary.compliant_count,
        watchCount: txSummary.pending_count,
        failCount: txSummary.non_compliant_count,
        criticalCount: txSummary.critical_risk_count,
        activeExceptions: 0, // Would need separate query for exceptions
        overallCompliance: txSummary.overall_compliance_percentage
      };
    }

    // Use upstream mock data
    const totalChecks = mockComplianceChecks.length;
    const passCount = mockComplianceChecks.filter(c => c.status === "pass").length;
    const watchCount = mockComplianceChecks.filter(c => c.status === "watch").length;
    const failCount = mockComplianceChecks.filter(c => c.status === "fail").length;
    const criticalCount = mockComplianceChecks.filter(c => c.priority === "critical").length;
    const activeExceptions = mockComplianceExceptions.filter(e => e.status === "active").length;

    const overallCompliance = mockComplianceChecks.reduce((sum, check) => sum + check.compliance, 0) / totalChecks;

    return {
      totalChecks,
      passCount,
      watchCount,
      failCount,
      criticalCount,
      activeExceptions,
      overallCompliance
    };
  }, [isTransmission, txSummary]);

  const listItems = isTransmission
    ? filteredTxRequirements.map(req => ({
      id: req.id,
      name: req.requirement_name,
      subtitle: `${req.standard_reference || 'N/A'} • ${req.compliance_status}`,
      status: req.compliance_status === 'compliant' ? 'pass' :
        req.compliance_status === 'pending' ? 'watch' : 'fail',
      metadata: {
        category: req.compliance_category,
        priority: req.risk_level.toLowerCase(),
        compliance: req.compliance_status === 'compliant' ? 100 :
          req.compliance_status === 'pending' ? 50 : 0,
        nextCheck: req.next_review_date || ''
      }
    }))
    : filteredChecks.map(check => ({
      id: check.id,
      name: check.name,
      subtitle: `${check.regulation} • ${check.compliance.toFixed(1)}% compliant`,
      status: check.status,
      metadata: {
        category: check.category,
        priority: check.priority,
        compliance: check.compliance,
        nextCheck: check.nextCheck
      }
    }));

  const workPaneContent = selectedCheck ? (
    <ComplianceCheckDetails
      check={selectedCheck}
      exceptions={mockComplianceExceptions.filter(e => e.checkId === selectedCheck.id)}
    />
  ) : (
    <ComplianceOverview
      checks={isTransmission ? [] : mockComplianceChecks}
      txRequirements={isTransmission ? filteredTxRequirements : []}
      txEvidence={isTransmission ? txEvidence : []}
      txSummary={isTransmission ? txSummary : null}
      exceptions={mockComplianceExceptions}
      packs={mockCompliancePacks}
      metrics={complianceMetrics}
      sector={sector}
      subsector={subsector}
      isTransmission={isTransmission}
      loading={loading}
      error={error}
    />
  );


  const filterView = (
    <EnergyListFilter
      filters={filters}
      onFiltersChange={setFilters}
      showRoleFilter={false}
      showTypeFilter={true}
      statusOptions={isTransmission ? [
        { label: "Compliant", value: "pass" },
        { label: "Pending", value: "watch" },
        { label: "Non-compliant", value: "fail" }
      ] : [
        { label: "Pass", value: "pass" },
        { label: "Watch", value: "watch" },
        { label: "Fail", value: "fail" }
      ]}
      typeOptions={[
        { label: "Power Quality", value: "power_quality" },
        { label: "Emissions", value: "emissions" },
        { label: "Reporting", value: "reporting" },
        { label: "Safety", value: "safety" },
        { label: "Environmental", value: "environmental" }
      ]}
    />
  );

  return (

    <EMSPageShell
      title="Compliance"
      featureSetName="Sustainability & Emissions Tracking"
      featureName="Compliance"
      listType="meters"
      listItems={listItems}
      selectedItem={selectedCheck}
      onItemSelect={(item) => {
        const check = mockComplianceChecks.find(c => c.id === item.id);
        const req = txRequirements.find(r => r.id === item.id);
        setSelectedCheck(check || (req ? {
          id: req.id,
          name: req.requirement_name,
          category: req.compliance_category as any,
          regulation: req.standard_reference || 'N/A',
          description: req.description || '',
          status: req.compliance_status === 'compliant' ? 'pass' : req.compliance_status === 'pending' ? 'watch' : 'fail',
          lastChecked: req.last_review_date || new Date().toISOString(),
          nextCheck: req.next_review_date || new Date().toISOString(),
          threshold: { value: 100, unit: '%', operator: '>=' },
          currentValue: req.compliance_status === 'compliant' ? 100 : 0,
          compliance: req.compliance_status === 'compliant' ? 100 : 0,
          priority: req.risk_level.toLowerCase() as any,
          actions: []
        } : null));
      }}
      workPaneContent={workPaneContent}
      searchPlaceholder="Search compliance checks..."
      listFilterContent={filterView}

      actions={
        <div className="flex flex-col gap-2">
          <Button size="sm" className="w-full gap-2">
            <RefreshCw className="w-4 h-4" />
            Run Checks
          </Button>
          <Button variant="outline" size="sm" className="w-full gap-2">
            <Download className="w-4 h-4" />
            Export Pack
          </Button>
          <Button variant="outline" size="sm" className="w-full gap-2">
            <Settings className="w-4 h-4" />
            Configure
          </Button>
        </div>
      }
    />
  );
}

interface ComplianceCheckListItemProps {
  check: ComplianceCheck;
  isSelected: boolean;
  onClick: () => void;
}

function ComplianceCheckListItem({ check, isSelected, onClick }: ComplianceCheckListItemProps) {
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "power_quality": return <Zap className="w-4 h-4" />;
      case "emissions": return <Leaf className="w-4 h-4" />;
      case "reporting": return <FileText className="w-4 h-4" />;
      case "safety": return <Shield className="w-4 h-4" />;
      case "environmental": return <BarChart3 className="w-4 h-4" />;
      default: return <CheckCircle className="w-4 h-4" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pass": return <CheckCircle className="w-3 h-3 text-success" />;
      case "watch": return <AlertTriangle className="w-3 h-3 text-warning" />;
      case "fail": return <XCircle className="w-3 h-3 text-destructive" />;
      default: return <AlertCircle className="w-3 h-3 text-muted-foreground" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical": return "text-destructive";
      case "high": return "text-warning";
      case "medium": return "text-primary";
      case "low": return "text-muted-foreground";
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
        {getCategoryIcon(check.category)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className={cn("text-sm font-medium", isSelected ? "text-primary" : "text-foreground")}>
            {check.name}
          </span>
          <StatusBadge status={check.status} size="sm" />
        </div>
        <p className="text-xs text-muted-foreground mb-2">{check.regulation}</p>
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            {getStatusIcon(check.status)}
            <span className="text-muted-foreground">{check.compliance.toFixed(1)}%</span>
          </div>
          <span className={getPriorityColor(check.priority)}>
            {check.priority} priority
          </span>
        </div>
      </div>
    </button>
  );
}

interface ComplianceCheckDetailsProps {
  check: ComplianceCheck;
  exceptions: ComplianceException[];
}

function ComplianceCheckDetails({ check, exceptions }: ComplianceCheckDetailsProps) {
  const getStatusVariant = (status: string) => {
    switch (status) {
      case "pass": return "success";
      case "watch": return "warning";
      case "fail": return "destructive";
      default: return "default";
    }
  };

  const getPriorityVariant = (priority: string) => {
    switch (priority) {
      case "critical": return "destructive";
      case "high": return "warning";
      case "medium": return "primary";
      case "low": return "default";
      default: return "default";
    }
  };

  const activeExceptions = exceptions.filter(e => e.status === "active");

  return (
    <div className="space-y-6">
      {/* Check KPIs */}
      <div className="grid grid-cols-4 gap-4">
        <KPICard
          title="Compliance Status"
          value={check.status.charAt(0).toUpperCase() + check.status.slice(1)}
          subtitle="Current status"
          icon={check.status === "pass" ? CheckCircle : check.status === "watch" ? AlertTriangle : XCircle}
          variant={getStatusVariant(check.status) as any}
        />
        <KPICard
          title="Compliance Rate"
          value={`${check.compliance.toFixed(1)}%`}
          subtitle="Overall compliance"
          icon={Gauge}
          variant={check.compliance >= 95 ? "success" : check.compliance >= 85 ? "warning" : "destructive"}
        />
        <KPICard
          title="Current Value"
          value={`${check.currentValue} ${check.threshold.unit}`}
          subtitle="Latest measurement"
          icon={BarChart3}
          variant="primary"
        />
        <KPICard
          title="Priority Level"
          value={check.priority.charAt(0).toUpperCase() + check.priority.slice(1)}
          subtitle="Risk priority"
          icon={AlertTriangle}
          variant={getPriorityVariant(check.priority) as any}
        />
      </div>

      {/* Check Information */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Compliance Check Details</h3>
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-3">
            <InfoRow label="Check ID" value={check.id} />
            <InfoRow label="Category" value={check.category.replace("_", " ").toUpperCase()} />
            <InfoRow label="Regulation" value={check.regulation} />
            <InfoRow label="Priority" value={check.priority} />
          </div>
          <div className="space-y-3">
            <InfoRow label="Last Checked" value={new Date(check.lastChecked).toLocaleString()} />
            <InfoRow label="Next Check" value={new Date(check.nextCheck).toLocaleString()} />
            <InfoRow label="Threshold" value={`${check.threshold.operator} ${check.threshold.value} ${check.threshold.unit}`} />
            <InfoRow label="Current Value" value={`${check.currentValue} ${check.threshold.unit}`} />
          </div>
        </div>
        <div className="mt-4">
          <p className="text-sm text-muted-foreground">{check.description}</p>
        </div>
      </div>

      {/* Compliance Status */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Compliance Assessment</h3>
        <div className="space-y-4">
          <div className={cn(
            "p-4 rounded-lg border",
            check.status === "pass" ? "bg-success/10 border-success/30" :
              check.status === "watch" ? "bg-warning/10 border-warning/30" :
                "bg-destructive/10 border-destructive/30"
          )}>
            <div className="flex items-center gap-2 mb-2">
              {check.status === "pass" ? (
                <CheckCircle className="w-5 h-5 text-success" />
              ) : check.status === "watch" ? (
                <AlertTriangle className="w-5 h-5 text-warning" />
              ) : (
                <XCircle className="w-5 h-5 text-destructive" />
              )}
              <span className="text-sm font-medium">
                {check.status === "pass" ? "Compliant" :
                  check.status === "watch" ? "Requires Monitoring" :
                    "Non-Compliant"}
              </span>
            </div>
            <div className="text-xs text-muted-foreground">
              <p>Current: {check.currentValue} {check.threshold.unit}</p>
              <p>Threshold: {check.threshold.operator} {check.threshold.value} {check.threshold.unit}</p>
              <p>Compliance Rate: {check.compliance.toFixed(1)}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Required Actions */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Required Actions</h3>
        <div className="space-y-3">
          {check.actions.map((action, index) => (
            <div key={index} className="flex items-start gap-3 p-3 bg-secondary/30 rounded-lg">
              <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold text-xs">
                {index + 1}
              </div>
              <span className="text-sm">{action}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Active Exceptions */}
      {activeExceptions.length > 0 && (
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Active Exceptions</h3>
          <div className="space-y-3">
            {activeExceptions.map((exception) => (
              <div key={exception.id} className="p-4 bg-warning/10 border border-warning/30 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">{exception.reason}</span>
                  <Badge variant="outline" className="text-warning border-warning">
                    Active
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mb-2">{exception.rationale}</p>
                <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
                  <div>
                    <p><strong>Approved by:</strong> {exception.approvedBy}</p>
                    <p><strong>Approved:</strong> {new Date(exception.approvedAt).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p><strong>Expires:</strong> {new Date(exception.expiresAt).toLocaleDateString()}</p>
                    <p><strong>Days remaining:</strong> {Math.ceil((new Date(exception.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Check History */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Recent Check History</h3>
        <div className="space-y-3">
          {Array.from({ length: 5 }, (_, i) => {
            const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
            const value = check.currentValue * (0.9 + Math.random() * 0.2);
            const status = value <= check.threshold.value ? "pass" : value <= check.threshold.value * 1.1 ? "watch" : "fail";

            return (
              <div key={i} className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                <div className="flex items-center gap-3">
                  {status === "pass" ? (
                    <CheckCircle className="w-4 h-4 text-success" />
                  ) : status === "watch" ? (
                    <AlertTriangle className="w-4 h-4 text-warning" />
                  ) : (
                    <XCircle className="w-4 h-4 text-destructive" />
                  )}
                  <span className="text-sm">{date.toLocaleDateString()}</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{value.toFixed(1)} {check.threshold.unit}</p>
                  <p className="text-xs text-muted-foreground capitalize">{status}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

interface ComplianceOverviewProps {
  checks: ComplianceCheck[];
  txRequirements: TxComplianceRequirement[];
  txEvidence: TxComplianceEvidence[];
  txSummary: TxComplianceSummary | null;
  exceptions: ComplianceException[];
  packs: CompliancePack[];
  metrics: any;
  sector: string | null;
  subsector: string | null;
  isTransmission: boolean;
  loading: boolean;
  error: string | null;
}

function ComplianceOverview({
  checks,
  txRequirements,
  txEvidence,
  txSummary,
  exceptions,
  packs,
  metrics,
  sector,
  subsector,
  isTransmission,
  loading,
  error
}: ComplianceOverviewProps) {
  // Group checks by category (for upstream)
  const checksByCategory = useMemo(() => {
    return checks.reduce((acc, check) => {
      if (!acc[check.category]) {
        acc[check.category] = [];
      }
      acc[check.category].push(check);
      return acc;
    }, {} as Record<string, ComplianceCheck[]>);
  }, [checks]);

  // Group transmission requirements by category
  const txRequirementsByCategory = useMemo(() => {
    return txRequirements.reduce((acc, req) => {
      if (!acc[req.compliance_category]) {
        acc[req.compliance_category] = [];
      }
      acc[req.compliance_category].push(req);
      return acc;
    }, {} as Record<string, TxComplianceRequirement[]>);
  }, [txRequirements]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-primary" />
          <p className="text-sm text-muted-foreground">Loading compliance data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="w-8 h-8 mx-auto mb-2 text-destructive" />
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview KPIs */}
      <div className="grid grid-cols-4 gap-4">
        <KPICard
          title="Overall Compliance"
          value={`${metrics.overallCompliance.toFixed(1)}%`}
          subtitle="Across all checks"
          icon={Shield}
          variant={metrics.overallCompliance >= 95 ? "success" : metrics.overallCompliance >= 85 ? "warning" : "destructive"}
        />
        <KPICard
          title="Passing Checks"
          value={`${metrics.passCount}/${metrics.totalChecks}`}
          subtitle="Compliant regulations"
          icon={CheckCircle}
          variant="success"
        />
        <KPICard
          title="Critical Issues"
          value={metrics.criticalCount.toString()}
          subtitle="Require immediate attention"
          icon={AlertTriangle}
          variant="destructive"
        />
        <KPICard
          title="Active Exceptions"
          value={metrics.activeExceptions.toString()}
          subtitle="Approved deviations"
          icon={FileText}
          variant="warning"
        />
      </div>

      {/* Compliance Status Table */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Compliance Status Summary</h3>
          {isTransmission && (
            <Badge variant="outline" className="gap-2">
              <Zap className="w-3 h-3" />
              Transmission Grid
            </Badge>
          )}
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-4 gap-4 text-xs font-medium text-muted-foreground border-b pb-2">
            <span>Requirement</span>
            <span>Status</span>
            <span>Compliance</span>
            <span>Next Review</span>
          </div>

          {isTransmission ? (
            // Transmission requirements
            txRequirements.length > 0 ? (
              txRequirements.map((req) => (
                <div key={req.id} className="grid grid-cols-4 gap-4 items-center p-3 bg-secondary/30 rounded-lg">
                  <div>
                    <p className="text-sm font-medium">{req.requirement_name}</p>
                    <p className="text-xs text-muted-foreground">{req.standard_reference || 'N/A'}</p>
                    {req.applies_to_scope !== 'org' && (
                      <div className="flex items-center gap-1 mt-1">
                        {req.applies_to_scope === 'substation' && <Building2 className="w-3 h-3 text-muted-foreground" />}
                        {req.applies_to_scope === 'feeder' && <Cable className="w-3 h-3 text-muted-foreground" />}
                        <span className="text-xs text-muted-foreground capitalize">{req.applies_to_scope}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {req.compliance_status === 'compliant' ? (
                      <CheckCircle className="w-4 h-4 text-success" />
                    ) : req.compliance_status === 'pending' ? (
                      <AlertTriangle className="w-4 h-4 text-warning" />
                    ) : (
                      <XCircle className="w-4 h-4 text-destructive" />
                    )}
                    <StatusBadge
                      status={req.compliance_status === 'compliant' ? 'pass' :
                        req.compliance_status === 'pending' ? 'watch' : 'fail'}
                      size="sm"
                    />
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      {req.compliance_status === 'compliant' ? '100%' :
                        req.compliance_status === 'pending' ? '50%' : '0%'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Risk: {req.risk_level}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm">
                      {req.next_review_date ? new Date(req.next_review_date).toLocaleDateString() : 'N/A'}
                    </p>
                    {req.next_review_date && (
                      <p className="text-xs text-muted-foreground">
                        {Math.ceil((new Date(req.next_review_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days
                      </p>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Info className="w-8 h-8 mx-auto mb-2" />
                <p className="text-sm">No transmission compliance requirements found</p>
              </div>
            )
          ) : (
            // Upstream checks
            checks.map((check) => (
              <div key={check.id} className="grid grid-cols-4 gap-4 items-center p-3 bg-secondary/30 rounded-lg">
                <div>
                  <p className="text-sm font-medium">{check.name}</p>
                  <p className="text-xs text-muted-foreground">{check.regulation}</p>
                </div>
                <div className="flex items-center gap-2">
                  {check.status === "pass" ? (
                    <CheckCircle className="w-4 h-4 text-success" />
                  ) : check.status === "watch" ? (
                    <AlertTriangle className="w-4 h-4 text-warning" />
                  ) : (
                    <XCircle className="w-4 h-4 text-destructive" />
                  )}
                  <StatusBadge status={check.status} size="sm" />
                </div>
                <div>
                  <p className="text-sm font-medium">{check.compliance.toFixed(1)}%</p>
                  <p className="text-xs text-muted-foreground">
                    {check.currentValue} {check.threshold.unit}
                  </p>
                </div>
                <div>
                  <p className="text-sm">{new Date(check.nextCheck).toLocaleDateString()}</p>
                  <p className="text-xs text-muted-foreground">
                    {Math.ceil((new Date(check.nextCheck).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Compliance by Category */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Compliance by Category</h3>
        <div className="grid grid-cols-2 gap-6">
          {isTransmission ? (
            // Transmission categories
            txSummary && txSummary.by_category.length > 0 ? (
              txSummary.by_category.map((cat) => (
                <div key={cat.category} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium capitalize">{cat.category.replace(/_/g, ' ')}</h4>
                    <Badge variant={cat.compliance_percentage >= 95 ? "default" : cat.compliance_percentage >= 85 ? "secondary" : "destructive"}>
                      {cat.compliance_percentage.toFixed(1)}%
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Total Requirements</span>
                      <span className="font-medium">{cat.total}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Compliant</span>
                      <span className="font-medium text-success">{cat.compliant}</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div
                        className={cn(
                          "h-2 rounded-full transition-all",
                          cat.compliance_percentage >= 95 ? "bg-success" :
                            cat.compliance_percentage >= 85 ? "bg-warning" :
                              "bg-destructive"
                        )}
                        style={{ width: `${cat.compliance_percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-2 text-center py-8 text-muted-foreground">
                <Info className="w-8 h-8 mx-auto mb-2" />
                <p className="text-sm">No category data available</p>
              </div>
            )
          ) : (
            // Upstream categories
            Object.entries(checksByCategory).map(([category, categoryChecks]) => {
              const categoryCompliance = categoryChecks.reduce((sum, check) => sum + check.compliance, 0) / categoryChecks.length;
              const passCount = categoryChecks.filter(c => c.status === "pass").length;

              return (
                <div key={category} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium capitalize">{category.replace("_", " ")}</h4>
                    <Badge variant={categoryCompliance >= 95 ? "default" : categoryCompliance >= 85 ? "secondary" : "destructive"}>
                      {categoryCompliance.toFixed(1)}%
                    </Badge>
                  </div>
                  {categoryChecks.map((check) => (
                    <div key={check.id} className="flex items-center justify-between p-2 bg-secondary/30 rounded">
                      <div className="flex items-center gap-2">
                        {check.status === "pass" ? (
                          <CheckCircle className="w-3 h-3 text-success" />
                        ) : check.status === "watch" ? (
                          <AlertTriangle className="w-3 h-3 text-warning" />
                        ) : (
                          <XCircle className="w-3 h-3 text-destructive" />
                        )}
                        <span className="text-xs">{check.name}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{check.compliance.toFixed(1)}%</span>
                    </div>
                  ))}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Active Exceptions */}
      {exceptions.filter(e => e.status === "active").length > 0 && (
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Active Exceptions</h3>
          <div className="space-y-3">
            {exceptions.filter(e => e.status === "active").map((exception) => (
              <div key={exception.id} className="p-4 bg-warning/10 border border-warning/30 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">{exception.checkName}</span>
                  <Badge variant="outline" className="text-warning border-warning">
                    Expires {new Date(exception.expiresAt).toLocaleDateString()}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mb-2">{exception.rationale}</p>
                <div className="text-xs text-muted-foreground">
                  <p><strong>Approved by:</strong> {exception.approvedBy}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Transmission Evidence Summary */}
      {isTransmission && txEvidence.length > 0 && (
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Compliance Evidence</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-4 gap-4">
              <KPICard
                title="Total Evidence"
                value={txEvidence.length.toString()}
                subtitle="Documents & records"
                icon={FileText}
                variant="primary"
              />
              <KPICard
                title="Active Evidence"
                value={txEvidence.filter(e => e.status === 'active').length.toString()}
                subtitle="Currently valid"
                icon={CheckCircle}
                variant="success"
              />
              <KPICard
                title="Verified"
                value={txEvidence.filter(e => e.verified).length.toString()}
                subtitle="Verified documents"
                icon={Shield}
                variant="default"
              />
              <KPICard
                title="Expired"
                value={txEvidence.filter(e => e.status === 'expired').length.toString()}
                subtitle="Needs renewal"
                icon={AlertTriangle}
                variant="warning"
              />
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-medium">Recent Evidence</h4>
              {txEvidence.slice(0, 5).map((evidence) => (
                <div key={evidence.id} className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{evidence.evidence_name}</p>
                    <p className="text-xs text-muted-foreground">{evidence.evidence_type}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {evidence.verified && (
                      <Badge variant="outline" className="text-success border-success">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Verified
                      </Badge>
                    )}
                    <Badge variant={evidence.status === 'active' ? 'default' : 'secondary'}>
                      {evidence.status}
                    </Badge>
                    {evidence.linked_substation_id && (
                      <Building2 className="w-4 h-4 text-muted-foreground" />
                    )}
                    {evidence.linked_feeder_id && (
                      <Cable className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Compliance Packs */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Export Compliance Packs</h3>
        <div className="grid grid-cols-1 gap-4">
          {packs.map((pack) => (
            <div key={pack.id} className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg">
              <div>
                <p className="text-sm font-medium">{pack.name}</p>
                <p className="text-xs text-muted-foreground mb-1">{pack.description}</p>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>{pack.checks.length} checks</span>
                  <span>{pack.format.toUpperCase()}</span>
                  {pack.fileSize && <span>{pack.fileSize}</span>}
                  {pack.lastGenerated && (
                    <span>Last: {new Date(pack.lastGenerated).toLocaleDateString()}</span>
                  )}
                </div>
              </div>
              <Button size="sm" variant="outline" className="gap-2">
                <Download className="w-4 h-4" />
                Export
              </Button>
            </div>
          ))}
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