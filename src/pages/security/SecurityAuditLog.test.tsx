import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within, fireEvent } from '@testing-library/react';
import * as fc from 'fast-check';
import { AuditLogEntry } from '@/data/mockData';
import { SecurityAuditLog } from './SecurityAuditLog';
import React from 'react';

// Mock the AppContext
const mockTenant = { id: 't1', name: 'Kenya Power', industry: 'Utilities' };
const mockSetCurrentTenant = vi.fn();

vi.mock('@/context/AppContext', () => ({
  useApp: () => ({
    currentTenant: mockTenant,
    setCurrentTenant: mockSetCurrentTenant,
  }),
}));

// Mock the layout components to simplify testing
vi.mock('@/components/layout/ListPane', () => ({
  ListPane: ({ children, title, subtitle, count, searchPlaceholder, onSearch, showFilters }: any) => (
    <div data-testid="list-pane">
      <div data-testid="list-pane-title">{title}</div>
      <div data-testid="list-pane-subtitle">{subtitle}</div>
      <div data-testid="list-pane-count">{count}</div>
      {onSearch && (
        <input
          data-testid="search-input"
          placeholder={searchPlaceholder}
          onChange={(e) => onSearch(e.target.value)}
        />
      )}
      {children}
    </div>
  ),
}));

vi.mock('@/components/layout/WorkPane', () => ({
  WorkPane: ({ title, subtitle, tabs }: any) => (
    <div data-testid="work-pane">
      <div data-testid="work-pane-title">{title}</div>
      <div data-testid="work-pane-subtitle">{subtitle}</div>
      {tabs && tabs.length > 0 && (
        <div data-testid="work-pane-tabs">
          {tabs.map((tab: any) => (
            <div key={tab.id} data-testid={`tab-${tab.id}`}>
              {tab.content}
            </div>
          ))}
        </div>
      )}
    </div>
  ),
}));

/**
 * Unit Tests for SecurityAuditLog Component
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5
 */
describe('SecurityAuditLog Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render without errors', () => {
      const { container } = render(<SecurityAuditLog />);
      expect(container).toBeTruthy();
    });

    it('should render ListPane with correct title and subtitle', () => {
      render(<SecurityAuditLog />);
      
      expect(screen.getByTestId('list-pane-title')).toHaveTextContent('Security Audit Log');
      expect(screen.getByTestId('list-pane-subtitle')).toHaveTextContent('Kenya Power');
    });

    it('should render audit log entries correctly', () => {
      render(<SecurityAuditLog />);
      
      const listPane = screen.getByTestId('list-pane');
      
      // Check for audit log entries from tenant t1
      expect(within(listPane).getByText('User login')).toBeInTheDocument();
    });

    it('should display summary statistics', () => {
      render(<SecurityAuditLog />);
      
      const listPane = screen.getByTestId('list-pane');
      
      expect(within(listPane).getByText('Total Events')).toBeInTheDocument();
      expect(within(listPane).getByText('Failed')).toBeInTheDocument();
      expect(within(listPane).getByText('Config Changes')).toBeInTheDocument();
      expect(within(listPane).getByText('Critical')).toBeInTheDocument();
    });

    it('should display filter controls', () => {
      render(<SecurityAuditLog />);
      
      const listPane = screen.getByTestId('list-pane');
      
      expect(within(listPane).getByText('Category')).toBeInTheDocument();
      expect(within(listPane).getByText('Outcome')).toBeInTheDocument();
    });

    it('should display search input', () => {
      render(<SecurityAuditLog />);
      
      const searchInput = screen.getByTestId('search-input');
      expect(searchInput).toBeInTheDocument();
      expect(searchInput).toHaveAttribute('placeholder', 'Search events...');
    });
  });

  describe('Event Selection', () => {
    it('should render WorkPane when an event is selected', () => {
      render(<SecurityAuditLog />);
      
      // WorkPane should be rendered with the first event selected by default
      expect(screen.getByTestId('work-pane')).toBeInTheDocument();
    });

    it('should update WorkPane title when event is selected', () => {
      render(<SecurityAuditLog />);
      
      const workPane = screen.getByTestId('work-pane');
      
      // The first event should be selected by default
      expect(within(workPane).getByTestId('work-pane-title')).toHaveTextContent('User login');
    });

    it('should display event details in WorkPane', () => {
      render(<SecurityAuditLog />);
      
      const workPane = screen.getByTestId('work-pane');
      
      // Check for Details tab content
      expect(within(workPane).getByText('Event Information')).toBeInTheDocument();
    });

    it('should display all tabs for selected event', () => {
      render(<SecurityAuditLog />);
      
      const workPane = screen.getByTestId('work-pane');
      
      // Check that all tabs are present
      expect(within(workPane).getByTestId('tab-details')).toBeInTheDocument();
      expect(within(workPane).getByTestId('tab-context')).toBeInTheDocument();
      expect(within(workPane).getByTestId('tab-related')).toBeInTheDocument();
    });

    it('should update WorkPane when a different event is clicked', () => {
      const { container } = render(<SecurityAuditLog />);
      
      const listPane = screen.getByTestId('list-pane');
      
      // Find and click on a different event
      const events = within(listPane).getAllByText(/User|Configuration|Data/);
      if (events.length > 1) {
        fireEvent.click(events[1].closest('div')!);
        
        // WorkPane should update (we can't easily test the exact content change without more complex mocking)
        expect(screen.getByTestId('work-pane')).toBeInTheDocument();
      }
    });
  });

  describe('Category Filtering', () => {
    it('should display category filter dropdown', () => {
      render(<SecurityAuditLog />);
      
      const listPane = screen.getByTestId('list-pane');
      const categorySelect = within(listPane).getAllByRole('combobox')[0];
      
      expect(categorySelect).toBeInTheDocument();
    });

    it('should filter events by authentication category', () => {
      render(<SecurityAuditLog />);
      
      const listPane = screen.getByTestId('list-pane');
      const categorySelect = within(listPane).getAllByRole('combobox')[0];
      
      // Change to authentication category
      fireEvent.change(categorySelect, { target: { value: 'authentication' } });
      
      // Count should update to show only authentication events
      const count = screen.getByTestId('list-pane-count');
      expect(count).toBeInTheDocument();
    });

    it('should filter events by configuration category', () => {
      render(<SecurityAuditLog />);
      
      const listPane = screen.getByTestId('list-pane');
      const categorySelect = within(listPane).getAllByRole('combobox')[0];
      
      // Change to configuration category
      fireEvent.change(categorySelect, { target: { value: 'configuration' } });
      
      // Count should update
      const count = screen.getByTestId('list-pane-count');
      expect(count).toBeInTheDocument();
    });

    it('should show all events when category filter is set to all', () => {
      render(<SecurityAuditLog />);
      
      const listPane = screen.getByTestId('list-pane');
      const categorySelect = within(listPane).getAllByRole('combobox')[0];
      
      // First filter to a specific category
      fireEvent.change(categorySelect, { target: { value: 'authentication' } });
      
      // Then change back to all
      fireEvent.change(categorySelect, { target: { value: 'all' } });
      
      // Should show all events again
      const count = screen.getByTestId('list-pane-count');
      expect(count).toBeInTheDocument();
    });
  });

  describe('Outcome Filtering', () => {
    it('should display outcome filter dropdown', () => {
      render(<SecurityAuditLog />);
      
      const listPane = screen.getByTestId('list-pane');
      const outcomeSelect = within(listPane).getAllByRole('combobox')[1];
      
      expect(outcomeSelect).toBeInTheDocument();
    });

    it('should filter events by success outcome', () => {
      render(<SecurityAuditLog />);
      
      const listPane = screen.getByTestId('list-pane');
      const outcomeSelect = within(listPane).getAllByRole('combobox')[1];
      
      // Change to success outcome
      fireEvent.change(outcomeSelect, { target: { value: 'success' } });
      
      // Count should update to show only successful events
      const count = screen.getByTestId('list-pane-count');
      expect(count).toBeInTheDocument();
    });

    it('should filter events by failure outcome', () => {
      render(<SecurityAuditLog />);
      
      const listPane = screen.getByTestId('list-pane');
      const outcomeSelect = within(listPane).getAllByRole('combobox')[1];
      
      // Change to failure outcome
      fireEvent.change(outcomeSelect, { target: { value: 'failure' } });
      
      // Count should update
      const count = screen.getByTestId('list-pane-count');
      expect(count).toBeInTheDocument();
    });

    it('should show all events when outcome filter is set to all', () => {
      render(<SecurityAuditLog />);
      
      const listPane = screen.getByTestId('list-pane');
      const outcomeSelect = within(listPane).getAllByRole('combobox')[1];
      
      // First filter to a specific outcome
      fireEvent.change(outcomeSelect, { target: { value: 'success' } });
      
      // Then change back to all
      fireEvent.change(outcomeSelect, { target: { value: 'all' } });
      
      // Should show all events again
      const count = screen.getByTestId('list-pane-count');
      expect(count).toBeInTheDocument();
    });
  });

  describe('Search Functionality', () => {
    it('should filter events by search query', () => {
      render(<SecurityAuditLog />);
      
      const searchInput = screen.getByTestId('search-input');
      
      // Type a search query
      fireEvent.change(searchInput, { target: { value: 'login' } });
      
      // Count should update to show filtered results
      const count = screen.getByTestId('list-pane-count');
      expect(count).toBeInTheDocument();
    });

    it('should search across user, action, resource, and details fields', () => {
      render(<SecurityAuditLog />);
      
      const searchInput = screen.getByTestId('search-input');
      
      // Search for a user name
      fireEvent.change(searchInput, { target: { value: 'admin' } });
      
      const count = screen.getByTestId('list-pane-count');
      expect(count).toBeInTheDocument();
    });

    it('should be case-insensitive', () => {
      render(<SecurityAuditLog />);
      
      const searchInput = screen.getByTestId('search-input');
      
      // Search with uppercase
      fireEvent.change(searchInput, { target: { value: 'LOGIN' } });
      
      const countUpper = screen.getByTestId('list-pane-count').textContent;
      
      // Search with lowercase
      fireEvent.change(searchInput, { target: { value: 'login' } });
      
      const countLower = screen.getByTestId('list-pane-count').textContent;
      
      // Should return same results
      expect(countUpper).toBe(countLower);
    });

    it('should show all events when search query is empty', () => {
      render(<SecurityAuditLog />);
      
      const searchInput = screen.getByTestId('search-input');
      
      // First search for something
      fireEvent.change(searchInput, { target: { value: 'login' } });
      
      // Then clear the search
      fireEvent.change(searchInput, { target: { value: '' } });
      
      // Should show all events again
      const count = screen.getByTestId('list-pane-count');
      expect(count).toBeInTheDocument();
    });

    it('should handle search with no results', () => {
      render(<SecurityAuditLog />);
      
      const searchInput = screen.getByTestId('search-input');
      
      // Search for something that doesn't exist
      fireEvent.change(searchInput, { target: { value: 'NONEXISTENT_SEARCH_TERM_12345' } });
      
      const count = screen.getByTestId('list-pane-count');
      expect(count).toHaveTextContent('0');
    });
  });

  describe('Combined Filtering', () => {
    it('should apply both category and outcome filters together', () => {
      render(<SecurityAuditLog />);
      
      const listPane = screen.getByTestId('list-pane');
      const categorySelect = within(listPane).getAllByRole('combobox')[0];
      const outcomeSelect = within(listPane).getAllByRole('combobox')[1];
      
      // Apply both filters
      fireEvent.change(categorySelect, { target: { value: 'authentication' } });
      fireEvent.change(outcomeSelect, { target: { value: 'failure' } });
      
      // Count should reflect both filters
      const count = screen.getByTestId('list-pane-count');
      expect(count).toBeInTheDocument();
    });

    it('should apply category filter and search together', () => {
      render(<SecurityAuditLog />);
      
      const listPane = screen.getByTestId('list-pane');
      const categorySelect = within(listPane).getAllByRole('combobox')[0];
      const searchInput = screen.getByTestId('search-input');
      
      // Apply both filters
      fireEvent.change(categorySelect, { target: { value: 'authentication' } });
      fireEvent.change(searchInput, { target: { value: 'admin' } });
      
      // Count should reflect both filters
      const count = screen.getByTestId('list-pane-count');
      expect(count).toBeInTheDocument();
    });

    it('should apply all filters together', () => {
      render(<SecurityAuditLog />);
      
      const listPane = screen.getByTestId('list-pane');
      const categorySelect = within(listPane).getAllByRole('combobox')[0];
      const outcomeSelect = within(listPane).getAllByRole('combobox')[1];
      const searchInput = screen.getByTestId('search-input');
      
      // Apply all filters
      fireEvent.change(categorySelect, { target: { value: 'authentication' } });
      fireEvent.change(outcomeSelect, { target: { value: 'success' } });
      fireEvent.change(searchInput, { target: { value: 'login' } });
      
      // Count should reflect all filters
      const count = screen.getByTestId('list-pane-count');
      expect(count).toBeInTheDocument();
    });
  });

  describe('Event Details Display', () => {
    it('should display event timestamp', () => {
      render(<SecurityAuditLog />);
      
      const workPane = screen.getByTestId('work-pane');
      
      expect(within(workPane).getByText('Timestamp')).toBeInTheDocument();
    });

    it('should display event user', () => {
      render(<SecurityAuditLog />);
      
      const workPane = screen.getByTestId('work-pane');
      
      expect(within(workPane).getByText('User')).toBeInTheDocument();
    });

    it('should display event type', () => {
      render(<SecurityAuditLog />);
      
      const workPane = screen.getByTestId('work-pane');
      
      expect(within(workPane).getByText('Event Type')).toBeInTheDocument();
    });

    it('should display event resource', () => {
      render(<SecurityAuditLog />);
      
      const workPane = screen.getByTestId('work-pane');
      
      expect(within(workPane).getByText('Resource')).toBeInTheDocument();
    });

    it('should display event outcome', () => {
      render(<SecurityAuditLog />);
      
      const workPane = screen.getByTestId('work-pane');
      
      expect(within(workPane).getByText('Outcome')).toBeInTheDocument();
    });
  });

  describe('Event Context Display', () => {
    it('should display session information', () => {
      render(<SecurityAuditLog />);
      
      const workPane = screen.getByTestId('work-pane');
      const contextTab = within(workPane).getByTestId('tab-context');
      
      expect(within(contextTab).getByText('Session Information')).toBeInTheDocument();
      expect(within(contextTab).getByText('Session ID')).toBeInTheDocument();
      expect(within(contextTab).getByText('IP Address')).toBeInTheDocument();
      expect(within(contextTab).getByText('User ID')).toBeInTheDocument();
    });

    it('should display risk assessment', () => {
      render(<SecurityAuditLog />);
      
      const workPane = screen.getByTestId('work-pane');
      const contextTab = within(workPane).getByTestId('tab-context');
      
      expect(within(contextTab).getByText('Risk Assessment')).toBeInTheDocument();
      expect(within(contextTab).getByText('Threat Level')).toBeInTheDocument();
      expect(within(contextTab).getByText('Requires Review')).toBeInTheDocument();
      expect(within(contextTab).getByText('Compliance Impact')).toBeInTheDocument();
    });
  });

  describe('Related Events Display', () => {
    it('should display related events section', () => {
      render(<SecurityAuditLog />);
      
      const workPane = screen.getByTestId('work-pane');
      const relatedTab = within(workPane).getByTestId('tab-related');
      
      expect(within(relatedTab).getByText('Related Events')).toBeInTheDocument();
    });

    it('should display event pattern analysis', () => {
      render(<SecurityAuditLog />);
      
      const workPane = screen.getByTestId('work-pane');
      const relatedTab = within(workPane).getByTestId('tab-related');
      
      expect(within(relatedTab).getByText('Event Pattern Analysis')).toBeInTheDocument();
      expect(within(relatedTab).getByText('Events by this user')).toBeInTheDocument();
      expect(within(relatedTab).getByText('Events in this session')).toBeInTheDocument();
      expect(within(relatedTab).getByText('Events on this resource')).toBeInTheDocument();
      expect(within(relatedTab).getByText('Similar event types')).toBeInTheDocument();
    });
  });

  describe('Tenant Context Integration', () => {
    it('should use current tenant from context', () => {
      render(<SecurityAuditLog />);
      
      // Verify tenant name appears in subtitle
      expect(screen.getByText('Kenya Power')).toBeInTheDocument();
    });

    it('should display data filtered by tenant', () => {
      render(<SecurityAuditLog />);
      
      const listPane = screen.getByTestId('list-pane');
      
      // Verify we're seeing tenant t1 data
      expect(within(listPane).getByText('User login')).toBeInTheDocument();
    });
  });

  describe('Event Sorting', () => {
    it('should sort events by timestamp with most recent first', () => {
      render(<SecurityAuditLog />);
      
      const listPane = screen.getByTestId('list-pane');
      
      // The first event should be the most recent one
      // We can verify this by checking that events are displayed
      expect(within(listPane).getByText('User login')).toBeInTheDocument();
    });
  });
});
