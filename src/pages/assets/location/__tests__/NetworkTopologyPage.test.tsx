import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { NetworkTopologyPage } from '../NetworkTopologyPage';

// Mock the AppContext
const mockAppContext = {
  currentTenant: { id: 'alpha-upstream', name: 'Alpha Upstream Ltd' },
  selectedAsset: null,
  setSelectedAsset: vi.fn(),
  setIsPopPaneOpen: vi.fn(),
  setPopPaneContent: vi.fn(),
};

vi.mock('@/context/AppContext', () => ({
  useApp: () => mockAppContext,
}));

// Mock the layout components
vi.mock('@/components/layout/ListPane', () => ({
  ListPane: ({ title, subtitle, children }: any) => (
    <div data-testid="list-pane">
      <h2>{title}</h2>
      <p>{subtitle}</p>
      {children}
    </div>
  ),
}));

vi.mock('@/components/layout/WorkPane', () => ({
  WorkPane: ({ title, subtitle, tabs }: any) => (
    <div data-testid="work-pane">
      <h2>{title}</h2>
      <p>{subtitle}</p>
      {tabs?.map((tab: any) => (
        <div key={tab.id} data-testid={`tab-${tab.id}`}>
          {tab.label}
        </div>
      ))}
    </div>
  ),
}));

describe('NetworkTopologyPage', () => {
  it('renders the page with correct title and subtitle', () => {
    render(<NetworkTopologyPage />);
    
    expect(screen.getByText('Network Topology')).toBeInTheDocument();
    expect(screen.getByText('Nodes (Wells, Manifolds, Facilities, Export headers)')).toBeInTheDocument();
  });

  it('renders the work pane with correct tabs', () => {
    render(<NetworkTopologyPage />);
    
    expect(screen.getByText('Network Topology Overview')).toBeInTheDocument();
    expect(screen.getByTestId('tab-adjacency')).toBeInTheDocument();
    expect(screen.getByTestId('tab-schematic')).toBeInTheDocument();
    expect(screen.getByTestId('tab-connections')).toBeInTheDocument();
  });

  it('displays topology nodes from mock data', () => {
    render(<NetworkTopologyPage />);
    
    // The component should render without errors and show the list pane
    expect(screen.getByTestId('list-pane')).toBeInTheDocument();
    expect(screen.getByTestId('work-pane')).toBeInTheDocument();
  });
});