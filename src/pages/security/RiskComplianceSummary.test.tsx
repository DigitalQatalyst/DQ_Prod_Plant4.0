import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within, waitFor } from '@testing-library/react';
import { RiskComplianceSummary } from './RiskComplianceSummary';
import React from 'react';

// Mock the AppContext
const mockTenant = { id: 't1', name: 'Dubai Electricity and Water Authority', industry: 'Power Transmission' };
const mockSetCurrentTenant = vi.fn();

vi.mock('@/context/AppContext', () => ({
  useApp: () => ({
    currentTenant: mockTenant,
    setCurrentTenant: mockSetCurrentTenant,
  }),
}));

// Mock the Supabase query functions
const mockSummary = {
  id: 'summary-1',
  tenant_id: 't1',
  site_id: null,
  summary_name: 'Q4 2023 DEWA Cybersecurity Risk & Compliance Summary',
  summary_date: '2024-01-05',
  reporting_period_start: '2023-10-01',
  reporting_period_end: '2023-12-31',
  summary_type: 'quarterly' as const,
  total_risks: 45,
  critical_risks: 3,
  high_risks: 12,
  medium_risks: 22,
  low_risks: 8,
  mitigated_risks: 28,
  accepted_risks: 5,
  overall_risk_score: 42.50,
  inherent_risk_score: 68.00,
  residual_risk_score: 42.50,
  risk_appetite_threshold: 50.00,
  risk_tolerance_exceeded: false,
  total_standards: 5,
  compliant_standards: 3,
  partial_compliant_standards: 2,
  non_compliant_standards: 0,
  overall_compliance_score: 88.40,
  iec_62443_score: 88.24,
  nerc_cip_score: 91.67,
  total_controls: 300,
  implemented_controls: 251,
  partial_controls: 36,
  not_implemented_controls: 13,
  control_effectiveness_score: 86.75,
  total_incidents: 8,
  critical_incidents: 1,
  resolved_incidents: 6,
  total_alerts: 127,
  critical_alerts: 8,
  total_assets: 850,
  critical_assets: 285,
  vulnerable_assets: 45,
  secure_assets: 805,
  risk_trend: 'improving' as const,
  compliance_trend: 'stable' as const,
  security_posture_trend: 'improving' as const,
  executive_summary: 'DEWA demonstrated strong cybersecurity posture in Q4 2023',
  key_findings: [
    'IEC 62443 compliance improved from 85% to 88.24%',
    'NERC CIP compliance maintained at 91.67%',
    'Incident response time improved by 35%',
  ],
  recommendations: [
    'Accelerate legacy system modernization',
    'Implement continuous monitoring',
  ],
  action_items: ['Complete MFA deployment by Q1 2024'],
  status: 'approved' as const,
  approved_by: 'Saeed Al Tayer',
  approved_at: '2024-01-10',
  notes: 'Quarterly executive summary',
  created_at: '2024-01-05',
  updated_at: '2024-01-10',
};

const mockStandards = [
  {
    id: 'std-1',
    summary_id: 'summary-1',
    tenant_id: 't1',
    standard_name: 'IEC 62443-3-3',
    standard_version: '2013',
    standard_type: 'iec-62443' as const,
    compliance_status: 'partial' as const,
    compliance_score: 88.24,
    total_requirements: 85,
    met_requirements: 68,
    partial_requirements: 12,
    unmet_requirements: 5,
    last_assessment_date: '2023-11-20',
    next_assessment_date: '2024-11-20',
    assessor: 'Fatima Al Zahra',
    critical_gaps: 2,
    high_gaps: 3,
    gap_summary: 'Strong compliance with IEC 62443',
    remediation_plan: 'Deploy centralized key management',
    notes: 'Assessment covers all facilities',
    created_at: '2024-01-05',
    updated_at: '2024-01-05',
  },
  {
    id: 'std-2',
    summary_id: 'summary-1',
    tenant_id: 't1',
    standard_name: 'NERC CIP Version 6',
    standard_version: 'v6',
    standard_type: 'nerc-cip' as const,
    compliance_status: 'compliant' as const,
    compliance_score: 91.67,
    total_requirements: 120,
    met_requirements: 105,
    partial_requirements: 10,
    unmet_requirements: 5,
    last_assessment_date: '2023-12-05',
    next_assessment_date: '2024-06-05',
    assessor: 'Mohammed bin Rashid',
    critical_gaps: 0,
    high_gaps: 2,
    gap_summary: 'Full compliance with NERC CIP',
    remediation_plan: 'Complete training documentation',
    notes: 'Covers all BES Cyber Systems',
    created_at: '2024-01-05',
    updated_at: '2024-01-05',
  },
];

const mockTrends = [
  {
    id: 'trend-1',
    tenant_id: 't1',
    site_id: null,
    trend_date: '2023-12-01',
    metric_name: 'Overall Compliance Score',
    metric_category: 'compliance' as const,
    metric_value: 88.40,
    metric_target: 90.00,
    metric_threshold: 85.00,
    status: 'at-risk' as const,
    context: { period: 'monthly' },
    created_at: '2023-12-01',
  },
];

vi.mock('@/lib/riskComplianceQueries', () => ({
  getLatestRiskComplianceSummary: vi.fn(() => Promise.resolve({ data: mockSummary, error: null })),
  getComplianceStandardStatusBySummary: vi.fn(() => Promise.resolve({ data: mockStandards, error: null })),
  getRiskComplianceTrendsByTenant: vi.fn(() => Promise.resolve({ data: mockTrends, error: null })),
}));

// Mock the layout components to simplify testing
vi.mock('@/components/layout/ListPane', () => ({
  ListPane: ({ children, title, subtitle }: any) => (
    <div data-testid="list-pane">
      <div data-testid="list-pane-title">{title}</div>
      <div data-testid="list-pane-subtitle">{subtitle}</div>
      {children}
    </div>
  ),
}));

vi.mock('@/components/layout/WorkPane', () => ({
  WorkPane: ({ title, subtitle, tabs }: any) => (
    <div data-testid="work-pane">
      <div data-testid="work-pane-title">{title}</div>
      <div data-testid="work-pane-subtitle">{subtitle}</div>
      {tabs && tabs.length > 0 && tabs[0].content}
    </div>
  ),
}));

/**
 * Unit Tests for RiskComplianceSummary Component
 * Requirements: 1.4, 10.4
 */
describe('RiskComplianceSummary Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render without errors', async () => {
      const { container } = render(<RiskComplianceSummary />);
      await waitFor(() => {
        expect(container).toBeTruthy();
      });
    });

    it('should render ListPane with correct title and subtitle', async () => {
      render(<RiskComplianceSummary />);
      
      await waitFor(() => {
        expect(screen.getByTestId('list-pane-title')).toHaveTextContent('Risk & Compliance Areas');
        const subtitle = screen.getByTestId('list-pane-subtitle');
        expect(subtitle.textContent).toContain('risks');
        expect(subtitle.textContent).toContain('standards');
      });
    });
  });

  describe('Risk Summary Display', () => {
    it('should display overall risk score', async () => {
      render(<RiskComplianceSummary />);
      
      await waitFor(() => {
        const listPane = screen.getByTestId('list-pane');
        expect(within(listPane).getByText('Overall Risk Score')).toBeInTheDocument();
      });
    });

    it('should display critical risk count', async () => {
      render(<RiskComplianceSummary />);
      
      await waitFor(() => {
        const listPane = screen.getByTestId('list-pane');
        expect(within(listPane).getByText(/3 critical/)).toBeInTheDocument();
      });
    });

    it('should display mitigated risk count', async () => {
      render(<RiskComplianceSummary />);
      
      await waitFor(() => {
        const listPane = screen.getByTestId('list-pane');
        expect(within(listPane).getByText(/28 mitigated/)).toBeInTheDocument();
      });
    });

    it('should display risk score progress bar', async () => {
      render(<RiskComplianceSummary />);
      
      await waitFor(() => {
        const listPane = screen.getByTestId('list-pane');
        expect(within(listPane).getByText('43')).toBeInTheDocument(); // rounded risk score
      });
    });
  });

  describe('Compliance Summary Display', () => {
    it('should display compliance score', async () => {
      render(<RiskComplianceSummary />);
      
      await waitFor(() => {
        const listPane = screen.getByTestId('list-pane');
        expect(within(listPane).getByText('Compliance Score')).toBeInTheDocument();
      });
    });

    it('should display compliant standards count', async () => {
      render(<RiskComplianceSummary />);
      
      await waitFor(() => {
        const listPane = screen.getByTestId('list-pane');
        expect(within(listPane).getByText(/3 compliant/)).toBeInTheDocument();
      });
    });

    it('should display total standards count', async () => {
      render(<RiskComplianceSummary />);
      
      await waitFor(() => {
        const subtitle = screen.getByTestId('list-pane-subtitle');
        expect(subtitle.textContent).toContain('5 standards');
      });
    });

    it('should display compliance score progress bar', async () => {
      render(<RiskComplianceSummary />);
      
      await waitFor(() => {
        const listPane = screen.getByTestId('list-pane');
        // Look for the compliance score specifically in the Compliance Summary section
        const complianceSection = within(listPane).getByText('Compliance Summary').parentElement;
        expect(complianceSection).toBeTruthy();
      });
    });
  });

  describe('Asset Risk Display', () => {
    it('should display safety-critical asset count', async () => {
      render(<RiskComplianceSummary />);
      
      await waitFor(() => {
        const listPane = screen.getByTestId('list-pane');
        expect(within(listPane).getByText(/285 safety-critical/)).toBeInTheDocument();
      });
    });

    it('should display production-critical asset count', async () => {
      render(<RiskComplianceSummary />);
      
      await waitFor(() => {
        const listPane = screen.getByTestId('list-pane');
        expect(within(listPane).getByText(/prod-critical/)).toBeInTheDocument();
      });
    });

    it('should display secure asset count', async () => {
      render(<RiskComplianceSummary />);
      
      await waitFor(() => {
        const listPane = screen.getByTestId('list-pane');
        expect(within(listPane).getByText(/805 secure/)).toBeInTheDocument();
      });
    });

    it('should display high-risk asset count', async () => {
      render(<RiskComplianceSummary />);
      
      await waitFor(() => {
        const listPane = screen.getByTestId('list-pane');
        expect(within(listPane).getByText(/45 high-risk/)).toBeInTheDocument();
      });
    });
  });

  describe('WorkPane Content', () => {
    it('should render WorkPane with correct title and subtitle', async () => {
      render(<RiskComplianceSummary />);
      
      await waitFor(() => {
        const workPane = screen.getByTestId('work-pane');
        expect(within(workPane).getByTestId('work-pane-title')).toHaveTextContent('Risk & Compliance Summary');
        const subtitle = within(workPane).getByTestId('work-pane-subtitle');
        expect(subtitle.textContent).toContain('Dubai Electricity and Water Authority');
      });
    });

    it('should display KPI cards in WorkPane', async () => {
      render(<RiskComplianceSummary />);
      
      await waitFor(() => {
        const workPane = screen.getByTestId('work-pane');
        expect(within(workPane).getByText('Risk Score')).toBeInTheDocument();
        expect(within(workPane).getByText('Compliance')).toBeInTheDocument();
        expect(within(workPane).getByText('Risk Mitigation')).toBeInTheDocument();
        expect(within(workPane).getByText('Asset Security')).toBeInTheDocument();
      });
    });

    it('should display key risk findings', async () => {
      render(<RiskComplianceSummary />);
      
      await waitFor(() => {
        const workPane = screen.getByTestId('work-pane');
        expect(within(workPane).getByText('Key Risk Findings')).toBeInTheDocument();
      });
    });

    it('should display compliance standards', async () => {
      render(<RiskComplianceSummary />);
      
      await waitFor(() => {
        const workPane = screen.getByTestId('work-pane');
        expect(within(workPane).getByText('Compliance Standards')).toBeInTheDocument();
      });
    });
  });

  describe('Tenant Context Integration', () => {
    it('should use current tenant from context', async () => {
      render(<RiskComplianceSummary />);
      
      await waitFor(() => {
        expect(screen.getByText(/Dubai Electricity and Water Authority/)).toBeInTheDocument();
      });
    });

    it('should display transmission-specific data', async () => {
      render(<RiskComplianceSummary />);
      
      await waitFor(() => {
        const workPane = screen.getByTestId('work-pane');
        expect(within(workPane).getByText(/Power Transmission/i)).toBeInTheDocument();
      });
    });
  });

  describe('Transmission-Specific Data Display', () => {
    it('should display transmission standards', async () => {
      render(<RiskComplianceSummary />);
      
      await waitFor(() => {
        const listPane = screen.getByTestId('list-pane');
        expect(within(listPane).getByText('Transmission Standards')).toBeInTheDocument();
        expect(within(listPane).getByText('IEC 62443')).toBeInTheDocument();
        expect(within(listPane).getByText('NERC CIP')).toBeInTheDocument();
      });
    });

    it('should display transmission compliance standards', async () => {
      render(<RiskComplianceSummary />);
      
      await waitFor(() => {
        const workPane = screen.getByTestId('work-pane');
        expect(within(workPane).getByText('IEC 62443-3-3')).toBeInTheDocument();
        expect(within(workPane).getByText('NERC CIP Version 6')).toBeInTheDocument();
      });
    });

    it('should show transmission asset criticality levels', async () => {
      render(<RiskComplianceSummary />);
      
      await waitFor(() => {
        const listPane = screen.getByTestId('list-pane');
        expect(within(listPane).getByText(/safety-critical/)).toBeInTheDocument();
        expect(within(listPane).getByText(/prod-critical/)).toBeInTheDocument();
      });
    });
  });
});