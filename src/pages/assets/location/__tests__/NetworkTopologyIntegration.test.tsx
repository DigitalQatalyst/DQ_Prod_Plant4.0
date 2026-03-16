import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
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

// Mock the layout components to avoid complex rendering
vi.mock('@/components/layout/ListPane', () => ({
  ListPane: ({ title, subtitle, children, count, actions }: any) => (
    <div data-testid="list-pane">
      <h2>{title}</h2>
      <p>{subtitle}</p>
      <span data-testid="node-count">{count}</span>
      {actions && <div data-testid="list-pane-actions">{actions}</div>}
      <div data-testid="node-list">{children}</div>
    </div>
  ),
}));

vi.mock('@/components/layout/WorkPane', () => ({
  WorkPane: ({ title, subtitle, tabs }: any) => (
    <div data-testid="work-pane">
      <h2>{title}</h2>
      <p>{subtitle}</p>
      <div data-testid="tabs">
        {tabs?.map((tab: any) => (
          <div key={tab.id} data-testid={`tab-${tab.id}`}>
            <span>{tab.label}</span>
            <div data-testid={`tab-content-${tab.id}`}>{tab.content}</div>
          </div>
        ))}
      </div>
    </div>
  ),
}));

// Mock UI components
vi.mock('@/components/ui/button', () => ({
  Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
}));

vi.mock('@/components/ui/select', () => ({
  Select: ({ children }: any) => <div data-testid="select">{children}</div>,
  SelectContent: ({ children }: any) => <div>{children}</div>,
  SelectItem: ({ children, value }: any) => <option value={value}>{children}</option>,
  SelectTrigger: ({ children }: any) => <div>{children}</div>,
  SelectValue: ({ placeholder }: any) => <span>{placeholder}</span>,
}));

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children, variant }: any) => <span className={`badge-${variant}`}>{children}</span>,
}));

vi.mock('@/components/ui/card', () => ({
  Card: ({ children, className }: any) => <div className={`card ${className}`}>{children}</div>,
  CardContent: ({ children }: any) => <div className="card-content">{children}</div>,
  CardDescription: ({ children }: any) => <p className="card-description">{children}</p>,
  CardHeader: ({ children }: any) => <div className="card-header">{children}</div>,
  CardTitle: ({ children }: any) => <h3 className="card-title">{children}</h3>,
}));

vi.mock('@/components/shared/StatusBadge', () => ({
  StatusBadge: ({ status }: any) => <span className="status-badge">{status}</span>,
}));

describe('NetworkTopologyPage Integration', () => {
  it('renders the complete page structure', () => {
    render(
      <BrowserRouter>
        <NetworkTopologyPage />
      </BrowserRouter>
    );
    
    // Check main structure
    expect(screen.getByTestId('list-pane')).toBeInTheDocument();
    expect(screen.getByTestId('work-pane')).toBeInTheDocument();
    
    // Check titles
    expect(screen.getByText('Network Topology')).toBeInTheDocument();
    expect(screen.getByText('Nodes (Wells, Manifolds, Facilities, Export headers)')).toBeInTheDocument();
    expect(screen.getByText('Network Topology Overview')).toBeInTheDocument();
  });

  it('renders all three tabs', () => {
    render(
      <BrowserRouter>
        <NetworkTopologyPage />
      </BrowserRouter>
    );
    
    expect(screen.getByTestId('tab-adjacency')).toBeInTheDocument();
    expect(screen.getByTestId('tab-schematic')).toBeInTheDocument();
    expect(screen.getByTestId('tab-connections')).toBeInTheDocument();
    
    // Use getAllByText to handle multiple elements with same text
    const adjacencyTableElements = screen.getAllByText('Adjacency Table');
    expect(adjacencyTableElements.length).toBeGreaterThan(0);
    expect(screen.getByText('Schematic Layout')).toBeInTheDocument();
    expect(screen.getByText('Connection Details')).toBeInTheDocument();
  });

  it('displays topology nodes from mock data', () => {
    render(
      <BrowserRouter>
        <NetworkTopologyPage />
      </BrowserRouter>
    );
    
    // Should show node count
    const nodeCount = screen.getByTestId('node-count');
    expect(nodeCount).toBeInTheDocument();
    
    // Should render node list
    expect(screen.getByTestId('node-list')).toBeInTheDocument();
  });

  it('includes filter functionality', () => {
    render(
      <BrowserRouter>
        <NetworkTopologyPage />
      </BrowserRouter>
    );
    
    // Should have actions section with filters
    const actionsSection = screen.getByTestId('list-pane-actions');
    expect(actionsSection).toBeInTheDocument();
    
    // Should have filter button
    const filterButton = screen.getByText('Filters');
    expect(filterButton).toBeInTheDocument();
    
    // Click to expand filters
    fireEvent.click(filterButton);
    
    // Should have filter controls (mocked as select components) after expanding
    const selects = screen.getAllByTestId('select');
    expect(selects.length).toBeGreaterThan(0);
  });

  it('renders adjacency table content', () => {
    render(
      <BrowserRouter>
        <NetworkTopologyPage />
      </BrowserRouter>
    );
    
    const adjacencyContent = screen.getByTestId('tab-content-adjacency');
    expect(adjacencyContent).toBeInTheDocument();
    
    // Should contain summary cards and table
    expect(adjacencyContent.textContent).toContain('Total Nodes');
    expect(adjacencyContent.textContent).toContain('Connections');
  });

  it('renders schematic layout content', () => {
    render(
      <BrowserRouter>
        <NetworkTopologyPage />
      </BrowserRouter>
    );
    
    const schematicContent = screen.getByTestId('tab-content-schematic');
    expect(schematicContent).toBeInTheDocument();
    
    // Should contain network diagram placeholder
    expect(schematicContent.textContent).toContain('Interactive Network Diagram');
  });

  it('renders connection details content', () => {
    render(
      <BrowserRouter>
        <NetworkTopologyPage />
      </BrowserRouter>
    );
    
    const connectionsContent = screen.getByTestId('tab-content-connections');
    expect(connectionsContent).toBeInTheDocument();
    
    // Should contain connection type summaries
    expect(connectionsContent.textContent).toContain('flowline');
    expect(connectionsContent.textContent).toContain('pipeline');
  });
});