import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ConnectionEndpointsPage from '../ConnectionEndpointsPage';
import { AppProvider } from '@/context/AppContext';

// Mock the AppContext hook
const mockSetSelectedAsset = vi.fn();
const mockSetIsPopPaneOpen = vi.fn();
const mockSetPopPaneContent = vi.fn();

vi.mock('@/context/AppContext', async () => {
  const actual = await vi.importActual('@/context/AppContext');
  return {
    ...actual,
    useApp: () => ({
      currentTenant: { id: 'alpha-upstream', name: 'Alpha Upstream Ltd' },
      selectedAsset: null,
      setSelectedAsset: mockSetSelectedAsset,
      setIsPopPaneOpen: mockSetIsPopPaneOpen,
      setPopPaneContent: mockSetPopPaneContent,
    }),
  };
});

function renderWithProvider(component: React.ReactElement) {
  return render(
    <AppProvider>
      {component}
    </AppProvider>
  );
}

describe('ConnectionEndpointsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders connection endpoints page with title and endpoint list', () => {
    renderWithProvider(<ConnectionEndpointsPage />);
    
    // Check if the main title is rendered
    expect(screen.getByText('Connection Endpoints')).toBeInTheDocument();
    expect(screen.getByText('Industrial protocol endpoints')).toBeInTheDocument();
    
    // Check if search functionality is present
    expect(screen.getByPlaceholderText('Search endpoints...')).toBeInTheDocument();
  });

  it('displays endpoints from upstream mock data', () => {
    renderWithProvider(<ConnectionEndpointsPage />);
    
    // Check if some expected endpoints are displayed
    expect(screen.getByText('NP-01 Pad RTU Modbus')).toBeInTheDocument();
    expect(screen.getByText('Central Processing OPC-UA Server')).toBeInTheDocument();
    expect(screen.getByText('Pipeline SCADA Gateway')).toBeInTheDocument();
  });

  it('shows endpoint selection prompt when no endpoint is selected', () => {
    renderWithProvider(<ConnectionEndpointsPage />);
    
    // Check if the selection prompt is shown
    expect(screen.getByText('Select Endpoint')).toBeInTheDocument();
    expect(screen.getByText('Choose an endpoint to view details')).toBeInTheDocument();
    expect(screen.getByText('No Endpoint Selected')).toBeInTheDocument();
    expect(screen.getByText('Select an endpoint from the list to view its configuration and linked assets.')).toBeInTheDocument();
  });

  it('displays endpoint cards with proper protocol and address information', () => {
    renderWithProvider(<ConnectionEndpointsPage />);
    
    // Check if endpoint cards show expected information
    expect(screen.getAllByText(/MODBUS-TCP/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/OPC-UA/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/192\.168\./).length).toBeGreaterThan(0); // IP addresses
    expect(screen.getAllByText(/Zone/).length).toBeGreaterThan(0); // Hazardous area zones
  });

  it('shows endpoint count in the list pane', () => {
    renderWithProvider(<ConnectionEndpointsPage />);
    
    // Check if endpoint count is displayed (should be a number)
    const countElement = screen.getByText(/^\d+$/);
    expect(countElement).toBeInTheDocument();
  });

  it('displays endpoint status badges', () => {
    renderWithProvider(<ConnectionEndpointsPage />);
    
    // Check if status badges are present
    expect(screen.getAllByText(/up|down|unknown/i).length).toBeGreaterThan(0);
  });

  it('handles search functionality', () => {
    renderWithProvider(<ConnectionEndpointsPage />);
    
    const searchInput = screen.getByPlaceholderText('Search endpoints...');
    
    // Test search input
    fireEvent.change(searchInput, { target: { value: 'modbus' } });
    expect(searchInput).toHaveValue('modbus');
  });

  it('shows linked asset count for endpoints', () => {
    renderWithProvider(<ConnectionEndpointsPage />);
    
    // Check if asset count badges are displayed
    expect(screen.getAllByText(/assets/).length).toBeGreaterThan(0);
  });

  it('displays last seen timestamps for endpoints', () => {
    renderWithProvider(<ConnectionEndpointsPage />);
    
    // Check if last seen information is displayed
    expect(screen.getAllByText(/Last seen:/).length).toBeGreaterThan(0);
  });

  it('shows inspect buttons on endpoint cards', () => {
    renderWithProvider(<ConnectionEndpointsPage />);
    
    // Check if inspect buttons are present (they should be visible on hover)
    const inspectButtons = screen.getAllByRole('button');
    const hasInspectButton = inspectButtons.some(button => 
      button.querySelector('svg') // Looking for the Eye icon
    );
    expect(hasInspectButton).toBe(true);
  });
});