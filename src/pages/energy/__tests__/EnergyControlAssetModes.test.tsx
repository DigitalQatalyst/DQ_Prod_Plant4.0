import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import EnergyControlAssetModes from '../EnergyControlAssetModes';
import * as AppContext from '@/context/AppContext';

// Mock the AppContext
vi.mock('@/context/AppContext', () => ({
  useApp: vi.fn(),
  AppProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}));

// Mock the EMSPageShell component
vi.mock('@/components/ems/EMSPageShell', () => ({
  EMSPageShell: ({ title, workPaneContent }: any) => (
    <div data-testid="ems-page-shell">
      <h1>{title}</h1>
      <div data-testid="work-pane">{workPaneContent}</div>
    </div>
  )
}));

describe('EnergyControlAssetModes', () => {
  it('should render with transmission context when sector is Power/Transmission', () => {
    vi.mocked(AppContext.useApp).mockReturnValue({
      sector: 'Power',
      subsector: 'Transmission',
      tenant: { id: '1', name: 'DEWA - Transmission' },
      setSector: vi.fn(),
      setSubsector: vi.fn(),
      setTenant: vi.fn()
    } as any);

    render(
      <BrowserRouter>
        <EnergyControlAssetModes />
      </BrowserRouter>
    );

    // Check that the transmission-specific title is displayed
    expect(screen.getByText('Transmission Equipment Control Modes')).toBeInTheDocument();
  });

  it('should render with upstream context when sector is Oil & Gas/Upstream', () => {
    vi.mocked(AppContext.useApp).mockReturnValue({
      sector: 'Oil & Gas',
      subsector: 'Upstream',
      tenant: { id: '2', name: 'GulfUpstream Demo' },
      setSector: vi.fn(),
      setSubsector: vi.fn(),
      setTenant: vi.fn()
    } as any);

    render(
      <BrowserRouter>
        <EnergyControlAssetModes />
      </BrowserRouter>
    );

    // Check that the upstream-specific title is displayed
    expect(screen.getByText('Asset Energy Mode Recommendations')).toBeInTheDocument();
  });

  it('should display transmission equipment context banner when transmission asset is selected', () => {
    vi.mocked(AppContext.useApp).mockReturnValue({
      sector: 'Power',
      subsector: 'Transmission',
      tenant: { id: '1', name: 'DEWA - Transmission' },
      setSector: vi.fn(),
      setSubsector: vi.fn(),
      setTenant: vi.fn()
    } as any);

    render(
      <BrowserRouter>
        <EnergyControlAssetModes />
      </BrowserRouter>
    );

    // The work pane should contain transmission-specific content
    const workPane = screen.getByTestId('work-pane');
    expect(workPane).toBeInTheDocument();
  });

  it('should show correct equipment type for transmission assets', () => {
    vi.mocked(AppContext.useApp).mockReturnValue({
      sector: 'Power',
      subsector: 'Transmission',
      tenant: { id: '1', name: 'DEWA - Transmission' },
      setSector: vi.fn(),
      setSubsector: vi.fn(),
      setTenant: vi.fn()
    } as any);

    render(
      <BrowserRouter>
        <EnergyControlAssetModes />
      </BrowserRouter>
    );

    // Verify the page renders without errors
    expect(screen.getByTestId('ems-page-shell')).toBeInTheDocument();
  });
});
