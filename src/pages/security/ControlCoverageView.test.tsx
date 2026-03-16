import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within, fireEvent } from '@testing-library/react';
import { ControlCoverageView } from './ControlCoverageView';
import React from 'react';

// Mock the AppContext
const mockTenant = { id: 't1', name: 'KSA Upstream JV', industry: 'Oil & Gas' };
const mockSetCurrentTenant = vi.fn();

vi.mock('@/context/AppContext', () => ({
  useApp: () => ({
    currentTenant: mockTenant,
    setCurrentTenant: mockSetCurrentTenant,
  }),
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
  WorkPane: ({ title, subtitle, tabs }: any) => (
    <div data-testid="work-pane">
      <div data-testid="work-pane-title">{title}</div>
      <div data-testid="work-pane-subtitle">{subtitle}</div>
      {tabs && tabs.length > 0 && tabs[0].content}
    </div>
  ),
}));

/**
 * Unit Tests for ControlCoverageView Component
 * Requirements: 1.3
 */
describe('ControlCoverageView Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render without errors', () => {
      const { container } = render(<ControlCoverageView />);
      expect(container).toBeTruthy();
    });

    it('should render ListPane with correct title and subtitle', () => {
      render(<ControlCoverageView />);
      
      expect(screen.getByTestId('list-pane-title')).toHaveTextContent('Security Controls by Standard');
      expect(screen.getByTestId('list-pane-subtitle')).toContain('controls across');
    });
  });

  describe('Controls Grouping by Standard', () => {
    it('should group controls by compliance standard', () => {
      render(<ControlCoverageView />);
      
      const listPane = screen.getByTestId('list-pane');
      
      // Should show upstream-specific standards
      expect(within(listPane).getByText('API 1164')).toBeInTheDocument();
      expect(within(listPane).getByText('IEC 62443')).toBeInTheDocument();
    });

    it('should display control count for each standard', () => {
      render(<ControlCoverageView />);
      
      const listPane = screen.getByTestId('list-pane');
      
      // Should show counts in parentheses
      expect(within(listPane).getByText(/\(\d+\)/)).toBeInTheDocument();
    });

    it('should display average coverage percentage for each standard', () => {
      render(<ControlCoverageView />);
      
      const listPane = screen.getByTestId('list-pane');
      
      // Should show average coverage percentages
      expect(within(listPane).getByText(/\d+% avg coverage/)).toBeInTheDocument();
    });

    it('should display control implementation status badges', () => {
      render(<ControlCoverageView />);
      
      const listPane = screen.getByTestId('list-pane');
      
      // Should show implementation status
      expect(within(listPane).getByText('implemented')).toBeInTheDocument();
    });

    it('should display upstream relevance indicators', () => {
      render(<ControlCoverageView />);
      
      const listPane = screen.getByTestId('list-pane');
      
      // Should show upstream relevance levels
      expect(within(listPane).getByText('critical')).toBeInTheDocument();
    });

    it('should display coverage percentages for individual controls', () => {
      render(<ControlCoverageView />);
      
      const listPane = screen.getByTestId('list-pane');
      
      // Should show coverage percentages
      expect(within(listPane).getByText(/\d+%/)).toBeInTheDocument();
    });
  });

  describe('Control Selection and WorkPane Update', () => {
    it('should show empty state when no control is selected initially', () => {
      render(<ControlCoverageView />);
      
      const workPane = screen.getByTestId('work-pane');
      expect(within(workPane).getByTestId('work-pane-title')).toHaveTextContent('Select a Control');
    });

    it('should update WorkPane when a control is clicked', () => {
      render(<ControlCoverageView />);
      
      const listPane = screen.getByTestId('list-pane');
      const controlElement = within(listPane).getByText('Remote Access Control');
      
      // Click on a control
      fireEvent.click(controlElement.closest('div')!);
      
      // WorkPane should update to show the selected control
      const workPane = screen.getByTestId('work-pane');
      expect(within(workPane).getByTestId('work-pane-title')).toHaveTextContent('Remote Access Control');
    });

    it('should display control code and category in WorkPane subtitle', () => {
      render(<ControlCoverageView />);
      
      const listPane = screen.getByTestId('list-pane');
      const controlElement = within(listPane).getByText('Remote Access Control');
      
      fireEvent.click(controlElement.closest('div')!);
      
      const workPane = screen.getByTestId('work-pane');
      const subtitle = within(workPane).getByTestId('work-pane-subtitle');
      expect(subtitle.textContent).toContain('access control');
    });
  });

  describe('Tenant Context Integration', () => {
    it('should use current tenant from context', () => {
      render(<ControlCoverageView />);
      
      // Verify tenant name appears in subtitle
      expect(screen.getByText('KSA Upstream JV')).toBeInTheDocument();
    });

    it('should display upstream-specific controls', () => {
      render(<ControlCoverageView />);
      
      const listPane = screen.getByTestId('list-pane');
      
      // Verify we're seeing upstream-specific controls
      expect(within(listPane).getByText('Remote Access Control')).toBeInTheDocument();
      expect(within(listPane).getByText('SIS Protection Control')).toBeInTheDocument();
    });
  });

  describe('Upstream-Specific Data Display', () => {
    it('should display upstream compliance standards', () => {
      render(<ControlCoverageView />);
      
      const listPane = screen.getByTestId('list-pane');
      
      // Should show upstream-specific standards
      expect(within(listPane).getByText('API 1164')).toBeInTheDocument();
      expect(within(listPane).getByText('IEC 62443')).toBeInTheDocument();
      expect(within(listPane).getByText('NIST 800-82')).toBeInTheDocument();
    });

    it('should show applicable site types for controls', () => {
      render(<ControlCoverageView />);
      
      const listPane = screen.getByTestId('list-pane');
      const controlElement = within(listPane).getByText('Remote Access Control');
      
      fireEvent.click(controlElement.closest('div')!);
      
      const workPane = screen.getByTestId('work-pane');
      
      // Should show applicable site types
      expect(within(workPane).getByText(/site types/)).toBeInTheDocument();
    });

    it('should show applicable security zones for controls', () => {
      render(<ControlCoverageView />);
      
      const listPane = screen.getByTestId('list-pane');
      const controlElement = within(listPane).getByText('Remote Access Control');
      
      fireEvent.click(controlElement.closest('div')!);
      
      const workPane = screen.getByTestId('work-pane');
      
      // Should show applicable zones
      expect(within(workPane).getByText(/zones/)).toBeInTheDocument();
    });

    it('should display upstream relevance levels', () => {
      render(<ControlCoverageView />);
      
      const listPane = screen.getByTestId('list-pane');
      const controlElement = within(listPane).getByText('Remote Access Control');
      
      fireEvent.click(controlElement.closest('div')!);
      
      const workPane = screen.getByTestId('work-pane');
      
      // Should show upstream relevance
      expect(within(workPane).getByText(/Relevance/)).toBeInTheDocument();
    });
  });
});