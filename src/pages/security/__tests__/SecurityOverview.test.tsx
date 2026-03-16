/**
 * SecurityOverview Component Tests
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SecurityOverview } from '../SecurityOverview';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the query functions
vi.mock('@/lib/securityDashboardQueries', () => ({
  getSecurityMetrics: vi.fn().mockResolvedValue({
    overallSecurityScore: 85,
    totalAssets: 150,
    criticalAssets: 25,
    vulnerableAssets: 8,
    secureAssets: 142,
    totalAlerts: 12,
    criticalAlerts: 2,
    highAlerts: 4,
    activeSessions: 3,
    totalZones: 8,
    compliantZones: 6
  }),
  getSiteSecurityPostures: vi.fn().mockResolvedValue([
    {
      siteId: '1',
      siteName: 'Substation Alpha',
      siteType: 'substation',
      totalAssets: 50,
      criticalAssets: 10,
      vulnerableAssets: 2,
      securityScore: 88,
      riskScore: 25,
      complianceStatus: 'compliant',
      openAlerts: 3,
      criticalAlerts: 0,
      lastAssessment: '2024-01-15T10:00:00Z',
      zones: 3,
      compliantZones: 3
    }
  ]),
  getAssetCriticalityBreakdown: vi.fn().mockResolvedValue({
    safetyCritical: 15,
    productionCritical: 10,
    high: 25,
    medium: 50,
    low: 50,
    total: 150
  }),
  getSecurityStatusBreakdown: vi.fn().mockResolvedValue({
    secure: 142,
    atRisk: 6,
    vulnerable: 2,
    total: 150
  }),
  getAlertSeverityBreakdown: vi.fn().mockResolvedValue({
    critical: 2,
    high: 4,
    warning: 4,
    info: 2,
    total: 12
  })
}));

vi.mock('@/lib/riskComplianceQueries', () => ({
  getLatestRiskComplianceSummary: vi.fn().mockResolvedValue({
    data: {
      overall_compliance_score: 78,
      compliant_standards: 3,
      total_standards: 4,
      overall_risk_score: 35,
      critical_risks: 2,
      total_risks: 15,
      security_posture_trend: 'improving',
      compliance_trend: 'stable',
      risk_trend: 'improving'
    }
  })
}));

vi.mock('@/lib/securityQueries', () => ({
  getSecurityUsers: vi.fn().mockResolvedValue([
    { id: '1', status: 'active', fullName: 'John Doe' },
    { id: '2', status: 'active', fullName: 'Jane Smith' },
    { id: '3', status: 'inactive', fullName: 'Bob Johnson' }
  ]),
  getAccessPolicies: vi.fn().mockResolvedValue([
    { id: '1', name: 'Admin Policy' },
    { id: '2', name: 'Operator Policy' }
  ]),
  getPrivilegedAccessSessions: vi.fn().mockResolvedValue([
    { id: '1', status: 'active' },
    { id: '2', status: 'active' },
    { id: '3', status: 'expired' }
  ])
}));

vi.mock('@/lib/threatMonitoringQueries', () => ({
  getSecurityAlerts: vi.fn().mockResolvedValue([
    {
      id: '1',
      alert_name: 'Unauthorized Access Attempt',
      severity: 'critical',
      created_at: '2024-01-15T10:00:00Z',
      source_system: 'IDS',
      status: 'new'
    },
    {
      id: '2',
      alert_name: 'Suspicious Network Traffic',
      severity: 'high',
      created_at: '2024-01-15T09:30:00Z',
      source_system: 'Firewall',
      status: 'acknowledged'
    }
  ])
}));

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = createTestQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('SecurityOverview', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders any security overview page content', async () => {
    render(
      <TestWrapper>
        <SecurityOverview />
      </TestWrapper>
    );

    // Check for main heading
    expect(screen.getByText('Security Overview')).toBeInTheDocument();
  });
});
