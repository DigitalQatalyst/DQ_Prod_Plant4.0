import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppProvider } from "@/context/AppContext";
import { AppShell } from "@/components/layout/AppShell";
import { ThemeProvider } from "@/components/theme-provider";
import SectorSwitchNotificationProvider from "@/components/shared/SectorSwitchNotification";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { EmptyStates } from "@/components/shared/EmptyState";
import { NavigationErrorHandler } from "@/lib/errorHandling";
import { DataProviderProvider } from "@/context/DataProviderContext";
import { TenantProvider } from "@/context/TenantContext";

// Asset Pages
import { AssetPortfolioPage } from "@/pages/assets/portfolio/AssetPortfolioPage";
import { PortfolioExplorerPage } from "@/pages/assets/portfolio/PortfolioExplorerPage";
import { SavedViewsPage } from "@/pages/assets/portfolio/SavedViewsPage";
import { BulkDiscoveryPage } from "@/pages/assets/discovery/BulkDiscoveryPage";
import { DiscoveryAgentsPage } from "@/pages/assets/discovery/DiscoveryAgentsPage";
import { ManualAssetCapturePage } from "@/pages/assets/discovery/ManualAssetCapturePage";
import { AssetImportPage } from "@/pages/assets/discovery/AssetImportPage";
import { DiscoveryReviewPage } from "@/pages/assets/discovery/DiscoveryReviewPage";
import { AssetCatalogPage } from "@/pages/assets/catalog/AssetCatalogPage";
import { SectorProfilesPage } from "@/pages/assets/catalog/SectorProfilesPage";
import { CrossTenantPortfolioPage } from "@/pages/assets/portfolio/CrossTenantPortfolioPage";

// Assets Dashboard & Alerts
import { AssetsDashboard } from "@/pages/assets/AssetsDashboard";
import { AssetsAlerts } from "@/pages/assets/AssetsAlerts";

// Asset Location Pages
import { GeoLocationPage } from "@/pages/assets/location/GeoLocationPage";
import { LinearAssetsPage } from "@/pages/assets/location/LinearAssetsPage";
import { NetworkTopologyPage } from "@/pages/assets/location/NetworkTopologyPage";
import { MobileAssetsPage } from "@/pages/assets/location/MobileAssetsPage";

// Asset Catalog Pages
import { PropertySetsPage } from "@/pages/assets/catalog/PropertySetsPage";
import { LifecycleConfigPage } from "@/pages/assets/catalog/LifecycleConfigPage";

// Asset Detail Page
import { AssetDetailPage } from "@/pages/assets/detail/AssetDetailPage";
import { TransmissionAssetDetailPage } from "@/pages/assets/detail/TransmissionAssetDetailPage";
import { Asset360Redirect } from "@/pages/assets/detail/Asset360Redirect";
import { Asset360Page } from "@/pages/assets/detail/Asset360Page";


// Asset Connectivity Pages
import ConnectionEndpointsPage from "@/pages/assets/connectivity/ConnectionEndpointsPage";
import StreamConfigPage from "@/pages/assets/connectivity/StreamConfigPage";
import ConnectionHealthPage from "@/pages/assets/connectivity/ConnectionHealthPage";
import SandboxStreamsPage from "@/pages/assets/connectivity/SandboxStreamsPage";
import TagMappingPage from "@/pages/assets/connectivity/TagMappingPage";

// Energy Pages - All EMS implementations
import { EnergyMonitoringRealTime } from "@/pages/energy/EnergyMonitoringRealTime";
import { EnergyMonitoringPowerQuality } from "@/pages/energy/EnergyMonitoringPowerQuality";
import { EnergyMonitoringMultiFluid } from "@/pages/energy/EnergyMonitoringMultiFluid";
import { TransmissionTopology } from "@/pages/energy/config/TransmissionTopology";
import { EnergyAnalyticsEfficiencyKPIs } from "@/pages/energy/EnergyAnalyticsEfficiencyKPIs";
import { EnergyMonitoringSubMetering } from "@/pages/energy/EnergyMonitoringSubMetering";
import { EnergyMonitoringBaselineTrends } from "@/pages/energy/EnergyMonitoringBaselineTrends";
import { EnergyAnalyticsAIOptimisation } from "@/pages/energy/EnergyAnalyticsAIOptimisation";

import { EnergyAnalyticsLoadProfiling } from "@/pages/energy/EnergyAnalyticsLoadProfiling";
import { EnergyAnalyticsPeakDemand } from "@/pages/energy/EnergyAnalyticsPeakDemand";
import { EnergyAnalyticsWasteDetection } from "@/pages/energy/EnergyAnalyticsWasteDetection";
import { EnergySustainabilityCarbonCalculation } from "@/pages/energy/EnergySustainabilityCarbonCalculation";

import { EnergySustainabilityEnergyIntensity } from "@/pages/energy/EnergySustainabilityEnergyIntensity";
import { EnergySustainabilityRenewables } from "@/pages/energy/EnergySustainabilityRenewables";
import { EnergySustainabilityESGReporting } from "@/pages/energy/EnergySustainabilityESGReporting";
import { EnergySustainabilityCompliance } from "@/pages/energy/EnergySustainabilityCompliance";
import EnergyControlLoadBalancing from "@/pages/energy/EnergyControlLoadBalancing";
import EnergyControlDemandResponse from "@/pages/energy/EnergyControlDemandResponse";
import EnergyControlAssetModes from "@/pages/energy/EnergyControlAssetModes";
import EnergyControlIntegration from "@/pages/energy/EnergyControlIntegration";
import EnergyControlEfficiencyCurves from "@/pages/energy/EnergyControlEfficiencyCurves";
import { EnergyDashboardsCustom } from "@/pages/energy/EnergyDashboardsCustom";
import { EnergyDashboardsPeriodComparison } from "@/pages/energy/EnergyDashboardsPeriodComparison";
import { EnergyDashboardsCostAnalysis } from "@/pages/energy/EnergyDashboardsCostAnalysis";
import { EnergyDashboardsAnomalies } from "@/pages/energy/EnergyDashboardsAnomalies";
import { EnergyDashboardsAuditReports } from "@/pages/energy/EnergyDashboardsAuditReports";

// Optimise Pages
import { Performance } from "@/pages/optimise/Performance";
import { LeanExecution } from "@/pages/optimise/LeanExecution";
import { ContinuousImprovement } from "@/pages/optimise/ContinuousImprovement";
import { Optimisation } from "@/pages/optimise/Optimisation";

// Automate (PA) Pages - Integrate & Model
import { TagMappingPage as AutomateTagMappingPage } from "@/pages/automate/TagMappingPage";
import { ControlModelsPage } from "@/pages/automate/ControlModelsPage";
import { ActionBindingsPage } from "@/pages/automate/ActionBindingsPage";

// Automate (PA) Pages - Monitor & Detect
import { TriggersPage } from "@/pages/automate/TriggersPage";
import { AlarmRulesPage } from "@/pages/automate/AlarmRulesPage";

// APM Transmission Pages - Inventory & Criticality
import {
  AssetRegistryPage,
  AssetDetailPage as APMAssetDetailPage,
  AssetEditPage,
  CriticalityScoringPage,
  FMEALibraryPage,
  LifecycleTrackingPage,
  SparePartsPage,
} from "@/pages/apm/transmission/inventory";

import { EventPatternsPage } from "@/pages/automate/EventPatternsPage";

// Automate (PA) Pages - Automate & Control
import { WorkflowsPage } from "@/pages/automate/WorkflowsPage";
import { SequencesPage } from "@/pages/automate/SequencesPage";
import { ControlRulesPage } from "@/pages/automate/ControlRulesPage";

// Automate (PA) Pages - Govern & Assure
import { VersionsPage } from "@/pages/automate/VersionsPage";
import { ApprovalsPage } from "@/pages/automate/ApprovalsPage";
import { SimulationPage } from "@/pages/automate/SimulationPage";
import { AuditLogsPage } from "@/pages/automate/AuditLogsPage";

// Dashboard Demo
import { WidgetGridDemo } from "@/components/dashboard/WidgetGridDemo";

// Alert Demos
import { IncidentCardDemo } from "@/components/alerts/IncidentCardDemo";
import { IncidentListDemo } from "@/components/alerts/IncidentListDemo";

// Security - Posture & Dashboards
import { SecurityOverview } from "@/pages/security/SecurityOverview";
import { SecurityOverviewDashboard } from "@/pages/security/SecurityOverviewDashboard";
import { PostureBySite } from "@/pages/security/PostureBySite";
import { ControlCoverageView } from "@/pages/security/ControlCoverageView";
import { RiskComplianceSummary } from "@/pages/security/RiskComplianceSummary";
import { VendorAdvisorSummary } from "@/pages/security/VendorAdvisorSummary";

// Security - Identity & Access
import { UserRoleDirectory } from "@/pages/security/UserRoleDirectory";
import { AccessPolicies } from "@/pages/security/AccessPolicies";
import { PrivilegedAccessControls } from "@/pages/security/PrivilegedAccessControls";
import { DirectorySsoIntegration } from "@/pages/security/DirectorySsoIntegration";
import { IdentityAccessLogs } from "@/pages/security/IdentityAccessLogs";
import { ApiKeysServicePrincipals } from "@/pages/security/ApiKeysServicePrincipals";
import { MfaSessionRules } from "@/pages/security/MfaSessionRules";
import { SecretsCertificatesVault } from "@/pages/security/SecretsCertificatesVault";

// Security - OT/IoT Security
import { ZoneConduitModel } from "@/pages/security/ZoneConduitModel";
import { OtAssetInventory } from "@/pages/security/OtAssetInventory";
import { GatewayAgentPosture } from "@/pages/security/GatewayAgentPosture";
import { EndpointBaselines } from "@/pages/security/EndpointBaselines";
import { RemoteAccessSessions } from "@/pages/security/RemoteAccessSessions";
import EncryptionProtocolPolicy from "@/pages/security/EncryptionProtocolPolicy";
import { IotFieldDeviceSecurity } from "@/pages/security/IotFieldDeviceSecurity";
import { NetworkExposureView } from "@/pages/security/NetworkExposureView";

// Security - Compliance & Governance
import { SecurityStandardsScope } from "@/pages/security/SecurityStandardsScope";
import { SecurityControlLibrary } from "@/pages/security/SecurityControlLibrary";
import { SecurityPolicyRegister } from "@/pages/security/SecurityPolicyRegister";
import { ExceptionsWaivers } from "@/pages/security/ExceptionsWaivers";
import { AuditReadinessView } from "@/pages/security/AuditReadinessView";
import { RiskRegister } from "@/pages/security/RiskRegister";

// Security - Threats & Incidents
import { SecurityAlertInbox } from "@/pages/security/SecurityAlertInbox";
import { IncidentCases } from "@/pages/security/IncidentCases";
import { AnomalySignals } from "@/pages/security/AnomalySignals";
import { ResponsePlaybooks } from "@/pages/security/ResponsePlaybooks";
import { BasicSoarActions } from "@/pages/security/BasicSoarActions";
import { ThreatIntelligence } from "@/pages/security/ThreatIntelligence";
import { ImpactBlastRadius } from "@/pages/security/ImpactBlastRadius";

// Security - Logging & Forensics
import { SecurityAuditLog } from "@/pages/security/SecurityAuditLog";
import { ConfigChangeHistory } from "@/pages/security/ConfigChangeHistory";
import { CentralLogExplorer } from "@/pages/security/CentralLogExplorer";
import { LogRetentionSettings } from "@/pages/security/LogRetentionSettings";
import { FileConfigIntegrity } from "@/pages/security/FileConfigIntegrity";
import { ForensicSnapshots } from "@/pages/security/ForensicSnapshots";

// Security - Platform Protection
import { PlatformDataProtection } from "@/pages/security/PlatformDataProtection";
import { EncryptionKeyManagement } from "@/pages/security/EncryptionKeyManagement";
import { BackupRecoveryConfig } from "@/pages/security/BackupRecoveryConfig";
import { WorkloadSecurityHardening } from "@/pages/security/WorkloadSecurityHardening";
import { ApplicationSecurityStatus } from "@/pages/security/ApplicationSecurityStatus";

// Dashboard components
import { SecurityDashboard } from "@/pages/security/SecurityDashboard";
import { SecurityAlerts } from "@/pages/security/SecurityAlerts";
import { EnergyDashboard } from "@/pages/energy/EnergyDashboard";
import { EnergyAlerts } from "@/pages/energy/EnergyAlerts";
import { AutomationDashboard } from "@/pages/automation/AutomationDashboard";
import { AutomationAlerts } from "@/pages/automation/AutomationAlerts";
import { MonitoringDashboard } from "@/pages/monitoring/MonitoringDashboard";
import { MonitoringAlerts } from "@/pages/monitoring/MonitoringAlerts";

// Monitor Pages
import { ConditionMonitoring } from "@/pages/monitor/ConditionMonitoring";
import { RootCauseDiagnostics } from "@/pages/monitor/RootCauseDiagnostics";
import { FailurePrediction } from "@/pages/monitor/FailurePrediction";
import { RULEstimation } from "@/pages/monitor/RULEstimation";
import { UptimeDowntimeTracking } from "@/pages/monitor/UptimeDowntimeTracking";
import { PerformanceDeviationDetection } from "@/pages/monitor/PerformanceDeviationDetection";
import { UtilisationMonitoring } from "@/pages/monitor/UtilisationMonitoring";
import { RealtimeAlerts } from "@/pages/monitor/RealtimeAlerts";
import { AlertHistory } from "@/pages/monitor/AlertHistory";
import { CustomDashboards } from "@/pages/monitor/CustomDashboards";
import { ReliabilityReports } from "@/pages/monitor/ReliabilityReports";
import { HealthScoring } from "@/pages/monitor/HealthScoring";
import { AnomalyDetection } from "@/pages/monitor/AnomalyDetection";
import { DegradationTrends } from "@/pages/monitor/DegradationTrends";
import { CBMTriggers } from "@/pages/monitor/CBMTriggers";
import { MaintenanceRecommendations } from "@/pages/monitor/MaintenanceRecommendations";
import { PriorityScoringRefactor as PriorityScoring } from "@/pages/monitor/PriorityScoring";
import { PerformanceBenchmarking } from "@/pages/monitor/PerformanceBenchmarking";
import { ARMKPIs } from "@/pages/monitor/ARMKPIs";
import { DataExport } from "@/pages/monitor/DataExport";

// Overview Pages
import { OverviewDashboard } from "@/pages/overview/OverviewDashboard";
import { OverviewAlerts } from "@/pages/overview/OverviewAlerts";

import { OverviewCommandCenterPage } from "@/pages/overview/OverviewCommandCenterPage";
import { OverviewDashboardsPage } from "@/pages/overview/OverviewDashboardsPage";
import { OverviewAlertsInboxPage } from "@/pages/overview/OverviewAlertsInboxPage";
import { OverviewExceptionsPage } from "@/pages/overview/OverviewExceptionsPage";
import { MyWorklistPage } from "@/pages/overview/MyWorklistPage";
import { WorkItemRoutePage } from "@/pages/overview/WorkItemRoutePage";
import { NotificationsCenterPage } from "@/pages/overview/NotificationsCenterPage";
import { AdvisorCardsPage } from "@/pages/overview/AdvisorCardsPage";
import { RecommendedActionsPage } from "@/pages/overview/RecommendedActionsPage";
import { PlatformHelpChangeLogPage } from "@/pages/overview/PlatformHelpChangeLogPage";
import { PlatformHealthFindingsPage } from "@/pages/overview/PlatformHealthFindingsPage";
import { DataStreamStatusPage } from "@/pages/overview/DataStreamStatusPage";
import { OverviewAlertRoutePage } from "@/pages/overview/OverviewAlertRoutePage";
import { OverviewExceptionRoutePage } from "@/pages/overview/OverviewExceptionRoutePage";
import { PlatformHealthFindingRoutePage } from "@/pages/overview/PlatformHealthFindingRoutePage";
import { DataStreamRoutePage } from "@/pages/overview/DataStreamRoutePage";

// Settings Pages
import { SettingsOrganizationPage } from "@/pages/settings/SettingsOrganizationPage";
import { SettingsNamingStandardsPage } from "@/pages/settings/SettingsNamingStandardsPage";
import { SettingsTeamsPage } from "@/pages/settings/SettingsTeamsPage";
import { SettingsUserProfilesPage } from "@/pages/settings/SettingsUserProfilesPage";
import { SettingsIntegrationsPage } from "@/pages/settings/SettingsIntegrationsPage";
import { SettingsModuleTogglesPage } from "@/pages/settings/SettingsModuleTogglesPage";
import { SettingsUserPreferencesPage } from "@/pages/settings/SettingsUserPreferencesPage";
import { SettingsStreamsProgramsPage } from "@/pages/settings/SettingsStreamsProgramsPage";
import { SettingsSitesPage } from "@/pages/settings/SettingsSitesPage";
import { SettingsOperationalHierarchyPage } from "@/pages/settings/SettingsOperationalHierarchyPage";
import { SettingsScopeDefaultsPage } from "@/pages/settings/SettingsScopeDefaultsPage";
import { SettingsUsersTeamsPage } from "@/pages/settings/SettingsUsersTeamsPage";
import { SettingsUserDetailPage } from "@/pages/settings/SettingsUserDetailPage";
import { SettingsResponsibilitiesPage } from "@/pages/settings/SettingsResponsibilitiesPage";
import { SettingsIntegrationDetailPage } from "@/pages/settings/SettingsIntegrationDetailPage";
import { SettingsIntegrationConfigPage } from "@/pages/settings/SettingsIntegrationConfigPage";
import { SettingsPlatformDefaultsPage } from "@/pages/settings/SettingsPlatformDefaultsPage";
import { SettingsMyProfilePage } from "@/pages/settings/SettingsMyProfilePage";
import { SettingsMyPreferencesPage } from "@/pages/settings/SettingsMyPreferencesPage";
import { SettingsMyNotificationsPage } from "@/pages/settings/SettingsMyNotificationsPage";
import { SettingsAccessibilityThemePage } from "@/pages/settings/SettingsAccessibilityThemePage";

// Shell Pages and Shared components (that might not be in individual files yet)
import {
  EnergyMeters,
  EnergyConsumption,
  SecurityPolicies,
  SecurityCompliance,
  SecurityIncidents,
  AutomateWorkflows,
  AutomateRecipes,
  MonitorPerformance,
  MonitorMaintenance,
  MonitorAlerts,
  OptimiseKPIs,
  OptimiseBenchmarks,
  SettingsUser,
  // Energy EMS - Analytics & Optimisation
  EMSEfficiencyKPIs,
  EMSPeakDemand,
  EMSWasteDetection,
  EMSAIRecommendations,
  // Energy EMS - Sustainability & Emissions
  EMSIntensityMetrics,
  EMSRenewableContribution,
  EMSESGSDGReporting,
  EMSComplianceOutputs,
  // Energy EMS - Control & Integration
  EMSLoadBalancing,
  EMSDemandResponse,
  EMSAssetModes,
  EMSIntegration,
  EMSEfficiencyCurves,
  // Energy EMS - Dashboards & Reporting
  EMSCustomDashboards,
  EMSPeriodComparison,
  EMSAnomalyCharts,
  EMSAuditReports,
  // Asset Performance & Utilisation
  UptimeTracking,
} from "@/pages/ShellPage";

// Assets Location Pages (imported from ShellPage)

import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary
    onError={(error) => {
      NavigationErrorHandler.handleNavigationFailure(error, "/");
    }}
    fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <EmptyStates.Error
          title="Application Error"
          description="The application encountered an unexpected error. Please refresh the page or contact support if the problem persists."
          action={{
            label: "Refresh Page",
            onClick: () => window.location.reload(),
            variant: "default",
          }}
        />
      </div>
    }
  >
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
        <TooltipProvider>
          <ErrorBoundary
            onError={(error) => {
              NavigationErrorHandler.handleNavigationFailure(error, "/");
            }}
            fallback={
              <div className="min-h-screen flex items-center justify-center bg-background">
                <EmptyStates.Error
                  title="Context Error"
                  description="Application context failed to initialize. Please refresh the page."
                  action={{
                    label: "Refresh Page",
                    onClick: () => window.location.reload(),
                    variant: "default",
                  }}
                />
              </div>
            }
          >
            <AppProvider>
              <DataProviderProvider>
                <TenantProvider>
                  <Toaster />
                  <Sonner />
                  <SectorSwitchNotificationProvider />
                  <BrowserRouter
                    future={{
                      v7_startTransition: true,
                      v7_relativeSplatPath: true,
                    }}
                  >
                    <AppShell>
                      <ErrorBoundary
                        onError={(error) => {
                          NavigationErrorHandler.handleRouteNotFound(window.location.pathname);
                        }}
                        fallback={
                          <div className="flex-1 flex items-center justify-center">
                            <EmptyStates.Error
                              title="Route Error"
                              description="The requested page could not be loaded."
                              action={{
                                label: "Go Home",
                                onClick: () => window.location.href = "/overview/dashboard",
                                variant: "default",
                              }}
                            />
                          </div>
                        }
                      >
                        <Routes>
                          {/* Default redirect */}
                          <Route path="/" element={<Navigate to="/overview/dashboard" replace />} />

                          {/* Overview */}
                          <Route path="/overview/dashboard" element={<OverviewDashboard />} />
                          <Route path="/overview/alerts" element={<OverviewAlerts />} />
                          <Route path="/overview/alerts/:id" element={<OverviewAlertRoutePage />} />
                          <Route path="/overview/command-center" element={<OverviewCommandCenterPage />} />
                          <Route path="/overview/dashboards" element={<OverviewDashboardsPage />} />
                          <Route path="/overview/alerts-inbox" element={<OverviewAlertsInboxPage />} />
                          <Route path="/overview/exceptions" element={<OverviewExceptionsPage />} />
                          <Route path="/overview/exceptions/:id" element={<OverviewExceptionRoutePage />} />
                          <Route path="/overview/work" element={<MyWorklistPage />} />
                          <Route path="/overview/work/:id" element={<WorkItemRoutePage />} />
                          <Route path="/overview/notifications" element={<NotificationsCenterPage />} />
                          <Route path="/overview/advisor" element={<AdvisorCardsPage />} />
                          <Route path="/overview/recommended-actions" element={<RecommendedActionsPage />} />
                          <Route path="/overview/help" element={<PlatformHelpChangeLogPage />} />


                          {/* Overview Health */}
                          <Route path="/overview/health/findings" element={<PlatformHealthFindingsPage />} />
                          <Route path="/overview/health/findings/:id" element={<PlatformHealthFindingRoutePage />} />
                          <Route path="/overview/health/streams" element={<DataStreamStatusPage />} />
                          <Route path="/overview/health/streams/:id" element={<DataStreamRoutePage />} />

                          {/* Aliases */}
                          <Route path="/overview/health-findings" element={<Navigate to="/overview/health/findings" replace />} />
                          <Route path="/overview/stream-status" element={<Navigate to="/overview/health/streams" replace />} />

                          {/* Assets Dashboard & Alerts */}
                          <Route path="/assets/dashboard" element={<AssetsDashboard />} />
                          <Route path="/assets/alerts" element={<AssetsAlerts />} />

                          {/* Demo Routes */}
                          <Route path="/demo/widget-grid" element={<WidgetGridDemo />} />
                          <Route path="/demo/incident-card" element={<IncidentCardDemo />} />
                          <Route path="/demo/incident-list" element={<IncidentListDemo />} />

                          {/* Assets - Discovery & Onboarding */}
                          <Route path="/assets/discovery/bulk" element={<BulkDiscoveryPage />} />
                          <Route path="/assets/discovery/agents" element={<DiscoveryAgentsPage />} />
                          <Route path="/assets/discovery/manual" element={<ManualAssetCapturePage />} />
                          <Route path="/assets/discovery/import" element={<AssetImportPage />} />
                          <Route path="/assets/discovery/review" element={<DiscoveryReviewPage />} />

                          {/* Assets - Portfolio Management */}
                          <Route path="/assets/portfolio" element={<Navigate to="/assets/portfolio/overview" replace />} />
                          <Route path="/assets/portfolio/overview" element={<AssetPortfolioPage />} />
                          <Route path="/assets/portfolio/explorer" element={<PortfolioExplorerPage />} />
                          <Route path="/assets/portfolio/views" element={<SavedViewsPage />} />
                          <Route path="/assets/portfolio/cross-tenant" element={<CrossTenantPortfolioPage />} />

                          {/* Assets - Catalog & Types */}
                          <Route path="/assets/catalog/types" element={<AssetCatalogPage />} />
                          <Route path="/assets/catalog/property-sets" element={<PropertySetsPage />} />
                          <Route path="/assets/catalog/lifecycle" element={<LifecycleConfigPage />} />
                          <Route path="/assets/catalog/sector-profiles" element={<SectorProfilesPage />} />


                          {/* Assets - Connectivity & Data Points */}
                          <Route path="/assets/connectivity/mapping" element={<TagMappingPage />} />
                          <Route path="/assets/connectivity/endpoints" element={<ConnectionEndpointsPage />} />
                          <Route path="/assets/connectivity/health" element={<ConnectionHealthPage />} />
                          <Route path="/assets/connectivity/streams" element={<StreamConfigPage />} />
                          <Route path="/assets/connectivity/sandbox" element={<SandboxStreamsPage />} />

                          {/* Assets - Detail & Context */}
                          <Route path="/assets/detail/selected" element={<AssetDetailPage />} />
                          <Route path="/assets/detail/360" element={<AssetDetailPage />} />

                          {/* Assets - Detail & Context */}
                          <Route path="/assets/detail/selected" element={<AssetDetailPage />} />
                          <Route path="/assets/detail/360" element={<Asset360Page />} />
                          <Route path="/assets/detail/360/:id" element={<TransmissionAssetDetailPage />} />
                          <Route path="/assets/transmission/:id" element={<Asset360Redirect />} />

                          {/* Assets - Location, Topology & Linear Assets */}
                          <Route path="/assets/location/geo" element={<GeoLocationPage />} />
                          <Route path="/assets/location/linear" element={<LinearAssetsPage />} />
                          <Route path="/assets/location/network" element={<NetworkTopologyPage />} />
                          <Route path="/assets/location/mobile" element={<MobileAssetsPage />} />

                          {/* Security */}
                          <Route path="/security" element={<SecurityOverview />} />
                          <Route path="/security/dashboard" element={<SecurityDashboard />} />
                          <Route path="/security/alerts" element={<SecurityAlerts />} />

                          {/* Security - Posture */}
                          <Route path="/security/posture/overview" element={<SecurityOverviewDashboard />} />
                          <Route path="/security/posture/sites" element={<PostureBySite />} />
                          <Route path="/security/posture/controls" element={<ControlCoverageView />} />
                          <Route path="/security/posture/risk-compliance" element={<RiskComplianceSummary />} />
                          <Route path="/security/posture/vendor-advisor" element={<VendorAdvisorSummary />} />

                          {/* Security - Identity */}
                          <Route path="/security/identity/users" element={<UserRoleDirectory />} />
                          <Route path="/security/identity/policies" element={<AccessPolicies />} />
                          <Route path="/security/identity/privileged" element={<PrivilegedAccessControls />} />
                          <Route path="/security/identity/sso" element={<DirectorySsoIntegration />} />
                          <Route path="/security/identity/logs" element={<IdentityAccessLogs />} />
                          <Route path="/security/identity/api-keys" element={<ApiKeysServicePrincipals />} />
                          <Route path="/security/identity/mfa-sessions" element={<MfaSessionRules />} />
                          <Route path="/security/identity/secrets" element={<SecretsCertificatesVault />} />

                          {/* Security - OT/IoT */}
                          <Route path="/security/ot/zones" element={<ZoneConduitModel />} />
                          <Route path="/security/ot/ot-inventory" element={<OtAssetInventory />} />
                          <Route path="/security/ot/gateways" element={<GatewayAgentPosture />} />
                          <Route path="/security/ot/baselines" element={<EndpointBaselines />} />
                          <Route path="/security/ot/remote-sessions" element={<RemoteAccessSessions />} />
                          <Route path="/security/ot/protocol-policy" element={<EncryptionProtocolPolicy />} />
                          <Route path="/security/ot/iot-security" element={<IotFieldDeviceSecurity />} />
                          <Route path="/security/ot/exposure" element={<NetworkExposureView />} />

                          {/* Security - Compliance */}
                          <Route path="/security/compliance/standards" element={<SecurityStandardsScope />} />
                          <Route path="/security/compliance/controls" element={<SecurityControlLibrary />} />
                          <Route path="/security/compliance/policies" element={<SecurityPolicyRegister />} />
                          <Route path="/security/compliance/exceptions" element={<ExceptionsWaivers />} />
                          <Route path="/security/compliance/audit" element={<AuditReadinessView />} />
                          <Route path="/security/compliance/risks" element={<RiskRegister />} />

                          {/* Security - Threats */}
                          <Route path="/security/threats/alerts" element={<SecurityAlertInbox />} />
                          <Route path="/security/threats/incidents" element={<IncidentCases />} />
                          <Route path="/security/threats/anomalies" element={<AnomalySignals />} />
                          <Route path="/security/threats/playbooks" element={<ResponsePlaybooks />} />
                          <Route path="/security/threats/soar" element={<BasicSoarActions />} />
                          <Route path="/security/threats/intel" element={<ThreatIntelligence />} />
                          <Route path="/security/threats/impact" element={<ImpactBlastRadius />} />

                          {/* Security - Logging */}
                          <Route path="/security/logging/audit-log" element={<SecurityAuditLog />} />
                          <Route path="/security/logging/config-history" element={<ConfigChangeHistory />} />
                          <Route path="/security/logging/log-explorer" element={<CentralLogExplorer />} />
                          <Route path="/security/logging/retention" element={<LogRetentionSettings />} />
                          <Route path="/security/logging/integrity" element={<FileConfigIntegrity />} />
                          <Route path="/security/logging/snapshots" element={<ForensicSnapshots />} />

                          {/* Security - Platform Protection */}
                          <Route path="/security/platform/data-protection" element={<PlatformDataProtection />} />
                          <Route path="/security/platform/encryption" element={<EncryptionKeyManagement />} />
                          <Route path="/security/platform/backups" element={<BackupRecoveryConfig />} />
                          <Route path="/security/platform/workloads" element={<WorkloadSecurityHardening />} />
                          <Route path="/security/platform/app-security" element={<ApplicationSecurityStatus />} />

                          {/* Energy EMS */}
                          <Route path="/energy/ems/monitoring/real-time" element={<EnergyMonitoringRealTime />} />
                          <Route path="/energy/ems/monitoring/sub-metering" element={<EnergyMonitoringSubMetering />} />
                          <Route path="/energy/ems/monitoring/power-quality" element={<EnergyMonitoringPowerQuality />} />
                          <Route path="/energy/ems/monitoring/baseline-trends" element={<EnergyMonitoringBaselineTrends />} />
                          <Route path="/energy/ems/monitoring/multi-fluid" element={<EnergyMonitoringMultiFluid />} />
                          <Route path="/energy/ems/analytics/efficiency-kpis" element={<EnergyAnalyticsEfficiencyKPIs />} />
                          <Route path="/energy/ems/analytics/load-profiling" element={<EnergyAnalyticsLoadProfiling />} />
                          <Route path="/energy/ems/analytics/peak-demand" element={<EnergyAnalyticsPeakDemand />} />
                          <Route path="/energy/ems/analytics/waste-detection" element={<EnergyAnalyticsWasteDetection />} />
                          <Route path="/energy/ems/analytics/ai-recommendations" element={<EnergyAnalyticsAIOptimisation />} />
                          <Route path="/energy/ems/sustainability/carbon-emissions" element={<EnergySustainabilityCarbonCalculation />} />
                          <Route path="/energy/ems/sustainability/intensity-metrics" element={<EnergySustainabilityEnergyIntensity />} />
                          <Route path="/energy/ems/sustainability/renewable-contribution" element={<EnergySustainabilityRenewables />} />
                          <Route path="/energy/ems/sustainability/esg-sdg-reporting" element={<EnergySustainabilityESGReporting />} />
                          <Route path="/energy/ems/sustainability/compliance-outputs" element={<EnergySustainabilityCompliance />} />
                          <Route path="/energy/ems/control/load-balancing" element={<EnergyControlLoadBalancing />} />
                          <Route path="/energy/ems/control/demand-response" element={<EnergyControlDemandResponse />} />
                          <Route path="/energy/ems/control/asset-modes" element={<EnergyControlAssetModes />} />
                          <Route path="/energy/ems/control/integration" element={<EnergyControlIntegration />} />
                          <Route path="/energy/ems/control/efficiency-curves" element={<EnergyControlEfficiencyCurves />} />
                          <Route path="/energy/ems/dashboards/custom" element={<EnergyDashboardsCustom />} />
                          <Route path="/energy/ems/dashboards/period-comparison" element={<EnergyDashboardsPeriodComparison />} />
                          <Route path="/energy/ems/dashboards/cost-analysis" element={<EnergyDashboardsCostAnalysis />} />
                          <Route path="/energy/ems/dashboards/anomaly-charts" element={<EnergyDashboardsAnomalies />} />
                          <Route path="/energy/ems/dashboards/audit-reports" element={<EnergyDashboardsAuditReports />} />

                          {/* Automate (PA) */}
                          <Route path="/automate/integrate/tags" element={<AutomateTagMappingPage />} />
                          <Route path="/automate/integrate/models" element={<ControlModelsPage />} />
                          <Route path="/automate/integrate/bindings" element={<ActionBindingsPage />} />
                          <Route path="/automate/monitor/triggers" element={<TriggersPage />} />
                          <Route path="/automate/monitor/alarms" element={<AlarmRulesPage />} />
                          <Route path="/automate/monitor/patterns" element={<EventPatternsPage />} />
                          <Route path="/automate/control/workflows" element={<WorkflowsPage />} />
                          <Route path="/automate/control/sequences" element={<SequencesPage />} />
                          <Route path="/automate/control/rules" element={<ControlRulesPage />} />
                          <Route path="/automate/govern/versions" element={<VersionsPage />} />
                          <Route path="/automate/govern/approvals" element={<ApprovalsPage />} />
                          <Route path="/automate/govern/simulation" element={<SimulationPage />} />
                          <Route path="/automate/govern/audit" element={<AuditLogsPage />} />
                          <Route path="/automation/dashboard" element={<AutomationDashboard />} />
                          <Route path="/automation/alerts" element={<AutomationAlerts />} />
                          <Route path="/automate/workflows" element={<AutomateWorkflows />} />
                          <Route path="/automate/recipes" element={<AutomateRecipes />} />

                          {/* Optimise */}
                          <Route path="/optimise/ci" element={<ContinuousImprovement />} />
                          <Route path="/optimise/optimisation" element={<Optimisation />} />
                          <Route path="/optimise/performance" element={<Performance />} />
                          <Route path="/optimise/sim" element={<LeanExecution />} />
                          <Route path="/optimise/sim/boards" element={<LeanExecution subFeature="boards" />} />
                          <Route path="/optimise/sim/switching-orders" element={<LeanExecution subFeature="switching-orders" />} />
                          <Route path="/optimise/sim/outages" element={<LeanExecution subFeature="outages" />} />
                          <Route path="/optimise/sim/shifts" element={<LeanExecution subFeature="shifts" />} />
                          <Route path="/optimise/sim/issues" element={<LeanExecution subFeature="issues" />} />
                          <Route path="/optimise/sim/actions" element={<LeanExecution subFeature="actions" />} />
                          <Route path="/optimise/ci/projects" element={<ContinuousImprovement subFeature="projects" />} />
                          <Route path="/optimise/ci/rca" element={<ContinuousImprovement subFeature="rca" />} />
                          <Route path="/optimise/ci/countermeasures" element={<ContinuousImprovement subFeature="countermeasures" />} />
                          <Route path="/optimise/ci/impact" element={<ContinuousImprovement subFeature="impact" />} />
                          <Route path="/optimise/ci/reports" element={<ContinuousImprovement subFeature="reports" />} />
                          <Route path="/optimise/optimisation/opportunities" element={<Optimisation subFeature="opportunities" />} />
                          <Route path="/optimise/optimisation/recommendations" element={<Optimisation subFeature="recommendations" />} />
                          <Route path="/optimise/optimisation/playbooks" element={<Optimisation subFeature="playbooks" />} />
                          <Route path="/optimise/optimisation/simulations" element={<Optimisation subFeature="simulations" />} />
                          <Route path="/optimise/optimisation/execution" element={<Optimisation subFeature="execution" />} />

                          {/* Monitor */}
                          <Route path="/monitor/performance" element={<MonitorPerformance />} />
                          <Route path="/monitor/maintenance" element={<MonitorMaintenance />} />
                          <Route path="/monitor/alerts" element={<MonitorAlerts />} />
                          <Route path="/monitoring/dashboard" element={<MonitoringDashboard />} />
                          <Route path="/monitoring/alerts" element={<MonitoringAlerts />} />
                          {/* Monitor - Health & Diagnostics */}
                          <Route path="/monitor/health-diagnostics/condition-monitoring" element={<ConditionMonitoring />} />
                          <Route path="/monitor/health-diagnostics/health-scoring" element={<HealthScoring />} />
                          <Route path="/monitor/health-diagnostics/anomaly-detection" element={<AnomalyDetection />} />
                          <Route path="/monitor/health-diagnostics/root-cause" element={<RootCauseDiagnostics />} />
                          <Route path="/monitor/health-diagnostics/degradation-trends" element={<DegradationTrends />} />

                          {/* Monitor - Predictive & Prescriptive */}
                          <Route path="/monitor/predictive-maintenance/failure-prediction" element={<FailurePrediction />} />
                          <Route path="/monitor/predictive-maintenance/rul-estimation" element={<RULEstimation />} />
                          <Route path="/monitor/predictive-maintenance/cbm-triggers" element={<CBMTriggers />} />
                          <Route path="/monitor/predictive-maintenance/recommendations" element={<MaintenanceRecommendations />} />
                          <Route path="/monitor/predictive-maintenance/priority-scoring" element={<PriorityScoring />} />

                          {/* Monitor - Performance & Utilisation */}
                          <Route path="/monitor/performance-utilisation/uptime-tracking" element={<UptimeDowntimeTracking />} />
                          <Route path="/monitor/performance-utilisation/utilisation-monitoring" element={<UtilisationMonitoring />} />
                          <Route path="/monitor/performance-utilisation/deviation-detection" element={<PerformanceDeviationDetection />} />
                          <Route path="/monitor/performance-utilisation/benchmarking" element={<PerformanceBenchmarking />} />
                          <Route path="/monitor/performance-utilisation/arm-kpis" element={<ARMKPIs />} />

                          {/* Monitor - Alerts & Reports */}
                          <Route path="/monitor/alerts-reports/realtime-alerts" element={<RealtimeAlerts />} />
                          <Route path="/monitor/alerts-reports/alert-history" element={<AlertHistory />} />
                          <Route path="/monitor/alerts-reports/custom-dashboards" element={<CustomDashboards />} />
                          <Route path="/monitor/alerts-reports/reliability-reports" element={<ReliabilityReports />} />
                          <Route path="/monitor/alerts-reports/data-export" element={<DataExport />} />

                          {/* Monitor - Inventory & Criticality (APM Features) */}
                          <Route path="/monitor/inventory-criticality/registry" element={<AssetRegistryPage />} />
                          <Route path="/monitor/inventory-criticality/registry/:id" element={<APMAssetDetailPage />} />
                          <Route path="/monitor/inventory-criticality/registry/:id/edit" element={<AssetEditPage />} />
                          <Route path="/monitor/inventory-criticality/criticality-scoring" element={<CriticalityScoringPage />} />
                          <Route path="/monitor/inventory-criticality/failure-modes" element={<FMEALibraryPage />} />
                          <Route path="/monitor/inventory-criticality/lifecycle-tracking" element={<LifecycleTrackingPage />} />
                          <Route path="/monitor/inventory-criticality/spare-parts" element={<SparePartsPage />} />

                          {/* Settings */}
                          <Route path="/settings/organization" element={<SettingsOrganizationPage />} />
                          <Route path="/settings/streams" element={<SettingsStreamsProgramsPage />} />
                          <Route path="/settings/naming-standards" element={<SettingsNamingStandardsPage />} />
                          <Route path="/settings/sites" element={<SettingsSitesPage />} />
                          <Route path="/settings/hierarchy" element={<SettingsOperationalHierarchyPage />} />
                          <Route path="/settings/scope-defaults" element={<SettingsScopeDefaultsPage />} />
                          <Route path="/settings/users-teams" element={<SettingsUsersTeamsPage />} />
                          <Route path="/settings/users/:userId" element={<SettingsUserDetailPage />} />
                          <Route path="/settings/responsibilities" element={<SettingsResponsibilitiesPage />} />
                          <Route path="/settings/teams" element={<SettingsTeamsPage />} />
                          <Route path="/settings/user-profiles" element={<SettingsUserProfilesPage />} />
                          <Route path="/settings/integrations" element={<SettingsIntegrationsPage />} />
                          <Route path="/settings/integrations/:integrationId" element={<SettingsIntegrationDetailPage />} />
                          <Route path="/settings/integrations/:integrationId/edit" element={<SettingsIntegrationConfigPage />} />
                          <Route path="/settings/platform-defaults" element={<SettingsPlatformDefaultsPage />} />
                          <Route path="/settings/modules" element={<SettingsModuleTogglesPage />} />
                          <Route path="/settings/me" element={<SettingsMyProfilePage />} />
                          <Route path="/settings/me/preferences" element={<SettingsMyPreferencesPage />} />
                          <Route path="/settings/me/notifications" element={<SettingsMyNotificationsPage />} />
                          <Route path="/settings/me/accessibility" element={<SettingsAccessibilityThemePage />} />

                          {/* Legacy Settings Routes & Aliases */}
                          <Route path="/settings/users" element={<Navigate to="/settings/users-teams" replace />} />
                          <Route path="/settings/operational-hierarchy" element={<Navigate to="/settings/hierarchy" replace />} />
                          <Route path="/settings/module-toggles" element={<Navigate to="/settings/modules" replace />} />
                          <Route path="/settings/my-profile" element={<Navigate to="/settings/me" replace />} />
                          <Route path="/settings/my-preferences" element={<Navigate to="/settings/me/preferences" replace />} />
                          <Route path="/settings/my-notifications" element={<Navigate to="/settings/me/notifications" replace />} />
                          <Route path="/settings/accessibility-theme" element={<Navigate to="/settings/me/accessibility" replace />} />
                          <Route path="/settings/user-preferences" element={<SettingsUserPreferencesPage />} />
                          <Route path="/settings/user" element={<SettingsUser />} />

                          {/* Energy EMS - Configuration (Admin) */}
                          <Route path="/energy/ems/config/transmission-topology" element={<TransmissionTopology />} />

                          {/* Security Aliases */}
                          <Route path="/security/ot-inventory" element={<Navigate to="/security/ot/ot-inventory" replace />} />
                          <Route path="/security/inventory" element={<Navigate to="/security/ot/ot-inventory" replace />} />

                          {/* Not Found */}
                          <Route path="*" element={<ErrorBoundary fallback={<NotFound />}><NotFound /></ErrorBoundary>} />
                        </Routes>

                      </ErrorBoundary>

                    </AppShell>
                  </BrowserRouter>
                </TenantProvider>
              </DataProviderProvider>
            </AppProvider>
          </ErrorBoundary>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
