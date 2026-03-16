import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { SecurityControlLibrary } from './SecurityControlLibrary';
import { AppProvider } from '@/context/AppContext';
import { BrowserRouter } from 'react-router-dom';
import * as complianceQueries from '@/lib/complianceQueries';

// Mock the compliance queries
vi.mock('@/lib/complianceQueries', () => ({
  getSecurityControls: vi.fn(),
  getSecurityControlsByStandard: vi.fn(),
}));

// Mock the layout components
vi.mock('@/components/layout/ListPane', () => ({
  ListPane: ({ children, title }: { children: React.ReactNode; title: string }) => (
    <div data-testid="list-pane">
      <h2>{title}</h2>
      {children}
    </div>
  ),
}));

vi.mock('@/components/layout/WorkPane', () => ({
  WorkPane: ({ title, subtitle, tabs }: { title: string; subtitle: string; tabs: any[] }) => (
    <div data-testid="work-pane">
      <h2>{title}</h2>
      <p>{subtitle}</p>
      <div data-testid="tabs">
        {tabs.map((tab, index) => (
          <div key={index} data-testid={`tab-${tab.id}`}>
            {tab.label}
          </div>
        ))}
      </div>
    </div>
  ),
}));

const mockTenant = {
  id: 'test-tenant-1',
  name: 'Test Transmission Company',
  industry: 'utilities' as const,
};

const mockSecurityControls = [
  {
    id: 'control-1',
    tenantId: 'test-tenant-1',
    controlId: 'IEC-62443-3-3-SR-1.1',
    controlName: 'Identification and Authentication Control',
    controlDescription: 'Multi-factor authentication for transmission systems',
    controlType: 'preventive' as const,
    category: 'Access Control',
    domain: 'Identity',
    implementationStatus: 'implemented' as const,
    implementationPercentage: 95,
    effectiveness: 'effective' as const,
    effectivenessScore: 90,
    validationFrequencyDays: 90,
    testingRequired: true,
    status: 'active' as const,
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-12-01T00:00:00Z',
    iec62443Mapping: 'IEC-62443-3-3-SR-1.1',
    criticality: 'safety-critical' as const,
    appliesToAssetTypes: ['transformer', 'protection-relay'] as const,
    appliesToZones: ['substation-control'],
    appliesToProtocols: ['IEC-61850'] as const,
  },
  {
    id: 'control-2',
    tenantId: 'test-tenant-1',
    controlId: 'NERC-CIP-007-6-R1',
    controlName: 'System Security Management',
    controlDescription: 'Security patch management for transmission systems',
    controlType: 'preventive' as const,
    category: 'System Security',
    domain: 'Endpoint',
    implementationStatus: 'partial' as const,
    implementationPercentage: 60,
    effectiveness: 'partially-effective' as const,
    effectivenessScore: 65,
    validationFrequencyDays: 30,
    testingRequired: true,
    status: 'active' as const,
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-12-01T00:00:00Z',
    nercCipMapping: 'CIP-007-6-R1',
    criticality: 'operational-critical' as const,
    appliesToAssetTypes: ['rtu', 'scada-node'] as const,
    appliesToZones: ['scada-network'],
    appliesToProtocols: ['DNP3'] as const,
  },
];

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>
    <AppProvider>
      {children}
    </AppProvider>
  </BrowserRouter>
);

describe('SecurityControlLibrary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock the AppContext to return our test tenant
    vi.doMock('@/context/AppContext', () => ({
      useApp: () => ({
        currentTenant: mockTenant,
      }),
      AppProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    }));
  });

  it('renders the security control library page', async () => {
    vi.mocked(complianceQueries.getSecurityControls).mockResolvedValue(mockSecurityControls);

    render(
      <TestWrapper>
        <SecurityControlLibrary />
      </TestWrapper>
    );

    expect(screen.getByText('Power Transmission Security Control Library')).toBeInTheDocument();
    // The subtitle is passed to ListPane but may not be rendered in our mock
    // Just check that the main title is there
  });

  it('displays loading state initially', async () => {
    vi.mocked(complianceQueries.getSecurityControls).mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve(mockSecurityControls), 100))
    );

    render(
      <TestWrapper>
        <SecurityControlLibrary />
      </TestWrapper>
    );

    expect(screen.getByText('Loading Security Controls')).toBeInTheDocument();
    expect(screen.getByText('Retrieving transmission security control library from database...')).toBeInTheDocument();
  });

  it('displays security controls when loaded', async () => {
    vi.mocked(complianceQueries.getSecurityControls).mockResolvedValue(mockSecurityControls);

    render(
      <TestWrapper>
        <SecurityControlLibrary />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Identification and Authentication Control')).toBeInTheDocument();
      expect(screen.getByText('System Security Management')).toBeInTheDocument();
    });

    // Check control IDs are displayed
    expect(screen.getByText('IEC-62443-3-3-SR-1.1')).toBeInTheDocument();
    expect(screen.getByText('NERC-CIP-007-6-R1')).toBeInTheDocument();

    // Check implementation status badges
    expect(screen.getByText('implemented')).toBeInTheDocument();
    expect(screen.getByText('partial')).toBeInTheDocument();
  });

  it('displays summary statistics', async () => {
    vi.mocked(complianceQueries.getSecurityControls).mockResolvedValue(mockSecurityControls);

    render(
      <TestWrapper>
        <SecurityControlLibrary />
      </TestWrapper>
    );

    await waitFor(() => {
      // Check that summary stats are displayed
      expect(screen.getByText('Avg Effectiveness:')).toBeInTheDocument();
      expect(screen.getByText('Implemented:')).toBeInTheDocument();
      expect(screen.getByText('Partial:')).toBeInTheDocument();
      expect(screen.getByText('Not Implemented:')).toBeInTheDocument();
    });
  });

  it('displays work pane when a control is selected', async () => {
    vi.mocked(complianceQueries.getSecurityControls).mockResolvedValue(mockSecurityControls);

    render(
      <TestWrapper>
        <SecurityControlLibrary />
      </TestWrapper>
    );

    await waitFor(() => {
      // The first control should be auto-selected
      expect(screen.getByTestId('work-pane')).toBeInTheDocument();
      // Check that the work pane title contains the control name (it appears in both list and work pane)
      expect(screen.getAllByText('Identification and Authentication Control')).toHaveLength(2);
    });

    // Check that tabs are rendered
    expect(screen.getByTestId('tab-overview')).toBeInTheDocument();
    expect(screen.getByTestId('tab-implementation')).toBeInTheDocument();
    expect(screen.getByTestId('tab-testing')).toBeInTheDocument();
    expect(screen.getByTestId('tab-evidence')).toBeInTheDocument();
  });

  it('handles error state', async () => {
    const errorMessage = 'Failed to load security controls';
    vi.mocked(complianceQueries.getSecurityControls).mockRejectedValue(new Error(errorMessage));

    render(
      <TestWrapper>
        <SecurityControlLibrary />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Failed to Load Controls')).toBeInTheDocument();
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it('displays empty state when no controls are found', async () => {
    vi.mocked(complianceQueries.getSecurityControls).mockResolvedValue([]);

    render(
      <TestWrapper>
        <SecurityControlLibrary />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('No Security Controls Found')).toBeInTheDocument();
      expect(screen.getByText(/This tenant does not have security controls configured/)).toBeInTheDocument();
    });
  });

  it('includes search and filter functionality', async () => {
    vi.mocked(complianceQueries.getSecurityControls).mockResolvedValue(mockSecurityControls);

    render(
      <TestWrapper>
        <SecurityControlLibrary />
      </TestWrapper>
    );

    await waitFor(() => {
      // Check search input
      expect(screen.getByPlaceholderText('Search controls by name, ID, or description...')).toBeInTheDocument();
      
      // Check filter dropdowns
      expect(screen.getByText('All Categories')).toBeInTheDocument();
      expect(screen.getByText('All Status')).toBeInTheDocument();
      expect(screen.getByText('All Standards')).toBeInTheDocument();
    });
  });
});