import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import EnergyControlEfficiencyCurves from '../EnergyControlEfficiencyCurves';
import { upstreamEfficiencyCurves, transmissionEfficiencyCurves } from '@/data/mockData';

// Mock the AppContext
const mockUseApp = vi.fn();
vi.mock('@/context/AppContext', () => ({
  useApp: () => mockUseApp()
}));

// Mock EMSPageShell to simplify testing
vi.mock('@/components/ems/EMSPageShell', () => ({
  EMSPageShell: ({ workPaneContent, listItems, sector, subsector }: any) => (
    <div data-testid="ems-page-shell" data-sector={sector} data-subsector={subsector}>
      <div data-testid="list-items-count">{listItems.length}</div>
      {workPaneContent}
    </div>
  )
}));

// Mock recharts to avoid rendering issues in tests
vi.mock('recharts', () => ({
  LineChart: ({ children }: any) => <div data-testid="line-chart">{children}</div>,
  Line: () => <div data-testid="line" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
  ReferenceLine: () => <div data-testid="reference-line" />,
  Dot: () => <div data-testid="dot" />
}));

describe('EnergyControlEfficiencyCurves', () => {
  describe('Upstream Context', () => {
    beforeEach(() => {
      mockUseApp.mockReturnValue({
        sector: 'Oil & Gas',
        subsector: 'Upstream'
      });
    });

    it('renders with upstream data', () => {
      render(<EnergyControlEfficiencyCurves />);
      
      expect(screen.getByTestId('ems-page-shell')).toHaveAttribute('data-sector', 'Oil & Gas');
      expect(screen.getByTestId('ems-page-shell')).toHaveAttribute('data-subsector', 'Upstream');
      expect(screen.getByTestId('list-items-count')).toHaveTextContent(upstreamEfficiencyCurves.length.toString());
    });

    it('displays upstream-specific labels', () => {
      render(<EnergyControlEfficiencyCurves />);
      
      // Should show flow rate terminology
      expect(screen.getByText(/Design Flow Rate/i)).toBeInTheDocument();
      expect(screen.getByText(/Current Power/i)).toBeInTheDocument();
      // Multiple "Flow Rate" labels exist, so just check one exists
      expect(screen.getAllByText(/Flow Rate/i).length).toBeGreaterThan(0);
    });

    it('does not show transmission context banner', () => {
      render(<EnergyControlEfficiencyCurves />);
      
      expect(screen.queryByText(/Transformer Efficiency Analysis/i)).not.toBeInTheDocument();
    });

    it('shows upstream asset type', () => {
      render(<EnergyControlEfficiencyCurves />);
      
      // Should show ESP, compressor, or pump - use getAllByText since there are multiple
      const assetTypes = ['ESP', 'COMPRESSOR', 'PUMP'];
      const hasAssetType = assetTypes.some(type => 
        screen.queryAllByText(new RegExp(type, 'i')).length > 0
      );
      expect(hasAssetType).toBe(true);
    });
  });

  describe('Transmission Context', () => {
    beforeEach(() => {
      mockUseApp.mockReturnValue({
        sector: 'Power',
        subsector: 'Transmission'
      });
    });

    it('renders with transmission data', () => {
      render(<EnergyControlEfficiencyCurves />);
      
      expect(screen.getByTestId('ems-page-shell')).toHaveAttribute('data-sector', 'Power');
      expect(screen.getByTestId('ems-page-shell')).toHaveAttribute('data-subsector', 'Transmission');
      expect(screen.getByTestId('list-items-count')).toHaveTextContent(transmissionEfficiencyCurves.length.toString());
    });

    it('displays transmission context banner', () => {
      render(<EnergyControlEfficiencyCurves />);
      
      expect(screen.getByText(/Transformer Efficiency Analysis/i)).toBeInTheDocument();
      expect(screen.getByText(/Power Transformer/i)).toBeInTheDocument();
    });

    it('displays transmission-specific labels', () => {
      render(<EnergyControlEfficiencyCurves />);
      
      // Should show load level terminology
      expect(screen.getByText(/Design Capacity/i)).toBeInTheDocument();
      expect(screen.getByText(/Current Losses/i)).toBeInTheDocument();
      // Multiple "Load Level" labels exist, so just check one exists
      expect(screen.getAllByText(/Load Level/i).length).toBeGreaterThan(0);
    });

    it('displays transformer losses chart title', () => {
      render(<EnergyControlEfficiencyCurves />);
      
      expect(screen.getByText(/Transformer Losses vs Load Level/i)).toBeInTheDocument();
    });

    it('shows transformer type', () => {
      render(<EnergyControlEfficiencyCurves />);
      
      // Multiple instances of "TRANSFORMER" exist, so just check one exists
      expect(screen.getAllByText(/TRANSFORMER/i).length).toBeGreaterThan(0);
    });

    it('shows substation context for transformer', () => {
      render(<EnergyControlEfficiencyCurves />);
      
      // First transformer is TX-T1-DXB (Dubai Main)
      expect(screen.getByText(/Dubai Main Substation/i)).toBeInTheDocument();
    });
  });

  describe('Efficiency Curve Analysis', () => {
    beforeEach(() => {
      mockUseApp.mockReturnValue({
        sector: 'Power',
        subsector: 'Transmission'
      });
    });

    it('displays efficiency metrics', () => {
      render(<EnergyControlEfficiencyCurves />);
      
      expect(screen.getByText(/Current Efficiency/i)).toBeInTheDocument();
      expect(screen.getByText(/Best Efficiency Point/i)).toBeInTheDocument();
    });

    it('displays tabs for different views', () => {
      render(<EnergyControlEfficiencyCurves />);
      
      expect(screen.getByText(/Efficiency Curves/i)).toBeInTheDocument();
      expect(screen.getByText(/Performance Analysis/i)).toBeInTheDocument();
      expect(screen.getByText(/BEP Guidance/i)).toBeInTheDocument();
    });
  });

  describe('Data Validation', () => {
    it('upstream efficiency curves have correct structure', () => {
      expect(upstreamEfficiencyCurves.length).toBeGreaterThan(0);
      
      upstreamEfficiencyCurves.forEach(curve => {
        expect(curve).toHaveProperty('id');
        expect(curve).toHaveProperty('assetId');
        expect(curve).toHaveProperty('assetName');
        expect(curve).toHaveProperty('assetType');
        expect(curve).toHaveProperty('designFlowRate');
        expect(curve).toHaveProperty('designFlowUnit');
        expect(curve).toHaveProperty('bestEfficiencyPoint');
        expect(curve).toHaveProperty('currentOperatingPoint');
        expect(curve).toHaveProperty('curvePoints');
        expect(curve).toHaveProperty('recommendations');
        
        expect(curve.curvePoints.length).toBeGreaterThan(0);
      });
    });

    it('transmission efficiency curves have correct structure', () => {
      expect(transmissionEfficiencyCurves.length).toBeGreaterThan(0);
      
      transmissionEfficiencyCurves.forEach(curve => {
        expect(curve).toHaveProperty('id');
        expect(curve).toHaveProperty('assetId');
        expect(curve).toHaveProperty('assetName');
        expect(curve).toHaveProperty('assetType');
        expect(curve).toHaveProperty('designFlowRate');
        expect(curve).toHaveProperty('designFlowUnit');
        expect(curve).toHaveProperty('bestEfficiencyPoint');
        expect(curve).toHaveProperty('currentOperatingPoint');
        expect(curve).toHaveProperty('curvePoints');
        expect(curve).toHaveProperty('recommendations');
        
        expect(curve.curvePoints.length).toBeGreaterThan(0);
        expect(curve.designFlowUnit).toBe('MVA');
      });
    });

    it('transmission transformers have high efficiency values', () => {
      transmissionEfficiencyCurves.forEach(curve => {
        // Transformers should have efficiency > 96%
        expect(curve.bestEfficiencyPoint.efficiency).toBeGreaterThan(96);
        expect(curve.currentOperatingPoint.efficiency).toBeGreaterThan(96);
      });
    });
  });
});
