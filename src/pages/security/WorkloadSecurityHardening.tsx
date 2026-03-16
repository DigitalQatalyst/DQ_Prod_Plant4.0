import { useState, useMemo, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { ListPane } from "@/components/layout/ListPane";
import { ListPaneItem } from "@/components/layout/ListPaneItem";
import { WorkPane } from "@/components/layout/WorkPane";
import {
  Shield,
  Server,
  AlertTriangle,
  CheckCircle2,
  Activity,
  Lock,
  HardDrive,
  Network,
  FileText,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";
import {
  getWorkloadSecurityList,
  getWorkloadSecuritySummary,
  isWorkloadSecurityQueriesAvailable
} from "@/lib/workloadSecurityQueries";
import type { WorkloadSecurity } from "@/types/security";
import { LoadingState } from "@/components/shared/LoadingState";
import { EmptyState } from "@/components/shared/EmptyState";
import { IdentityOverview } from "@/components/security/IdentityOverview";
import { FeatureOverviewCharts } from "@/components/security/FeatureOverviewCharts";
import type { KeyArea, RecentActivity } from "@/components/security/FeatureOverviewCharts";
import {
  OverviewTab,
  BaselineTab,
  HardeningTab,
  VulnerabilitiesTab,
  ComplianceTab,
} from "./WorkloadSecurityHardening.tabs";

export function WorkloadSecurityHardening() {
  const { currentTenant } = useApp();
  const [workloads, setWorkloads] = useState<WorkloadSecurity[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedWorkload, setSelectedWorkload] = useState<WorkloadSecurity | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [environmentFilter, setEnvironmentFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("compliance");

  // Check if Supabase is available
  const isSupabaseAvailable = isWorkloadSecurityQueriesAvailable();

  // Load data from Supabase
  useEffect(() => {
    if (!isSupabaseAvailable) {
      setError("Supabase not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.");
      setLoading(false);
      return;
    }

    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [workloadsData, summaryData] = await Promise.all([
          getWorkloadSecurityList(currentTenant.id),
          getWorkloadSecuritySummary(currentTenant.id)
        ]);

        setWorkloads(workloadsData);
        setSummary(summaryData);

        // Removed auto-selection to show overview by default
        /*
        if (workloadsData.length > 0 && !selectedWorkload) {
          setSelectedWorkload(workloadsData[0]);
        }
        */
      } catch (err) {
        console.error("Error loading workload security:", err);
        setError(err instanceof Error ? err.message : "Failed to load workload security information");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [currentTenant.id, isSupabaseAvailable]);

  // Filter and sort workloads
  const filteredAndSortedWorkloads = useMemo(() => {
    let result = workloads.filter((workload) => {
      const matchesSearch = workload.workloadName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        workload.workloadType.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesEnvironment = environmentFilter === "all" || workload.deploymentEnvironment === environmentFilter;
      const matchesStatus = statusFilter === "all" || workload.healthStatus === statusFilter;
      return matchesSearch && matchesEnvironment && matchesStatus;
    });

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'compliance':
          return b.baselineComplianceScore - a.baselineComplianceScore;
        case 'vulnerabilities':
          return b.criticalVulnerabilities - a.criticalVulnerabilities;
        case 'name':
          return a.workloadName.localeCompare(b.workloadName);
        case 'type':
          return a.workloadType.localeCompare(b.workloadType);
        default:
          return 0;
      }
    });

    return result;
  }, [workloads, searchTerm, environmentFilter, statusFilter, sortBy]);

  const workloadTypeIcons = {
    application: Server,
    database: HardDrive,
    web_server: Network,
    api_service: Activity,
    scada_interface: Shield,
    data_processor: FileText,
  };

  // Get transmission-specific context
  const isTransmissionTenant = currentTenant.sector === 'transmission';

  // Handle loading state
  if (loading) {
    return (
      <>
        <ListPane
          title={isTransmissionTenant ? "Workload Security Hardening" : "Workload Security"}
          subtitle={isTransmissionTenant ? `${currentTenant.name} - Transmission Operations` : currentTenant.name}
          showFilters={false}
        >
          <LoadingState loadingText="Scanning workload configurations..." />
        </ListPane>
        <WorkPane title="Workload Security" subtitle="Loading..." tabs={[]} />
      </>
    );
  }

  // Handle error state
  if (error) {
    return (
      <>
        <ListPane
          title={isTransmissionTenant ? "Workload Security Hardening" : "Workload Security"}
          subtitle={isTransmissionTenant ? `${currentTenant.name} - Transmission Operations` : currentTenant.name}
          showFilters={false}
        >
          <EmptyState
            icon={AlertTriangle}
            title="Error Loading Data"
            description={error}
          />
        </ListPane>
        <WorkPane title="Workload Security" subtitle="Error" tabs={[]} />
      </>
    );
  }

  // Handle empty data case
  if (!workloads || workloads.length === 0) {
    return (
      <>
        <ListPane
          title={isTransmissionTenant ? "Workload Security Hardening" : "Workload Security"}
          subtitle={isTransmissionTenant ? `${currentTenant.name} - Transmission Operations` : currentTenant.name}
          showFilters={false}
        >
          <EmptyState
            icon={Shield}
            title="No Workloads Configured"
            description={isTransmissionTenant
              ? "No transmission workloads configured for security hardening"
              : "No workloads configured for security hardening"
            }
          />
        </ListPane>
        <WorkPane
          title={selectedWorkload ? selectedWorkload.workloadName : "Workload Security Overview"}
          subtitle={selectedWorkload ? `${selectedWorkload.workloadType.replace('_', ' ')} · ${selectedWorkload.deploymentEnvironment}` : "Advanced runtime protection, OS hardening, and baseline compliance for transmission infrastructure workloads"}
          tabs={selectedWorkload ? [
            {
              id: "overview",
              label: "Overview",
              content: <OverviewTab workload={selectedWorkload} />,
            },
            {
              id: "baseline",
              label: "Security Baseline",
              content: <BaselineTab workload={selectedWorkload} />,
            },
            {
              id: "hardening",
              label: "Hardening",
              content: <HardeningTab workload={selectedWorkload} />,
            },
            {
              id: "vulnerabilities",
              label: "Vulnerabilities",
              content: <VulnerabilitiesTab workload={selectedWorkload} />,
            },
            {
              id: "compliance",
              label: "Compliance",
              content: <ComplianceTab workload={selectedWorkload} />,
            },
          ] : [
            {
              id: "overview",
              label: "Overview",
              content: <WorkloadOverview workloads={workloads} summary={summary} onWorkloadSelect={setSelectedWorkload} />,
            }
          ]}
        />
      </>
    );
  }

  return (
    <>
      <ListPane
        title={isTransmissionTenant ? "Workload Security Hardening" : "Workload Security"}
        context="DEWA – Transmission"
        count={filteredAndSortedWorkloads.length}
        searchPlaceholder="Search"
        onSearch={setSearchTerm}
        filters={[
          {
            key: "environment",
            label: "Environment",
            options: [
              { label: "All Environments", value: "all" },
              { label: "Production", value: "production" },
              { label: "Staging", value: "staging" },
              { label: "Development", value: "development" },
              { label: "Test", value: "test" },
            ],
            value: environmentFilter,
            onChange: setEnvironmentFilter,
          },
          {
            key: "status",
            label: "Status",
            options: [
              { label: "All Status", value: "all" },
              { label: "Healthy", value: "healthy" },
              { label: "Degraded", value: "degraded" },
              { label: "Critical", value: "critical" },
              { label: "Offline", value: "offline" },
            ],
            value: statusFilter,
            onChange: setStatusFilter,
          },
        ]}
        sortOptions={[
          { label: 'Compliance', value: 'compliance' },
          { label: 'Vulnerabilities', value: 'vulnerabilities' },
          { label: 'Name', value: 'name' },
          { label: 'Type', value: 'type' },
        ]}
        sortValue={sortBy}
        onSortChange={setSortBy}
      >
        {/* Workload List */}
        <div className="space-y-1">
          {filteredAndSortedWorkloads.map((workload) => (
            <ListPaneItem
              key={workload.id}
              title={workload.workloadName}
              description={`${workload.workloadType.replace('_', ' ')} • ${workload.deploymentEnvironment}`}
              status={workload.healthStatus === "healthy" ? 'online' : (workload.healthStatus === "critical" ? 'offline' : 'maintenance')}
              category={workload.workloadType}
              value={`${workload.baselineComplianceScore}%`}
              isSelected={selectedWorkload?.id === workload.id}
              onClick={() => setSelectedWorkload(workload)}
            />
          ))}
        </div>
      </ListPane>

      {selectedWorkload ? (
        <WorkPane
          title={selectedWorkload.workloadName}
          subtitle={`${selectedWorkload.workloadType.replace('_', ' ')} · ${selectedWorkload.deploymentEnvironment}`}
          tabs={[
            {
              id: "overview",
              label: "Overview",
              content: <OverviewTab workload={selectedWorkload} />,
            },
            {
              id: "baseline",
              label: "Security Baseline",
              content: <BaselineTab workload={selectedWorkload} />,
            },
            {
              id: "hardening",
              label: "Hardening",
              content: <HardeningTab workload={selectedWorkload} />,
            },
            {
              id: "vulnerabilities",
              label: "Vulnerabilities",
              content: <VulnerabilitiesTab workload={selectedWorkload} />,
            },
            {
              id: "compliance",
              label: "Compliance",
              content: <ComplianceTab workload={selectedWorkload} />,
            },
          ]}
        />
      ) : (
        <WorkPane
          title="Workload Security Overview"
          subtitle="Summary of workload security health and hardening status"
          tabs={[
            {
              id: "overview",
              label: "Overview",
              content: <WorkloadOverview workloads={workloads} summary={summary} onWorkloadSelect={setSelectedWorkload} />,
            }
          ]}
        />
      )}
    </>
  );
}

function WorkloadOverview({
  workloads,
  summary,
  onWorkloadSelect
}: {
  workloads: any[];
  summary: any;
  onWorkloadSelect: (workload: any) => void;
}) {
  return (
    <IdentityOverview
      title="Workload Security Posture"
      description="Overview of workload security status, compliance scores, and vulnerability assessment across transmission infrastructure."
      showTitleCard={false}
      metrics={[
        {
          title: "Total Workloads",
          value: summary?.totalWorkloads || workloads.length,
          icon: Server,
          variant: "primary"
        },
        {
          title: "Avg Compliance",
          value: summary?.averageComplianceScore ? `${summary.averageComplianceScore}%` : "0%",
          icon: Shield,
          variant: summary?.averageComplianceScore >= 90 ? "success" : summary?.averageComplianceScore >= 70 ? "warning" : "destructive"
        },
        {
          title: "Healthy Workloads",
          value: summary?.healthyWorkloads || 0,
          icon: CheckCircle2,
          variant: "success"
        },
        {
          title: "Critical Issues",
          value: summary?.criticalWorkloads || 0,
          icon: AlertTriangle,
          variant: (summary?.criticalWorkloads || 0) > 0 ? "destructive" : "default"
        }
      ]}
    >
      <FeatureOverviewCharts
        pieChartTitle="Health Status Distribution"
        pieChartData={[
          { name: 'Healthy', value: workloads.filter(w => w.healthStatus === 'healthy').length, color: 'hsl(var(--success))' },
          { name: 'Degraded', value: workloads.filter(w => w.healthStatus === 'degraded').length, color: 'hsl(var(--warning))' },
          { name: 'Critical', value: workloads.filter(w => w.healthStatus === 'critical').length, color: 'hsl(var(--destructive))' },
        ].filter(d => d.value > 0)}
        barChartTitle="Top Workloads by Compliance"
        barChartData={workloads
          .sort((a, b) => b.baselineComplianceScore - a.baselineComplianceScore)
          .slice(0, 5)
          .map(w => ({ name: w.workloadName, value: w.baselineComplianceScore }))}
        keyAreasTitle="Hardening Focus Areas"
        keyAreas={[
          {
            icon: Lock,
            title: "OS Hardening",
            description: "CIS benchmark alignment and removal of unnecessary services and protocols."
          },
          {
            icon: Shield,
            title: "Vulnerability Shielding",
            description: "Virtual patching and exploit mitigation for known system vulnerabilities."
          },
          {
            icon: Activity,
            title: "Runtime Protection",
            description: "Continuous monitoring of process behavior and memory integrity."
          },
          {
            icon: FileText,
            title: "Configuration Baselining",
            description: "Immutable state enforcement and drift detection for critical configurations."
          },
        ]}
        recentActivityTitle="Recent Hardening Events"
        recentActivity={workloads
          .slice(0, 3)
          .map(workload => ({
            id: workload.id,
            title: workload.workloadName,
            subtitle: `Last scan: ${new Date(workload.updatedAt).toLocaleDateString()}`,
            status: workload.healthStatus === 'healthy' ? 'success' : workload.healthStatus === 'critical' ? 'error' : 'warning',
            value: `${workload.baselineComplianceScore}%`
          }))}
        onActivityClick={(id) => onWorkloadSelect(workloads.find(w => w.id === id) || null)}
      />
    </IdentityOverview>
  );
}
