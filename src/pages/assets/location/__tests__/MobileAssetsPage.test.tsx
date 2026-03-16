import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MobileAssetsPage } from '../MobileAssetsPage';

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

describe('MobileAssetsPage', () => {
  it('renders the page with correct title and subtitle', () => {
    render(<MobileAssetsPage />);
    
    expect(screen.getByText('Mobile Assets')).toBeInTheDocument();
    expect(screen.getByText('Mobile assets (trucks, portable pumps/generators)')).toBeInTheDocument();
  });

  it('renders the work pane with correct tabs', () => {
    render(<MobileAssetsPage />);
    
    expect(screen.getByText('Mobile Assets Overview')).toBeInTheDocument();
    expect(screen.getByTestId('tab-overview')).toBeInTheDocument();
    expect(screen.getByTestId('tab-locations')).toBeInTheDocument();
    expect(screen.getByTestId('tab-assignments')).toBeInTheDocument();
  });

  it('displays mobile assets from mock data', () => {
    render(<MobileAssetsPage />);
    
    // The component should render without errors and show the list pane
    expect(screen.getByTestId('list-pane')).toBeInTheDocument();
    expect(screen.getByTestId('work-pane')).toBeInTheDocument();
  });

  it('shows correct tab labels', () => {
    render(<MobileAssetsPage />);
    
    expect(screen.getByText('Overview')).toBeInTheDocument();
    expect(screen.getByText('Locations')).toBeInTheDocument();
    expect(screen.getByText('Assignments')).toBeInTheDocument();
  });
});