import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Simulations } from '../Simulations';
import { AppProvider } from '@/context/AppContext';
import { BrowserRouter } from 'react-router-dom';

// Mock the hooks and context
vi.mock('@/hooks/use-sector-switching', () => ({
  useSectorContentFilter: () => ({
    filterItems: (items: any[]) => items,
    currentSectorName: 'FMCG',
    currentSubsectorName: 'Food & Beverage'
  })
}));

vi.mock('@/context/AppContext', () => ({
  useApp: () => ({
    currentTenant: { name: 'Test Tenant' },
    selectedAsset: null,
    setSelectedAsset: vi.fn(),
    setIsPopPaneOpen: vi.fn(),
    setPopPaneContent: vi.fn()
  }),
  AppProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}));

vi.mock('@/lib/sectorModalUtils', () => ({
  getSectorSpecificModalContent: () => ({ type: 'test', data: {} })
}));

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>
    <AppProvider>
      {children}
    </AppProvider>
  </BrowserRouter>
);

describe('Simulations Component', () => {
  it('renders without crashing', () => {
    render(
      <TestWrapper>
        <Simulations />
      </TestWrapper>
    );
    
    // Check for multiple instances of the title (list pane and work pane)
    const titles = screen.getAllByText('Optimization Simulations');
    expect(titles.length).toBeGreaterThan(0);
  });

  it('displays scenarios when available', () => {
    render(
      <TestWrapper>
        <Simulations />
      </TestWrapper>
    );
    
    // Should show the search input for scenarios
    expect(screen.getByPlaceholderText('Search simulations...')).toBeInTheDocument();
  });
});