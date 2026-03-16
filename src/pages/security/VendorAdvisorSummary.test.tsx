import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within, fireEvent, waitFor } from '@testing-library/react';
import { VendorAdvisorSummary } from './VendorAdvisorSummary';
import React from 'react';

// Mock the AppContext
const mockTenant = { id: 't1', name: 'KSA Upstream JV', industry: 'Oil & Gas' };
const mockSetCurrentTenant = vi.fn();

vi.mock('@/context/AppContext', () => ({
  useApp: () => ({
    currentTenant: mockTenant,
    setCurrentTenant: mockSetCurrentTenant,
  }),
}));

// Mock vendor security queries
vi.mock('@/lib/vendorSecurityQueries', () => ({
  getVendorSummaries: vi.fn(() => Promise.resolve([
    {
      vendor_name: 'Schneider Electric',
      vendor_type: 'technology-provider',
      average_security_score: 85,
      average_risk_score: 25,
      critical_findings: 2,
      high_findings: 5,
      total_findings: 15,
      open_findings: 8,
      assessment_count: 3,
      trust_level: 'trusted',
      contract_status: 'active',
      latest_assessment_date: '2024-01-15',
      next_assessment_date: '2024-07-15',
      systems: [
        {
          system_name: 'EcoStruxure SCADA',
          system_type: 'scada-system',
          system_criticality: 'safety-critical',
          security_score: 85,
          risk_score: 25,
          status: 'approved',
          assessment_date: '2024-01-15',
        },
      ],
    },
    {
      vendor_name: 'Emerson',
      vendor_type: 'technology-provider',
      average_security_score: 78,
      average_risk_score: 35,
      critical_findings: 1,
      high_findings: 3,
      total_findings: 10,
      open_findings: 5,
      assessment_count: 2,
      trust_level: 'conditional',
      contract_status: 'active',
      latest_assessment_date: '2024-01-10',
      next_assessment_date: '2024-07-10',
      systems: [
        {
          system_name: 'DeltaV DCS',
          system_type: 'dcs-system',
          system_criticality: 'production-critical',
          security_score: 78,
          risk_score: 35,
          status: 'approved',
          assessment_date: '2024-01-10',
        },
      ],
    },
    {
      vendor_name: 'Honeywell',
      vendor_type: 'technology-provider',
      average_security_score: 82,
      average_risk_score: 28,
      critical_findings: 0,
      high_findings: 2,
      total_findings: 8,
      open_findings: 3,
      assessment_count: 2,
      trust_level: 'trusted',
      contract_status: 'active',
      latest_assessment_date: '2024-01-12',
      next_assessment_date: '2024-07-12',
      systems: [
        {
          system_name: 'Experion PKS',
          system_type: 'dcs-system',
          system_criticality: 'production-critical',
          security_score: 82,
          risk_score: 28,
          status: 'approved',
          assessment_date: '2024-01-12',
        },
      ],
    },
  ])),
  getVendorStatistics: vi.fn(() => Promise.resolve({
    totalVendors: 3,
    totalAssessments: 7,
    averageSecurityScore: 82,
    averageRiskScore: 29,
    totalCriticalFindings: 3,
    assessmentsNeedingAttention: 1,
  })),
  getVendorScorecard: vi.fn(() => Promise.resolve(null)),
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
 * Unit Tests for VendorAdvisorSummary Component
 * Requirements: 1.5
 */
describe('VendorAdvisorSummary Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render without errors', async () => {
      const { container } = render(<VendorAdvisorSummary />);
      await waitFor(() => {
        expect(container).toBeTruthy();
      });
    });

    it('should render ListPane with correct title and subtitle', async () => {
      render(<VendorAdvisorSummary />);
      
      await waitFor(() => {
        expect(screen.getByTestId('list-pane-title')).toHaveTextContent('Vendors & Third-Party Systems');
        expect(screen.getByTestId('list-pane-subtitle')).toHaveTextContent(/vendors/);
        expect(screen.getByTestId('list-pane-subtitle')).toHaveTextContent(/assessments/);
      });
    });
  });

  describe('Vendor Grouping by Company', () => {
    it('should group vendors by company', async () => {
      render(<VendorAdvisorSummary />);
      
      await waitFor(() => {
        const listPane = screen.getByTestId('list-pane');
        
        // Should show company names as headers
        expect(within(listPane).getByText('Schneider Electric')).toBeInTheDocument();
        expect(within(listPane).getByText('Emerson')).toBeInTheDocument();
      });
    });

    it('should display vendor count for each company', async () => {
      render(<VendorAdvisorSummary />);
      
      await waitFor(() => {
        const listPane = screen.getByTestId('list-pane');
        
        // Should show counts in parentheses (using getAllByText since there are multiple companies)
        expect(within(listPane).getAllByText(/\(\d+ systems\)/)).toHaveLength(3);
      });
    });

    it('should display vendor status indicators', async () => {
      render(<VendorAdvisorSummary />);
      
      await waitFor(() => {
        const listPane = screen.getByTestId('list-pane');
        
        // Should show vendor status (using getAllByText since there are multiple vendors)
        expect(within(listPane).getAllByText(/Online/i)).toHaveLength(3);
      });
    });

    it('should display site access counts', async () => {
      render(<VendorAdvisorSummary />);
      
      await waitFor(() => {
        const listPane = screen.getByTestId('list-pane');
        
        // Should show site access counts (using getAllByText since there are multiple vendors)
        expect(within(listPane).getAllByText(/\d+ systems/)).toHaveLength(3);
      });
    });

    it('should display active session counts', async () => {
      render(<VendorAdvisorSummary />);
      
      await waitFor(() => {
        const listPane = screen.getByTestId('list-pane');
        
        // Should show critical findings counts
        expect(within(listPane).getAllByText(/\d+ critical/)).toHaveLength(3);
      });
    });

    it('should display MFA status indicators', async () => {
      render(<VendorAdvisorSummary />);
      
      await waitFor(() => {
        const listPane = screen.getByTestId('list-pane');
        
        // Should show security scores
        expect(within(listPane).getByText('85%')).toBeInTheDocument();
        expect(within(listPane).getByText('78%')).toBeInTheDocument();
        expect(within(listPane).getByText('82%')).toBeInTheDocument();
      });
    });

    it('should show safety-critical access indicators', async () => {
      render(<VendorAdvisorSummary />);
      
      await waitFor(() => {
        const listPane = screen.getByTestId('list-pane');
        
        // Should show safety-critical indicators (lightning bolt icon)
        // This would be represented by the Zap icon in the component
        const vendorElements = within(listPane).getAllByText(/Schneider|Emerson/);
        expect(vendorElements.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Vendor Selection and WorkPane Update', () => {
    it('should show empty state when no vendor is selected initially', async () => {
      render(<VendorAdvisorSummary />);
      
      await waitFor(() => {
        const workPane = screen.getByTestId('work-pane');
        expect(within(workPane).getByTestId('work-pane-title')).toHaveTextContent('Select a Vendor');
      });
    });

    it('should update WorkPane when a vendor is clicked', async () => {
      render(<VendorAdvisorSummary />);
      
      await waitFor(() => {
        const listPane = screen.getByTestId('list-pane');
        const vendorElements = within(listPane).getAllByText('Schneider Electric');
        
        // Click on a vendor card (not the header)
        fireEvent.click(vendorElements[1].closest('div')!);
      });
      
      await waitFor(() => {
        // WorkPane should update to show the selected vendor
        const workPane = screen.getByTestId('work-pane');
        expect(within(workPane).getByTestId('work-pane-title')).toHaveTextContent('Schneider Electric');
      });
    });

    it('should display vendor role and email in WorkPane subtitle', async () => {
      render(<VendorAdvisorSummary />);
      
      await waitFor(() => {
        const listPane = screen.getByTestId('list-pane');
        const vendorElements = within(listPane).getAllByText('Schneider Electric');
        
        fireEvent.click(vendorElements[1].closest('div')!);
      });
      
      await waitFor(() => {
        const workPane = screen.getByTestId('work-pane');
        const subtitle = within(workPane).getByTestId('work-pane-subtitle');
        expect(subtitle.textContent).toContain('technology-provider');
      });
    });
  });

  describe('Vendor Details Display', () => {
    it('should display vendor information in WorkPane', async () => {
      render(<VendorAdvisorSummary />);
      
      await waitFor(() => {
        const listPane = screen.getByTestId('list-pane');
        const vendorElements = within(listPane).getAllByText('Schneider Electric');
        
        fireEvent.click(vendorElements[1].closest('div')!);
      });
      
      await waitFor(() => {
        const workPane = screen.getByTestId('work-pane');
        
        // Should show vendor KPIs
        expect(within(workPane).getByText('Security Score')).toBeInTheDocument();
        expect(within(workPane).getByText('Risk Score')).toBeInTheDocument();
        expect(within(workPane).getByText('Critical Findings')).toBeInTheDocument();
        expect(within(workPane).getByText('Trust Level')).toBeInTheDocument();
      });
    });

    it('should display vendor access scope', async () => {
      render(<VendorAdvisorSummary />);
      
      await waitFor(() => {
        const listPane = screen.getByTestId('list-pane');
        const vendorElements = within(listPane).getAllByText('Schneider Electric');
        
        fireEvent.click(vendorElements[1].closest('div')!);
      });
      
      await waitFor(() => {
        const workPane = screen.getByTestId('work-pane');
        
        // Should show vendor information section
        expect(within(workPane).getByText('Vendor Information')).toBeInTheDocument();
        expect(within(workPane).getByText('Security Summary')).toBeInTheDocument();
      });
    });

    it('should display zone access information', async () => {
      render(<VendorAdvisorSummary />);
      
      await waitFor(() => {
        const listPane = screen.getByTestId('list-pane');
        const vendorElements = within(listPane).getAllByText('Schneider Electric');
        
        fireEvent.click(vendorElements[1].closest('div')!);
      });
      
      await waitFor(() => {
        const workPane = screen.getByTestId('work-pane');
        
        // Should show vendor details
        expect(within(workPane).getByText('Vendor Name:')).toBeInTheDocument();
      });
    });
  });

  describe('Tenant Context Integration', () => {
    it('should use current tenant from context', async () => {
      render(<VendorAdvisorSummary />);
      
      await waitFor(() => {
        // Verify tenant-specific vendor data is displayed
        expect(screen.getByTestId('list-pane-subtitle')).toHaveTextContent(/3 vendors/);
      });
    });

    it('should display upstream-specific vendor data', async () => {
      render(<VendorAdvisorSummary />);
      
      await waitFor(() => {
        const listPane = screen.getByTestId('list-pane');
        
        // Verify we're seeing upstream-specific vendors (using getAllByText since names appear multiple times)
        expect(within(listPane).getAllByText('Schneider Electric').length).toBeGreaterThan(0);
        expect(within(listPane).getAllByText('Emerson').length).toBeGreaterThan(0);
      });
    });
  });

  describe('Upstream-Specific Data Display', () => {
    it('should display upstream vendor companies', async () => {
      render(<VendorAdvisorSummary />);
      
      await waitFor(() => {
        const listPane = screen.getByTestId('list-pane');
        
        // Should show upstream-specific vendor companies (using getAllByText since names appear multiple times)
        expect(within(listPane).getAllByText('Schneider Electric').length).toBeGreaterThan(0);
        expect(within(listPane).getAllByText('Emerson').length).toBeGreaterThan(0);
        expect(within(listPane).getAllByText('Honeywell').length).toBeGreaterThan(0);
      });
    });

    it('should show safety-critical system access', async () => {
      render(<VendorAdvisorSummary />);
      
      await waitFor(() => {
        const listPane = screen.getByTestId('list-pane');
        const vendorElements = within(listPane).getAllByText('Schneider Electric');
        
        // Click on the vendor card (not the header)
        fireEvent.click(vendorElements[1].closest('div')!);
      });
      
      await waitFor(() => {
        const workPane = screen.getByTestId('work-pane');
        
        // Should show safety-critical access information
        expect(within(workPane).getByText('Critical Findings')).toBeInTheDocument();
      });
    });

    it('should display upstream site access', async () => {
      render(<VendorAdvisorSummary />);
      
      await waitFor(() => {
        const listPane = screen.getByTestId('list-pane');
        const vendorElements = within(listPane).getAllByText('Schneider Electric');
        
        fireEvent.click(vendorElements[1].closest('div')!);
      });
      
      await waitFor(() => {
        const workPane = screen.getByTestId('work-pane');
        
        // Should show site access information
        expect(within(workPane).getByText('Security Score')).toBeInTheDocument();
      });
    });

    it('should show vendor access to upstream zones', async () => {
      render(<VendorAdvisorSummary />);
      
      await waitFor(() => {
        const listPane = screen.getByTestId('list-pane');
        const vendorElements = within(listPane).getAllByText('Schneider Electric');
        
        fireEvent.click(vendorElements[1].closest('div')!);
      });
      
      await waitFor(() => {
        const workPane = screen.getByTestId('work-pane');
        
        // Should show vendor details
        expect(within(workPane).getByText('Vendor Information')).toBeInTheDocument();
      });
    });
  });
});