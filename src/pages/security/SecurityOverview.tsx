/**
 * Security Overview Page
 * 
 * Provides a comprehensive overview of all cybersecurity features and metrics
 * before users navigate to specific security areas. Shows key metrics, summaries,
 * and top performing/at-risk assets across all security domains.
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
// Note: Progress component may need to be created if not available
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Users,
  Cpu,
  FileCheck,
  ScrollText,
  HardDrive,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  Activity,
  Target,
  Eye,
  Lock,
  Bell,
  BarChart3,
  ArrowRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Import query functions
import { getSecurityMetrics, getSiteSecurityPostures, getAssetCriticalityBreakdown, getSecurityStatusBreakdown, getAlertSeverityBreakdown } from '@/lib/securityDashboardQueries';
import { getLatestRiskComplianceSummary } from '@/lib/riskComplianceQueries';
import { getSecurityUsers, getAccessPolicies, getPrivilegedAccessSessions } from '@/lib/securityQueries';
import { getSecurityAlerts } from '@/lib/threatMonitoringQueries';

interface SecurityOverviewMetrics {
  // Overall metrics
  overallSecurityScore: number;
  totalAssets: number;
  criticalAssets: number;
  vulnerableAssets: number;
  secureAssets: number;

  // Alerts and incidents
  totalAlerts: number;
  criticalAlerts: number;
  highAlerts: number;

  // Identity and access
  totalUsers: number;
  activeUsers: number;
  activeSessions: number;

  // Compliance
  complianceScore: number;
  compliantStandards: number;
  totalStandards: number;

  // Risk
  overallRiskScore: number;
  criticalRisks: number;
  totalRisks: number;

  // Zones and sites
  totalZones: number;
  compliantZones: number;
  totalSites: number;

  // Trends
  securityTrend: 'improving' | 'stable' | 'degrading';
  complianceTrend: 'improving' | 'stable' | 'degrading';
  riskTrend: 'improving' | 'stable' | 'degrading';
}

interface TopAsset {
  id: string;
  name: string;
  type: string;
  site: string;
  securityScore: number;
  riskScore: number;
  status: 'secure' | 'at-risk' | 'vulnerable';
  criticality: 'safety-critical' | 'production-critical' | 'high' | 'medium' | 'low';
}

interface RecentAlert {
  id: string;
  title: string;
  severity: 'critical' | 'high' | 'warning' | 'info';
  timestamp: string;
  source: string;
  status: 'new' | 'acknowledged' | 'in-progress' | 'resolved';
}

export const SecurityOverview: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<SecurityOverviewMetrics | null>(null);
  const [topSecureAssets, setTopSecureAssets] = useState<TopAsset[]>([]);
  const [topRiskAssets, setTopRiskAssets] = useState<TopAsset[]>([]);
  const [recentAlerts, setRecentAlerts] = useState<RecentAlert[]>([]);
  const [selectedTab, setSelectedTab] = useState('overview');

  // Mock tenant ID - in real app this would come from context
  const tenantId = 'transmission-corp';

  useEffect(() => {
    loadSecurityOverview();
  }, []);

  const loadSecurityOverview = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load all security metrics in parallel
      const [
        securityMetrics,
        sitePostures,
        assetBreakdown,
        statusBreakdown,
        alertBreakdown,
        riskCompliance,
        users,
        policies,
        sessions,
        alerts
      ] = await Promise.all([
        getSecurityMetrics(tenantId),
        getSiteSecurityPostures(tenantId),
        getAssetCriticalityBreakdown(tenantId),
        getSecurityStatusBreakdown(tenantId),
        getAlertSeverityBreakdown(tenantId),
        getLatestRiskComplianceSummary(tenantId),
        getSecurityUsers(tenantId, { limit: 100 }),
        getAccessPolicies(tenantId),
        getPrivilegedAccessSessions(tenantId, { limit: 50 }),
        getSecurityAlerts(tenantId, { limit: 10 })
      ]);

      // Aggregate metrics
      const overviewMetrics: SecurityOverviewMetrics = {
        overallSecurityScore: securityMetrics.overallSecurityScore,
        totalAssets: securityMetrics.totalAssets,
        criticalAssets: securityMetrics.criticalAssets,
        vulnerableAssets: securityMetrics.vulnerableAssets,
        secureAssets: securityMetrics.secureAssets,
        totalAlerts: securityMetrics.totalAlerts,
        criticalAlerts: securityMetrics.criticalAlerts,
        highAlerts: securityMetrics.highAlerts,
        totalUsers: users.length,
        activeUsers: users.filter(u => u.status === 'active').length,
        activeSessions: securityMetrics.activeSessions,
        complianceScore: riskCompliance.data?.overall_compliance_score || 0,
        compliantStandards: riskCompliance.data?.compliant_standards || 0,
        totalStandards: riskCompliance.data?.total_standards || 0,
        overallRiskScore: riskCompliance.data?.overall_risk_score || 0,
        criticalRisks: riskCompliance.data?.critical_risks || 0,
        totalRisks: riskCompliance.data?.total_risks || 0,
        totalZones: securityMetrics.totalZones,
        compliantZones: securityMetrics.compliantZones,
        totalSites: sitePostures.length,
        securityTrend: riskCompliance.data?.security_posture_trend || 'stable',
        complianceTrend: riskCompliance.data?.compliance_trend || 'stable',
        riskTrend: riskCompliance.data?.risk_trend || 'stable'
      };

      setMetrics(overviewMetrics);

      // Generate mock top assets (in real app, this would come from queries)
      setTopSecureAssets([
        {
          id: '1',
          name: 'Primary Transformer T1',
          type: 'Transformer',
          site: 'Substation Alpha',
          securityScore: 98,
          riskScore: 15,
          status: 'secure',
          criticality: 'safety-critical'
        },
        {
          id: '2',
          name: 'Control System HMI-01',
          type: 'HMI',
          site: 'Control Center',
          securityScore: 95,
          riskScore: 18,
          status: 'secure',
          criticality: 'production-critical'
        },
        {
          id: '3',
          name: 'Protection Relay R-345',
          type: 'Protection Relay',
          site: 'Substation Beta',
          securityScore: 92,
          riskScore: 22,
          status: 'secure',
          criticality: 'safety-critical'
        }
      ]);

      setTopRiskAssets([
        {
          id: '4',
          name: 'Legacy RTU Unit 5',
          type: 'RTU',
          site: 'Remote Station C',
          securityScore: 35,
          riskScore: 85,
          status: 'vulnerable',
          criticality: 'production-critical'
        },
        {
          id: '5',
          name: 'Field Gateway GW-12',
          type: 'Gateway',
          site: 'Substation Gamma',
          securityScore: 42,
          riskScore: 78,
          status: 'at-risk',
          criticality: 'high'
        },
        {
          id: '6',
          name: 'Historian Server HS-01',
          type: 'Server',
          site: 'Data Center',
          securityScore: 48,
          riskScore: 72,
          status: 'at-risk',
          criticality: 'production-critical'
        }
      ]);

      // Convert alerts to recent alerts format
      setRecentAlerts(
        alerts.slice(0, 5).map(alert => ({
          id: alert.id,
          title: alert.alert_name,
          severity: alert.severity,
          timestamp: alert.created_at,
          source: alert.source_system || 'Security Monitor',
          status: alert.status
        }))
      );

    } catch (err) {
      console.error('Error loading security overview:', err);
      setError('Failed to load security overview data');
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadgeVariant = (score: number) => {
    if (score >= 80) return 'default';
    if (score >= 60) return 'secondary';
    return 'destructive';
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'degrading':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'text-red-600 bg-red-50';
      case 'high':
        return 'text-orange-600 bg-orange-50';
      case 'warning':
        return 'text-yellow-600 bg-yellow-50';
      default:
        return 'text-blue-600 bg-blue-50';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'secure':
        return 'text-green-600 bg-green-50';
      case 'at-risk':
        return 'text-yellow-600 bg-yellow-50';
      case 'vulnerable':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const navigateToFeature = (path: string) => {
    navigate(path);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading security overview...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert className="m-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!metrics) {
    return (
      <Alert className="m-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>No security data available</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Security Overview</h1>
          <p className="text-gray-600 mt-1">
            Comprehensive cybersecurity posture across all transmission assets and systems
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="text-sm">
            <Clock className="h-3 w-3 mr-1" />
            Last updated: {new Date().toLocaleTimeString()}
          </Badge>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Security Score</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <div className={`text-2xl font-bold ${getScoreColor(metrics.overallSecurityScore)}`}>
                {metrics.overallSecurityScore}%
              </div>
              {getTrendIcon(metrics.securityTrend)}
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full"
                style={{ width: `${metrics.overallSecurityScore}%` }}
              ></div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Asset Security</CardTitle>
            <Cpu className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.secureAssets}/{metrics.totalAssets}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.vulnerableAssets} vulnerable, {metrics.criticalAssets} critical
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{metrics.criticalAlerts}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.totalAlerts} total, {metrics.highAlerts} high priority
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compliance Score</CardTitle>
            <FileCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <div className={`text-2xl font-bold ${getScoreColor(metrics.complianceScore)}`}>
                {metrics.complianceScore}%
              </div>
              {getTrendIcon(metrics.complianceTrend)}
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics.compliantStandards}/{metrics.totalStandards} standards compliant
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="assets">Assets</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="identity">Identity</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
          <TabsTrigger value="features">Features</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Security Posture Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <ShieldCheck className="h-5 w-5 mr-2" />
                  Security Posture Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Sites Monitored</span>
                  <Badge variant="outline">{metrics.totalSites}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Security Zones</span>
                  <Badge variant="outline">{metrics.compliantZones}/{metrics.totalZones} compliant</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Active Users</span>
                  <Badge variant="outline">{metrics.activeUsers}/{metrics.totalUsers}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Active Sessions</span>
                  <Badge variant="outline">{metrics.activeSessions}</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Risk Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Target className="h-5 w-5 mr-2" />
                  Risk Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Overall Risk Score</span>
                  <Badge variant={getScoreBadgeVariant(100 - metrics.overallRiskScore)}>
                    {metrics.overallRiskScore}%
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Critical Risks</span>
                  <Badge variant="destructive">{metrics.criticalRisks}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Total Risks</span>
                  <Badge variant="outline">{metrics.totalRisks}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Risk Trend</span>
                  <div className="flex items-center space-x-1">
                    {getTrendIcon(metrics.riskTrend)}
                    <span className="text-sm capitalize">{metrics.riskTrend}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="assets" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Secure Assets */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
                  Top Secure Assets
                </CardTitle>
                <CardDescription>Best performing assets with highest security scores</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {topSecureAssets.map((asset) => (
                    <div key={asset.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium">{asset.name}</div>
                        <div className="text-sm text-gray-600">{asset.type} • {asset.site}</div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={getStatusColor(asset.status)}>
                          {asset.status}
                        </Badge>
                        <Badge variant="outline">{asset.securityScore}%</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Top Risk Assets */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertTriangle className="h-5 w-5 mr-2 text-red-600" />
                  Highest Risk Assets
                </CardTitle>
                <CardDescription>Assets requiring immediate attention</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {topRiskAssets.map((asset) => (
                    <div key={asset.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium">{asset.name}</div>
                        <div className="text-sm text-gray-600">{asset.type} • {asset.site}</div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={getStatusColor(asset.status)}>
                          {asset.status}
                        </Badge>
                        <Badge variant="destructive">Risk: {asset.riskScore}%</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bell className="h-5 w-5 mr-2" />
                Recent Security Alerts
              </CardTitle>
              <CardDescription>Latest security events and incidents</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentAlerts.map((alert) => (
                  <div key={alert.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium">{alert.title}</div>
                      <div className="text-sm text-gray-600">
                        {alert.source} • {new Date(alert.timestamp).toLocaleString()}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getSeverityColor(alert.severity)}>
                        {alert.severity}
                      </Badge>
                      <Badge variant="outline">{alert.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4">
                <Button
                  variant="outline"
                  onClick={() => navigateToFeature('/security/threats/alerts')}
                  className="w-full"
                >
                  View All Alerts
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="identity" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Users & Access</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Total Users</span>
                    <span className="font-medium">{metrics.totalUsers}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Active Users</span>
                    <span className="font-medium text-green-600">{metrics.activeUsers}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Active Sessions</span>
                    <span className="font-medium">{metrics.activeSessions}</span>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateToFeature('/security/identity/users')}
                  className="w-full mt-4"
                >
                  Manage Users
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Access Policies</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-2xl font-bold">12</div>
                  <p className="text-sm text-gray-600">Active Policies</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateToFeature('/security/identity/policies')}
                  className="w-full mt-4"
                >
                  View Policies
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Privileged Access</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-2xl font-bold">{metrics.activeSessions}</div>
                  <p className="text-sm text-gray-600">Active Sessions</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateToFeature('/security/identity/privileged')}
                  className="w-full mt-4"
                >
                  Monitor Access
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="compliance" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Compliance Standards</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>IEC 62443</span>
                    <Badge variant="default">Compliant</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>NERC CIP</span>
                    <Badge variant="secondary">Partial</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>NIST Framework</span>
                    <Badge variant="default">Compliant</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>ISO 27001</span>
                    <Badge variant="destructive">Non-Compliant</Badge>
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={() => navigateToFeature('/security/compliance/standards')}
                  className="w-full mt-4"
                >
                  View Standards
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Control Coverage</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span>Implemented Controls</span>
                      <span>85%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-green-600 h-2 rounded-full" style={{ width: '85%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span>Effective Controls</span>
                      <span>78%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-yellow-600 h-2 rounded-full" style={{ width: '78%' }}></div>
                    </div>
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={() => navigateToFeature('/security/posture/controls')}
                  className="w-full mt-4"
                >
                  View Controls
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="features" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature Set Cards */}
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigateToFeature('/security/posture/overview')}>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <ShieldCheck className="h-5 w-5 mr-2" />
                  Posture & Dashboards
                </CardTitle>
                <CardDescription>Security overview and site posture monitoring</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">5 features</span>
                  <ArrowRight className="h-4 w-4" />
                </div>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigateToFeature('/security/identity/users')}>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  Identity & Access
                </CardTitle>
                <CardDescription>User management and access control</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">8 features</span>
                  <ArrowRight className="h-4 w-4" />
                </div>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigateToFeature('/security/ot/zones')}>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Cpu className="h-5 w-5 mr-2" />
                  OT/IoT Security
                </CardTitle>
                <CardDescription>Operational technology security monitoring</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">8 features</span>
                  <ArrowRight className="h-4 w-4" />
                </div>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigateToFeature('/security/compliance/standards')}>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileCheck className="h-5 w-5 mr-2" />
                  Compliance & Governance
                </CardTitle>
                <CardDescription>Standards compliance and risk management</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">6 features</span>
                  <ArrowRight className="h-4 w-4" />
                </div>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigateToFeature('/security/threats/alerts')}>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <ShieldAlert className="h-5 w-5 mr-2" />
                  Threats & Incidents
                </CardTitle>
                <CardDescription>Security alerts and incident response</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">7 features</span>
                  <ArrowRight className="h-4 w-4" />
                </div>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigateToFeature('/security/logging/audit-log')}>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <ScrollText className="h-5 w-5 mr-2" />
                  Logging & Forensics
                </CardTitle>
                <CardDescription>Audit logs and forensic analysis</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">6 features</span>
                  <ArrowRight className="h-4 w-4" />
                </div>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigateToFeature('/security/platform/data-protection')}>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <HardDrive className="h-5 w-5 mr-2" />
                  Platform Protection
                </CardTitle>
                <CardDescription>Data protection and system hardening</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">5 features</span>
                  <ArrowRight className="h-4 w-4" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

