import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { EnergySustainabilityCompliance } from '../EnergySustainabilityCompliance';
import { useApp } from '@/context/AppContext';
import { getTransmissionProvider } from '@/lib/data/providers/TransmissionProvider';

// Mock dependencies
vi.mock('@/context/AppContext');
vi.mock('@/lib/data/providers/TransmissionProvider');

const mockUseApp = useApp as ReturnType<typeof vi.fn>;
const mockGetTransmissionProvider = getTransmissionProvider as ReturnType<typeof vi.fn>;

describe('EnergySustainabilityCompliance', () => {
  const mockTenant = {
    id: 'test-tenant-id',
    name: 'Test Tenant',
    sector: 'power',
    subsector: 'transmission'
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Upstream Mode', () => {
    beforeEach(() => {
      mockUseApp.mockReturnValue({
        sector: 'Oil & Gas',
        subsector: 'Upstream',
        currentTenant: mockTenant,
        energyMeters: [],
        energyTelemetry: [],
        emissionFactors: []
      });
    });

    it('should render upstream compliance checks', () => {
      render(<EnergySustainabilityCompliance />);
      
      // Should show the page title
      expect(screen.getByText('Compliance')).toBeInTheDocument();
      
      // Should show upstream mock data
      expect(screen.getByText('Overall Compliance')).toBeInTheDocument();
    });

    it('should display upstream compliance categories', () => {
      render(<EnergySustainabilityCompliance />);
      
      // Should show upstream categories like power_quality, emissions, etc.
      expect(screen.getByText(/Compliance Status Summary/i)).toBeInTheDocument();
    });
  });

  describe('Transmission Mode', () => {
    const mockTransmissionProvider = {
      listTxComplianceRequirements: vi.fn(),
      listTxComplianceEvidence: vi.fn(),
      getTxComplianceSummary: vi.fn()
    };

    beforeEach(() => {
      mockUseApp.mockReturnValue({
        sector: 'Power',
        subsector: 'Transmission',
        currentTenant: mockTenant,
        energyMeters: [],
        energyTelemetry: [],
        emissionFactors: []
      });

      mockGetTransmissionProvider.mockReturnValue(mockTransmissionProvider);
    });

    it('should load transmission compliance data on mount', async () => {
      const mockRequirements = [
        {
          id: 'req-1',
          org_id: mockTenant.id,
          requirement_code: 'NERC-CIP-001',
          requirement_name: 'Cybersecurity Controls',
          requirement_type: 'operational',
          compliance_category: 'security',
          compliance_status: 'compliant',
          risk_level: 'High',
          standard_reference: 'NERC CIP-002',
          effective_date: '2024-01-01',
          applies_to_scope: 'all_transmission',
          active: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        }
      ];

      const mockEvidence = [
        {
          id: 'ev-1',
          org_id: mockTenant.id,
          requirement_id: 'req-1',
          evidence_type: 'certification',
          evidence_name: 'NERC CIP Certification',
          valid_from: '2024-01-01',
          status: 'active',
          verified: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        }
      ];

      const mockSummary = {
        org_id: mockTenant.id,
        total_requirements: 1,
        compliant_count: 1,
        non_compliant_count: 0,
        pending_count: 0,
        not_applicable_count: 0,
        critical_risk_count: 0,
        high_risk_count: 1,
        medium_risk_count: 0,
        low_risk_count: 0,
        overdue_reviews_count: 0,
        expiring_soon_count: 0,
        missing_evidence_count: 0,
        overall_compliance_percentage: 100,
        by_category: [
          {
            category: 'security',
            total: 1,
            compliant: 1,
            compliance_percentage: 100
          }
        ],
        by_type: [
          {
            type: 'operational',
            total: 1,
            compliant: 1,
            compliance_percentage: 100
          }
        ]
      };

      mockTransmissionProvider.listTxComplianceRequirements.mockResolvedValue(mockRequirements);
      mockTransmissionProvider.listTxComplianceEvidence.mockResolvedValue(mockEvidence);
      mockTransmissionProvider.getTxComplianceSummary.mockResolvedValue(mockSummary);

      render(<EnergySustainabilityCompliance />);

      // Should show loading state initially
      expect(screen.getByText(/Loading compliance data/i)).toBeInTheDocument();

      // Wait for data to load
      await waitFor(() => {
        expect(mockTransmissionProvider.listTxComplianceRequirements).toHaveBeenCalledWith({
          org_id: mockTenant.id,
          active: true
        });
      });

      await waitFor(() => {
        expect(mockTransmissionProvider.listTxComplianceEvidence).toHaveBeenCalledWith({
          org_id: mockTenant.id
        });
      });

      await waitFor(() => {
        expect(mockTransmissionProvider.getTxComplianceSummary).toHaveBeenCalledWith(mockTenant.id);
      });
    });

    it('should display transmission compliance requirements', async () => {
      const mockRequirements = [
        {
          id: 'req-1',
          org_id: mockTenant.id,
          requirement_code: 'ISO-50001',
          requirement_name: 'Energy Management System',
          requirement_type: 'certification',
          compliance_category: 'energy_efficiency',
          compliance_status: 'compliant',
          risk_level: 'Medium',
          standard_reference: 'ISO 50001:2018',
          effective_date: '2024-01-01',
          applies_to_scope: 'org',
          active: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        }
      ];

      mockTransmissionProvider.listTxComplianceRequirements.mockResolvedValue(mockRequirements);
      mockTransmissionProvider.listTxComplianceEvidence.mockResolvedValue([]);
      mockTransmissionProvider.getTxComplianceSummary.mockResolvedValue({
        org_id: mockTenant.id,
        total_requirements: 1,
        compliant_count: 1,
        non_compliant_count: 0,
        pending_count: 0,
        not_applicable_count: 0,
        critical_risk_count: 0,
        high_risk_count: 0,
        medium_risk_count: 1,
        low_risk_count: 0,
        overdue_reviews_count: 0,
        expiring_soon_count: 0,
        missing_evidence_count: 0,
        overall_compliance_percentage: 100,
        by_category: [],
        by_type: []
      });

      render(<EnergySustainabilityCompliance />);

      await waitFor(() => {
        expect(screen.getByText('Energy Management System')).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.getByText('ISO 50001:2018')).toBeInTheDocument();
      });
    });

    it('should display transmission grid badge', async () => {
      mockTransmissionProvider.listTxComplianceRequirements.mockResolvedValue([]);
      mockTransmissionProvider.listTxComplianceEvidence.mockResolvedValue([]);
      mockTransmissionProvider.getTxComplianceSummary.mockResolvedValue(null);

      render(<EnergySustainabilityCompliance />);

      await waitFor(() => {
        expect(screen.getByText('Transmission Grid')).toBeInTheDocument();
      });
    });

    it('should display compliance evidence when available', async () => {
      const mockEvidence = [
        {
          id: 'ev-1',
          org_id: mockTenant.id,
          requirement_id: 'req-1',
          evidence_type: 'report',
          evidence_name: 'Annual Compliance Report',
          valid_from: '2024-01-01',
          status: 'active',
          verified: true,
          linked_substation_id: 'sub-1',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        }
      ];

      mockTransmissionProvider.listTxComplianceRequirements.mockResolvedValue([]);
      mockTransmissionProvider.listTxComplianceEvidence.mockResolvedValue(mockEvidence);
      mockTransmissionProvider.getTxComplianceSummary.mockResolvedValue(null);

      render(<EnergySustainabilityCompliance />);

      await waitFor(() => {
        expect(screen.getByText('Compliance Evidence')).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.getByText('Annual Compliance Report')).toBeInTheDocument();
      });
    });

    it('should handle error loading transmission data', async () => {
      mockTransmissionProvider.listTxComplianceRequirements.mockRejectedValue(
        new Error('Failed to load requirements')
      );

      render(<EnergySustainabilityCompliance />);

      await waitFor(() => {
        expect(screen.getByText('Failed to load requirements')).toBeInTheDocument();
      });
    });

    it('should display scope indicators for requirements', async () => {
      const mockRequirements = [
        {
          id: 'req-1',
          org_id: mockTenant.id,
          requirement_code: 'SUB-001',
          requirement_name: 'Substation Safety',
          requirement_type: 'safety',
          compliance_category: 'safety',
          compliance_status: 'compliant',
          risk_level: 'High',
          standard_reference: 'OSHA 1910',
          effective_date: '2024-01-01',
          applies_to_scope: 'substation',
          active: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        }
      ];

      mockTransmissionProvider.listTxComplianceRequirements.mockResolvedValue(mockRequirements);
      mockTransmissionProvider.listTxComplianceEvidence.mockResolvedValue([]);
      mockTransmissionProvider.getTxComplianceSummary.mockResolvedValue({
        org_id: mockTenant.id,
        total_requirements: 1,
        compliant_count: 1,
        non_compliant_count: 0,
        pending_count: 0,
        not_applicable_count: 0,
        critical_risk_count: 0,
        high_risk_count: 1,
        medium_risk_count: 0,
        low_risk_count: 0,
        overdue_reviews_count: 0,
        expiring_soon_count: 0,
        missing_evidence_count: 0,
        overall_compliance_percentage: 100,
        by_category: [],
        by_type: []
      });

      render(<EnergySustainabilityCompliance />);

      await waitFor(() => {
        expect(screen.getByText('Substation Safety')).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.getByText('substation')).toBeInTheDocument();
      });
    });
  });

  describe('Sector Switching', () => {
    it('should switch between upstream and transmission modes', async () => {
      const { rerender } = render(<EnergySustainabilityCompliance />);

      // Start with upstream
      mockUseApp.mockReturnValue({
        sector: 'Oil & Gas',
        subsector: 'Upstream',
        currentTenant: mockTenant,
        energyMeters: [],
        energyTelemetry: [],
        emissionFactors: []
      });

      rerender(<EnergySustainabilityCompliance />);
      expect(screen.getByText('Overall Compliance')).toBeInTheDocument();

      // Switch to transmission
      const mockTransmissionProvider = {
        listTxComplianceRequirements: vi.fn().mockResolvedValue([]),
        listTxComplianceEvidence: vi.fn().mockResolvedValue([]),
        getTxComplianceSummary: vi.fn().mockResolvedValue(null)
      };

      mockGetTransmissionProvider.mockReturnValue(mockTransmissionProvider);

      mockUseApp.mockReturnValue({
        sector: 'Power',
        subsector: 'Transmission',
        currentTenant: mockTenant,
        energyMeters: [],
        energyTelemetry: [],
        emissionFactors: []
      });

      rerender(<EnergySustainabilityCompliance />);

      await waitFor(() => {
        expect(mockTransmissionProvider.listTxComplianceRequirements).toHaveBeenCalled();
      });
    });
  });
});
