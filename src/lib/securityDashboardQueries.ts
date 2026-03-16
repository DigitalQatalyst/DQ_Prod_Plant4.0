/**
 * Security Dashboard Queries for Power Transmission Cybersecurity
 * 
 * Provides aggregation queries for security dashboards, posture monitoring, and KPI calculations.
 * Implements comprehensive security metrics across transmission sites.
 * Requirements: 1.1, 1.2
 */

import { supabase, isSupabaseConfigured } from './supabase';
import { mapTenantIdToUUID } from './tenantMapping';
import type {
  SecurityZone,
  OTAssetSecurity,
  SecurityAlert,
  RemoteAccessSession,
  NetworkExposureAssessment
} from '@/types/security';

/**
 * Security dashboard query error class
 */
export class SecurityDashboardQueryError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'SecurityDashboardQueryError';
  }
}

/**
 * Ensure Supabase is connected
 */
function ensureSupabaseConnected(): void {
  if (!isSupabaseConfigured() || !supabase) {
    throw new SecurityDashboardQueryError(
      'Supabase client not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.',
      'SUPABASE_NOT_CONFIGURED'
    );
  }
}

/**
 * Handle Supabase query errors
 */
function handleSupabaseError(error: unknown, operation: string): never {
  if (error && typeof error === 'object' && 'message' in error) {
    throw new SecurityDashboardQueryError(
      `${operation} failed: ${(error as { message: string }).message}`,
      (error as { code?: string }).code,
      error
    );
  }
  throw new SecurityDashboardQueryError(`${operation} failed: Unknown error`, 'UNKNOWN_ERROR', error);
}

// ============================================================================
// Security Metrics Aggregation
// ============================================================================

/**
 * Overall security metrics for a tenant
 */
export interface SecurityMetrics {
  totalAssets: number;
  criticalAssets: number;
  vulnerableAssets: number;
  secureAssets: number;
  atRiskAssets: number;
  totalZones: number;
  compliantZones: number;
  nonCompliantZones: number;
  totalAlerts: number;
  criticalAlerts: number;
  highAlerts: number;
  activeSessions: number;
  highExposureAssets: number;
  averageRiskScore: number;
  overallSecurityScore: number;
}

/**
 * Site-specific security posture
 */
export interface SiteSecurityPosture {
  siteId: string;
  siteName: string;
  siteType: string;
  totalAssets: number;
  criticalAssets: number;
  vulnerableAssets: number;
  securityScore: number;
  riskScore: number;
  complianceStatus: 'compliant' | 'non-compliant' | 'partial';
  openAlerts: number;
  criticalAlerts: number;
  lastAssessment: string;
  zones: number;
  compliantZones: number;
}

/**
 * Zone security summary
 */
export interface ZoneSecuritySummary {
  zoneId: string;
  zoneName: string;
  zoneType: string;
  securityLevel: number;
  assetCount: number;
  vulnerableAssets: number;
  complianceStatus: 'compliant' | 'non-compliant' | 'partial';
  riskScore: number;
  lastAssessment: string;
}

/**
 * Asset criticality breakdown
 */
export interface AssetCriticalityBreakdown {
  safetyCritical: number;
  productionCritical: number;
  high: number;
  medium: number;
  low: number;
  total: number;
}

/**
 * Security status breakdown
 */
export interface SecurityStatusBreakdown {
  secure: number;
  atRisk: number;
  vulnerable: number;
  total: number;
}

/**
 * Alert severity breakdown
 */
export interface AlertSeverityBreakdown {
  critical: number;
  high: number;
  warning: number;
  info: number;
  total: number;
}

/**
 * Get overall security metrics for a tenant
 */
export async function getSecurityMetrics(tenantId: string): Promise<SecurityMetrics> {
  ensureSupabaseConnected();

  try {
    // Map frontend tenant ID to Supabase UUID
    const tenantUUID = await mapTenantIdToUUID(tenantId);

    // If tenant not in Supabase, return empty metrics
    if (!tenantUUID) {
      return {
        totalAssets: 0,
        criticalAssets: 0,
        vulnerableAssets: 0,
        secureAssets: 0,
        atRiskAssets: 0,
        totalZones: 0,
        compliantZones: 0,
        nonCompliantZones: 0,
        totalAlerts: 0,
        criticalAlerts: 0,
        highAlerts: 0,
        activeSessions: 0,
        highExposureAssets: 0,
        averageRiskScore: 0,
        overallSecurityScore: 0
      };
    }

    // Get asset counts
    const { data: assets, error: assetsError } = await supabase!
      .from('ot_asset_security')
      .select('criticality, security_status, risk_score')
      .eq('tenant_id', tenantUUID);

    if (assetsError) {
      handleSupabaseError(assetsError, 'Get asset metrics');
    }

    // Get zone counts
    const { data: zones, error: zonesError } = await supabase!
      .from('security_zones')
      .select('compliance_status')
      .eq('tenant_id', tenantUUID);

    if (zonesError) {
      handleSupabaseError(zonesError, 'Get zone metrics');
    }

    // Get alert counts
    const { data: alerts, error: alertsError } = await supabase!
      .from('security_alerts')
      .select('severity, status')
      .eq('tenant_id', tenantUUID)
      .in('status', ['new', 'acknowledged', 'in-progress']);

    if (alertsError) {
      handleSupabaseError(alertsError, 'Get alert metrics');
    }

    // Get active sessions count
    const { count: activeSessions, error: sessionsError } = await supabase!
      .from('remote_access_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantUUID)
      .eq('status', 'active');

    if (sessionsError) {
      handleSupabaseError(sessionsError, 'Get session metrics');
    }

    // Get high exposure assets count
    const { count: highExposure, error: exposureError } = await supabase!
      .from('network_exposure_assessments')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantUUID)
      .eq('exposure_level', 'high');

    if (exposureError) {
      handleSupabaseError(exposureError, 'Get exposure metrics');
    }

    // Calculate metrics
    const totalAssets = assets?.length || 0;
    const criticalAssets = assets?.filter(a =>
      a.criticality === 'safety-critical' || a.criticality === 'production-critical'
    ).length || 0;
    const vulnerableAssets = assets?.filter(a => a.security_status === 'vulnerable').length || 0;
    const secureAssets = assets?.filter(a => a.security_status === 'secure').length || 0;
    const atRiskAssets = assets?.filter(a => a.security_status === 'at-risk').length || 0;

    const totalZones = zones?.length || 0;
    const compliantZones = zones?.filter(z => z.compliance_status === 'compliant').length || 0;
    const nonCompliantZones = zones?.filter(z => z.compliance_status === 'non-compliant').length || 0;

    const totalAlerts = alerts?.length || 0;
    const criticalAlerts = alerts?.filter(a => a.severity === 'critical').length || 0;
    const highAlerts = alerts?.filter(a => a.severity === 'high').length || 0;

    // Calculate average risk score
    const riskScores = assets?.map(a => a.risk_score || 0) || [];
    const averageRiskScore = riskScores.length > 0
      ? riskScores.reduce((sum, score) => sum + score, 0) / riskScores.length
      : 0;

    // Calculate overall security score (0-100, higher is better)
    const securityScore = totalAssets > 0
      ? Math.round(
        ((secureAssets / totalAssets) * 40) +
        ((compliantZones / Math.max(totalZones, 1)) * 30) +
        ((1 - (criticalAlerts / Math.max(totalAlerts, 1))) * 20) +
        ((1 - (averageRiskScore / 100)) * 10)
      )
      : 0;

    return {
      totalAssets,
      criticalAssets,
      vulnerableAssets,
      secureAssets,
      atRiskAssets,
      totalZones,
      compliantZones,
      nonCompliantZones,
      totalAlerts,
      criticalAlerts,
      highAlerts,
      activeSessions: activeSessions || 0,
      highExposureAssets: highExposure || 0,
      averageRiskScore: Math.round(averageRiskScore),
      overallSecurityScore: securityScore
    };
  } catch (error) {
    if (error instanceof SecurityDashboardQueryError) {
      throw error;
    }
    handleSupabaseError(error, 'Get security metrics');
  }
}

/**
 * Get security posture for all sites
 */
export async function getSiteSecurityPostures(tenantId: string): Promise<SiteSecurityPosture[]> {
  ensureSupabaseConnected();

  try {
    // Map frontend tenant ID to Supabase UUID
    const tenantUUID = await mapTenantIdToUUID(tenantId);

    // If tenant not in Supabase, return empty array (will use mock data)
    if (!tenantUUID) {
      return [];
    }

    // Get all sites for the tenant
    const { data: sites, error: sitesError } = await supabase!
      .from('sites')
      .select('id, name, site_type')
      .eq('tenant_id', tenantUUID);

    if (sitesError) {
      handleSupabaseError(sitesError, 'Get sites');
    }

    if (!sites || sites.length === 0) {
      return [];
    }

    // Get security data for each site
    const sitePostures: SiteSecurityPosture[] = [];

    for (const site of sites) {
      // Filter out rogue "Overview" sites if they exist in DB
      if (site.name === 'Overview' || site.name === 'Overview Item') {
        continue;
      }

      // Get zones for this site
      const { data: zones, error: zonesError } = await supabase!
        .from('security_zones')
        .select('id, compliance_status')
        .eq('tenant_id', tenantUUID)
        .eq('site_id', site.id);

      if (zonesError) {
        console.error(`Error getting zones for site ${site.id}:`, zonesError);
        continue;
      }

      // Get assets for this site through zones
      const zoneIds = zones?.map(z => z.id) || [];
      let assets: any[] = [];

      if (zoneIds.length > 0) {
        const { data: assetData, error: assetsError } = await supabase!
          .from('ot_asset_security')
          .select('criticality, security_status, risk_score')
          .eq('tenant_id', tenantUUID)
          .in('zone_id', zoneIds);

        if (assetsError) {
          console.error(`Error getting assets for site ${site.id}:`, assetsError);
        } else {
          assets = assetData || [];
        }
      }

      // Get alerts for this site
      const { data: alerts, error: alertsError } = await supabase!
        .from('security_alerts')
        .select('severity, status')
        .eq('tenant_id', tenantUUID)
        .eq('site_id', site.id)
        .in('status', ['new', 'acknowledged', 'in-progress']);

      if (alertsError) {
        console.error(`Error getting alerts for site ${site.id}:`, alertsError);
      }

      // Calculate site metrics
      const totalAssets = assets.length;
      const criticalAssets = assets.filter(a =>
        a.criticality === 'safety-critical' || a.criticality === 'production-critical'
      ).length;
      const vulnerableAssets = assets.filter(a => a.security_status === 'vulnerable').length;

      const totalZones = zones?.length || 0;
      const compliantZones = zones?.filter(z => z.compliance_status === 'compliant').length || 0;

      const openAlerts = alerts?.length || 0;
      const criticalAlerts = alerts?.filter(a => a.severity === 'critical').length || 0;

      // Calculate average risk score
      const riskScores = assets.map(a => a.risk_score || 0);
      const avgRiskScore = riskScores.length > 0
        ? riskScores.reduce((sum, score) => sum + score, 0) / riskScores.length
        : 0;

      // Calculate security score
      const securityScore = totalAssets > 0
        ? Math.round(
          ((1 - (vulnerableAssets / totalAssets)) * 40) +
          ((compliantZones / Math.max(totalZones, 1)) * 30) +
          ((1 - (criticalAlerts / Math.max(openAlerts, 1))) * 30)
        )
        : 0;

      // Determine compliance status
      let complianceStatus: 'compliant' | 'non-compliant' | 'partial' = 'compliant';
      if (totalZones > 0) {
        const complianceRatio = compliantZones / totalZones;
        if (complianceRatio < 0.5) {
          complianceStatus = 'non-compliant';
        } else if (complianceRatio < 1.0) {
          complianceStatus = 'partial';
        }
      }

      sitePostures.push({
        siteId: site.id,
        siteName: site.name,
        siteType: site.site_type || 'unknown',
        totalAssets,
        criticalAssets,
        vulnerableAssets,
        securityScore,
        riskScore: Math.round(avgRiskScore),
        complianceStatus,
        openAlerts,
        criticalAlerts,
        lastAssessment: new Date().toISOString(),
        zones: totalZones,
        compliantZones
      });
    }

    return sitePostures;
  } catch (error) {
    if (error instanceof SecurityDashboardQueryError) {
      throw error;
    }
    handleSupabaseError(error, 'Get site security postures');
  }
}

/**
 * Get security summary for all zones
 */
export async function getZoneSecuritySummaries(tenantId: string): Promise<ZoneSecuritySummary[]> {
  ensureSupabaseConnected();

  try {
    // Map frontend tenant ID to Supabase UUID
    const tenantUUID = await mapTenantIdToUUID(tenantId);

    // If tenant not in Supabase, return empty array
    if (!tenantUUID) {
      return [];
    }

    // Get all zones
    const { data: zones, error: zonesError } = await supabase!
      .from('security_zones')
      .select('id, name, zone_type, security_level, asset_count, compliance_status')
      .eq('tenant_id', tenantUUID);

    if (zonesError) {
      handleSupabaseError(zonesError, 'Get zones');
    }

    if (!zones || zones.length === 0) {
      return [];
    }

    // Get asset security data for each zone
    const zoneSummaries: ZoneSecuritySummary[] = [];

    for (const zone of zones) {
      const { data: assets, error: assetsError } = await supabase!
        .from('ot_asset_security')
        .select('security_status, risk_score')
        .eq('tenant_id', tenantUUID)
        .eq('zone_id', zone.id);

      if (assetsError) {
        console.error(`Error getting assets for zone ${zone.id}:`, assetsError);
        continue;
      }

      const vulnerableAssets = assets?.filter(a => a.security_status === 'vulnerable').length || 0;
      const riskScores = assets?.map(a => a.risk_score || 0) || [];
      const avgRiskScore = riskScores.length > 0
        ? riskScores.reduce((sum, score) => sum + score, 0) / riskScores.length
        : 0;

      zoneSummaries.push({
        zoneId: zone.id,
        zoneName: zone.name,
        zoneType: zone.zone_type,
        securityLevel: zone.security_level,
        assetCount: zone.asset_count || 0,
        vulnerableAssets,
        complianceStatus: zone.compliance_status,
        riskScore: Math.round(avgRiskScore),
        lastAssessment: new Date().toISOString()
      });
    }

    return zoneSummaries;
  } catch (error) {
    if (error instanceof SecurityDashboardQueryError) {
      throw error;
    }
    handleSupabaseError(error, 'Get zone security summaries');
  }
}

/**
 * Get asset criticality breakdown
 */
export async function getAssetCriticalityBreakdown(tenantId: string): Promise<AssetCriticalityBreakdown> {
  ensureSupabaseConnected();

  try {
    const tenantUUID = await mapTenantIdToUUID(tenantId);
    if (!tenantUUID) {
      return { safetyCritical: 0, productionCritical: 0, high: 0, medium: 0, low: 0, total: 0 };
    }

    const { data: assets, error } = await supabase!
      .from('ot_asset_security')
      .select('criticality')
      .eq('tenant_id', tenantUUID);

    if (error) {
      handleSupabaseError(error, 'Get asset criticality breakdown');
    }

    const breakdown = {
      safetyCritical: assets?.filter(a => a.criticality === 'safety-critical').length || 0,
      productionCritical: assets?.filter(a => a.criticality === 'production-critical').length || 0,
      high: assets?.filter(a => a.criticality === 'high').length || 0,
      medium: assets?.filter(a => a.criticality === 'medium').length || 0,
      low: assets?.filter(a => a.criticality === 'low').length || 0,
      total: assets?.length || 0
    };

    return breakdown;
  } catch (error) {
    if (error instanceof SecurityDashboardQueryError) {
      throw error;
    }
    handleSupabaseError(error, 'Get asset criticality breakdown');
  }
}

/**
 * Get security status breakdown
 */
export async function getSecurityStatusBreakdown(tenantId: string): Promise<SecurityStatusBreakdown> {
  ensureSupabaseConnected();

  try {
    const tenantUUID = await mapTenantIdToUUID(tenantId);
    if (!tenantUUID) {
      return { secure: 0, atRisk: 0, vulnerable: 0, total: 0 };
    }

    const { data: assets, error } = await supabase!
      .from('ot_asset_security')
      .select('security_status')
      .eq('tenant_id', tenantUUID);

    if (error) {
      handleSupabaseError(error, 'Get security status breakdown');
    }

    const breakdown = {
      secure: assets?.filter(a => a.security_status === 'secure').length || 0,
      atRisk: assets?.filter(a => a.security_status === 'at-risk').length || 0,
      vulnerable: assets?.filter(a => a.security_status === 'vulnerable').length || 0,
      total: assets?.length || 0
    };

    return breakdown;
  } catch (error) {
    if (error instanceof SecurityDashboardQueryError) {
      throw error;
    }
    handleSupabaseError(error, 'Get security status breakdown');
  }
}

/**
 * Get alert severity breakdown
 */
export async function getAlertSeverityBreakdown(tenantId: string): Promise<AlertSeverityBreakdown> {
  ensureSupabaseConnected();

  try {
    const tenantUUID = await mapTenantIdToUUID(tenantId);
    if (!tenantUUID) {
      return { critical: 0, high: 0, warning: 0, info: 0, total: 0 };
    }

    const { data: alerts, error } = await supabase!
      .from('security_alerts')
      .select('severity')
      .eq('tenant_id', tenantUUID)
      .in('status', ['new', 'acknowledged', 'in-progress']);

    if (error) {
      handleSupabaseError(error, 'Get alert severity breakdown');
    }

    const breakdown = {
      critical: alerts?.filter(a => a.severity === 'critical').length || 0,
      high: alerts?.filter(a => a.severity === 'high').length || 0,
      warning: alerts?.filter(a => a.severity === 'warning').length || 0,
      info: alerts?.filter(a => a.severity === 'info').length || 0,
      total: alerts?.length || 0
    };

    return breakdown;
  } catch (error) {
    if (error instanceof SecurityDashboardQueryError) {
      throw error;
    }
    handleSupabaseError(error, 'Get alert severity breakdown');
  }
}

/**
 * Get security posture for a specific site
 */
export async function getSiteSecurityPosture(
  tenantId: string,
  siteId: string
): Promise<SiteSecurityPosture | null> {
  ensureSupabaseConnected();

  try {
    const postures = await getSiteSecurityPostures(tenantId);
    return postures.find(p => p.siteId === siteId) || null;
  } catch (error) {
    if (error instanceof SecurityDashboardQueryError) {
      throw error;
    }
    handleSupabaseError(error, 'Get site security posture');
  }
}
/**
 * Get top critical assets for a tenant
 */
export async function getTopCriticalAssets(tenantId: string, limit: number = 5): Promise<any[]> {
  ensureSupabaseConnected();

  try {
    const tenantUUID = await mapTenantIdToUUID(tenantId);
    if (!tenantUUID) {
      return [];
    }

    const { data, error } = await supabase!
      .from('ot_asset_security')
      .select(`
        *,
        asset:assets(id, name, site:sites(id, name))
      `)
      .eq('tenant_id', tenantUUID)
      .order('risk_score', { ascending: false })
      .limit(limit);

    if (error) {
      handleSupabaseError(error, 'Get top critical assets');
    }

    return (data || []).map(item => ({
      id: item.id,
      name: item.asset?.name || 'Unknown Asset',
      siteName: item.asset?.site?.name || 'Unknown Site',
      criticality: item.criticality,
      securityStatus: item.security_status,
      riskScore: item.risk_score,
      vulnerabilities: item.vulnerability_count || 0,
      type: item.asset?.name?.includes('Relay') ? 'Protection Relay' :
        item.asset?.name?.includes('RTU') ? 'RTU' :
          item.asset?.name?.includes('Transformer') ? 'Transformer' :
            item.asset?.name?.includes('Breaker') ? 'Breaker' : 'OT Asset'
    }));
  } catch (error) {
    if (error instanceof SecurityDashboardQueryError) {
      throw error;
    }
    handleSupabaseError(error, 'Get top critical assets');
  }
}
