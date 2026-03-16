import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { RiskRegister } from './RiskRegister';
import { AppProvider } from '@/context/AppContext';

// Mock the risk queries
vi.mock('@/lib/riskQueries', () => ({
  getSecurityRisksByTenant: vi.fn().mockResolvedValue([
    {
      id: 'risk-1',
      riskId: 'RISK-TX-001',
      riskName: 'IEC 61850 GOOSE Message Manipulation',
      riskDescription: 'Test risk description',
      riskCategory: 'cyber-attack',
      status: 'mitigating',
      inherentRiskLevel: 'critical',
      inherentRiskScore: 85,
      inherentLikelihood: 'high',
      inherentImpact: 'major',
      residualRiskLevel: 'high',
      treatmentStrategy: 'mitigate',
      treatmentOwner: 'Cybersecurity Team',
      threatScenario: 'Test threat scenario',
      lastAssessmentDate: '2024-01-15',
      safetyImpact: true,
      gridStabilityImpact: false,
      affectedAssetTypes: ['substation-control', 'protection-relay'],
      affectedProtocols: ['IEC-61850', 'GOOSE'],
      appliesToSites: ['site-1', 'site-2']
    }
  ]),
  getRiskSummaryStats: vi.fn().mockResolvedValue({
    totalRisks: 5,
    criticalRisks: 1,
    highRisks: 2,
    mediumRisks: 1,
    lowRisks: 1,
    negligibleRisks: 0,
    identifiedRisks: 0,
    assessedRisks: 1,
    mitigatingRisks: 3,
    monitoringRisks: 1,
    acceptedRisks: 0,
    transferredRisks: 0,
    closedRisks: 0,
    overdueMitigations: 0,
    overdueAssessments: 0,
    safetyImpactRisks: 2,
    gridStabilityRisks: 1,
    cyberAttackRisks: 3,
    insiderThreatRisks: 1,
    systemVulnerabilityRisks: 1,
    averageRiskScore: 65.5
  })
}));

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>
    <AppProvider>
      {children}
    </AppProvider>
  </BrowserRouter>
);

describe('RiskRegister', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', async () => {
    render(
      <TestWrapper>
        <RiskRegister />
      </TestWrapper>
    );

    // Wait for the component to load
    await waitFor(() => {
      expect(screen.getByText('Risk Register')).toBeInTheDocument();
    });
  });

  it('displays risk data when loaded', async () => {
    render(
      <TestWrapper>
        <RiskRegister />
      </TestWrapper>
    );

    // Wait for data to load - look for the risk name in the list specifically
    await waitFor(() => {
      const riskElements = screen.getAllByText('IEC 61850 GOOSE Message Manipulation');
      expect(riskElements.length).toBeGreaterThan(0);
    });
  });

  it('displays summary statistics', async () => {
    render(
      <TestWrapper>
        <RiskRegister />
      </TestWrapper>
    );

    // Wait for stats to load - look for the Critical label and count
    await waitFor(() => {
      expect(screen.getByText('Critical:')).toBeInTheDocument();
      expect(screen.getByText('Safety Impact:')).toBeInTheDocument();
    });
  });
});