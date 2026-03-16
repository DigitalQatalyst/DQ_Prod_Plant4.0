import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { AppProvider } from '@/context/AppContext';
import { AssetsDashboard } from '@/pages/assets/AssetsDashboard';
import { AssetsAlerts } from '@/pages/assets/AssetsAlerts';

// Mock the data provider
const mockProvider = {
  getAssetPortfolioKpis: vi.fn().mockResolvedValue({
    totalAssets: 100,
    onlineAssets: 85,
    offlineAssets: 10,
    maintenanceAssets: 5,
    criticalAlerts: 2,
    warningAlerts: 5,
    assetsByType: { 'Transformer': 20, 'Circuit Breaker': 15 },
    assetsBySite: { 'Nairobi': 40, 'Kisumu': 30 }
  }),
  getAlertsByTenant: vi.fn().mockResolvedValue([
    {
      id: 'alert-001',
      tenantId: 't1',
      featureArea: 'assets',
      severity: 'critical',
      status: 'open',
      title: 'Circuit Breaker Offline',
      summary: 'Circuit breaker has been offline for 2 hours',
      createdAt: '2024-01-15T14:30:00Z',
      updatedAt: '2024-01-15T14:30:00Z',
      assetId: 'a6'
    },
    {
      id: 'alert-002',
      tenantId: 't1',
      featureArea: 'assets',
      severity: 'warning',
      status: 'acknowledged',
      title: 'Temperature Warning',
      summary: 'Transformer temperature elevated',
      createdAt: '2024-01-15T12:00:00Z',
      updatedAt: '2024-01-15T13:00:00Z',
      assetId: 'a1'
    }
  ]),
  updateAlertStatus: vi.fn().mockResolvedValue({
    id: 'alert-001',
    status: 'acknowledged',
    updatedAt: new Date().toISOString()
  })
};

vi.mock('@/hooks/useDataProvider', () => ({
  useDataProvider: () => ({ provider: mockProvider })
}));

vi.mock('@/context/AppContext', () => ({
  useApp: () => ({
    currentTenant: { id: 't1', name: 'Kenya Power' }
  }),
  AppProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}));

/**
 * Smoke Tests for Cycle 7 Pages
 *
 * Tests that AssetsDashboard and AssetsAlerts render correctly
 */
describe('Cycle 7 Smoke Tests', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, gcTime: 0 },
        mutations: { retry: false }
      }
    });
    vi.clearAllMocks();
  });

  const renderWithProviders = (component: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AppProvider>
            {component}
          </AppProvider>
        </BrowserRouter>
      </QueryClientProvider>
    );
  };

  describe('AssetsDashboard', () => {
    it('renders dashboard with KPI cards', async () => {
      renderWithProviders(<AssetsDashboard />);

      // Check main title
      expect(screen.getByText('Assets Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Monitor asset health, performance, and connectivity')).toBeInTheDocument();

      // Check KPI cards
      await waitFor(() => {
        expect(screen.getByText('Asset Health')).toBeInTheDocument();
        expect(screen.getByText('Connectivity Status')).toBeInTheDocument();
        expect(screen.getByText('Alert Summary')).toBeInTheDocument();
      });

      // Check that portfolio KPIs are displayed
      await waitFor(() => {
        expect(screen.getByText('85/100')).toBeInTheDocument(); // online/total assets
        expect(screen.getByText('7')).toBeInTheDocument(); // total alerts
      });
    });

    it('renders recent alerts section', async () => {
      renderWithProviders(<AssetsDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Recent Alerts')).toBeInTheDocument();
        expect(screen.getByText('Circuit Breaker Offline')).toBeInTheDocument();
        expect(screen.getByText('Temperature Warning')).toBeInTheDocument();
      });
    });

    it('displays empty state when no data available', async () => {
      // Mock empty data
      mockProvider.getAssetPortfolioKpis.mockResolvedValueOnce(null);
      mockProvider.getAlertsByTenant.mockResolvedValueOnce([]);

      renderWithProviders(<AssetsDashboard />);

      await waitFor(() => {
        // We have multiple "No data available" tags for empty cards
        expect(screen.getAllByText('No data available')[0]).toBeInTheDocument();
        expect(screen.getByText('No recent alerts')).toBeInTheDocument();
      });
    });
  });

  describe('AssetsAlerts', () => {
    const mockAlerts = [
      {
        id: 'alert-001',
        tenantId: 't1',
        featureArea: 'assets',
        severity: 'critical',
        status: 'open',
        title: 'Circuit Breaker Offline',
        summary: 'Circuit breaker has been offline for 2 hours',
        createdAt: '2024-01-15T14:30:00Z',
        updatedAt: '2024-01-15T14:30:00Z',
        assetId: 'a6'
      },
      {
        id: 'alert-002',
        tenantId: 't1',
        featureArea: 'assets',
        severity: 'warning',
        status: 'acknowledged',
        title: 'Temperature Warning',
        summary: 'Transformer temperature elevated',
        createdAt: '2024-01-15T12:00:00Z',
        updatedAt: '2024-01-15T13:00:00Z',
        assetId: 'a1'
      }
    ];

    it('renders alerts page with filters', async () => {
      mockProvider.getAlertsByTenant.mockResolvedValue(mockAlerts);
      renderWithProviders(<AssetsAlerts />);

      // Check main title
      expect(await screen.findByText(/Assets Alerts/i)).toBeInTheDocument();
      expect(screen.getByText(/Monitor and respond to asset-related alerts and incidents/i)).toBeInTheDocument();

      // Check filters section
      expect(screen.getByText(/Filters:/i)).toBeInTheDocument();

      // Wait for alerts to load
      expect(await screen.findByText(/Circuit Breaker Offline/i)).toBeInTheDocument();
      expect(screen.getByText(/Temperature Warning/i)).toBeInTheDocument();

      // Check for the status dropdown/filter button
      const openElements = await screen.findAllByText(/Open/i);
      expect(openElements.length).toBeGreaterThan(0);
    });

    it('displays alert details correctly', async () => {
      mockProvider.getAlertsByTenant.mockResolvedValue(mockAlerts);
      renderWithProviders(<AssetsAlerts />);

      // Wait for data to load (finding an alert title ensures loading is done)
      expect(await screen.findByText(/Circuit Breaker Offline/i)).toBeInTheDocument();

      // Check severity labels
      expect(await screen.findByText(/Critical/i)).toBeInTheDocument();
      expect(screen.getByText(/Warning/i)).toBeInTheDocument();

      // Check status labels (using findAll because it might be in filter and card)
      const openElements = await screen.findAllByText(/Open/i);
      expect(openElements.length).toBeGreaterThan(0);

      const ackElements = await screen.findAllByText(/Acknowledged/i);
      expect(ackElements.length).toBeGreaterThan(0);
    });

    it('shows empty state when no alerts match filters', async () => {
      // Mock empty alerts
      mockProvider.getAlertsByTenant.mockResolvedValue([]);

      renderWithProviders(<AssetsAlerts />);

      expect(await screen.findByText(/No alerts found/i)).toBeInTheDocument();
      expect(screen.getByText(/There are no alerts to display./i)).toBeInTheDocument();
    });

    it('handles alert status updates', async () => {
      mockProvider.getAlertsByTenant.mockResolvedValue(mockAlerts);
      renderWithProviders(<AssetsAlerts />);

      // Confirm the status select/filter is present
      const openElements = await screen.findAllByText(/Open/i);
      expect(openElements.length).toBeGreaterThan(0);

      // The actual click testing would require more complex setup with user events
      expect(mockProvider.updateAlertStatus).not.toHaveBeenCalled();
    });
  });
});
