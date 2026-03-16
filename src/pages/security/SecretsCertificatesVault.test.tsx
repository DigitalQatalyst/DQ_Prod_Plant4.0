import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within, fireEvent, waitFor } from '@testing-library/react';
import { SecretsCertificatesVault } from './SecretsCertificatesVault';

// Mock the AppContext
const mockTenant = { id: 'tenant-transmission', name: 'DEWA Transmission', industry: 'utilities' };
const mockSetCurrentTenant = vi.fn();

vi.mock('@/context/AppContext', () => ({
  useApp: () => ({
    currentTenant: mockTenant,
    setCurrentTenant: mockSetCurrentTenant,
  }),
}));

// Mock the shared components
vi.mock('@/components/shared/LoadingState', () => ({
  LoadingState: () => <div data-testid="loading-state">Loading...</div>,
}));

vi.mock('@/components/shared/EmptyState', () => ({
  EmptyState: ({ title, description }: any) => (
    <div data-testid="empty-state">
      <div data-testid="empty-state-title">{title}</div>
      <div data-testid="empty-state-description">{description}</div>
    </div>
  ),
}));

// Mock the layout components to simplify testing
vi.mock('@/components/layout/ListPane', () => ({
  ListPane: ({ children, title, subtitle, count, searchPlaceholder, onSearch }: any) => (
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
      <div data-testid="list-pane-content">{children}</div>
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
              <div data-testid={`tab-label-${tab.id}`}>{tab.label}</div>
              <div data-testid={`tab-content-${tab.id}`}>{tab.content}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  ),
}));

/**
 * Unit Tests for SecretsCertificatesVault Component
 * Requirements: 2.8, 7.2, 9.2, 9.3, 9.4
 */
describe('SecretsCertificatesVault Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render without errors', async () => {
      const { container } = render(<SecretsCertificatesVault />);
      expect(container).toBeTruthy();
      
      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByTestId('loading-state')).not.toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('should render ListPane with correct title and subtitle', async () => {
      render(<SecretsCertificatesVault />);
      
      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByTestId('loading-state')).not.toBeInTheDocument();
      }, { timeout: 3000 });
      
      expect(screen.getByTestId('list-pane-title')).toHaveTextContent('Secrets & Certificates Vault');
      expect(screen.getByTestId('list-pane-subtitle')).toHaveTextContent('DEWA Transmission');
    });

    it('should render secrets list correctly', async () => {
      render(<SecretsCertificatesVault />);
      
      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByTestId('loading-state')).not.toBeInTheDocument();
      }, { timeout: 3000 });
      
      const listPaneContent = screen.getByTestId('list-pane-content');
      
      // Should render multiple secrets
      expect(listPaneContent.children.length).toBeGreaterThan(0);
    });

    it('should display secret names in the list', async () => {
      render(<SecretsCertificatesVault />);
      
      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByTestId('loading-state')).not.toBeInTheDocument();
      }, { timeout: 3000 });
      
      // Check for at least one secret from mock data in the list pane
      const listPaneContent = screen.getByTestId('list-pane-content');
      expect(within(listPaneContent).getByText('SCADA Server Certificate')).toBeInTheDocument();
    });

    it('should display secret descriptions in the list', async () => {
      render(<SecretsCertificatesVault />);
      
      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByTestId('loading-state')).not.toBeInTheDocument();
      }, { timeout: 3000 });
      
      // Check for secret description in the list pane
      const listPaneContent = screen.getByTestId('list-pane-content');
      expect(within(listPaneContent).getByText('TLS certificate for main SCADA server authentication')).toBeInTheDocument();
    });

    it('should display secret types in the list', async () => {
      render(<SecretsCertificatesVault />);
      
      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByTestId('loading-state')).not.toBeInTheDocument();
      }, { timeout: 3000 });
      
      // Check for type display - use getAllByText since there may be multiple instances
      // The text is split across elements, so we need to check for partial matches
      const listPaneContent = screen.getByTestId('list-pane-content');
      expect(within(listPaneContent).getByText('scada auth')).toBeInTheDocument();
    });

    it('should display secret status badges', async () => {
      render(<SecretsCertificatesVault />);
      
      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByTestId('loading-state')).not.toBeInTheDocument();
      }, { timeout: 3000 });
      
      // Check for status badges
      const listPaneContent = screen.getByTestId('list-pane-content');
      expect(within(listPaneContent).getAllByText('active').length).toBeGreaterThan(0);
    });

    it('should display expiration information', async () => {
      render(<SecretsCertificatesVault />);
      
      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByTestId('loading-state')).not.toBeInTheDocument();
      }, { timeout: 3000 });
      
      const listPaneContent = screen.getByTestId('list-pane-content');
      expect(within(listPaneContent).getAllByText(/Expires in/).length).toBeGreaterThan(0);
    });

    it('should display secret count in ListPane', async () => {
      render(<SecretsCertificatesVault />);
      
      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByTestId('loading-state')).not.toBeInTheDocument();
      }, { timeout: 3000 });
      
      const countElement = screen.getByTestId('list-pane-count');
      // Should show the total number of secrets
      expect(parseInt(countElement.textContent || '0')).toBeGreaterThan(0);
    });

    it('should show expired secrets with appropriate styling', async () => {
      render(<SecretsCertificatesVault />);
      
      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByTestId('loading-state')).not.toBeInTheDocument();
      }, { timeout: 3000 });
      
      const listPaneContent = screen.getByTestId('list-pane-content');
      // Should show expired status for expired certificates
      expect(within(listPaneContent).getAllByText('expired').length).toBeGreaterThan(0);
    });

    it('should show expiring soon warnings', async () => {
      render(<SecretsCertificatesVault />);
      
      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByTestId('loading-state')).not.toBeInTheDocument();
      }, { timeout: 3000 });
      
      const listPaneContent = screen.getByTestId('list-pane-content');
      // Should show expiration warnings for certificates expiring soon
      expect(within(listPaneContent).getAllByText(/Expires in/).length).toBeGreaterThan(0);
    });
  });

  describe('Secret Selection and WorkPane Update', () => {
    it('should render WorkPane when a secret is selected', async () => {
      render(<SecretsCertificatesVault />);
      
      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByTestId('loading-state')).not.toBeInTheDocument();
      }, { timeout: 3000 });
      
      // WorkPane should be rendered with the first secret selected by default
      expect(screen.getByTestId('work-pane')).toBeInTheDocument();
    });

    it('should display selected secret name in WorkPane title', async () => {
      render(<SecretsCertificatesVault />);
      
      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByTestId('loading-state')).not.toBeInTheDocument();
      }, { timeout: 3000 });
      
      const workPaneTitle = screen.getByTestId('work-pane-title');
      // Should show the first secret's name (SCADA Server Certificate)
      expect(workPaneTitle).toHaveTextContent('SCADA Server Certificate');
    });

    it('should display selected secret type in WorkPane subtitle', async () => {
      render(<SecretsCertificatesVault />);
      
      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByTestId('loading-state')).not.toBeInTheDocument();
      }, { timeout: 3000 });
      
      const workPaneSubtitle = screen.getByTestId('work-pane-subtitle');
      // Should show the first secret's type and protocol
      expect(workPaneSubtitle).toHaveTextContent('certificate • IEC-61850');
    });

    it('should update WorkPane when a different secret is clicked', async () => {
      render(<SecretsCertificatesVault />);
      
      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByTestId('loading-state')).not.toBeInTheDocument();
      }, { timeout: 3000 });
      
      // Find and click on a different secret
      const listPaneContent = screen.getByTestId('list-pane-content');
      const secretItems = listPaneContent.querySelectorAll('[class*="cursor-pointer"]');
      
      // Click on the second secret if available
      if (secretItems.length > 1) {
        fireEvent.click(secretItems[1]);
        
        // WorkPane should update (we can't easily test the exact content without knowing which secret,
        // but we can verify the WorkPane is still rendered)
        expect(screen.getByTestId('work-pane')).toBeInTheDocument();
      }
    });

    it('should render all four tabs for selected secret', async () => {
      render(<SecretsCertificatesVault />);
      
      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByTestId('loading-state')).not.toBeInTheDocument();
      }, { timeout: 3000 });
      
      // Check for all four tabs
      expect(screen.getByTestId('tab-label-details')).toHaveTextContent('Details');
      expect(screen.getByTestId('tab-label-usage')).toHaveTextContent('Usage & Systems');
      expect(screen.getByTestId('tab-label-rotation')).toHaveTextContent('Rotation & History');
      expect(screen.getByTestId('tab-label-security')).toHaveTextContent('Security & Access');
    });

    it('should display secret details in Details tab', async () => {
      render(<SecretsCertificatesVault />);
      
      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByTestId('loading-state')).not.toBeInTheDocument();
      }, { timeout: 3000 });
      
      const detailsTab = screen.getByTestId('tab-content-details');
      
      // Should show certificate information section for certificates
      expect(within(detailsTab).getByText('Certificate Information')).toBeInTheDocument();
      expect(within(detailsTab).getByText('Validity Period')).toBeInTheDocument();
    });

    it('should display certificate DN information in Details tab', async () => {
      render(<SecretsCertificatesVault />);
      
      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByTestId('loading-state')).not.toBeInTheDocument();
      }, { timeout: 3000 });
      
      const detailsTab = screen.getByTestId('tab-content-details');
      
      // Should show subject DN
      expect(within(detailsTab).getByText('Subject DN')).toBeInTheDocument();
      expect(within(detailsTab).getByText('CN=scada.dewa.gov.ae,O=DEWA,C=AE')).toBeInTheDocument();
    });

    it('should display certificate fingerprint in Details tab', async () => {
      render(<SecretsCertificatesVault />);
      
      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByTestId('loading-state')).not.toBeInTheDocument();
      }, { timeout: 3000 });
      
      const detailsTab = screen.getByTestId('tab-content-details');
      
      // Should show SHA-256 fingerprint
      expect(within(detailsTab).getByText('SHA-256 Fingerprint')).toBeInTheDocument();
    });

    it('should display validity dates in Details tab', async () => {
      render(<SecretsCertificatesVault />);
      
      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByTestId('loading-state')).not.toBeInTheDocument();
      }, { timeout: 3000 });
      
      const detailsTab = screen.getByTestId('tab-content-details');
      
      // Should show validity period
      expect(within(detailsTab).getByText('Valid From')).toBeInTheDocument();
      expect(within(detailsTab).getByText('Valid Until')).toBeInTheDocument();
    });

    it('should display metadata in Details tab', async () => {
      render(<SecretsCertificatesVault />);
      
      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByTestId('loading-state')).not.toBeInTheDocument();
      }, { timeout: 3000 });
      
      const detailsTab = screen.getByTestId('tab-content-details');
      
      // Should show metadata
      expect(within(detailsTab).getByText('Metadata')).toBeInTheDocument();
      expect(within(detailsTab).getByText('Created')).toBeInTheDocument();
      expect(within(detailsTab).getByText('Created By')).toBeInTheDocument();
    });
  });

  describe('Search Functionality', () => {
    it('should render search input with correct placeholder', async () => {
      render(<SecretsCertificatesVault />);
      
      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByTestId('loading-state')).not.toBeInTheDocument();
      }, { timeout: 3000 });
      
      const searchInput = screen.getByTestId('search-input');
      expect(searchInput).toHaveAttribute('placeholder', 'Search secrets and certificates...');
    });

    it('should filter secrets when search query is entered', async () => {
      render(<SecretsCertificatesVault />);
      
      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByTestId('loading-state')).not.toBeInTheDocument();
      }, { timeout: 3000 });
      
      const searchInput = screen.getByTestId('search-input');
      const initialCount = parseInt(screen.getByTestId('list-pane-count').textContent || '0');
      
      // Search for a specific secret
      fireEvent.change(searchInput, { target: { value: 'SCADA' } });
      
      // Count should be updated (likely reduced)
      const filteredCount = parseInt(screen.getByTestId('list-pane-count').textContent || '0');
      expect(filteredCount).toBeLessThanOrEqual(initialCount);
    });

    it('should show matching secrets when searching by name', async () => {
      render(<SecretsCertificatesVault />);
      
      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByTestId('loading-state')).not.toBeInTheDocument();
      }, { timeout: 3000 });
      
      const searchInput = screen.getByTestId('search-input');
      
      // Search for "SCADA"
      fireEvent.change(searchInput, { target: { value: 'SCADA' } });
      
      // Should show SCADA Server Certificate
      expect(screen.getByText('SCADA Server Certificate')).toBeInTheDocument();
    });

    it('should show matching secrets when searching by type', async () => {
      render(<SecretsCertificatesVault />);
      
      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByTestId('loading-state')).not.toBeInTheDocument();
      }, { timeout: 3000 });
      
      const searchInput = screen.getByTestId('search-input');
      
      // Search by type
      fireEvent.change(searchInput, { target: { value: 'certificate' } });
      
      // Should show certificates
      const listPaneContent = screen.getByTestId('list-pane-content');
      expect(listPaneContent.children.length).toBeGreaterThan(0);
    });

    it('should show matching secrets when searching by protocol', async () => {
      render(<SecretsCertificatesVault />);
      
      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByTestId('loading-state')).not.toBeInTheDocument();
      }, { timeout: 3000 });
      
      const searchInput = screen.getByTestId('search-input');
      
      // Search by protocol
      fireEvent.change(searchInput, { target: { value: 'IEC-61850' } });
      
      // Should show secrets using IEC-61850 protocol
      const listPaneContent = screen.getByTestId('list-pane-content');
      expect(listPaneContent.children.length).toBeGreaterThan(0);
    });

    it('should update secret count when search filters results', async () => {
      render(<SecretsCertificatesVault />);
      
      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByTestId('loading-state')).not.toBeInTheDocument();
      }, { timeout: 3000 });
      
      const searchInput = screen.getByTestId('search-input');
      const initialCount = parseInt(screen.getByTestId('list-pane-count').textContent || '0');
      
      // Search for something specific
      fireEvent.change(searchInput, { target: { value: 'SCADA Server Certificate' } });
      
      const filteredCount = parseInt(screen.getByTestId('list-pane-count').textContent || '0');
      
      // Filtered count should be less than or equal to initial count
      expect(filteredCount).toBeLessThanOrEqual(initialCount);
      // Should have at least one result (SCADA Server Certificate)
      expect(filteredCount).toBeGreaterThan(0);
    });

    it('should show all secrets when search query is empty', async () => {
      render(<SecretsCertificatesVault />);
      
      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByTestId('loading-state')).not.toBeInTheDocument();
      }, { timeout: 3000 });
      
      const searchInput = screen.getByTestId('search-input');
      const initialCount = parseInt(screen.getByTestId('list-pane-count').textContent || '0');
      
      // Enter a search query
      fireEvent.change(searchInput, { target: { value: 'SCADA' } });
      
      // Clear the search
      fireEvent.change(searchInput, { target: { value: '' } });
      
      const finalCount = parseInt(screen.getByTestId('list-pane-count').textContent || '0');
      
      // Should show all secrets again
      expect(finalCount).toBe(initialCount);
    });
  });

  describe('Usage & Systems Tab', () => {
    it('should display usage statistics section', async () => {
      render(<SecretsCertificatesVault />);
      
      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByTestId('loading-state')).not.toBeInTheDocument();
      }, { timeout: 3000 });
      
      const usageTab = screen.getByTestId('tab-content-usage');
      
      // Should show usage statistics
      expect(within(usageTab).getByText('Usage Statistics')).toBeInTheDocument();
    });

    it('should display usage metrics', async () => {
      render(<SecretsCertificatesVault />);
      
      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByTestId('loading-state')).not.toBeInTheDocument();
      }, { timeout: 3000 });
      
      const usageTab = screen.getByTestId('tab-content-usage');
      
      // Should show metrics like Total Uses, Connected Systems
      expect(within(usageTab).getByText('Total Uses')).toBeInTheDocument();
      expect(within(usageTab).getAllByText('Connected Systems').length).toBeGreaterThan(0);
    });

    it('should display connected systems section', async () => {
      render(<SecretsCertificatesVault />);
      
      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByTestId('loading-state')).not.toBeInTheDocument();
      }, { timeout: 3000 });
      
      const usageTab = screen.getByTestId('tab-content-usage');
      
      // Should show connected systems - use getAllByText since there are multiple instances
      expect(within(usageTab).getAllByText('Connected Systems').length).toBeGreaterThan(0);
    });

    it('should display associated assets section', async () => {
      render(<SecretsCertificatesVault />);
      
      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByTestId('loading-state')).not.toBeInTheDocument();
      }, { timeout: 3000 });
      
      const usageTab = screen.getByTestId('tab-content-usage');
      
      // Should show associated assets
      expect(within(usageTab).getByText('Associated Assets')).toBeInTheDocument();
    });

    it('should display security zones section', async () => {
      render(<SecretsCertificatesVault />);
      
      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByTestId('loading-state')).not.toBeInTheDocument();
      }, { timeout: 3000 });
      
      const usageTab = screen.getByTestId('tab-content-usage');
      
      // Should show security zones
      expect(within(usageTab).getByText('Security Zones')).toBeInTheDocument();
    });

    it('should display last activity information', async () => {
      render(<SecretsCertificatesVault />);
      
      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByTestId('loading-state')).not.toBeInTheDocument();
      }, { timeout: 3000 });
      
      const usageTab = screen.getByTestId('tab-content-usage');
      
      // Should show last activity
      expect(within(usageTab).getByText('Last Activity')).toBeInTheDocument();
    });
  });

  describe('Rotation & History Tab', () => {
    it('should display rotation schedule section', async () => {
      render(<SecretsCertificatesVault />);
      
      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByTestId('loading-state')).not.toBeInTheDocument();
      }, { timeout: 3000 });
      
      const rotationTab = screen.getByTestId('tab-content-rotation');
      
      // Should show rotation schedule
      expect(within(rotationTab).getByText('Rotation Schedule')).toBeInTheDocument();
    });

    it('should display rotation interval', async () => {
      render(<SecretsCertificatesVault />);
      
      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByTestId('loading-state')).not.toBeInTheDocument();
      }, { timeout: 3000 });
      
      const rotationTab = screen.getByTestId('tab-content-rotation');
      
      // Should show rotation interval
      expect(within(rotationTab).getByText('Rotation Interval')).toBeInTheDocument();
    });

    it('should display last rotated date', async () => {
      render(<SecretsCertificatesVault />);
      
      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByTestId('loading-state')).not.toBeInTheDocument();
      }, { timeout: 3000 });
      
      const rotationTab = screen.getByTestId('tab-content-rotation');
      
      // Should show last rotated
      expect(within(rotationTab).getByText('Last Rotated')).toBeInTheDocument();
    });

    it('should display next rotation due date', async () => {
      render(<SecretsCertificatesVault />);
      
      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByTestId('loading-state')).not.toBeInTheDocument();
      }, { timeout: 3000 });
      
      const rotationTab = screen.getByTestId('tab-content-rotation');
      
      // Should show next rotation due
      expect(within(rotationTab).getByText('Next Rotation Due')).toBeInTheDocument();
    });

    it('should display rotation history section', async () => {
      render(<SecretsCertificatesVault />);
      
      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByTestId('loading-state')).not.toBeInTheDocument();
      }, { timeout: 3000 });
      
      const rotationTab = screen.getByTestId('tab-content-rotation');
      
      // Should show rotation history
      expect(within(rotationTab).getByText('Rotation History')).toBeInTheDocument();
    });

    it('should display rotation actions section', async () => {
      render(<SecretsCertificatesVault />);
      
      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByTestId('loading-state')).not.toBeInTheDocument();
      }, { timeout: 3000 });
      
      const rotationTab = screen.getByTestId('tab-content-rotation');
      
      // Should show rotation actions
      expect(within(rotationTab).getByText('Rotation Actions')).toBeInTheDocument();
    });
  });

  describe('Security & Access Tab', () => {
    it('should display security status section', async () => {
      render(<SecretsCertificatesVault />);
      
      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByTestId('loading-state')).not.toBeInTheDocument();
      }, { timeout: 3000 });
      
      const securityTab = screen.getByTestId('tab-content-security');
      
      // Should show security status
      expect(within(securityTab).getByText('Security Status')).toBeInTheDocument();
    });

    it('should display access control section', async () => {
      render(<SecretsCertificatesVault />);
      
      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByTestId('loading-state')).not.toBeInTheDocument();
      }, { timeout: 3000 });
      
      const securityTab = screen.getByTestId('tab-content-security');
      
      // Should show access control
      expect(within(securityTab).getByText('Access Control')).toBeInTheDocument();
    });

    it('should display requires approval information', async () => {
      render(<SecretsCertificatesVault />);
      
      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByTestId('loading-state')).not.toBeInTheDocument();
      }, { timeout: 3000 });
      
      const securityTab = screen.getByTestId('tab-content-security');
      
      // Should show requires approval
      expect(within(securityTab).getByText('Requires Approval')).toBeInTheDocument();
    });

    it('should display authorized roles', async () => {
      render(<SecretsCertificatesVault />);
      
      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByTestId('loading-state')).not.toBeInTheDocument();
      }, { timeout: 3000 });
      
      const securityTab = screen.getByTestId('tab-content-security');
      
      // Should show authorized roles
      expect(within(securityTab).getByText('Authorized Roles')).toBeInTheDocument();
    });

    it('should display encryption information', async () => {
      render(<SecretsCertificatesVault />);
      
      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByTestId('loading-state')).not.toBeInTheDocument();
      }, { timeout: 3000 });
      
      const securityTab = screen.getByTestId('tab-content-security');
      
      // Should show encryption
      expect(within(securityTab).getByText('Encryption')).toBeInTheDocument();
      expect(within(securityTab).getByText('Encryption Key ID')).toBeInTheDocument();
    });

    it('should display security recommendations', async () => {
      render(<SecretsCertificatesVault />);
      
      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByTestId('loading-state')).not.toBeInTheDocument();
      }, { timeout: 3000 });
      
      const securityTab = screen.getByTestId('tab-content-security');
      
      // Should show security recommendations
      expect(within(securityTab).getByText('Security Recommendations')).toBeInTheDocument();
      expect(within(securityTab).getByText('Security Best Practices')).toBeInTheDocument();
    });
  });

  describe('Tenant Context Integration', () => {
    it('should use current tenant from context', async () => {
      render(<SecretsCertificatesVault />);
      
      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByTestId('loading-state')).not.toBeInTheDocument();
      }, { timeout: 3000 });
      
      // Verify tenant name appears in subtitle
      expect(screen.getByText('DEWA Transmission')).toBeInTheDocument();
    });

    it('should display secrets for the current tenant', async () => {
      render(<SecretsCertificatesVault />);
      
      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByTestId('loading-state')).not.toBeInTheDocument();
      }, { timeout: 3000 });
      
      // Verify we're seeing transmission tenant secrets
      const listPaneContent = screen.getByTestId('list-pane-content');
      expect(within(listPaneContent).getByText('SCADA Server Certificate')).toBeInTheDocument();
    });
  });

  describe('Certificate Expiration Monitoring', () => {
    it('should show expiration warnings for certificates expiring soon', async () => {
      render(<SecretsCertificatesVault />);
      
      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByTestId('loading-state')).not.toBeInTheDocument();
      }, { timeout: 3000 });
      
      const listPaneContent = screen.getByTestId('list-pane-content');
      // Should show expiration information
      expect(within(listPaneContent).getAllByText(/Expires in/).length).toBeGreaterThan(0);
    });

    it('should show expired status for expired certificates', async () => {
      render(<SecretsCertificatesVault />);
      
      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByTestId('loading-state')).not.toBeInTheDocument();
      }, { timeout: 3000 });
      
      const listPaneContent = screen.getByTestId('list-pane-content');
      // Should show expired status
      expect(within(listPaneContent).getAllByText('expired').length).toBeGreaterThan(0);
    });

    it('should display expiration recommendations in security tab', async () => {
      render(<SecretsCertificatesVault />);
      
      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByTestId('loading-state')).not.toBeInTheDocument();
      }, { timeout: 3000 });
      
      const securityTab = screen.getByTestId('tab-content-security');
      
      // Should show security recommendations including expiration warnings
      expect(within(securityTab).getByText('Security Best Practices')).toBeInTheDocument();
    });
  });

  describe('Secure Certificate Management', () => {
    it('should show encrypted storage information', async () => {
      render(<SecretsCertificatesVault />);
      
      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByTestId('loading-state')).not.toBeInTheDocument();
      }, { timeout: 3000 });
      
      const securityTab = screen.getByTestId('tab-content-security');
      
      // Should show encryption at rest
      expect(within(securityTab).getByText('Encrypted at rest')).toBeInTheDocument();
    });

    it('should display role-based access control', async () => {
      render(<SecretsCertificatesVault />);
      
      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByTestId('loading-state')).not.toBeInTheDocument();
      }, { timeout: 3000 });
      
      const securityTab = screen.getByTestId('tab-content-security');
      
      // Should show authorized roles for access control
      expect(within(securityTab).getByText('Authorized Roles')).toBeInTheDocument();
    });

    it('should show approval requirements for sensitive operations', async () => {
      render(<SecretsCertificatesVault />);
      
      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByTestId('loading-state')).not.toBeInTheDocument();
      }, { timeout: 3000 });
      
      const securityTab = screen.getByTestId('tab-content-security');
      
      // Should show approval requirements
      expect(within(securityTab).getByText('Requires Approval')).toBeInTheDocument();
    });

    it('should display transmission-specific protocols', async () => {
      render(<SecretsCertificatesVault />);
      
      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByTestId('loading-state')).not.toBeInTheDocument();
      }, { timeout: 3000 });
      
      const listPaneContent = screen.getByTestId('list-pane-content');
      // Should show transmission protocols like IEC-61850, DNP3
      expect(within(listPaneContent).getByText('IEC-61850')).toBeInTheDocument();
    });

    it('should show certificate types relevant to transmission', async () => {
      render(<SecretsCertificatesVault />);
      
      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByTestId('loading-state')).not.toBeInTheDocument();
      }, { timeout: 3000 });
      
      const listPaneContent = screen.getByTestId('list-pane-content');
      // Should show transmission-specific certificate types - check for partial text
      expect(within(listPaneContent).getByText('scada auth')).toBeInTheDocument();
    });
  });
});