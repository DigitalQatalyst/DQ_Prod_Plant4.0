import { ListPane } from "@/components/layout/ListPane";
import { WorkPane } from "@/components/layout/WorkPane";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { LucideIcon, Sparkles, Shield, Zap, Settings2, Target, Activity, Settings, Building, Users, Plug, AlertTriangle, Lock, ClipboardList, Gauge, BarChart3, TrendingUp, Factory, FileText, Wrench, Bell, Cpu, Network, CheckCircle, HeartPulse, Brain, Database, FileBarChart } from "lucide-react";
import { SectorBadge } from "@/components/shared/SectorBadge";
import { useApp } from "@/context/AppContext";

interface ShellItem {
  id: string;
  name: string;
  description: string;
  status?: string;
}

interface ShellPageProps {
  title: string;
  subtitle: string;
  listTitle: string;
  icon: LucideIcon;
  items: ShellItem[];
  description: string;
}

function ShellPage({ title, subtitle, listTitle, icon: Icon, items, description }: ShellPageProps) {
  const { sector, subsector } = useApp();
  const [selectedItem, setSelectedItem] = useState<ShellItem | null>(null);

  const tabs = [
    {
      id: "overview",
      label: "Overview",
      content: (
        <div className="space-y-6">
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Icon className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">{selectedItem?.name || title}</h3>
                <p className="text-sm text-muted-foreground mt-1">{selectedItem?.description || description}</p>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Sparkles className="w-12 h-12 text-muted-foreground/50 mb-4" />
            <p className="text-sm text-muted-foreground">Full functionality coming in Stage 03</p>
          </div>
        </div>
      ),
    },
    { id: "details", label: "Details", content: <ComingSoon /> },
    { id: "settings", label: "Settings", content: <ComingSoon /> },
  ];

  return (
    <div className="flex w-full h-full overflow-hidden">
      <ListPane title={listTitle} subtitle={subtitle} count={items.length} searchPlaceholder="Search...">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => setSelectedItem(item)}
            className={cn(
              "w-full flex items-start gap-3 p-3 rounded-lg text-left transition-all duration-200",
              selectedItem?.id === item.id
                ? "bg-primary/10 border border-primary/30"
                : "hover:bg-secondary/50 border border-transparent"
            )}
          >
            <div
              className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                selectedItem?.id === item.id ? "bg-primary/20" : "bg-secondary"
              )}
            >
              <Icon className={cn("w-5 h-5", selectedItem?.id === item.id ? "text-primary" : "text-muted-foreground")} />
            </div>
            <div className="flex-1 min-w-0">
              <span className={cn("text-sm font-medium", selectedItem?.id === item.id ? "text-primary" : "text-foreground")}>
                {item.name}
              </span>
              <p className="text-xs text-muted-foreground truncate mt-0.5">{item.description}</p>
              {item.status && (
                <span className="inline-block mt-2 text-[10px] px-2 py-0.5 rounded-full bg-success/20 text-success">
                  {item.status}
                </span>
              )}
            </div>
          </button>
        ))}
      </ListPane>
      <WorkPane
        title={selectedItem?.name || title}
        subtitle={
          <div className="flex items-center gap-3">
            <span>{selectedItem?.description || description}</span>
            {sector && subsector && (
              <SectorBadge sector={sector} subsector={subsector} size="sm" />
            )}
          </div>
        }
        tabs={tabs}
      />
    </div>
  );
}

function ComingSoon() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <Sparkles className="w-12 h-12 text-muted-foreground/50 mb-4" />
      <p className="text-sm text-muted-foreground">Coming in Stage 03</p>
    </div>
  );
}

// Security Page
export function SecurityPolicies() {
  const items = [
    { id: "s1", name: "Network Segmentation", description: "Industrial network isolation policy", status: "Active" },
    { id: "s2", name: "Access Control", description: "Role-based access management", status: "Active" },
    { id: "s3", name: "Encryption Standards", description: "Data encryption requirements", status: "Active" },
    { id: "s4", name: "Audit Logging", description: "Security event logging policy", status: "Review" },
    { id: "s5", name: "Incident Response", description: "Security incident procedures", status: "Active" },
  ];
  return <ShellPage title="Security Policies" subtitle="Cybersecurity" listTitle="Policies" icon={Lock} items={items} description="Manage security policies and compliance" />;
}

export function SecurityCompliance() {
  const items = [
    { id: "c1", name: "IEC 62443", description: "Industrial automation security", status: "Compliant" },
    { id: "c2", name: "NIST CSF", description: "Cybersecurity framework", status: "In Progress" },
    { id: "c3", name: "ISO 27001", description: "Information security management", status: "Audit Due" },
  ];
  return <ShellPage title="Compliance Monitor" subtitle="Security" listTitle="Standards" icon={ClipboardList} items={items} description="Track compliance with security standards" />;
}

export function SecurityIncidents() {
  const items = [
    { id: "i1", name: "Unauthorized Access Attempt", description: "Gateway login failures detected", status: "Investigating" },
    { id: "i2", name: "Configuration Change", description: "PLC settings modified", status: "Resolved" },
    { id: "i3", name: "Network Anomaly", description: "Unusual traffic pattern", status: "Monitoring" },
  ];
  return <ShellPage title="Incident Log" subtitle="Security" listTitle="Incidents" icon={AlertTriangle} items={items} description="Security incident tracking and response" />;
}

// Energy Pages
export function EnergyMeters() {
  const items = [
    { id: "m1", name: "Main Meter - Plant A", description: "Primary consumption meter", status: "Online" },
    { id: "m2", name: "Sub-Meter - Line 1", description: "Production line meter", status: "Online" },
    { id: "m3", name: "Sub-Meter - HVAC", description: "Climate control meter", status: "Online" },
    { id: "m4", name: "Solar Generation", description: "PV system meter", status: "Online" },
  ];
  return <ShellPage title="Meters & Sites" subtitle="Energy Management" listTitle="Meters" icon={Gauge} items={items} description="Monitor energy meters and consumption" />;
}

export function EnergyOverview() {
  const items = [
    { id: "e1", name: "Daily Consumption", description: "24-hour energy usage", status: "Normal" },
    { id: "e2", name: "Peak Demand", description: "Maximum load tracking", status: "Warning" },
    { id: "e3", name: "Power Factor", description: "System efficiency metric", status: "Good" },
  ];
  return <ShellPage title="Energy Overview" subtitle="Energy Management" listTitle="Metrics" icon={BarChart3} items={items} description="Energy consumption analytics and insights" />;
}

export function EnergyConsumption() {
  const items = [
    { id: "c1", name: "Production Line A", description: "1,234 kWh today", status: "Normal" },
    { id: "c2", name: "Production Line B", description: "987 kWh today", status: "Efficient" },
    { id: "c3", name: "Utilities", description: "456 kWh today", status: "Normal" },
  ];
  return <ShellPage title="Consumption Analysis" subtitle="Energy Management" listTitle="Areas" icon={TrendingUp} items={items} description="Detailed energy consumption breakdown" />;
}

// Automate Pages
export function AutomateWorkflows() {
  const items = [
    { id: "w1", name: "Startup Sequence", description: "Production line initialization", status: "Active" },
    { id: "w2", name: "Shift Handover", description: "Automated reporting workflow", status: "Active" },
    { id: "w3", name: "Quality Check", description: "Automated quality triggers", status: "Active" },
  ];
  return <ShellPage title="Automation Workflows" subtitle="Process Automation" listTitle="Workflows" icon={Settings2} items={items} description="Configure automation workflows and triggers" />;
}

export function AutomateRecipes() {
  const items = [
    { id: "r1", name: "Product A - Standard", description: "Standard production recipe", status: "Active" },
    { id: "r2", name: "Product B - Premium", description: "Premium variant recipe", status: "Active" },
    { id: "r3", name: "Maintenance Mode", description: "System maintenance recipe", status: "Standby" },
  ];
  return <ShellPage title="Process Recipes" subtitle="Process Automation" listTitle="Recipes" icon={FileText} items={items} description="Manage process recipes and parameters" />;
}

// Optimise Pages
export function OptimiseKPIs() {
  const items = [
    { id: "k1", name: "OEE", description: "Overall Equipment Effectiveness", status: "85.2%" },
    { id: "k2", name: "MTBF", description: "Mean Time Between Failures", status: "720h" },
    { id: "k3", name: "Quality Rate", description: "First-pass yield", status: "99.1%" },
  ];
  return <ShellPage title="KPI Dashboard" subtitle="Operational Excellence" listTitle="KPIs" icon={Target} items={items} description="Track and optimize key performance indicators" />;
}

export function OptimiseBenchmarks() {
  const items = [
    { id: "b1", name: "Industry Average", description: "Sector benchmark comparison", status: "Above" },
    { id: "b2", name: "Best-in-Class", description: "Top performer targets", status: "Tracking" },
    { id: "b3", name: "Historical Trend", description: "Year-over-year comparison", status: "Improving" },
  ];
  return <ShellPage title="Benchmarks" subtitle="Operational Excellence" listTitle="Benchmarks" icon={TrendingUp} items={items} description="Compare performance against benchmarks" />;
}

// Monitor Pages - Asset Health & Diagnostics
export function SettingsOrganization() {
  const items = [
    { id: "o1", name: "Organization Profile", description: "Company information and branding" },
    { id: "o2", name: "Sites & Locations", description: "Manage physical locations" },
    { id: "o3", name: "Departments", description: "Organizational structure" },
  ];
  return <ShellPage title="Organization Profile" subtitle="Settings" listTitle="Settings" icon={Building} items={items} description="Manage organization settings" />;
}

export function SettingsUsers() {
  const items = [
    { id: "u1", name: "John Doe", description: "Asset Manager • Admin" },
    { id: "u2", name: "Jane Smith", description: "Operations Lead • Editor" },
    { id: "u3", name: "Mike Johnson", description: "Technician • Viewer" },
  ];
  return <ShellPage title="Users & Teams" subtitle="Settings" listTitle="Users" icon={Users} items={items} description="Manage users, teams, and permissions" />;
}

export function SettingsIntegrations() {
  const items = [
    { id: "i1", name: "OPC-UA Server", description: "Industrial protocol connector", status: "Connected" },
    { id: "i2", name: "ERP System", description: "SAP S/4HANA integration", status: "Connected" },
    { id: "i3", name: "CMMS", description: "Maintenance system sync", status: "Pending" },
  ];
  return <ShellPage title="Integrations" subtitle="Settings" listTitle="Connectors" icon={Plug} items={items} description="Manage external system integrations" />;
}

export function SettingsUser() {
  const items = [
    { id: "p1", name: "Profile", description: "Personal information and preferences" },
    { id: "p2", name: "Notifications", description: "Alert and notification settings" },
    { id: "p3", name: "Security", description: "Password and 2FA settings" },
    { id: "p4", name: "Appearance", description: "Theme and display preferences" },
  ];
  return <ShellPage title="User Settings" subtitle="Personal" listTitle="Settings" icon={Settings} items={items} description="Manage your personal settings" />;
}

// Overview Page
export function OverviewDashboard() {
  const items = [
    { id: "d1", name: "Asset Summary", description: "Total assets and status overview", status: "Healthy" },
    { id: "d2", name: "Active Alerts", description: "Current system alerts", status: "3 Active" },
    { id: "d3", name: "Energy Today", description: "Daily consumption summary", status: "Normal" },
  ];
  return <ShellPage title="Main Dashboard" subtitle="Overview" listTitle="Widgets" icon={BarChart3} items={items} description="Platform overview and key metrics" />;
}

export function OverviewAlerts() {
  const items = [
    { id: "a1", name: "Critical Alerts", description: "Requires immediate attention", status: "1" },
    { id: "a2", name: "Warnings", description: "Monitor closely", status: "5" },
    { id: "a3", name: "Information", description: "System notifications", status: "12" },
  ];
  return <ShellPage title="Alerts Summary" subtitle="Overview" listTitle="Categories" icon={AlertTriangle} items={items} description="All system alerts and notifications" />;
}

// Energy EMS - Monitoring & Metering
export const EMSSubMetering = () => <ShellPage title="Sub-metering by Asset / Process / Line" subtitle="Energy Monitoring & Metering" listTitle="Sub-meters" icon={Gauge} items={[]} description="Track energy usage by individual assets, processes, and production lines" />;
export const EMSPowerQuality = () => <ShellPage title="Power Quality Monitoring" subtitle="Energy Monitoring & Metering" listTitle="Quality Metrics" icon={Zap} items={[]} description="Monitor power quality parameters and detect anomalies" />;
export const EMSBaselineTrends = () => <ShellPage title="Baseline & Trend Tracking" subtitle="Energy Monitoring & Metering" listTitle="Trends" icon={TrendingUp} items={[]} description="Track energy baselines and identify consumption trends" />;
export const EMSMultiFluid = () => <ShellPage title="Multi-fluid Monitoring" subtitle="Energy Monitoring & Metering" listTitle="Fluids" icon={Gauge} items={[]} description="Monitor multiple utility fluids including water, gas, and compressed air" />;

// Energy EMS - Analytics & Optimisation
export const EMSEfficiencyKPIs = () => <ShellPage title="Energy Efficiency KPIs" subtitle="Energy Analytics & Optimisation" listTitle="KPIs" icon={Target} items={[]} description="Track key performance indicators for energy efficiency" />;
export const EMSPeakDemand = () => <ShellPage title="Peak Demand Management" subtitle="Energy Analytics & Optimisation" listTitle="Demand Events" icon={TrendingUp} items={[]} description="Manage and reduce peak demand charges" />;
export const EMSWasteDetection = () => <ShellPage title="Energy Waste Detection" subtitle="Energy Analytics & Optimisation" listTitle="Waste Events" icon={AlertTriangle} items={[]} description="Identify and eliminate energy waste across operations" />;
export const EMSAIRecommendations = () => <ShellPage title="AI-driven Optimisation Recommendations" subtitle="Energy Analytics & Optimisation" listTitle="Recommendations" icon={Sparkles} items={[]} description="Receive AI-powered recommendations for energy optimization" />;

// Energy EMS - Sustainability & Emissions
export const EMSIntensityMetrics = () => <ShellPage title="Energy Intensity Metrics" subtitle="Sustainability & Emissions Tracking" listTitle="Metrics" icon={BarChart3} items={[]} description="Monitor energy intensity per unit of production" />;
export const EMSRenewableContribution = () => <ShellPage title="Renewable Energy Contribution" subtitle="Sustainability & Emissions Tracking" listTitle="Sources" icon={Zap} items={[]} description="Track renewable energy generation and contribution" />;
export const EMSESGSDGReporting = () => <ShellPage title="ESG/SDG-aligned Reporting" subtitle="Sustainability & Emissions Tracking" listTitle="Reports" icon={FileText} items={[]} description="Generate ESG and SDG-aligned sustainability reports" />;
export const EMSComplianceOutputs = () => <ShellPage title="Environmental Compliance Outputs" subtitle="Sustainability & Emissions Tracking" listTitle="Compliance" icon={Shield} items={[]} description="Generate environmental compliance reports and documentation" />;

// Energy EMS - Control & Integration
export const EMSLoadBalancing = () => <ShellPage title="Load Balancing Advisory" subtitle="Energy Control Advisory & Integration" listTitle="Advisories" icon={Settings2} items={[]} description="Receive load balancing recommendations for optimal energy distribution" />;
export const EMSDemandResponse = () => <ShellPage title="Demand-response Signals" subtitle="Energy Control Advisory & Integration" listTitle="Signals" icon={Activity} items={[]} description="Manage demand response events and signals" />;
export const EMSAssetModes = () => <ShellPage title="Asset Energy Mode Recommendations" subtitle="Energy Control Advisory & Integration" listTitle="Modes" icon={Settings} items={[]} description="Optimize asset operating modes for energy efficiency" />;
export const EMSIntegration = () => <ShellPage title="Integration with Generators / UPS / Renewables" subtitle="Energy Control Advisory & Integration" listTitle="Systems" icon={Plug} items={[]} description="Integrate with generators, UPS systems, and renewable energy sources" />;
export const EMSEfficiencyCurves = () => <ShellPage title="Efficiency Curve Analysis" subtitle="Energy Control Advisory & Integration" listTitle="Curves" icon={TrendingUp} items={[]} description="Analyze asset efficiency curves and optimize operating points" />;

// Energy EMS - Dashboards & Reporting
export const EMSCustomDashboards = () => <ShellPage title="Custom Energy Dashboards" subtitle="Energy Dashboards & Reporting" listTitle="Dashboards" icon={BarChart3} items={[]} description="Create and customize energy dashboards for your needs" />;
export const EMSPeriodComparison = () => <ShellPage title="Period-over-period Comparison" subtitle="Energy Dashboards & Reporting" listTitle="Comparisons" icon={BarChart3} items={[]} description="Compare energy performance across different time periods" />;
export const EMSAnomalyCharts = () => <ShellPage title="Anomaly & Outlier Charts" subtitle="Energy Dashboards & Reporting" listTitle="Anomalies" icon={AlertTriangle} items={[]} description="Visualize energy anomalies and outliers" />;
export const EMSAuditReports = () => <ShellPage title="Exportable Audit & Compliance Reports" subtitle="Energy Dashboards & Reporting" listTitle="Reports" icon={FileText} items={[]} description="Generate and export audit and compliance reports" />;


// Asset Management - Upstream O&G Asset Shell Pages
export function PropertySetsPage() {
  const items = [
    { id: "ps1", name: "Wellhead Properties", description: "Standard wellhead property definitions", status: "Active" },
    { id: "ps2", name: "Pump Properties", description: "ESP and transfer pump properties", status: "Active" },
    { id: "ps3", name: "Compressor Properties", description: "Gas compressor property sets", status: "Active" },
  ];

  return <ShellPage title="Property Sets" subtitle="Asset Catalog" listTitle="Property Sets" icon={Database} items={items} description="Manage asset property definitions" />;
}

export function LifecycleConfigPage() {
  const items = [
    { id: "lc1", name: "Asset Lifecycle States", description: "Define asset lifecycle stages", status: "Configured" },
    { id: "lc2", name: "Transition Rules", description: "Lifecycle transition conditions", status: "Active" },
    { id: "lc3", name: "State Notifications", description: "Lifecycle change notifications", status: "Enabled" },
  ];

  return <ShellPage title="Lifecycle Configuration" subtitle="Asset Catalog" listTitle="Lifecycle" icon={Activity} items={items} description="Configure asset lifecycle management" />;
}

export function ConnectionEndpointsPage() {
  const items = [
    { id: "ce1", name: "OPC-UA Server", description: "Primary OPC-UA connection", status: "Connected" },
    { id: "ce2", name: "Modbus Gateway", description: "Modbus TCP gateway", status: "Connected" },
    { id: "ce3", name: "MQTT Broker", description: "IoT device broker", status: "Disconnected" },
  ];

  return <ShellPage title="Connection Endpoints" subtitle="Connectivity" listTitle="Endpoints" icon={Plug} items={items} description="Manage data connection endpoints" />;
}

export function StreamConfigPage() {
  const items = [
    { id: "sc1", name: "Production Data Stream", description: "Real-time production metrics", status: "Active" },
    { id: "sc2", name: "Alarm Stream", description: "System alarms and events", status: "Active" },
    { id: "sc3", name: "Energy Stream", description: "Energy consumption data", status: "Active" },
  ];

  return <ShellPage title="Stream Configuration" subtitle="Connectivity" listTitle="Streams" icon={Activity} items={items} description="Configure data streams" />;
}

export function ConnectionHealthPage() {
  const items = [
    { id: "ch1", name: "Primary Gateway", description: "Main data gateway health", status: "Healthy" },
    { id: "ch2", name: "Backup Gateway", description: "Redundant gateway status", status: "Standby" },
    { id: "ch3", name: "Field Devices", description: "Connected device health", status: "95% Online" },
  ];

  return <ShellPage title="Connection Health" subtitle="Connectivity" listTitle="Health" icon={HeartPulse} items={items} description="Monitor connection health" />;
}

export function SandboxStreamsPage() {
  const items = [
    { id: "ss1", name: "Test Stream 1", description: "Development data stream", status: "Testing" },
    { id: "ss2", name: "Simulation Stream", description: "Simulated asset data", status: "Running" },
    { id: "ss3", name: "Validation Stream", description: "Data validation testing", status: "Paused" },
  ];

  return <ShellPage title="Sandbox Streams" subtitle="Connectivity" listTitle="Sandbox" icon={Settings} items={items} description="Test data streams" />;
}

export function AssetDetailPage() {
  const items = [
    { id: "ad1", name: "Asset Information", description: "Detailed asset properties", status: "Complete" },
    { id: "ad2", name: "Maintenance History", description: "Historical maintenance records", status: "Updated" },
    { id: "ad3", name: "Performance Metrics", description: "Asset performance data", status: "Live" },
  ];

  return <ShellPage title="Asset Detail" subtitle="Assets" listTitle="Details" icon={FileText} items={items} description="View asset details" />;
}

export function GeoLocationPage() {
  const items = [
    { id: "gl1", name: "Site Mapping", description: "Geographic site locations", status: "Mapped" },
    { id: "gl2", name: "Asset Positioning", description: "Asset GPS coordinates", status: "85% Complete" },
    { id: "gl3", name: "Boundary Definitions", description: "Site boundary markers", status: "Defined" },
  ];

  return <ShellPage title="Geo Location" subtitle="Shell" listTitle="Items" icon={Settings} items={items} description="Geo Location management" />;
}

export function LinearAssetsPage() {
  const items = [
    { id: "la1", name: "Pipeline Network", description: "Pipeline asset mapping", status: "Mapped" },
    { id: "la2", name: "Cable Runs", description: "Electrical cable routing", status: "Documented" },
    { id: "la3", name: "Road Network", description: "Site road infrastructure", status: "Complete" },
  ];

  return <ShellPage title="Linear Assets" subtitle="Shell" listTitle="Items" icon={Settings} items={items} description="Linear Assets management" />;
}

export function NetworkTopologyPage() {
  const items = [
    { id: "nt1", name: "Network Diagram", description: "System network topology", status: "Current" },
    { id: "nt2", name: "Device Hierarchy", description: "Asset hierarchy structure", status: "Organized" },
    { id: "nt3", name: "Connection Map", description: "Device interconnections", status: "Mapped" },
  ];

  return <ShellPage title="Network Topology" subtitle="Shell" listTitle="Items" icon={Settings} items={items} description="Network Topology management" />;
}

export function MobileAssetsPage() {
  const items = [
    { id: "ma1", name: "Service Vehicles", description: "Mobile service equipment", status: "Tracked" },
    { id: "ma2", name: "Portable Equipment", description: "Moveable asset tracking", status: "Monitored" },
    { id: "ma3", name: "Personnel Tracking", description: "Staff location monitoring", status: "Active" },
  ];

  return <ShellPage title="Mobile Assets" subtitle="Shell" listTitle="Items" icon={Settings} items={items} description="Mobile Assets management" />;
}
// Asset Health & Diagnostics
export function HealthScoring() {
  const items = [
    { id: "hs1", name: "Overall Health Index", description: "Composite asset health score", status: "87%" },
    { id: "hs2", name: "Criticality Weighting", description: "Asset criticality factors", status: "Configured" },
    { id: "hs3", name: "Health Trends", description: "Historical health progression", status: "Trending Down" },
  ];

  return <ShellPage title="Health Scoring" subtitle="Shell" listTitle="Items" icon={Settings} items={items} description="Health Scoring management" />;
}

export function AnomalyDetection() {
  const items = [
    { id: "ad1", name: "Statistical Anomalies", description: "Statistical deviation detection", status: "2 Active" },
    { id: "ad2", name: "ML Anomalies", description: "Machine learning anomaly detection", status: "1 Active" },
    { id: "ad3", name: "Pattern Anomalies", description: "Behavioral pattern deviations", status: "Normal" },
  ];

  return <ShellPage title="Anomaly Detection" subtitle="Shell" listTitle="Items" icon={Settings} items={items} description="Anomaly Detection management" />;
}

export function DegradationTrends() {
  const items = [
    { id: "dt1", name: "Performance Degradation", description: "Asset performance decline", status: "Monitored" },
    { id: "dt2", name: "Efficiency Trends", description: "Efficiency degradation tracking", status: "Stable" },
    { id: "dt3", name: "Wear Indicators", description: "Component wear progression", status: "Increasing" },
  ];

  return <ShellPage title="Degradation Trends" subtitle="Shell" listTitle="Items" icon={Settings} items={items} description="Degradation Trends management" />;
}


// Asset Performance & Utilisation


export function UptimeTracking() {
  const items = [
    { id: "ut1", name: "Overall Uptime", description: "System-wide uptime metrics", status: "94.2%" },
    { id: "ut2", name: "Asset Availability", description: "Individual asset availability", status: "Monitored" },
    { id: "ut3", name: "Downtime Analysis", description: "Downtime root cause analysis", status: "Analyzed" },
  ];

  return <ShellPage title="Uptime Tracking" subtitle="Shell" listTitle="Items" icon={Settings} items={items} description="Uptime Tracking management" />;
}

export function UtilisationMonitoring() {
  const items = [
    { id: "um1", name: "Capacity Utilization", description: "Asset capacity utilization rates", status: "78%" },
    { id: "um2", name: "Load Monitoring", description: "Real-time load monitoring", status: "Active" },
    { id: "um3", name: "Efficiency Tracking", description: "Operational efficiency metrics", status: "Tracked" },
  ];

  return <ShellPage title="Utilisation Monitoring" subtitle="Shell" listTitle="Items" icon={Settings} items={items} description="Utilisation Monitoring management" />;
}

export function DeviationDetection() {
  const items = [
    { id: "dd1", name: "Performance Deviations", description: "Performance baseline deviations", status: "2 Detected" },
    { id: "dd2", name: "Operating Deviations", description: "Operating parameter deviations", status: "1 Active" },
    { id: "dd3", name: "Efficiency Deviations", description: "Efficiency baseline deviations", status: "Normal" },
  ];

  return <ShellPage title="Deviation Detection" subtitle="Shell" listTitle="Items" icon={Settings} items={items} description="Deviation Detection management" />;
}

export function PerformanceBenchmarking() {
  const items = [
    { id: "pb1", name: "Industry Benchmarks", description: "Industry performance comparisons", status: "Above Average" },
    { id: "pb2", name: "Historical Benchmarks", description: "Historical performance comparison", status: "Improving" },
    { id: "pb3", name: "Peer Benchmarks", description: "Peer facility comparisons", status: "Competitive" },
  ];

  return <ShellPage title="Performance Benchmarking" subtitle="Shell" listTitle="Items" icon={Settings} items={items} description="Performance Benchmarking management" />;
}

export function ARMKPIs() {
  const items = [
    { id: "arm1", name: "Availability KPIs", description: "Asset availability metrics", status: "94.2%" },
    { id: "arm2", name: "Reliability KPIs", description: "Asset reliability metrics", status: "96.8%" },
    { id: "arm3", name: "Maintainability KPIs", description: "Asset maintainability metrics", status: "Good" },
  ];

  return <ShellPage title="A/R/M KPIs" subtitle="Shell" listTitle="Items" icon={Settings} items={items} description="A/R/M KPIs management" />;
}

// Asset Inventory & Criticality
export function AssetRegistry() {
  const items = [
    { id: "ar1", name: "Asset Catalog", description: "Complete asset inventory", status: "1,247 Assets" },
    { id: "ar2", name: "Asset Hierarchy", description: "Hierarchical asset organization", status: "Structured" },
    { id: "ar3", name: "Asset Relationships", description: "Asset interdependencies", status: "Mapped" },
  ];

  return <ShellPage title="Asset Registry" subtitle="Shell" listTitle="Items" icon={Settings} items={items} description="Asset Registry management" />;
}

export function CriticalityScoring() {
  const items = [
    { id: "cs1", name: "Business Impact", description: "Business impact assessment", status: "Scored" },
    { id: "cs2", name: "Safety Impact", description: "Safety criticality scoring", status: "Assessed" },
    { id: "cs3", name: "Environmental Impact", description: "Environmental impact scoring", status: "Evaluated" },
  ];

  return <ShellPage title="Criticality Scoring" subtitle="Shell" listTitle="Items" icon={Settings} items={items} description="Criticality Scoring management" />;
}

export function FailureModeMapping() {
  const items = [
    { id: "fmm1", name: "FMEA Analysis", description: "Failure Mode & Effects Analysis", status: "Complete" },
    { id: "fmm2", name: "FMECA Analysis", description: "FMEA with Criticality Analysis", status: "In Progress" },
    { id: "fmm3", name: "Failure Patterns", description: "Historical failure pattern analysis", status: "Analyzed" },
  ];

  return <ShellPage title="Failure Mode Mapping" subtitle="Shell" listTitle="Items" icon={Settings} items={items} description="Failure Mode Mapping management" />;
}

export function LifecycleTracking() {
  const items = [
    { id: "lt1", name: "Asset Age Tracking", description: "Asset age and lifecycle stage", status: "Tracked" },
    { id: "lt2", name: "Replacement Planning", description: "Asset replacement scheduling", status: "Planned" },
    { id: "lt3", name: "Lifecycle Costs", description: "Total cost of ownership tracking", status: "Calculated" },
  ];

  return <ShellPage title="Lifecycle Tracking" subtitle="Shell" listTitle="Items" icon={Settings} items={items} description="Lifecycle Tracking management" />;
}

export function SparePartLinkage() {
  const items = [
    { id: "spl1", name: "Spare Parts Catalog", description: "Spare parts inventory", status: "Cataloged" },
    { id: "spl2", name: "Asset-Part Mapping", description: "Asset to spare part relationships", status: "Mapped" },
    { id: "spl3", name: "Inventory Levels", description: "Spare part stock levels", status: "Monitored" },
  ];

  return <ShellPage title="Spare Part Linkage" subtitle="Shell" listTitle="Items" icon={Settings} items={items} description="Spare Part Linkage management" />;
}

// Alerts, Reports & Visualisation
export function RealtimeAlerts() {
  const items = [
    { id: "rta1", name: "Critical Alerts", description: "High priority real-time alerts", status: "2 Active" },
    { id: "rta2", name: "Warning Alerts", description: "Medium priority warnings", status: "5 Active" },
    { id: "rta3", name: "Info Alerts", description: "Informational notifications", status: "12 Active" },
  ];

  return <ShellPage title="Realtime Alerts" subtitle="Shell" listTitle="Items" icon={Settings} items={items} description="Realtime Alerts management" />;
}

export function AlertHistory() {
  const items = [
    { id: "ah1", name: "Alert Timeline", description: "Historical alert timeline", status: "Available" },
    { id: "ah2", name: "Alert Trends", description: "Alert frequency and trends", status: "Analyzed" },
    { id: "ah3", name: "Resolution History", description: "Alert resolution tracking", status: "Tracked" },
  ];

  return <ShellPage title="Alert History" subtitle="Shell" listTitle="Items" icon={Settings} items={items} description="Alert History management" />;
}

export function CustomDashboards() {
  const items = [
    { id: "cd1", name: "Executive Dashboard", description: "High-level KPI dashboard", status: "Active" },
    { id: "cd2", name: "Operations Dashboard", description: "Operational metrics dashboard", status: "Active" },
    { id: "cd3", name: "Maintenance Dashboard", description: "Maintenance-focused dashboard", status: "Active" },
  ];

  return <ShellPage title="Custom Dashboards" subtitle="Shell" listTitle="Items" icon={Settings} items={items} description="Custom Dashboards management" />;
}

export function ReliabilityReports() {
  const items = [
    { id: "rr1", name: "Monthly Reliability", description: "Monthly reliability reports", status: "Generated" },
    { id: "rr2", name: "Annual Summary", description: "Annual reliability summary", status: "Scheduled" },
    { id: "rr3", name: "Trend Analysis", description: "Reliability trend analysis", status: "Available" },
  ];

  return <ShellPage title="Reliability Reports" subtitle="Shell" listTitle="Items" icon={Settings} items={items} description="Reliability Reports management" />;
}

export function DataExport() {
  const items = [
    { id: "de1", name: "CSV Export", description: "Data export to CSV format", status: "Available" },
    { id: "de2", name: "PDF Reports", description: "PDF report generation", status: "Available" },
    { id: "de3", name: "API Access", description: "REST API data access", status: "Configured" },
  ];

  return <ShellPage title="Data Export" subtitle="Shell" listTitle="Items" icon={Settings} items={items} description="Data Export management" />;
}

// =============================================================================
// Monitor Pages
export function MonitorPerformance() {
  const items = [
    { id: "mp1", name: "Overall Equipment Effectiveness", description: "OEE: 85.2% • Target: 90%", status: "Below Target" },
    { id: "mp2", name: "Production Rate", description: "Current: 1,180 units/hr • Target: 1,200", status: "Below Target" },
    { id: "mp3", name: "Quality Rate", description: "First pass yield: 97.2% • Target: 98.5%", status: "Below Target" },
  ];

  return <ShellPage title="Monitor Performance" subtitle="Performance Monitoring" listTitle="Performance Metrics" icon={Activity} items={items} description="Monitor asset and production performance" />;
  return <ShellPage title="Performance Monitoring" subtitle="Asset Health & Diagnostics" listTitle="Metrics" icon={Activity} items={items} description="Monitor asset performance and utilization" />;
}

export function MonitorMaintenance() {
  const items = [
    { id: "mm1", name: "Scheduled Maintenance", description: "Next: Motor M-12 bearing replacement in 5 days", status: "Scheduled" },
    { id: "mm2", name: "Preventive Maintenance", description: "Completed: 12 tasks this month", status: "On Track" },
    { id: "mm3", name: "Corrective Maintenance", description: "Open work orders: 3 • Average resolution: 4.2 hours", status: "Active" },
  ];

  return <ShellPage title="Monitor Maintenance" subtitle="Maintenance Management" listTitle="Maintenance Tasks" icon={Wrench} items={items} description="Monitor maintenance activities and schedules" />;
  return <ShellPage title="Maintenance Management" subtitle="Asset Health & Diagnostics" listTitle="Tasks" icon={Wrench} items={items} description="Manage maintenance tasks and work orders" />;
}

export function MonitorAlerts() {
  const items = [
    { id: "ma1", name: "Critical Alerts", description: "Active: 2 • Requires immediate attention", status: "Critical" },
    { id: "ma2", name: "Warning Alerts", description: "Active: 8 • Monitor closely", status: "Warning" },
    { id: "ma3", name: "Information Alerts", description: "Active: 15 • For awareness", status: "Info" },
  ];

  return <ShellPage title="Monitor Alerts" subtitle="Alert Management" listTitle="Active Alerts" icon={AlertTriangle} items={items} description="Monitor system alerts and notifications" />;
  return <ShellPage title="Alert Management" subtitle="Asset Health & Diagnostics" listTitle="Alerts" icon={AlertTriangle} items={items} description="Manage system alerts and notifications" />;
}

// Security Components that are imported from ShellPage
export function SecurityOverviewDashboard() {
  const items = [
    { id: "s1", name: "Security Posture", description: "Overall security status", status: "Good" },
    { id: "s2", name: "Active Threats", description: "Current security threats", status: "2 Active" },
    { id: "s3", name: "Compliance Status", description: "Regulatory compliance", status: "Compliant" },
  ];
  return <ShellPage title="Security Overview" subtitle="Security Dashboard" listTitle="Metrics" icon={Shield} items={items} description="Security overview and key metrics" />;
}

export function UserRoleDirectory() {
  const items = [
    { id: "u1", name: "Admin Users", description: "System administrators", status: "5 Users" },
    { id: "u2", name: "Operators", description: "System operators", status: "12 Users" },
    { id: "u3", name: "Viewers", description: "Read-only users", status: "8 Users" },
  ];
  return <ShellPage title="User & Role Directory" subtitle="Identity & Access Management" listTitle="Roles" icon={Users} items={items} description="Manage users and role assignments" />;
}

export function OtAssetInventory() {
  const items = [
    { id: "a1", name: "PLCs", description: "Programmable Logic Controllers", status: "24 Assets" },
    { id: "a2", name: "HMIs", description: "Human Machine Interfaces", status: "8 Assets" },
    { id: "a3", name: "Sensors", description: "Industrial sensors", status: "156 Assets" },
  ];
  return <ShellPage title="OT Asset Inventory" subtitle="OT/IoT Security" listTitle="Assets" icon={Cpu} items={items} description="Operational technology asset inventory" />;
}

export function SecurityStandardsScope() {
  const items = [
    { id: "s1", name: "IEC 62443", description: "Industrial automation security", status: "Active" },
    { id: "s2", name: "NIST CSF", description: "Cybersecurity framework", status: "Active" },
    { id: "s3", name: "ISO 27001", description: "Information security management", status: "Active" },
  ];
  return <ShellPage title="Security Standards Scope" subtitle="Governance, Risk & Compliance" listTitle="Standards" icon={ClipboardList} items={items} description="Security standards and compliance scope" />;
}

export function SecurityAlertInbox() {
  const items = [
    { id: "a1", name: "Critical Alerts", description: "High priority security alerts", status: "3 Active" },
    { id: "a2", name: "Warning Alerts", description: "Medium priority warnings", status: "7 Active" },
    { id: "a3", name: "Info Alerts", description: "Informational notifications", status: "15 Active" },
  ];
  return <ShellPage title="Security Alert Inbox" subtitle="Incident Response & Forensics" listTitle="Alerts" icon={AlertTriangle} items={items} description="Security alert management and response" />;
}

export function SecurityAuditLog() {
  const items = [
    { id: "l1", name: "Access Logs", description: "User access audit trail", status: "Active" },
    { id: "l2", name: "Configuration Changes", description: "System configuration audit", status: "Active" },
    { id: "l3", name: "Security Events", description: "Security event logging", status: "Active" },
  ];
  return <ShellPage title="Security Audit Log" subtitle="Audit & Logging" listTitle="Logs" icon={FileText} items={items} description="Security audit logging and compliance" />;
}

export function PlatformDataProtection() {
  const items = [
    { id: "d1", name: "Data Encryption", description: "Data encryption at rest and in transit", status: "Active" },
    { id: "d2", name: "Access Controls", description: "Data access control policies", status: "Active" },
    { id: "d3", name: "Backup & Recovery", description: "Data backup and recovery", status: "Active" },
  ];
  return <ShellPage title="Platform Data Protection" subtitle="Data Protection & Privacy" listTitle="Controls" icon={Lock} items={items} description="Platform data protection and privacy controls" />;
}