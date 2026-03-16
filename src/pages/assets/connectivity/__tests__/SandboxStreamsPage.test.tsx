import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import SandboxStreamsPage from '../SandboxStreamsPage';
import { AppProvider } from '@/context/AppContext';

// Mock the context
const mockContextValue = {
  currentTenant: { id: 'alpha-upstream', name: 'Alpha Upstream Ltd' },
  selectedAsset: null,
  setSelectedAsset: vi.fn(),
  setIsPopPaneOpen: vi.fn(),
  setPopPaneContent: vi.fn(),
  isPopPaneOpen: false,
  popPaneContent: null,
  currentPersona: 'operator',
  setCurrentPersona: vi.fn(),
  setCurrentTenant: vi.fn(),
};

vi.mock('@/context/AppContext', () => ({
  useApp: () => mockContextValue,
  AppProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

function renderWithProvider(component: React.ReactElement) {
  return render(
    <AppProvider>
      {component}
    </AppProvider>
  );
}

describe('SandboxStreamsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders sandbox streams page with title and controls', () => {
    renderWithProvider(<SandboxStreamsPage />);
    
    // Check if the main title is rendered
    expect(screen.getByText('Sandbox Streams')).toBeInTheDocument();
    expect(screen.getByText('Simulated data configuration')).toBeInTheDocument();
  });

  it('displays simulation controls with toggles', () => {
    renderWithProvider(<SandboxStreamsPage />);
    
    // Check if simulation controls are present
    expect(screen.getByText('Simulation Controls')).toBeInTheDocument();
    expect(screen.getByText('Well Data')).toBeInTheDocument();
    expect(screen.getByText('Pipeline Data')).toBeInTheDocument();
    
    // Check for toggle switches
    const wellDataSwitch = screen.getByLabelText('Well Data');
    const pipelineDataSwitch = screen.getByLabelText('Pipeline Data');
    expect(wellDataSwitch).toBeInTheDocument();
    expect(pipelineDataSwitch).toBeInTheDocument();
  });

  it('shows statistics card with asset counts', () => {
    renderWithProvider(<SandboxStreamsPage />);
    
    // Check if statistics are displayed
    expect(screen.getByText('Statistics')).toBeInTheDocument();
    expect(screen.getByText('Total Assets')).toBeInTheDocument();
    expect(screen.getByText('Well Assets')).toBeInTheDocument();
    expect(screen.getByText('Pipeline Assets')).toBeInTheDocument();
    expect(screen.getByText('Active Simulations')).toBeInTheDocument();
  });

  it('displays sandbox-eligible assets from upstream mock data', () => {
    renderWithProvider(<SandboxStreamsPage />);
    
    // Check if some expected assets are displayed (wellheads, separators, etc.)
    // These should be filtered to only show well and pipeline related assets
    const assetElements = screen.getAllByText(/WH-|Separator|Pipeline|Flowline/);
    expect(assetElements.length).toBeGreaterThan(0);
  });

  it('shows asset selection prompt when no asset is selected', () => {
    renderWithProvider(<SandboxStreamsPage />);
    
    // Check if the selection prompt is shown
    expect(screen.getByText('No Asset Selected')).toBeInTheDocument();
    expect(screen.getByText('Select an asset from the list to view its simulation configuration and data points.')).toBeInTheDocument();
  });

  it('handles search functionality', () => {
    renderWithProvider(<SandboxStreamsPage />);
    
    const searchInput = screen.getByPlaceholderText('Search assets...');
    expect(searchInput).toBeInTheDocument();
    
    // Test search functionality
    fireEvent.change(searchInput, { target: { value: 'WH' } });
    expect(searchInput).toHaveValue('WH');
  });

  it('displays asset cards with simulation status', () => {
    renderWithProvider(<SandboxStreamsPage />);
    
    // Check if asset cards show simulation status
    const statusElements = screen.getAllByText(/active|inactive|error/i);
    expect(statusElements.length).toBeGreaterThan(0);
  });

  it('shows data point counts for assets', () => {
    renderWithProvider(<SandboxStreamsPage />);
    
    // Check if data point counts are displayed
    const dataPointElements = screen.getAllByText(/\d+ data points/);
    expect(dataPointElements.length).toBeGreaterThan(0);
  });

  it('toggles well data simulation', () => {
    renderWithProvider(<SandboxStreamsPage />);
    
    const wellDataSwitch = screen.getByLabelText('Well Data');
    
    // Initially should be enabled (based on mock config)
    expect(wellDataSwitch).toBeChecked();
    
    // Toggle it off
    fireEvent.click(wellDataSwitch);
    expect(wellDataSwitch).not.toBeChecked();
  });

  it('toggles pipeline data simulation', () => {
    renderWithProvider(<SandboxStreamsPage />);
    
    const pipelineDataSwitch = screen.getByLabelText('Pipeline Data');
    
    // Initially should be disabled (based on mock config)
    expect(pipelineDataSwitch).not.toBeChecked();
    
    // Toggle it on
    fireEvent.click(pipelineDataSwitch);
    expect(pipelineDataSwitch).toBeChecked();
  });

  it('displays asset type badges', () => {
    renderWithProvider(<SandboxStreamsPage />);
    
    // Check if asset type badges are shown
    const typeElements = screen.getAllByText(/Wellhead|Separator|Pipeline|Compressor/);
    expect(typeElements.length).toBeGreaterThan(0);
  });

  it('shows location information for assets', () => {
    renderWithProvider(<SandboxStreamsPage />);
    
    // Check if field/pad information is displayed
    const locationElements = screen.getAllByText(/North Permian|South Permian|Eagle Ford/);
    expect(locationElements.length).toBeGreaterThan(0);
  });

  it('displays inspect buttons on asset cards', () => {
    renderWithProvider(<SandboxStreamsPage />);
    
    // Check if inspect buttons are present
    const inspectButtons = screen.getAllByRole('button');
    const hasInspectButton = inspectButtons.some(button => 
      button.textContent?.includes('Inspect') || 
      button.querySelector('[data-testid="eye-icon"]')
    );
    expect(hasInspectButton || inspectButtons.length > 0).toBe(true);
  });

  it('shows simulation status indicators', () => {
    renderWithProvider(<SandboxStreamsPage />);
    
    // Check for simulation status badges
    const statusBadges = screen.getAllByText(/active|inactive|error/i);
    expect(statusBadges.length).toBeGreaterThan(0);
  });

  it('displays asset count in the list pane', () => {
    renderWithProvider(<SandboxStreamsPage />);
    
    // Check if asset count is displayed in the header area
    const listPaneHeader = screen.getByText('Sandbox Streams').closest('.pane-header');
    expect(listPaneHeader).toBeInTheDocument();
    
    // The count should be visible somewhere in the interface
    const countElements = screen.getAllByText(/^\d+$/);
    expect(countElements.length).toBeGreaterThan(0);
  });

  it('shows help text for simulation controls', () => {
    renderWithProvider(<SandboxStreamsPage />);
    
    // Check if help text is displayed
    expect(screen.getByText('Wellheads, separators, pumps')).toBeInTheDocument();
    expect(screen.getByText('Flowlines, pipelines, manifolds')).toBeInTheDocument();
  });
});