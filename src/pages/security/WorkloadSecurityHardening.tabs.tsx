import {
  Shield,
  CheckCircle2,
  AlertTriangle,
  Activity,
  Lock,
  HardDrive,
  Network,
  FileText,
  TrendingUp,
  TrendingDown,
  Minus,
  Server,
} from "lucide-react";
import type { WorkloadSecurity } from "@/types/security";

export function OverviewTab({ workload }: { workload: WorkloadSecurity }) {
  const getHealthStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-success';
      case 'degraded': return 'text-warning';
      case 'critical': return 'text-destructive';
      default: return 'text-muted-foreground';
    }
  };

  const getHealthStatusBg = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-success/10';
      case 'degraded': return 'bg-warning/10';
      case 'critical': return 'bg-destructive/10';
      default: return 'bg-secondary';
    }
  };

  return (
    <div className="space-y-6">
      {/* Overall Status Card */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold">{workload.workloadName}</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {workload.workloadDescription || `${workload.workloadType.replace('_', ' ')} workload`}
            </p>
          </div>
          <div
            className={`px-4 py-2 rounded-lg ${getHealthStatusBg(workload.healthStatus)}`}
          >
            <div className="flex items-center gap-2">
              {workload.healthStatus === "healthy" ? (
                <CheckCircle2 className={`w-5 h-5 ${getHealthStatusColor(workload.healthStatus)}`} />
              ) : (
                <AlertTriangle className={`w-5 h-5 ${getHealthStatusColor(workload.healthStatus)}`} />
              )}
              <span className={`font-medium capitalize ${getHealthStatusColor(workload.healthStatus)}`}>
                {workload.healthStatus}
              </span>
            </div>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-secondary/30 rounded-lg p-4 border border-border">
            <p className="text-xs text-muted-foreground mb-1">Compliance Score</p>
            <div className="flex items-center justify-between">
              <p className="text-xl font-semibold">{workload.baselineComplianceScore}%</p>
              <div className={`w-2 h-2 rounded-full ${
                workload.baselineComplianceScore >= 90 ? "bg-success" : 
                workload.baselineComplianceScore >= 70 ? "bg-warning" : "bg-destructive"
              }`} />
            </div>
          </div>
          <div className="bg-secondary/30 rounded-lg p-4 border border-border">
            <p className="text-xs text-muted-foreground mb-1">Hardening Level</p>
            <div className="flex items-center justify-between">
              <p className="text-xl font-semibold capitalize">{workload.hardeningLevel}</p>
              <Shield className={`w-5 h-5 ${
                workload.hardeningLevel === 'maximum' ? 'text-success' :
                workload.hardeningLevel === 'enhanced' ? 'text-primary' :
                workload.hardeningLevel === 'standard' ? 'text-warning' : 'text-muted-foreground'
              }`} />
            </div>
          </div>
          <div className="bg-secondary/30 rounded-lg p-4 border border-border">
            <p className="text-xs text-muted-foreground mb-1">Critical Vulnerabilities</p>
            <div className="flex items-center justify-between">
              <p className={`text-xl font-semibold ${workload.criticalVulnerabilities > 0 ? 'text-destructive' : 'text-success'}`}>
                {workload.criticalVulnerabilities}
              </p>
              <div className={`w-2 h-2 rounded-full ${workload.criticalVulnerabilities === 0 ? "bg-success" : "bg-destructive"}`} />
            </div>
          </div>
          <div className="bg-secondary/30 rounded-lg p-4 border border-border">
            <p className="text-xs text-muted-foreground mb-1">Pending Patches</p>
            <div className="flex items-center justify-between">
              <p className={`text-xl font-semibold ${workload.pendingPatchesCount > 0 ? 'text-warning' : 'text-success'}`}>
                {workload.pendingPatchesCount}
              </p>
              <div className={`w-2 h-2 rounded-full ${workload.pendingPatchesCount === 0 ? "bg-success" : "bg-warning"}`} />
            </div>
          </div>
        </div>
      </div>

      {/* Deployment Details */}
      <div>
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Server className="w-4 h-4 text-primary" />
          Deployment Details
        </h3>
        <div className="bg-card border border-border rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Environment</span>
            <span className="text-sm font-medium capitalize">{workload.deploymentEnvironment}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Platform</span>
            <span className="text-sm font-medium capitalize">{workload.deploymentPlatform}</span>
          </div>
          {workload.deploymentLocation && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Location</span>
              <span className="text-sm font-medium">{workload.deploymentLocation}</span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Status</span>
            <span className={`text-sm font-medium ${workload.status === 'active' ? 'text-success' : 'text-warning'}`}>
              {workload.status}
            </span>
          </div>
        </div>
      </div>

      {/* Security Controls */}
      <div>
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Lock className="w-4 h-4 text-primary" />
          Security Controls
        </h3>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Firewall</span>
              <span className={`text-xs font-medium ${workload.firewallEnabled ? 'text-success' : 'text-destructive'}`}>
                {workload.firewallEnabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Antivirus</span>
              <span className={`text-xs font-medium ${workload.antivirusEnabled ? 'text-success' : 'text-destructive'}`}>
                {workload.antivirusEnabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Network Encryption</span>
              <span className={`text-xs font-medium ${workload.networkEncryptionEnabled ? 'text-success' : 'text-destructive'}`}>
                {workload.networkEncryptionEnabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Monitoring Agent</span>
              <span className={`text-xs font-medium ${workload.monitoringAgentInstalled ? 'text-success' : 'text-destructive'}`}>
                {workload.monitoringAgentInstalled ? 'Installed' : 'Not Installed'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Logging</span>
              <span className={`text-xs font-medium ${workload.loggingEnabled ? 'text-success' : 'text-destructive'}`}>
                {workload.loggingEnabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Config Management</span>
              <span className={`text-xs font-medium ${workload.configurationManagementEnabled ? 'text-success' : 'text-destructive'}`}>
                {workload.configurationManagementEnabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function BaselineTab({ workload }: { workload: WorkloadSecurity }) {
  return (
    <div className="space-y-4">
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="text-sm font-semibold">Security Baseline</h4>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full ${
                  workload.baselineComplianceStatus === "compliant"
                    ? "bg-success/10 text-success"
                    : workload.baselineComplianceStatus === "partial"
                    ? "bg-warning/10 text-warning"
                    : "bg-destructive/10 text-destructive"
                }`}
              >
                {workload.baselineComplianceStatus}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Baseline ID: {workload.securityBaselineId} (v{workload.baselineVersion})
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold">{workload.baselineComplianceScore}%</p>
            <p className="text-xs text-muted-foreground">Compliance Score</p>
          </div>
        </div>

        {workload.lastBaselineAssessment && (
          <div className="pt-3 border-t border-border">
            <p className="text-xs text-muted-foreground">
              Last Assessment: {new Date(workload.lastBaselineAssessment).toLocaleString()}
            </p>
          </div>
        )}
      </div>

      {/* OS Hardening */}
      {workload.osType && (
        <div>
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-primary" />
            Operating System Hardening
          </h3>
          <div className="bg-card border border-border rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">OS Type</span>
              <span className="text-sm font-medium capitalize">{workload.osType}</span>
            </div>
            {workload.osVersion && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">OS Version</span>
                <span className="text-sm font-medium">{workload.osVersion}</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">OS Hardening</span>
              <span className={`text-sm font-medium ${workload.osHardeningEnabled ? 'text-success' : 'text-destructive'}`}>
                {workload.osHardeningEnabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>
            {workload.osHardeningControls && workload.osHardeningControls.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">Applied Controls</p>
                <div className="flex flex-wrap gap-1">
                  {workload.osHardeningControls.map((control, index) => (
                    <span key={index} className="px-2 py-0.5 bg-secondary text-xs rounded">
                      {control}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Network Segmentation */}
      <div>
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Network className="w-4 h-4 text-primary" />
          Network Configuration
        </h3>
        <div className="bg-card border border-border rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Network Segmentation</span>
            <span className={`text-sm font-medium ${workload.networkSegmentationEnabled ? 'text-success' : 'text-destructive'}`}>
              {workload.networkSegmentationEnabled ? 'Enabled' : 'Disabled'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Network Encryption</span>
            <span className={`text-sm font-medium ${workload.networkEncryptionEnabled ? 'text-success' : 'text-destructive'}`}>
              {workload.networkEncryptionEnabled ? 'Enabled' : 'Disabled'}
            </span>
          </div>
          {workload.allowedInboundPorts && workload.allowedInboundPorts.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Allowed Inbound Ports</p>
              <div className="flex flex-wrap gap-1">
                {workload.allowedInboundPorts.map((port, index) => (
                  <span key={index} className="px-2 py-0.5 bg-secondary text-xs rounded">
                    {port}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Configuration Management */}
      <div>
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <FileText className="w-4 h-4 text-primary" />
          Configuration Management
        </h3>
        <div className="bg-card border border-border rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Config Management</span>
            <span className={`text-sm font-medium ${workload.configurationManagementEnabled ? 'text-success' : 'text-destructive'}`}>
              {workload.configurationManagementEnabled ? 'Enabled' : 'Disabled'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Configuration Drift</span>
            <span className={`text-sm font-medium ${workload.configurationDriftDetected ? 'text-warning' : 'text-success'}`}>
              {workload.configurationDriftDetected ? 'Detected' : 'None'}
            </span>
          </div>
          {workload.lastConfigurationCheck && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Last Check</span>
              <span className="text-sm font-medium">
                {new Date(workload.lastConfigurationCheck).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function HardeningTab({ workload }: { workload: WorkloadSecurity }) {
  return (
    <div className="space-y-4">
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="text-sm font-semibold">Hardening Configuration</h4>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full ${
                  workload.hardeningApplied
                    ? "bg-success/10 text-success"
                    : "bg-warning/10 text-warning"
                }`}
              >
                {workload.hardeningApplied ? 'Applied' : 'Not Applied'}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Level: {workload.hardeningLevel} {workload.hardeningProfile && `· Profile: ${workload.hardeningProfile}`}
            </p>
          </div>
        </div>

        {workload.hardeningDate && (
          <div className="pt-3 border-t border-border">
            <p className="text-xs text-muted-foreground">
              Applied: {new Date(workload.hardeningDate).toLocaleString()}
            </p>
          </div>
        )}
      </div>

      {/* Hardening Standards */}
      {workload.hardeningStandards && workload.hardeningStandards.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" />
            Hardening Standards
          </h3>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex flex-wrap gap-2">
              {workload.hardeningStandards.map((standard, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-primary/10 text-primary text-xs rounded-full"
                >
                  {standard}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Access Controls */}
      <div>
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Lock className="w-4 h-4 text-primary" />
          Access Controls
        </h3>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">SSH Access</span>
              <span className={`text-xs font-medium ${workload.sshEnabled ? 'text-warning' : 'text-success'}`}>
                {workload.sshEnabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>
            {workload.sshEnabled && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">SSH Key Only</span>
                <span className={`text-xs font-medium ${workload.sshKeyOnly ? 'text-success' : 'text-destructive'}`}>
                  {workload.sshKeyOnly ? 'Yes' : 'No'}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">RDP Access</span>
              <span className={`text-xs font-medium ${workload.rdpEnabled ? 'text-warning' : 'text-success'}`}>
                {workload.rdpEnabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Privileged Access</span>
              <span className={`text-xs font-medium ${workload.privilegedAccessRestricted ? 'text-success' : 'text-destructive'}`}>
                {workload.privilegedAccessRestricted ? 'Restricted' : 'Unrestricted'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Security Tools */}
      <div>
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary" />
          Security Tools
        </h3>
        <div className="bg-card border border-border rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Firewall</span>
            <div className="flex items-center gap-2">
              <span className={`text-sm font-medium ${workload.firewallEnabled ? 'text-success' : 'text-destructive'}`}>
                {workload.firewallEnabled ? 'Enabled' : 'Disabled'}
              </span>
              {workload.firewallEnabled && (
                <span className="text-xs text-muted-foreground">
                  ({workload.firewallRulesCount} rules)
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Antivirus</span>
            <div className="flex items-center gap-2">
              <span className={`text-sm font-medium ${workload.antivirusEnabled ? 'text-success' : 'text-destructive'}`}>
                {workload.antivirusEnabled ? 'Enabled' : 'Disabled'}
              </span>
              {workload.antivirusEnabled && (
                <span className={`text-xs ${workload.antivirusUpdated ? 'text-success' : 'text-warning'}`}>
                  ({workload.antivirusUpdated ? 'Updated' : 'Outdated'})
                </span>
              )}
            </div>
          </div>
          {workload.antivirusLastScan && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Last AV Scan</span>
              <span className="text-sm font-medium">
                {new Date(workload.antivirusLastScan).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Monitoring */}
      <div>
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary" />
          Monitoring & Logging
        </h3>
        <div className="bg-card border border-border rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Logging</span>
            <span className={`text-sm font-medium ${workload.loggingEnabled ? 'text-success' : 'text-destructive'}`}>
              {workload.loggingEnabled ? 'Enabled' : 'Disabled'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Log Forwarding</span>
            <span className={`text-sm font-medium ${workload.logForwardingEnabled ? 'text-success' : 'text-destructive'}`}>
              {workload.logForwardingEnabled ? 'Enabled' : 'Disabled'}
            </span>
          </div>
          {workload.logDestination && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Log Destination</span>
              <span className="text-sm font-medium">{workload.logDestination}</span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Monitoring Agent</span>
            <div className="flex items-center gap-2">
              <span className={`text-sm font-medium ${workload.monitoringAgentInstalled ? 'text-success' : 'text-destructive'}`}>
                {workload.monitoringAgentInstalled ? 'Installed' : 'Not Installed'}
              </span>
              {workload.monitoringAgentVersion && (
                <span className="text-xs text-muted-foreground">
                  (v{workload.monitoringAgentVersion})
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function VulnerabilitiesTab({ workload }: { workload: WorkloadSecurity }) {
  const totalVulnerabilities = 
    workload.criticalVulnerabilities + 
    workload.highVulnerabilities + 
    workload.mediumVulnerabilities + 
    workload.lowVulnerabilities;

  return (
    <div className="space-y-4">
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex items-center gap-3">
          <div
            className={`w-12 h-12 rounded-lg flex items-center justify-center ${
              totalVulnerabilities === 0
                ? "bg-success/10"
                : workload.criticalVulnerabilities > 0
                ? "bg-destructive/10"
                : "bg-warning/10"
            }`}
          >
            {totalVulnerabilities === 0 ? (
              <CheckCircle2 className="w-6 h-6 text-success" />
            ) : (
              <AlertTriangle
                className={`w-6 h-6 ${
                  workload.criticalVulnerabilities > 0 ? "text-destructive" : "text-warning"
                }`}
              />
            )}
          </div>
          <div className="flex-1">
            <p className="text-2xl font-bold">{totalVulnerabilities}</p>
            <p className="text-sm text-muted-foreground">
              Total vulnerabilit{totalVulnerabilities !== 1 ? "ies" : "y"}
            </p>
          </div>
        </div>
      </div>

      {/* Vulnerability Breakdown */}
      <div>
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-primary" />
          Vulnerability Breakdown
        </h3>
        <div className="space-y-3">
          <div className="bg-card border border-destructive/30 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-destructive" />
                <span className="text-sm font-medium">Critical</span>
              </div>
              <span className="text-lg font-bold text-destructive">
                {workload.criticalVulnerabilities}
              </span>
            </div>
          </div>
          <div className="bg-card border border-warning/30 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-warning" />
                <span className="text-sm font-medium">High</span>
              </div>
              <span className="text-lg font-bold text-warning">
                {workload.highVulnerabilities}
              </span>
            </div>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-primary" />
                <span className="text-sm font-medium">Medium</span>
              </div>
              <span className="text-lg font-bold">
                {workload.mediumVulnerabilities}
              </span>
            </div>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-muted-foreground" />
                <span className="text-sm font-medium">Low</span>
              </div>
              <span className="text-lg font-bold text-muted-foreground">
                {workload.lowVulnerabilities}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Vulnerability Scanning */}
      <div>
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary" />
          Vulnerability Scanning
        </h3>
        <div className="bg-card border border-border rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Scanning Enabled</span>
            <span className={`text-sm font-medium ${workload.vulnerabilityScanEnabled ? 'text-success' : 'text-destructive'}`}>
              {workload.vulnerabilityScanEnabled ? 'Yes' : 'No'}
            </span>
          </div>
          {workload.lastVulnerabilityScan && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Last Scan</span>
              <span className="text-sm font-medium">
                {new Date(workload.lastVulnerabilityScan).toLocaleString()}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Patch Management */}
      <div>
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Shield className="w-4 h-4 text-primary" />
          Patch Management
        </h3>
        <div className="bg-card border border-border rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Patch Level</span>
            <span className={`text-sm font-medium capitalize ${
              workload.patchLevel === 'current' ? 'text-success' :
              workload.patchLevel === 'outdated' ? 'text-warning' :
              workload.patchLevel === 'critical_missing' ? 'text-destructive' : 'text-muted-foreground'
            }`}>
              {workload.patchLevel.replace('_', ' ')}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Pending Patches</span>
            <span className={`text-sm font-medium ${workload.pendingPatchesCount > 0 ? 'text-warning' : 'text-success'}`}>
              {workload.pendingPatchesCount}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Critical Patches</span>
            <span className={`text-sm font-medium ${workload.criticalPatchesPending > 0 ? 'text-destructive' : 'text-success'}`}>
              {workload.criticalPatchesPending}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Auto Patching</span>
            <span className={`text-sm font-medium ${workload.autoPatchingEnabled ? 'text-success' : 'text-warning'}`}>
              {workload.autoPatchingEnabled ? 'Enabled' : 'Disabled'}
            </span>
          </div>
          {workload.lastPatchedDate && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Last Patched</span>
              <span className="text-sm font-medium">
                {new Date(workload.lastPatchedDate).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function ComplianceTab({ workload }: { workload: WorkloadSecurity }) {
  return (
    <div className="space-y-4">
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="text-sm font-semibold">Compliance Status</h4>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full ${
                  workload.baselineComplianceStatus === "compliant"
                    ? "bg-success/10 text-success"
                    : workload.baselineComplianceStatus === "partial"
                    ? "bg-warning/10 text-warning"
                    : "bg-destructive/10 text-destructive"
                }`}
              >
                {workload.baselineComplianceStatus}
              </span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold">{workload.baselineComplianceScore}%</p>
            <p className="text-xs text-muted-foreground">Score</p>
          </div>
        </div>
      </div>

      {/* Compliance Frameworks */}
      {workload.complianceFrameworks && workload.complianceFrameworks.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" />
            Compliance Frameworks
          </h3>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex flex-wrap gap-2">
              {workload.complianceFrameworks.map((framework, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-primary/10 text-primary text-xs rounded-full"
                >
                  {framework}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Audit Information */}
      <div>
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary" />
          Audit Information
        </h3>
        <div className="bg-card border border-border rounded-lg p-4 space-y-3">
          {workload.lastAuditDate && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Last Audit</span>
              <span className="text-sm font-medium">
                {new Date(workload.lastAuditDate).toLocaleDateString()}
              </span>
            </div>
          )}
          {workload.nextAuditDate && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Next Audit</span>
              <span className="text-sm font-medium">
                {new Date(workload.nextAuditDate).toLocaleDateString()}
              </span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Audit Findings</span>
            <span className={`text-sm font-medium ${workload.auditFindingsCount > 0 ? 'text-warning' : 'text-success'}`}>
              {workload.auditFindingsCount}
            </span>
          </div>
        </div>
      </div>

      {/* Contacts */}
      <div>
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Shield className="w-4 h-4 text-primary" />
          Responsible Parties
        </h3>
        <div className="bg-card border border-border rounded-lg p-4 space-y-3">
          {workload.ownerUserId && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Owner</span>
              <span className="text-sm font-medium">{workload.ownerUserId}</span>
            </div>
          )}
          {workload.securityContact && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Security Contact</span>
              <span className="text-sm font-medium">{workload.securityContact}</span>
            </div>
          )}
          {workload.technicalContact && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Technical Contact</span>
              <span className="text-sm font-medium">{workload.technicalContact}</span>
            </div>
          )}
        </div>
      </div>

      {/* Tags */}
      {workload.tags && workload.tags.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" />
            Tags
          </h3>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex flex-wrap gap-2">
              {workload.tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-secondary text-xs rounded"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Notes */}
      {workload.notes && (
        <div>
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" />
            Notes
          </h3>
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">{workload.notes}</p>
          </div>
        </div>
      )}
    </div>
  );
}
