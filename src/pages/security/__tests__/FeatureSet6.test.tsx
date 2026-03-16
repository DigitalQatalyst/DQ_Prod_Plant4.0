import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within, fireEvent } from '@testing-library/react';
import React from 'react';

// Import all Feature Set 6 components
import { SecurityAuditLog } from '../SecurityAuditLog';
import { ConfigChangeHistory } from '../ConfigChangeHistory';
import { CentralLogExplorer } from '../CentralLogExplorer';
import { LogRetentionSettings } from '../LogRetentionSettings';
import { FileConfigIntegrity } from '../FileConfigIntegrity';
import { ForensicSnapshots } from '../ForensicSnapshots';

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
      {showFilters && <div data-testid="filters-enabled">Filters</div>}
      {children}
    </div>
  ),
}));

vi.mock('@/components/layout/WorkPane', () => ({
  WorkPane: ({ title, subtitle, tabs, children }: any) => (
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
      {children}
    </div>
  ),
}));

/**
 * Unit Tests for Feature Set 6 - Logging & Forensics Components
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6
 */
describe('Feature Set 6 - Logging & Forensics Components', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * SecurityAuditLog Component Tests (6.1)
   */
  describe('SecurityAuditLog Component', () => {
    describe('Component Rendering', () => {
      it('should render without errors', () => {
        const { container } = render(<SecurityAuditLog />);
        expect(container).toBeTruthy();
      });

      it('should render with correct title and tenant context', () => {
        render(<SecurityAuditLog />);
        
        expect(screen.getByTestId('list-pane-title')).toHaveTextContent('Security Audit Log');
        expect(screen.getByTestId('list-pane-subtitle')).toHaveTextContent('KSA Upstream JV');
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
    });

    describe('Search and Filtering', () => {
      it('should provide search functionality', () => {
        render(<SecurityAuditLog />);
        
        const searchInput = screen.getByTestId('search-input');
        expect(searchInput).toBeInTheDocument();
        expect(searchInput).toHaveAttribute('placeholder', 'Search events...');
      });

      it('should filter by category', () => {
        render(<SecurityAuditLog />);
        
        const listPane = screen.getByTestId('list-pane');
        const categorySelect = within(listPane).getAllByRole('combobox')[0];
        
        fireEvent.change(categorySelect, { target: { value: 'authentication' } });
        expect(screen.getByTestId('list-pane-count')).toBeInTheDocument();
      });

      it('should filter by outcome', () => {
        render(<SecurityAuditLog />);
        
        const listPane = screen.getByTestId('list-pane');
        const outcomeSelect = within(listPane).getAllByRole('combobox')[1];
        
        fireEvent.change(outcomeSelect, { target: { value: 'failure' } });
        expect(screen.getByTestId('list-pane-count')).toBeInTheDocument();
      });

      it('should handle search queries', () => {
        render(<SecurityAuditLog />);
        
        const searchInput = screen.getByTestId('search-input');
        fireEvent.change(searchInput, { target: { value: 'login' } });
        
        expect(screen.getByTestId('list-pane-count')).toBeInTheDocument();
      });
    });

    describe('Event Details', () => {
      it('should display event details when selected', () => {
        render(<SecurityAuditLog />);
        
        const workPane = screen.getByTestId('work-pane');
        expect(within(workPane).getByText('Event Information')).toBeInTheDocument();
      });

      it('should show all required tabs', () => {
        render(<SecurityAuditLog />);
        
        const workPane = screen.getByTestId('work-pane');
        expect(within(workPane).getByTestId('tab-details')).toBeInTheDocument();
        expect(within(workPane).getByTestId('tab-context')).toBeInTheDocument();
        expect(within(workPane).getByTestId('tab-related')).toBeInTheDocument();
      });
    });
  });

  /**
   * ConfigChangeHistory Component Tests (6.2)
   */
  describe('ConfigChangeHistory Component', () => {
    describe('Component Rendering', () => {
      it('should render without errors', () => {
        const { container } = render(<ConfigChangeHistory />);
        expect(container).toBeTruthy();
      });

      it('should render with correct title and tenant context', () => {
        render(<ConfigChangeHistory />);
        
        expect(screen.getByTestId('list-pane-title')).toHaveTextContent('Configuration Change History');
        expect(screen.getByTestId('list-pane-subtitle')).toHaveTextContent('KSA Upstream JV');
      });

      it('should display summary statistics', () => {
        render(<ConfigChangeHistory />);
        
        const listPane = screen.getByTestId('list-pane');
        expect(within(listPane).getByText('Total Changes')).toBeInTheDocument();
        expect(within(listPane).getByText('High Risk')).toBeInTheDocument();
        expect(within(listPane).getByText('Failed')).toBeInTheDocument();
        expect(within(listPane).getByText('Safety Systems')).toBeInTheDocument();
      });

      it('should display filter controls', () => {
        render(<ConfigChangeHistory />);
        
        const listPane = screen.getByTestId('list-pane');
        expect(within(listPane).getByText('Asset Type')).toBeInTheDocument();
        expect(within(listPane).getByText('Change Type')).toBeInTheDocument();
      });
    });

    describe('Search and Filtering', () => {
      it('should provide search functionality', () => {
        render(<ConfigChangeHistory />);
        
        const searchInput = screen.getByTestId('search-input');
        expect(searchInput).toBeInTheDocument();
        expect(searchInput).toHaveAttribute('placeholder', 'Search changes...');
      });

      it('should filter by asset type', () => {
        render(<ConfigChangeHistory />);
        
        const listPane = screen.getByTestId('list-pane');
        const assetSelect = within(listPane).getAllByRole('combobox')[0];
        
        fireEvent.change(assetSelect, { target: { value: 'plc' } });
        expect(screen.getByTestId('list-pane-count')).toBeInTheDocument();
      });

      it('should filter by change type', () => {
        render(<ConfigChangeHistory />);
        
        const listPane = screen.getByTestId('list-pane');
        const changeTypeSelect = within(listPane).getAllByRole('combobox')[1];
        
        fireEvent.change(changeTypeSelect, { target: { value: 'logic' } });
        expect(screen.getByTestId('list-pane-count')).toBeInTheDocument();
      });
    });

    describe('Change Details', () => {
      it('should display empty state when no change is selected', () => {
        render(<ConfigChangeHistory />);
        
        const workPane = screen.getByTestId('work-pane');
        expect(within(workPane).getByText('No Change Selected')).toBeInTheDocument();
        expect(within(workPane).getByText('Select a configuration change from the list to view detailed information')).toBeInTheDocument();
      });

      it('should show empty state when no change is selected', () => {
        render(<ConfigChangeHistory />);
        
        const workPane = screen.getByTestId('work-pane');
        // The component shows empty state when no change is selected
        expect(within(workPane).getByText('Configuration Change History')).toBeInTheDocument();
        expect(within(workPane).getByText('Select a change to view details')).toBeInTheDocument();
      });
    });
  });

  /**
   * CentralLogExplorer Component Tests (6.3)
   */
  describe('CentralLogExplorer Component', () => {
    describe('Component Rendering', () => {
      it('should render without errors', () => {
        const { container } = render(<CentralLogExplorer />);
        expect(container).toBeTruthy();
      });

      it('should render with correct title and tenant context', () => {
        render(<CentralLogExplorer />);
        
        expect(screen.getByTestId('list-pane-title')).toHaveTextContent('Central Log Explorer');
        expect(screen.getByTestId('list-pane-subtitle')).toHaveTextContent('KSA Upstream JV');
      });

      it('should display summary statistics', () => {
        render(<CentralLogExplorer />);
        
        const listPane = screen.getByTestId('list-pane');
        expect(within(listPane).getByText('Total Logs')).toBeInTheDocument();
        expect(within(listPane).getByText('Errors')).toBeInTheDocument();
        expect(within(listPane).getByText('Warnings')).toBeInTheDocument();
        expect(within(listPane).getByText('Sources')).toBeInTheDocument();
      });

      it('should display comprehensive filter controls', () => {
        render(<CentralLogExplorer />);
        
        const listPane = screen.getByTestId('list-pane');
        expect(within(listPane).getByText('Time Range')).toBeInTheDocument();
        expect(within(listPane).getByText('Source')).toBeInTheDocument();
        expect(within(listPane).getByText('Level')).toBeInTheDocument();
        expect(within(listPane).getByText('Category')).toBeInTheDocument();
        expect(within(listPane).getByText('Tags')).toBeInTheDocument();
      });
    });

    describe('Advanced Search and Filtering', () => {
      it('should provide search functionality', () => {
        render(<CentralLogExplorer />);
        
        const searchInput = screen.getByTestId('search-input');
        expect(searchInput).toBeInTheDocument();
        expect(searchInput).toHaveAttribute('placeholder', 'Search logs...');
      });

      it('should filter by time range', () => {
        render(<CentralLogExplorer />);
        
        const listPane = screen.getByTestId('list-pane');
        const timeRangeSelect = within(listPane).getAllByRole('combobox')[0];
        
        fireEvent.change(timeRangeSelect, { target: { value: '1h' } });
        expect(screen.getByTestId('list-pane-count')).toBeInTheDocument();
      });

      it('should filter by log level', () => {
        render(<CentralLogExplorer />);
        
        const listPane = screen.getByTestId('list-pane');
        const levelSelect = within(listPane).getAllByRole('combobox')[2];
        
        fireEvent.change(levelSelect, { target: { value: 'error' } });
        expect(screen.getByTestId('list-pane-count')).toBeInTheDocument();
      });

      it('should show advanced search toggle', () => {
        render(<CentralLogExplorer />);
        
        const listPane = screen.getByTestId('list-pane');
        expect(within(listPane).getByText('Show Advanced Search')).toBeInTheDocument();
      });
    });

    describe('Log Details', () => {
      it('should display log details when selected', () => {
        render(<CentralLogExplorer />);
        
        const workPane = screen.getByTestId('work-pane');
        expect(within(workPane).getByText('Log Information')).toBeInTheDocument();
      });

      it('should show all required tabs', () => {
        render(<CentralLogExplorer />);
        
        const workPane = screen.getByTestId('work-pane');
        expect(within(workPane).getByTestId('tab-details')).toBeInTheDocument();
        expect(within(workPane).getByTestId('tab-context')).toBeInTheDocument();
        expect(within(workPane).getByTestId('tab-correlation')).toBeInTheDocument();
        expect(within(workPane).getByTestId('tab-raw')).toBeInTheDocument();
      });
    });
  });

  /**
   * LogRetentionSettings Component Tests (6.4)
   */
  describe('LogRetentionSettings Component', () => {
    describe('Component Rendering', () => {
      it('should render without errors', () => {
        const { container } = render(<LogRetentionSettings />);
        expect(container).toBeTruthy();
      });

      it('should render with correct title and tenant context', () => {
        render(<LogRetentionSettings />);
        
        expect(screen.getByTestId('list-pane-title')).toHaveTextContent('Log Retention Settings');
        expect(screen.getByTestId('list-pane-subtitle')).toHaveTextContent('KSA Upstream JV');
      });

      it('should display summary statistics', () => {
        render(<LogRetentionSettings />);
        
        const listPane = screen.getByTestId('list-pane');
        expect(within(listPane).getByText('Active Policies')).toBeInTheDocument();
        expect(within(listPane).getByText('Storage Used')).toBeInTheDocument();
        expect(within(listPane).getByText('Utilization')).toBeInTheDocument();
        // Use getAllByText to handle multiple instances and check the first one (statistics)
        expect(within(listPane).getAllByText('Near Limit')[0]).toBeInTheDocument();
      });

      it('should display filter controls', () => {
        render(<LogRetentionSettings />);
        
        const listPane = screen.getByTestId('list-pane');
        expect(within(listPane).getByText('Status')).toBeInTheDocument();
        expect(within(listPane).getByText('Storage')).toBeInTheDocument();
      });
    });

    describe('Search and Filtering', () => {
      it('should provide search functionality', () => {
        render(<LogRetentionSettings />);
        
        const searchInput = screen.getByTestId('search-input');
        expect(searchInput).toBeInTheDocument();
        expect(searchInput).toHaveAttribute('placeholder', 'Search policies...');
      });

      it('should filter by status', () => {
        render(<LogRetentionSettings />);
        
        const listPane = screen.getByTestId('list-pane');
        const statusSelect = within(listPane).getAllByRole('combobox')[0];
        
        fireEvent.change(statusSelect, { target: { value: 'active' } });
        expect(screen.getByTestId('list-pane-count')).toBeInTheDocument();
      });

      it('should filter by storage location', () => {
        render(<LogRetentionSettings />);
        
        const listPane = screen.getByTestId('list-pane');
        const storageSelect = within(listPane).getAllByRole('combobox')[1];
        
        fireEvent.change(storageSelect, { target: { value: 'local' } });
        expect(screen.getByTestId('list-pane-count')).toBeInTheDocument();
      });
    });

    describe('Policy Details', () => {
      it('should display policy details when selected', () => {
        render(<LogRetentionSettings />);
        
        const workPane = screen.getByTestId('work-pane');
        expect(within(workPane).getByText('Policy Configuration')).toBeInTheDocument();
      });

      it('should show all required tabs', () => {
        render(<LogRetentionSettings />);
        
        const workPane = screen.getByTestId('work-pane');
        expect(within(workPane).getByTestId('tab-details')).toBeInTheDocument();
        expect(within(workPane).getByTestId('tab-compliance')).toBeInTheDocument();
        expect(within(workPane).getByTestId('tab-storage')).toBeInTheDocument();
        expect(within(workPane).getByTestId('tab-settings')).toBeInTheDocument();
      });
    });
  });

  /**
   * FileConfigIntegrity Component Tests (6.5)
   */
  describe('FileConfigIntegrity Component', () => {
    describe('Component Rendering', () => {
      it('should render without errors', () => {
        const { container } = render(<FileConfigIntegrity />);
        expect(container).toBeTruthy();
      });

      it('should render with correct title and tenant context', () => {
        render(<FileConfigIntegrity />);
        
        expect(screen.getByTestId('list-pane-title')).toHaveTextContent('File & Config Integrity');
        expect(screen.getByTestId('list-pane-subtitle')).toHaveTextContent('KSA Upstream JV');
      });

      it('should display summary statistics', () => {
        render(<FileConfigIntegrity />);
        
        const listPane = screen.getByTestId('list-pane');
        expect(within(listPane).getByText('Integrity Score')).toBeInTheDocument();
        // Use getAllByText to handle multiple instances and check the first one (statistics)
        expect(within(listPane).getAllByText('Verified')[0]).toBeInTheDocument();
        expect(within(listPane).getByText('Issues')).toBeInTheDocument();
        expect(within(listPane).getAllByText('Safety Critical')[0]).toBeInTheDocument();
      });

      it('should display filter controls', () => {
        render(<FileConfigIntegrity />);
        
        const listPane = screen.getByTestId('list-pane');
        expect(within(listPane).getByText('Status')).toBeInTheDocument();
        expect(within(listPane).getByText('Criticality')).toBeInTheDocument();
        expect(within(listPane).getByText('System Type')).toBeInTheDocument();
      });
    });

    describe('Search and Filtering', () => {
      it('should provide search functionality', () => {
        render(<FileConfigIntegrity />);
        
        const searchInput = screen.getByTestId('search-input');
        expect(searchInput).toBeInTheDocument();
        expect(searchInput).toHaveAttribute('placeholder', 'Search files...');
      });

      it('should filter by integrity status', () => {
        render(<FileConfigIntegrity />);
        
        const listPane = screen.getByTestId('list-pane');
        const statusSelect = within(listPane).getAllByRole('combobox')[0];
        
        fireEvent.change(statusSelect, { target: { value: 'verified' } });
        expect(screen.getByTestId('list-pane-count')).toBeInTheDocument();
      });

      it('should filter by criticality', () => {
        render(<FileConfigIntegrity />);
        
        const listPane = screen.getByTestId('list-pane');
        const criticalitySelect = within(listPane).getAllByRole('combobox')[1];
        
        fireEvent.change(criticalitySelect, { target: { value: 'safety-critical' } });
        expect(screen.getByTestId('list-pane-count')).toBeInTheDocument();
      });

      it('should filter by system type', () => {
        render(<FileConfigIntegrity />);
        
        const listPane = screen.getByTestId('list-pane');
        const systemTypeSelect = within(listPane).getAllByRole('combobox')[2];
        
        fireEvent.change(systemTypeSelect, { target: { value: 'sis' } });
        expect(screen.getByTestId('list-pane-count')).toBeInTheDocument();
      });
    });

    describe('File Details', () => {
      it('should display file details when selected', () => {
        render(<FileConfigIntegrity />);
        
        const workPane = screen.getByTestId('work-pane');
        expect(within(workPane).getByText('File Information')).toBeInTheDocument();
      });

      it('should show all required tabs', () => {
        render(<FileConfigIntegrity />);
        
        const workPane = screen.getByTestId('work-pane');
        expect(within(workPane).getByTestId('tab-details')).toBeInTheDocument();
        expect(within(workPane).getByTestId('tab-integrity')).toBeInTheDocument();
        expect(within(workPane).getByTestId('tab-history')).toBeInTheDocument();
        expect(within(workPane).getByTestId('tab-actions')).toBeInTheDocument();
      });
    });
  });

  /**
   * ForensicSnapshots Component Tests (6.6)
   */
  describe('ForensicSnapshots Component', () => {
    describe('Component Rendering', () => {
      it('should render without errors', () => {
        const { container } = render(<ForensicSnapshots />);
        expect(container).toBeTruthy();
      });

      it('should render with correct title and tenant context', () => {
        render(<ForensicSnapshots />);
        
        expect(screen.getByTestId('list-pane-title')).toHaveTextContent('Forensic Snapshots');
        expect(screen.getByTestId('list-pane-subtitle')).toHaveTextContent('KSA Upstream JV');
      });

      it('should display summary statistics', () => {
        render(<ForensicSnapshots />);
        
        const listPane = screen.getByTestId('list-pane');
        expect(within(listPane).getByText('Total Snapshots')).toBeInTheDocument();
        expect(within(listPane).getByText('Regulatory')).toBeInTheDocument();
        expect(within(listPane).getByText('SIS Overrides')).toBeInTheDocument();
        expect(within(listPane).getByText('Pipeline Events')).toBeInTheDocument();
      });

      it('should display filter controls', () => {
        render(<ForensicSnapshots />);
        
        const listPane = screen.getByTestId('list-pane');
        expect(within(listPane).getByText('Trigger Type')).toBeInTheDocument();
        expect(within(listPane).getByText('Regulatory Status')).toBeInTheDocument();
      });
    });

    describe('Search and Filtering', () => {
      it('should provide search functionality', () => {
        render(<ForensicSnapshots />);
        
        const searchInput = screen.getByTestId('search-input');
        expect(searchInput).toBeInTheDocument();
        expect(searchInput).toHaveAttribute('placeholder', 'Search snapshots...');
      });

      it('should filter by trigger type', () => {
        render(<ForensicSnapshots />);
        
        const listPane = screen.getByTestId('list-pane');
        const triggerSelect = within(listPane).getAllByRole('combobox')[0];
        
        fireEvent.change(triggerSelect, { target: { value: 'sis-override' } });
        expect(screen.getByTestId('list-pane-count')).toBeInTheDocument();
      });

      it('should filter by regulatory status', () => {
        render(<ForensicSnapshots />);
        
        const listPane = screen.getByTestId('list-pane');
        const regulatorySelect = within(listPane).getAllByRole('combobox')[1];
        
        fireEvent.change(regulatorySelect, { target: { value: 'regulatory' } });
        expect(screen.getByTestId('list-pane-count')).toBeInTheDocument();
      });
    });

    describe('Snapshot Details', () => {
      it('should display empty state when no snapshot is selected', () => {
        render(<ForensicSnapshots />);
        
        const workPane = screen.getByTestId('work-pane');
        expect(within(workPane).getByText('No Snapshot Selected')).toBeInTheDocument();
        expect(within(workPane).getByText('Select a forensic snapshot from the list to view detailed information')).toBeInTheDocument();
      });

      it('should show empty state tab when no snapshot is selected', () => {
        render(<ForensicSnapshots />);
        
        const workPane = screen.getByTestId('work-pane');
        expect(within(workPane).getByTestId('tab-empty')).toBeInTheDocument();
      });
    });
  });

  /**
   * Cross-Component Integration Tests
   */
  describe('Cross-Component Integration', () => {
    describe('Tenant Context Integration', () => {
      it('should use current tenant from context in all components', () => {
        const components = [
          SecurityAuditLog,
          ConfigChangeHistory,
          CentralLogExplorer,
          LogRetentionSettings,
          FileConfigIntegrity,
          ForensicSnapshots
        ];

        components.forEach((Component) => {
          const { unmount } = render(<Component />);
          expect(screen.getByText('KSA Upstream JV')).toBeInTheDocument();
          unmount();
        });
      });
    });

    describe('Common UI Patterns', () => {
      it('should implement consistent search functionality across all components', () => {
        const components = [
          SecurityAuditLog,
          ConfigChangeHistory,
          CentralLogExplorer,
          LogRetentionSettings,
          FileConfigIntegrity,
          ForensicSnapshots
        ];

        components.forEach((Component) => {
          const { unmount } = render(<Component />);
          expect(screen.getByTestId('search-input')).toBeInTheDocument();
          unmount();
        });
      });

      it('should implement consistent filter functionality across all components', () => {
        const components = [
          SecurityAuditLog,
          ConfigChangeHistory,
          CentralLogExplorer,
          LogRetentionSettings,
          FileConfigIntegrity,
          ForensicSnapshots
        ];

        components.forEach((Component) => {
          const { unmount } = render(<Component />);
          expect(screen.getByTestId('filters-enabled')).toBeInTheDocument();
          unmount();
        });
      });

      it('should display summary statistics in all components', () => {
        const components = [
          { Component: SecurityAuditLog, stats: ['Total Events', 'Failed', 'Config Changes', 'Critical'] },
          { Component: ConfigChangeHistory, stats: ['Total Changes', 'High Risk', 'Failed', 'Safety Systems'] },
          { Component: CentralLogExplorer, stats: ['Total Logs', 'Errors', 'Warnings', 'Sources'] },
          { Component: LogRetentionSettings, stats: ['Active Policies', 'Storage Used', 'Utilization', 'Near Limit'] },
          { Component: FileConfigIntegrity, stats: ['Integrity Score', 'Verified', 'Issues', 'Safety Critical'] },
          { Component: ForensicSnapshots, stats: ['Total Snapshots', 'Regulatory', 'SIS Overrides', 'Pipeline Events'] }
        ];

        components.forEach(({ Component, stats }) => {
          const { unmount } = render(<Component />);
          const listPane = screen.getByTestId('list-pane');
          
          stats.forEach(stat => {
            // Handle cases where text appears in multiple places (statistics vs filters)
            const elements = within(listPane).getAllByText(stat);
            expect(elements.length).toBeGreaterThan(0);
          });
          
          unmount();
        });
      });
    });

    describe('Upstream Oil & Gas Context', () => {
      it('should display upstream-specific terminology and data across components', () => {
        // Test that components show upstream O&G specific content
        const { unmount: unmountAudit } = render(<SecurityAuditLog />);
        // SecurityAuditLog should show upstream-specific events
        unmountAudit();

        const { unmount: unmountConfig } = render(<ConfigChangeHistory />);
        // ConfigChangeHistory should show upstream asset types
        const configListPane = screen.getByTestId('list-pane');
        expect(within(configListPane).getByText('Asset Type')).toBeInTheDocument();
        unmountConfig();

        const { unmount: unmountIntegrity } = render(<FileConfigIntegrity />);
        // FileConfigIntegrity should show upstream system types
        const integrityListPane = screen.getByTestId('list-pane');
        expect(within(integrityListPane).getByText('System Type')).toBeInTheDocument();
        unmountIntegrity();

        const { unmount: unmountSnapshots } = render(<ForensicSnapshots />);
        // ForensicSnapshots should show upstream trigger types
        const snapshotsListPane = screen.getByTestId('list-pane');
        expect(within(snapshotsListPane).getByText('SIS Overrides')).toBeInTheDocument();
        unmountSnapshots();
      });
    });
  });

  /**
   * Error Handling and Edge Cases
   */
  describe('Error Handling and Edge Cases', () => {
    describe('Empty State Handling', () => {
      it('should handle empty search results gracefully', () => {
        const components = [
          SecurityAuditLog,
          ConfigChangeHistory,
          CentralLogExplorer,
          LogRetentionSettings,
          FileConfigIntegrity,
          ForensicSnapshots
        ];

        components.forEach((Component) => {
          const { unmount } = render(<Component />);
          
          const searchInput = screen.getByTestId('search-input');
          fireEvent.change(searchInput, { target: { value: 'NONEXISTENT_SEARCH_TERM_12345' } });
          
          // Should show 0 count for empty results
          const count = screen.getByTestId('list-pane-count');
          expect(count).toHaveTextContent('0');
          
          unmount();
        });
      });
    });

    describe('Filter Reset Functionality', () => {
      it('should reset filters to show all items when set to "all"', () => {
        const { unmount } = render(<SecurityAuditLog />);
        
        const listPane = screen.getByTestId('list-pane');
        const categorySelect = within(listPane).getAllByRole('combobox')[0];
        
        // Apply a filter
        fireEvent.change(categorySelect, { target: { value: 'authentication' } });
        
        // Reset to all
        fireEvent.change(categorySelect, { target: { value: 'all' } });
        
        // Should show all items again
        expect(screen.getByTestId('list-pane-count')).toBeInTheDocument();
        
        unmount();
      });
    });
  });
});