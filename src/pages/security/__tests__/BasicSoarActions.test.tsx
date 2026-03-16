import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { BasicSoarActions } from '../BasicSoarActions';
import { AppProvider } from '@/context/AppContext';

// Mock the threat monitoring queries
vi.mock('@/lib/threatMonitoringQueries', () => ({
  getResponsePlaybooks: vi.fn().mockResolvedValue([]),
  getPlaybookExecutions: vi.fn().mockResolvedValue([]),
  getTransmissionSoarActions: vi.fn().mockResolvedValue([]),
  getSoarActionExecutions: vi.fn().mockResolvedValue([]),
  executeSoarAction: vi.fn().mockResolvedValue({})
}));

// Mock the app context
const mockTenant = {
  id: 'test-tenant-id',
  name: 'Test Transmission Company'
};

const MockAppProvider = ({ children }: { children: React.ReactNode }) => (
  <AppProvider value={{ currentTenant: mockTenant }}>
    {children}
  </AppProvider>
);

describe('BasicSoarActions', () => {
  it('renders SOAR actions page', async () => {
    render(
      <MockAppProvider>
        <BasicSoarActions />
      </MockAppProvider>
    );

    // Check for main page title
    await waitFor(() => {
      expect(screen.getByText('SOAR Actions')).toBeInTheDocument();
    });
  });

  it('displays transmission-specific SOAR actions', async () => {
    render(
      <MockAppProvider>
        <BasicSoarActions />
      </MockAppProvider>
    );

    // Check for transmission-specific SOAR actions
    await waitFor(() => {
      expect(screen.getAllByText('Isolate Compromised Substation')).toHaveLength(3); // List, detail, and overview
      expect(screen.getByText('Block SCADA Access')).toBeInTheDocument();
      expect(screen.getByText('Backup System Configuration')).toBeInTheDocument();
      expect(screen.getByText('Disconnect Transmission Line')).toBeInTheDocument();
      expect(screen.getByText('Emergency System Shutdown')).toBeInTheDocument();
    });
  });

  it('shows critical action indicators', async () => {
    render(
      <MockAppProvider>
        <BasicSoarActions />
      </MockAppProvider>
    );

    await waitFor(() => {
      // Check for critical action indicators
      const criticalBadges = screen.getAllByText('CRITICAL');
      expect(criticalBadges.length).toBeGreaterThan(0);
    });
  });

  it('displays action filters', async () => {
    render(
      <MockAppProvider>
        <BasicSoarActions />
      </MockAppProvider>
    );

    await waitFor(() => {
      // Check for filter options in select elements
      expect(screen.getByText('Isolate Substation')).toBeInTheDocument();
      expect(screen.getByText('Block SCADA Access')).toBeInTheDocument();
      expect(screen.getByText('Backup Configuration')).toBeInTheDocument();
    });
  });

  it('shows approval requirements', async () => {
    render(
      <MockAppProvider>
        <BasicSoarActions />
      </MockAppProvider>
    );

    await waitFor(() => {
      // Check for approval badges
      const approvalBadges = screen.getAllByText('APPROVAL');
      expect(approvalBadges.length).toBeGreaterThan(0);
    });
  });

  it('displays transmission-specific target types', async () => {
    render(
      <MockAppProvider>
        <BasicSoarActions />
      </MockAppProvider>
    );

    await waitFor(() => {
      // Check for transmission-specific target types
      expect(screen.getByText('Substation')).toBeInTheDocument();
      expect(screen.getByText('Protection Relay')).toBeInTheDocument();
      expect(screen.getByText('SCADA System')).toBeInTheDocument();
    });
  });
});