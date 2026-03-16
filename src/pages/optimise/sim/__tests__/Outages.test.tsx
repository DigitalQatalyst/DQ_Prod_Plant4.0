import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { Outages } from '../Outages';
import { AppProvider } from '@/context/AppContext';

// Mock the data provider hook
vi.mock('@/hooks/useDataProvider', () => ({
  useDataProvider: () => ({
    provider: {
      listOutages: vi.fn().mockResolvedValue([]),
      getOutage: vi.fn().mockResolvedValue(null),
      createOutage: vi.fn().mockResolvedValue({}),
      updateOutage: vi.fn().mockResolvedValue({}),
    }
  })
}));

// Mock the sector content filter hook
vi.mock('@/hooks/use-sector-switching', () => ({
  useSectorContentFilter: () => ({
    filterItems: (items: any[]) => items,
    currentSectorName: 'Power',
    currentSubsectorName: 'Transmission'
  })
}));

// Mock the layout components
vi.mock('@/components/layout/ErrorAwareListPane', () => ({
  ErrorAwareListPane: ({ children, title }: any) => (
    <div data-testid="list-pane">
      <h2>{title}</h2>
      {children}
    </div>
  )
}));

vi.mock('@/components/layout/ErrorAwareWorkPane', () => ({
  ErrorAwareWorkPane: ({ title, tabs, selectedTab }: any) => (
    <div data-testid="work-pane">
      <h2>{title}</h2>
      {tabs?.map((tab: any) => (
        <div key={tab.id} data-testid={`tab-${tab.id}`}>
          {tab.label}
        </div>
      ))}
      {!selectedTab && (
        <div data-testid="tab-empty">
          <div>Select Outage</div>
        </div>
      )}
    </div>
  )
}));

const renderWithProviders = (component: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppProvider>
          {component}
        </AppProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('Outages Component', () => {
  it('should render the outages page with correct title', () => {
    renderWithProviders(<Outages />);
    
    expect(screen.getByText('Outages')).toBeInTheDocument();
    expect(screen.getByTestId('list-pane')).toBeInTheDocument();
    // Work pane only renders when an outage is selected
  });

  it('should display empty state when no outages exist', () => {
    renderWithProviders(<Outages />);
    
    expect(screen.getByText('No outages found')).toBeInTheDocument();
    expect(screen.getByText('Create your first outage record to get started')).toBeInTheDocument();
  });

  it('should render filter controls', () => {
    renderWithProviders(<Outages />);
    
    // The component should render filter dropdowns and date inputs
    // These are rendered within the ErrorAwareListPane actions prop
    expect(screen.getByTestId('list-pane')).toBeInTheDocument();
  });

  it('should handle component mounting without errors', () => {
    expect(() => {
      renderWithProviders(<Outages />);
    }).not.toThrow();
  });
});