import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import EnergyControlDemandResponse from '../EnergyControlDemandResponse';
import { BrowserRouter } from 'react-router-dom';

// Mock the AppContext
const mockUseApp = vi.fn();
vi.mock('@/context/AppContext', () => ({
  useApp: () => mockUseApp()
}));

// Mock the EMSPageShell to simplify testing
vi.mock('@/components/ems/EMSPageShell', () => ({
  EMSPageShell: ({ workPaneContent }: any) => <div data-testid="ems-page-shell">{workPaneContent}</div>
}));

describe('EnergyControlDemandResponse', () => {
  it('should render with upstream context', () => {
    mockUseApp.mockReturnValue({
      sector: 'Oil & Gas',
      subsector: 'Upstream'
    });

    render(
      <BrowserRouter>
        <EnergyControlDemandResponse />
      </BrowserRouter>
    );

    expect(screen.getByTestId('ems-page-shell')).toBeInTheDocument();
  });

  it('should render with transmission context', () => {
    mockUseApp.mockReturnValue({
      sector: 'Power',
      subsector: 'Transmission'
    });

    render(
      <BrowserRouter>
        <EnergyControlDemandResponse />
      </BrowserRouter>
    );

    expect(screen.getByTestId('ems-page-shell')).toBeInTheDocument();
  });

  it('should show transmission-specific content when in transmission mode', () => {
    mockUseApp.mockReturnValue({
      sector: 'Power',
      subsector: 'Transmission'
    });

    render(
      <BrowserRouter>
        <EnergyControlDemandResponse />
      </BrowserRouter>
    );

    // Check for transmission-specific text
    const pageShell = screen.getByTestId('ems-page-shell');
    expect(pageShell.textContent).toContain('transmission');
  });

  it('should show upstream content when not in transmission mode', () => {
    mockUseApp.mockReturnValue({
      sector: 'Oil & Gas',
      subsector: 'Upstream'
    });

    render(
      <BrowserRouter>
        <EnergyControlDemandResponse />
      </BrowserRouter>
    );

    const pageShell = screen.getByTestId('ems-page-shell');
    // Should not contain transmission-specific terminology
    expect(pageShell.textContent).not.toContain('Capacitor Bank');
  });

  it('should use transmission DR events when in transmission mode', () => {
    mockUseApp.mockReturnValue({
      sector: 'Power',
      subsector: 'Transmission'
    });

    render(
      <BrowserRouter>
        <EnergyControlDemandResponse />
      </BrowserRouter>
    );

    const pageShell = screen.getByTestId('ems-page-shell');
    // Check for transmission DR event IDs
    expect(pageShell.textContent).toContain('dr-tx-');
  });

  it('should use upstream DR events when not in transmission mode', () => {
    mockUseApp.mockReturnValue({
      sector: 'Oil & Gas',
      subsector: 'Upstream'
    });

    render(
      <BrowserRouter>
        <EnergyControlDemandResponse />
      </BrowserRouter>
    );

    const pageShell = screen.getByTestId('ems-page-shell');
    // Check for upstream DR event IDs
    expect(pageShell.textContent).toContain('dr-');
  });
});
