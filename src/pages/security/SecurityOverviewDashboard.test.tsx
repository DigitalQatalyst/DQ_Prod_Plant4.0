import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within, waitFor } from '@testing-library/react';
import { SecurityOverviewDashboard } from './SecurityOverviewDashboard';
import React from 'react';
import * as securityDashboardQueries from '@/lib/securityDashboardQueries';
import * as supabaseModule from '@/lib/supabase';

// Mock the AppContext - using transmission tenant
const mockTenant = { id: 'dewa-transmission', name: 'DEWA Transmission', industry: 'utilities' };
const mockSetCurrentTenant = vi.fn();

vi.mock('@/context/AppContext', () => ({
  useApp: () => ({
    currentTenant: mockTenant,
    setCurrentTenant: mockSetCurrentTenant,
  }),
}));

// Mock tenant mapping directly to avoid supabase issues in tests
vi.mock('@/lib/tenantMapping', () => ({
  mapTenantIdToUUID: vi.fn().mockResolvedValue('dewa-transmission-uuid'),
  isTenantInSupabase: vi.fn().mockResolvedValue(true),
  clearTenantIdCache: vi.fn(),
}));

// Mock Supabase
vi.mock('@/lib/supabase', () => {
  const queryChain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data: { id: 'dewa-transmission-uuid' }, error: null }),
    limit: vi.fn().mockResolvedValue({
      data: [
        {
          id: 'alert-1',
          title: 'Unauthorized Relay Configuration Change',
          description: 'Protection relay settings modified without authorization',
          severity: 'critical',
          status: 'new',
          created_at: '2024-01-15T10:00:00Z',
          detected_by: 'IDS System',
          affected_asset_id: 'relay-001',
        },
      ],
      error: null,
    }),
  };

  return {
    supabase: {
      from: vi.fn().mockReturnValue(queryChain),
    },
    isSupabaseConfigured: vi.fn().mockReturnValue(true),
    getDataBackend: vi.fn().mockReturnValue('mock'),
  };
});

// Mock security dashboard queries
vi.mock('@/lib/securityDashboardQueries', () => ({
  getSecurityMetrics: vi.fn(),
  getSiteSecurityPostures: vi.fn(),
  getAlertSeverityBreakdown: vi.fn(),
  getTopCriticalAssets: vi.fn(),
}));

// Mock the layout components to simplify testing
vi.mock('@/components/shared/StatusBadge', () => ({
  StatusBadge: ({ status }: any) => <div data-testid="status-badge">{status}</div>,
}));

vi.mock('@/components/security/IdentityOverview', () => ({
  IdentityOverview: ({ title, description, metrics, children }: any) => (
    <div data-testid="identity-overview">
      <div data-testid="io-title">{title}</div>
      <div data-testid="io-description">{description}</div>
      <div data-testid="io-metrics">
        {metrics?.map((m: any, i: number) => (
          <div key={i} data-testid={`metric-${m.title.toLowerCase().replace(/ /g, '-')}`}>
            <span>{m.title}</span>
            <span>{m.value}</span>
            <span>{m.subtitle}</span>
          </div>
        ))}
      </div>
      {children}
    </div>
  ),
}));

vi.mock('@/components/security/FeatureOverviewCharts', () => ({
  FeatureOverviewCharts: ({ pieChartTitle, pieChartData, barChartTitle, barChartData, keyAreas, recentActivity }: any) => (
    <div data-testid="feature-charts">
      <div data-testid="pie-title">{pieChartTitle}</div>
      <div data-testid="pie-data">
        {pieChartData?.map((d: any) => (
          <div key={d.name}>{d.name}: {d.value}</div>
        ))}
      </div>
      <div data-testid="bar-title">{barChartTitle}</div>
      <div data-testid="bar-data">
        {barChartData?.map((d: any) => (
          <div key={d.name}>{d.name}: {d.value}</div>
        ))}
      </div>
      <div data-testid="key-areas">
        {keyAreas?.map((area: any, i: number) => (
          <div key={i}>{area.title}</div>
        ))}
      </div>
      <div data-testid="recent-activity">
        {recentActivity?.map((act: any) => (
          <div key={act.id}>{act.title}</div>
        ))}
      </div>
    </div>
  ),
}));
vi.mock('@/components/layout/ListPane', () => ({
  ListPane: ({ children, title, subtitle, context }: any) => (
    <div data-testid="list-pane">
      <div data-testid="list-pane-title">{title}</div>
      <div data-testid="list-pane-subtitle">{context || subtitle}</div>
      {children}
    </div>
  ),
}));

vi.mock('@/components/layout/WorkPane', () => ({
  WorkPane: ({ title, subtitle, tabs }: any) => {
    const [activeTabId, setActiveTabId] = React.useState(tabs?.[0]?.id);
    const activeTab = tabs?.find((t: any) => t.id === activeTabId);

    return (
      <div data-testid="work-pane">
        <div data-testid="work-pane-title">{title}</div>
        <div data-testid="work-pane-subtitle">{subtitle}</div>
        <div role="tablist" className="flex gap-2 mb-4">
          {tabs?.map((tab: any) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTabId === tab.id}
              onClick={() => setActiveTabId(tab.id)}
              className="px-4 py-2 border-b-2 transition-colors"
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div data-testid="active-tab-content">
          {activeTab?.content}
        </div>
      </div>
    );
  },
}));

/**
 * Unit Tests for SecurityOverviewDashboard Component (Transmission Context)
 * Requirements: 1.1, 1.2, 10.1
 */
describe('SecurityOverviewDashboard Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default mock responses
    vi.mocked(securityDashboardQueries.getSecurityMetrics).mockResolvedValue({
      totalAssets: 150,
      criticalAssets: 45,
      vulnerableAssets: 12,
      secureAssets: 120,
      atRiskAssets: 18,
      totalZones: 8,
      compliantZones: 6,
      nonCompliantZones: 2,
      totalAlerts: 23,
      criticalAlerts: 5,
      highAlerts: 8,
      activeSessions: 3,
      highExposureAssets: 7,
      averageRiskScore: 42,
      overallSecurityScore: 78,
    });

    vi.mocked(securityDashboardQueries.getSiteSecurityPostures).mockResolvedValue([
      {
        siteId: 'site-1',
        siteName: 'Al Quoz Substation',
        siteType: 'substation',
        totalAssets: 50,
        criticalAssets: 15,
        vulnerableAssets: 4,
        securityScore: 82,
        riskScore: 38,
        complianceStatus: 'compliant' as const,
        openAlerts: 8,
        criticalAlerts: 2,
        lastAssessment: '2024-01-15T10:00:00Z',
        zones: 3,
        compliantZones: 3,
      },
      {
        siteId: 'site-2',
        siteName: 'Jebel Ali Grid Station',
        siteType: 'grid-station',
        totalAssets: 40,
        criticalAssets: 12,
        vulnerableAssets: 3,
        securityScore: 75,
        riskScore: 45,
        complianceStatus: 'partial' as const,
        openAlerts: 6,
        criticalAlerts: 1,
        lastAssessment: '2024-01-15T10:00:00Z',
        zones: 2,
        compliantZones: 1,
      },
    ]);

    vi.mocked(securityDashboardQueries.getAlertSeverityBreakdown).mockResolvedValue({
      critical: 5,
      high: 8,
      warning: 7,
      info: 3,
      total: 23,
    });

    vi.mocked(securityDashboardQueries.getTopCriticalAssets).mockResolvedValue([
      {
        id: 'asset-1',
        name: 'Main GT Transformer T1',
        siteName: 'Al Quoz Substation',
        type: 'Transformer',
        criticality: 'safety-critical',
        securityStatus: 'vulnerable',
        riskScore: 88,
        vulnerabilities: 4,
      },
    ]);
  });

  describe('Component Rendering', () => {
    it('should render without errors', async () => {
      const { container } = render(<SecurityOverviewDashboard />);
      await waitFor(() => {
        expect(container).toBeTruthy();
      });
    });

    it('should render ListPane with correct title and subtitle', async () => {
      render(<SecurityOverviewDashboard />);

      await waitFor(() => {
        expect(screen.getByTestId('list-pane-title')).toHaveTextContent('Security Areas');
        expect(screen.getByTestId('list-pane-subtitle')).toHaveTextContent(/DEWA.*Transmission/);
      });
    });

    it('should render WorkPane with correct title and subtitle for transmission', async () => {
      render(<SecurityOverviewDashboard />);

      await waitFor(() => {
        expect(screen.getByTestId('work-pane-title')).toHaveTextContent(/Security Overview Dashboard/i);
        expect(screen.getByTestId('work-pane-subtitle')).toHaveTextContent(/Power Transmission.*DEWA Transmission/i);
      });
    });

    it('should render quick access links in ListPane', async () => {
      render(<SecurityOverviewDashboard />);

      await waitFor(() => {
        const listPane = screen.getByTestId('list-pane');

        expect(within(listPane).getByText('Security Alerts')).toBeInTheDocument();
        expect(within(listPane).getByText('Security Score')).toBeInTheDocument();
        expect(within(listPane).getByText('Critical Assets')).toBeInTheDocument();
        expect(within(listPane).getByText('Active Sessions')).toBeInTheDocument();
        expect(within(listPane).getByText('Transmission Sites')).toBeInTheDocument();
      });
    });
  });

  describe('Workspace Tabs', () => {
    it('should display the Overview and Recent Alerts tabs', async () => {
      render(<SecurityOverviewDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Overview')).toBeInTheDocument();
        expect(screen.getByText('Recent Alerts')).toBeInTheDocument();
      });
    });
  });

  describe('KPI Cards Display', () => {
    it('should display Total Alerts KPI card', async () => {
      render(<SecurityOverviewDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Total Alerts')).toBeInTheDocument();
      });
    });

    it('should display Security Score KPI card for transmission', async () => {
      render(<SecurityOverviewDashboard />);

      await waitFor(() => {
        expect(screen.getAllByText('Security Score').length).toBeGreaterThan(0);
      });
    });

    it('should display Critical Assets KPI card with transmission asset types', async () => {
      render(<SecurityOverviewDashboard />);

      await waitFor(() => {
        expect(screen.getAllByText('Critical Assets').length).toBeGreaterThan(0);
        expect(screen.getByText('Transformers, Relays, RTUs')).toBeInTheDocument();
      });
    });

    it('should display Active Sessions KPI card', async () => {
      render(<SecurityOverviewDashboard />);

      await waitFor(() => {
        expect(screen.getAllByText('Active Sessions').length).toBeGreaterThan(0);
      });
    });

    it('should display transmission-specific compliance standards', async () => {
      render(<SecurityOverviewDashboard />);

      await waitFor(() => {
        expect(screen.getByText('IEC 62443, NERC CIP')).toBeInTheDocument();
      });
    });
  });

  describe('Alert Severity Breakdown', () => {
    it('should display alert severity breakdown section for transmission sites', async () => {
      render(<SecurityOverviewDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Alert Severity Breakdown Across Transmission Sites')).toBeInTheDocument();
      });
    });

    it('should display all severity levels', async () => {
      render(<SecurityOverviewDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Critical')).toBeInTheDocument();
        expect(screen.getByText('High')).toBeInTheDocument();
        expect(screen.getByText('Warning')).toBeInTheDocument();
        expect(screen.getByText('Info')).toBeInTheDocument();
      });
    });
  });

  describe('Recent Security Events', () => {
    it('should display recent security events section for transmission', async () => {
      render(<SecurityOverviewDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Recent Transmission Security Events')).toBeInTheDocument();
      });
    });

    it('should display transmission security event titles', async () => {
      render(<SecurityOverviewDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Unauthorized Relay Configuration Change')).toBeInTheDocument();
      });
    });
  });

  describe('Top Critical Assets', () => {
    it('should display top critical assets section with transmission asset types', async () => {
      render(<SecurityOverviewDashboard />);

      await waitFor(() => {
        expect(screen.getByText(/Top 5 Critical Transmission Assets/i)).toBeInTheDocument();
      });
    });

    it('should display asset table headers', async () => {
      render(<SecurityOverviewDashboard />);

      await waitFor(() => {
        expect(screen.getByText(/Asset Name/i)).toBeInTheDocument();
        expect(screen.getByText(/Type/i)).toBeInTheDocument();
        expect(screen.getByText(/Site/i)).toBeInTheDocument();
        expect(screen.getByText(/Risk Score/i)).toBeInTheDocument();
      });
    });
  });

  describe('Transmission Site Type Filtering', () => {
    it('should display site type filter buttons', async () => {
      render(<SecurityOverviewDashboard />);

      await waitFor(() => {
        expect(screen.getByText(/All Sites/)).toBeInTheDocument();
        expect(screen.getByText(/Substations/)).toBeInTheDocument();
        expect(screen.getByText(/Grid Stations/)).toBeInTheDocument();
        expect(screen.getByText(/Regional Hubs/)).toBeInTheDocument();
      });
    });
  });

  describe('Tenant Context Integration', () => {
    it('should use current tenant from context', async () => {
      render(<SecurityOverviewDashboard />);

      await waitFor(() => {
        expect(screen.getByText('DEWA Transmission')).toBeInTheDocument();
      });
    });
  });
});

