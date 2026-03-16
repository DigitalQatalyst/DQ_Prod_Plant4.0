import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { EnergySustainabilityESGReporting } from '../EnergySustainabilityESGReporting';
import { useApp } from '@/context/AppContext';

// Mock the AppContext
vi.mock('@/context/AppContext', () => ({
  useApp: vi.fn(),
}));

// Mock the EMSPageShell component
vi.mock('@/components/ems/EMSPageShell', () => ({
  EMSPageShell: ({ title, workPaneContent }: any) => (
    <div data-testid="ems-page-shell">
      <h1>{title}</h1>
      <div data-testid="work-pane">{workPaneContent}</div>
    </div>
  ),
}));

// Mock other components
vi.mock('@/components/ems/widgets/ReportBuilderShell', () => ({
  ReportBuilderShell: () => <div data-testid="report-builder-shell">Report Builder</div>,
}));

vi.mock('@/components/ems/widgets/ExportPanel', () => ({
  ExportPanel: ({ exportPacks }: any) => (
    <div data-testid="export-panel">
      <div data-testid="export-packs-count">{exportPacks?.length || 0}</div>
    </div>
  ),
}));

vi.mock('@/components/shared/KPICard', () => ({
  KPICard: ({ title, value }: any) => (
    <div data-testid="kpi-card">
      <span data-testid="kpi-title">{title}</span>
      <span data-testid="kpi-value">{value}</span>
    </div>
  ),
}));

const createMockContext = (sector: string | null, subsector: string | null) => ({
  sector,
  subsector,
  currentTenant: { id: 'test-tenant', name: 'Test Tenant' },
  energyMeters: [],
  energyTelemetry: [],
  emissionFactors: [],
  setCurrentTenant: vi.fn(),
  setSector: vi.fn(),
  setSubsector: vi.fn(),
});

describe('EnergySustainabilityESGReporting', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Upstream Context', () => {
    it('should render ESG reporting page for upstream sector', () => {
      const mockContext = createMockContext('Oil & Gas', 'Upstream');
      vi.mocked(useApp).mockReturnValue(mockContext as any);

      render(<EnergySustainabilityESGReporting />);

      expect(screen.getByText('ESG Reporting')).toBeInTheDocument();
    });

    it('should display upstream report templates', () => {
      const mockContext = createMockContext('Oil & Gas', 'Upstream');
      vi.mocked(useApp).mockReturnValue(mockContext as any);

      render(<EnergySustainabilityESGReporting />);

      const workPane = screen.getByTestId('work-pane');
      
      // Should show standard upstream templates
      expect(within(workPane).getByText(/Active Templates/i)).toBeInTheDocument();
      expect(within(workPane).getByText(/Completed Jobs/i)).toBeInTheDocument();
    });

    it('should show 3 export packs for upstream', () => {
      const mockContext = createMockContext('Oil & Gas', 'Upstream');
      vi.mocked(useApp).mockReturnValue(mockContext as any);

      render(<EnergySustainabilityESGReporting />);

      const exportPanel = screen.getByTestId('export-panel');
      const packsCount = within(exportPanel).getByTestId('export-packs-count');
      
      expect(packsCount.textContent).toBe('3');
    });

    it('should not show transmission-specific banner for upstream', () => {
      const mockContext = createMockContext('Oil & Gas', 'Upstream');
      vi.mocked(useApp).mockReturnValue(mockContext as any);

      render(<EnergySustainabilityESGReporting />);

      expect(screen.queryByText(/Transmission Grid ESG Reporting/i)).not.toBeInTheDocument();
    });
  });

  describe('Transmission Context', () => {
    it('should render ESG reporting page for transmission sector', () => {
      const mockContext = createMockContext('Power', 'Transmission');
      vi.mocked(useApp).mockReturnValue(mockContext as any);

      render(<EnergySustainabilityESGReporting />);

      expect(screen.getByText('ESG Reporting')).toBeInTheDocument();
    });

    it('should display transmission-specific banner', () => {
      const mockContext = createMockContext('Power', 'Transmission');
      vi.mocked(useApp).mockReturnValue(mockContext as any);

      render(<EnergySustainabilityESGReporting />);

      expect(screen.getByText(/Transmission Grid ESG Reporting/i)).toBeInTheDocument();
      expect(screen.getByText(/grid efficiency metrics/i)).toBeInTheDocument();
      expect(screen.getByText(/emissions per MWh delivered/i)).toBeInTheDocument();
    });

    it('should show transmission-specific report templates', () => {
      const mockContext = createMockContext('Power', 'Transmission');
      vi.mocked(useApp).mockReturnValue(mockContext as any);

      render(<EnergySustainabilityESGReporting />);

      const workPane = screen.getByTestId('work-pane');
      
      // Should show transmission-specific context
      expect(within(workPane).getByText(/Grid Performance/i)).toBeInTheDocument();
      expect(within(workPane).getByText(/Emissions Intensity/i)).toBeInTheDocument();
      expect(within(workPane).getAllByText(/Renewable Integration/i).length).toBeGreaterThan(0);
    });

    it('should show 5 export packs for transmission (including grid metrics)', () => {
      const mockContext = createMockContext('Power', 'Transmission');
      vi.mocked(useApp).mockReturnValue(mockContext as any);

      render(<EnergySustainabilityESGReporting />);

      const exportPanel = screen.getByTestId('export-panel');
      const packsCount = within(exportPanel).getByTestId('export-packs-count');
      
      expect(packsCount.textContent).toBe('5');
    });

    it('should display transmission ESG metrics categories', () => {
      const mockContext = createMockContext('Power', 'Transmission');
      vi.mocked(useApp).mockReturnValue(mockContext as any);

      render(<EnergySustainabilityESGReporting />);

      // Check for transmission-specific metric categories in the banner
      expect(screen.getByText(/Grid Performance/i)).toBeInTheDocument();
      expect(screen.getByText(/Emissions Intensity/i)).toBeInTheDocument();
      expect(screen.getAllByText(/Renewable Integration/i).length).toBeGreaterThan(0);
      expect(screen.getByText(/Compliance Tracking/i)).toBeInTheDocument();
    });

    it('should show transmission-specific quick action text', () => {
      const mockContext = createMockContext('Power', 'Transmission');
      vi.mocked(useApp).mockReturnValue(mockContext as any);

      render(<EnergySustainabilityESGReporting />);

      expect(screen.getByText(/Build custom transmission ESG report/i)).toBeInTheDocument();
    });
  });

  describe('Sector Switching', () => {
    it('should switch from upstream to transmission templates', () => {
      const mockContext = createMockContext('Oil & Gas', 'Upstream');
      vi.mocked(useApp).mockReturnValue(mockContext as any);

      const { rerender } = render(<EnergySustainabilityESGReporting />);

      // Initially should not show transmission banner
      expect(screen.queryByText(/Transmission Grid ESG Reporting/i)).not.toBeInTheDocument();

      // Switch to transmission
      const transmissionContext = createMockContext('Power', 'Transmission');
      vi.mocked(useApp).mockReturnValue(transmissionContext as any);
      rerender(<EnergySustainabilityESGReporting />);

      // Now should show transmission banner
      expect(screen.getByText(/Transmission Grid ESG Reporting/i)).toBeInTheDocument();
    });

    it('should update export packs count when switching sectors', () => {
      const mockContext = createMockContext('Oil & Gas', 'Upstream');
      vi.mocked(useApp).mockReturnValue(mockContext as any);

      const { rerender } = render(<EnergySustainabilityESGReporting />);

      let exportPanel = screen.getByTestId('export-panel');
      let packsCount = within(exportPanel).getByTestId('export-packs-count');
      expect(packsCount.textContent).toBe('3');

      // Switch to transmission
      const transmissionContext = createMockContext('Power', 'Transmission');
      vi.mocked(useApp).mockReturnValue(transmissionContext as any);
      rerender(<EnergySustainabilityESGReporting />);

      exportPanel = screen.getByTestId('export-panel');
      packsCount = within(exportPanel).getByTestId('export-packs-count');
      expect(packsCount.textContent).toBe('5');
    });
  });

  describe('Requirements Validation', () => {
    it('should support report template management (Req 22.1)', () => {
      const mockContext = createMockContext('Power', 'Transmission');
      vi.mocked(useApp).mockReturnValue(mockContext as any);

      render(<EnergySustainabilityESGReporting />);

      // Should show template management interface
      expect(screen.getByText(/Active Templates/i)).toBeInTheDocument();
    });

    it('should support report generation (Req 22.2)', () => {
      const mockContext = createMockContext('Power', 'Transmission');
      vi.mocked(useApp).mockReturnValue(mockContext as any);

      render(<EnergySustainabilityESGReporting />);

      // Should show generation status tracking
      expect(screen.getByText(/Completed Jobs/i)).toBeInTheDocument();
      expect(screen.getByText(/Pending Jobs/i)).toBeInTheDocument();
    });

    it('should display report metadata (Req 22.3)', () => {
      const mockContext = createMockContext('Power', 'Transmission');
      vi.mocked(useApp).mockReturnValue(mockContext as any);

      render(<EnergySustainabilityESGReporting />);

      // Should show job status and metadata
      expect(screen.getByText(/Completed Jobs/i)).toBeInTheDocument();
      expect(screen.getByText(/Failed Jobs/i)).toBeInTheDocument();
    });

    it('should support report scheduling (Req 22.5)', () => {
      const mockContext = createMockContext('Power', 'Transmission');
      vi.mocked(useApp).mockReturnValue(mockContext as any);

      render(<EnergySustainabilityESGReporting />);

      // Should show active scheduled reports
      expect(screen.getByText(/Active Templates/i)).toBeInTheDocument();
    });

    it('should include transmission-specific ESG metrics in reports', () => {
      const mockContext = createMockContext('Power', 'Transmission');
      vi.mocked(useApp).mockReturnValue(mockContext as any);

      render(<EnergySustainabilityESGReporting />);

      // Should show transmission ESG metric categories
      expect(screen.getByText(/Grid Performance/i)).toBeInTheDocument();
      expect(screen.getByText(/Emissions Intensity/i)).toBeInTheDocument();
      expect(screen.getAllByText(/Renewable Integration/i).length).toBeGreaterThan(0);
      expect(screen.getByText(/Compliance Tracking/i)).toBeInTheDocument();
    });
  });
});
