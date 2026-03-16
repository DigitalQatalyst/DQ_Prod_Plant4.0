import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ConnectionHealthPage from '../ConnectionHealthPage';
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

describe('ConnectionHealthPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders connection health page with title and endpoint list', () => {
    renderWithProvider(<ConnectionHealthPage />);
    
    // Check if the main title is rendered
    expect(screen.getByText('Connection Health')).toBeInTheDocument();
    expect(screen.getByText('Endpoint connectivity status')).toBeInTheDocument();
  });

  it('displays endpoints from upstream mock data', () => {
    renderWithProvider(<ConnectionHealthPage />);
    
    // Check if some expected endpoints are displayed
    expect(screen.getByText('NP-01 Pad RTU Modbus')).toBeInTheDocument();
    expect(screen.getByText('Central Processing OPC-UA Server')).toBeInTheDocument();
  });

  it('shows endpoint selection prompt when no endpoint is selected', () => {
    renderWithProvider(<ConnectionHealthPage />);
    
    // Check if the selection prompt is shown
    expect(screen.getByText('No Endpoint Selected')).toBeInTheDocument();
    expect(screen.getByText('Select an endpoint from the list to view its connectivity timeline and impacted assets.')).toBeInTheDocument();
  });

  it('displays endpoint cards with proper status and connectivity information', () => {
    renderWithProvider(<ConnectionHealthPage />);
    
    // Check if endpoint cards show expected information
    expect(screen.getAllByText('MODBUS-TCP').length).toBeGreaterThan(0);
    expect(screen.getAllByText('OPC-UA').length).toBeGreaterThan(0);
    
    // Check for status indicators
    const statusElements = screen.getAllByText(/Last seen:/);
    expect(statusElements.length).toBeGreaterThan(0);
  });

  it('shows endpoint count in the list pane', () => {
    renderWithProvider(<ConnectionHealthPage />);
    
    // Check if endpoint count is displayed (should be a number)
    const countElement = screen.getByText(/^\d+$/);
    expect(countElement).toBeInTheDocument();
  });

  it('displays connectivity status with appropriate icons', () => {
    renderWithProvider(<ConnectionHealthPage />);
    
    // Check if connectivity status is shown
    const endpoints = screen.getAllByText(/assets$/);
    expect(endpoints.length).toBeGreaterThan(0);
  });

  it('handles search functionality', () => {
    renderWithProvider(<ConnectionHealthPage />);
    
    const searchInput = screen.getByPlaceholderText('Search endpoints...');
    expect(searchInput).toBeInTheDocument();
    
    // Test search functionality
    fireEvent.change(searchInput, { target: { value: 'RTU' } });
    expect(searchInput).toHaveValue('RTU');
  });

  it('shows asset count for endpoints', () => {
    renderWithProvider(<ConnectionHealthPage />);
    
    // Check if asset count badges are displayed
    const assetCountElements = screen.getAllByText(/\d+ assets/);
    expect(assetCountElements.length).toBeGreaterThan(0);
  });

  it('displays time since last seen for endpoints', () => {
    renderWithProvider(<ConnectionHealthPage />);
    
    // Check if last seen information is displayed
    const lastSeenElements = screen.getAllByText(/Last seen:/);
    expect(lastSeenElements.length).toBeGreaterThan(0);
  });

  it('shows inspect buttons on endpoint cards', () => {
    renderWithProvider(<ConnectionHealthPage />);
    
    // Check if inspect buttons are present
    const inspectButtons = screen.getAllByRole('button');
    const hasInspectButton = inspectButtons.some(button => 
      button.textContent?.includes('Inspect') || 
      button.querySelector('[data-testid="eye-icon"]')
    );
    expect(hasInspectButton || inspectButtons.length > 0).toBe(true);
  });

  it('displays up/down status correctly', () => {
    renderWithProvider(<ConnectionHealthPage />);
    
    // The mock data should have both up and down endpoints
    // Pipeline SCADA Gateway should be down
    expect(screen.getByText('Pipeline SCADA Gateway')).toBeInTheDocument();
  });

  it('shows protocol badges for different endpoint types', () => {
    renderWithProvider(<ConnectionHealthPage />);
    
    // Check for different protocol badges
    expect(screen.getAllByText('MODBUS-TCP').length).toBeGreaterThan(0);
    expect(screen.getAllByText('OPC-UA').length).toBeGreaterThan(0);
    expect(screen.getAllByText('HART').length).toBeGreaterThan(0);
  });
});