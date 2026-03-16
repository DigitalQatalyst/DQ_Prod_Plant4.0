import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within, waitFor } from '@testing-library/react';
import { PostureBySite } from './PostureBySite';
import React from 'react';

// Mock the AppContext
const mockTenant = { id: 't1', name: 'DEWA Transmission', industry: 'utilities' };
const mockSetCurrentTenant = vi.fn();

vi.mock('@/context/AppContext', () => ({
  useApp: () => ({
    currentTenant: mockTenant,
    setCurrentTenant: mockSetCurrentTenant,
  }),
}));

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          in: vi.fn(() => ({
            order: vi.fn(() => ({
              limit: vi.fn(() => Promise.resolve({ data: [], error: null }))
            }))
          }))
        }))
      }))
    }))
  }
}));

// Mock security dashboard queries
vi.mock('@/lib/securityDashboardQueries', () => ({
  getSiteSecurityPostures: vi.fn(() => Promise.resolve([
    {
      siteId: 's1',
      siteName: 'Al Quoz Substation',
      siteType: 'substation',
      totalAssets: 45,
      criticalAssets: 12,
      vulnerableAssets: 3,
      securityScore: 85,
      riskScore: 25,
      complianceStatus: 'compliant',
      openAlerts: 2,
      criticalAlerts: 0,
      lastAssessment: '2024-01-15T10:00:00Z',
      zones: 4,
      compliantZones: 4
    },
    {
      siteId: 's2',
      siteName: 'Jebel Ali Grid Station',
      siteType: 'grid-station',
      totalAssets: 78,
      criticalAssets: 25,
      vulnerableAssets: 5,
      securityScore: 72,
      riskScore: 38,
      complianceStatus: 'partial',
      openAlerts: 8,
      criticalAlerts: 2,
      lastAssessment: '2024-01-15T10:00:00Z',
      zones: 6,
      compliantZones: 4
    }
  ]))
}));

// Mock the layout components to simplify testing
vi.mock('@/components/layout/ListPane', () => ({
  ListPane: ({ children, title, subtitle }: any) => (
    <div data-testid="list-pane">
      <div data-testid="list-pane-title">{title}</div>
      <div data-testid="list-pane-subtitle">{subtitle}</div>
      {children}
    </div>
  ),
}));

vi.mock('@/components/layout/WorkPane', () => ({
  WorkPane: ({ title, subtitle, tabs, emptyState }: any) => (
    <div data-testid="work-pane">
      <div data-testid="work-pane-title">{title}</div>
      <div data-testid="work-pane-subtitle">{subtitle}</div>
      {tabs && tabs.length > 0 && tabs[0].content}
      {emptyState && <div data-testid="empty-state">{emptyState.title}</div>}
    </div>
  ),
}));

vi.mock('@/components/shared/LoadingState', () => ({
  LoadingState: ({ message }: any) => <div data-testid="loading-state">{message}</div>
}));

vi.mock('@/components/shared/EmptyState', () => ({
  EmptyState: ({ title }: any) => <div data-testid="empty-state">{title}</div>
}));

/**
 * Unit Tests for PostureBySite Component (Transmission Context)
 * Requirements: 1.2, 10.1
 */
describe('PostureBySite Unit Tests - Transmission Context', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render without errors', async () => {
      const { container } = render(<PostureBySite />);
      await waitFor(() => {
        expect(container).toBeTruthy();
      });
    });

    it('should render ListPane with transmission-specific title', async () => {
      render(<PostureBySite />);
      
      await waitFor(() => {
        expect(screen.getByTestId('list-pane-title')).toHaveTextContent('Transmission Sites by Type');
      });
    });

    it('should display site count in subtitle', async () => {
      render(<PostureBySite />);
      
      await waitFor(() => {
        expect(screen.getByTestId('list-pane-subtitle').textContent).toContain('sites across');
      });
    });
  });

  describe('Transmission Site Grouping', () => {
    it('should group sites by transmission type correctly', async () => {
      render(<PostureBySite />);
      
      await waitFor(() => {
        const listPane = screen.getByTestId('list-pane');
        
        // Should show transmission site type headers (using getAllByText since they appear multiple times)
        expect(within(listPane).getAllByText('Substations').length).toBeGreaterThan(0);
        expect(within(listPane).getAllByText('Grid Stations').length).toBeGreaterThan(0);
      });
    });

    it('should display site count for each transmission type', async () => {
      render(<PostureBySite />);
      
      await waitFor(() => {
        const listPane = screen.getByTestId('list-pane');
        
        // Should show counts in parentheses (using getAllByText since there are multiple site types)
        const counts = within(listPane).getAllByText(/\(\d+\)/);
        expect(counts.length).toBeGreaterThan(0);
      });
    });

    it('should display transmission site names', async () => {
      render(<PostureBySite />);
      
      await waitFor(() => {
        const listPane = screen.getByTestId('list-pane');
        
        // Should show transmission-specific site names
        expect(within(listPane).getByText('Al Quoz Substation')).toBeInTheDocument();
        expect(within(listPane).getByText('Jebel Ali Grid Station')).toBeInTheDocument();
      });
    });
  });

  describe('Tenant Context Integration', () => {
    it('should use current tenant from context', async () => {
      render(<PostureBySite />);
      
      await waitFor(() => {
        // Component should render successfully with tenant context
        expect(screen.getByTestId('list-pane')).toBeInTheDocument();
      });
    });
  });

  describe('Transmission-Specific Data Display', () => {
    it('should display transmission site types', async () => {
      render(<PostureBySite />);
      
      await waitFor(() => {
        const listPane = screen.getByTestId('list-pane');
        
        // Should show transmission-specific site types (using getAllByText since they appear multiple times)
        expect(within(listPane).getAllByText('Substations').length).toBeGreaterThan(0);
        expect(within(listPane).getAllByText('Grid Stations').length).toBeGreaterThan(0);
      });
    });

    it('should display security metrics for transmission sites', async () => {
      render(<PostureBySite />);
      
      await waitFor(() => {
        const listPane = screen.getByTestId('list-pane');
        
        // Should show security score percentages
        expect(within(listPane).getAllByText('85%').length).toBeGreaterThan(0);
        expect(within(listPane).getAllByText('72%').length).toBeGreaterThan(0);
      });
    });

    it('should display compliance status badges', async () => {
      render(<PostureBySite />);
      
      await waitFor(() => {
        const listPane = screen.getByTestId('list-pane');
        
        // Should show compliance status (capitalized by StatusBadge component)
        expect(within(listPane).getByText('Compliant')).toBeInTheDocument();
        expect(within(listPane).getByText('Partial')).toBeInTheDocument();
      });
    });

    it('should display critical asset counts', async () => {
      render(<PostureBySite />);
      
      await waitFor(() => {
        const listPane = screen.getByTestId('list-pane');
        
        // Should show critical asset counts
        expect(within(listPane).getByText('12 critical')).toBeInTheDocument();
        expect(within(listPane).getByText('25 critical')).toBeInTheDocument();
      });
    });

    it('should display alert counts', async () => {
      render(<PostureBySite />);
      
      await waitFor(() => {
        const listPane = screen.getByTestId('list-pane');
        
        // Should show alert counts
        expect(within(listPane).getByText('2 alerts')).toBeInTheDocument();
        expect(within(listPane).getByText('8 alerts')).toBeInTheDocument();
      });
    });
  });

  describe('Supabase Integration', () => {
    it('should fetch site security postures from Supabase', async () => {
      const { getSiteSecurityPostures } = await import('@/lib/securityDashboardQueries');
      
      render(<PostureBySite />);
      
      await waitFor(() => {
        expect(getSiteSecurityPostures).toHaveBeenCalledWith('t1');
      });
    });

    it('should display loading state while fetching data', () => {
      render(<PostureBySite />);
      
      expect(screen.getByTestId('loading-state')).toBeInTheDocument();
      expect(screen.getByText('Loading site security postures...')).toBeInTheDocument();
    });
  });
});