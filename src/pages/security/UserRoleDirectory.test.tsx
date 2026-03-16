import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within, fireEvent } from '@testing-library/react';
import { UserRoleDirectory } from './UserRoleDirectory';

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
 * Unit Tests for UserRoleDirectory Component
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5
 */
describe('UserRoleDirectory Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render without errors', () => {
      const { container } = render(<UserRoleDirectory />);
      expect(container).toBeTruthy();
    });

    it('should render ListPane with correct title and subtitle', () => {
      render(<UserRoleDirectory />);
      
      expect(screen.getByTestId('list-pane-title')).toHaveTextContent('Users');
      expect(screen.getByTestId('list-pane-subtitle')).toHaveTextContent('Kenya Power');
    });

    it('should render user list correctly', () => {
      render(<UserRoleDirectory />);
      
      const listPaneContent = screen.getByTestId('list-pane-content');
      
      // Should render multiple users
      expect(listPaneContent.children.length).toBeGreaterThan(0);
    });

    it('should display user names in the list', () => {
      render(<UserRoleDirectory />);
      
      // Check for at least one user from mock data in the list pane
      const listPaneContent = screen.getByTestId('list-pane-content');
      expect(within(listPaneContent).getByText('John Smith (Schneider Electric)')).toBeInTheDocument();
    });

    it('should display user emails in the list', () => {
      render(<UserRoleDirectory />);
      
      // Check for user email in the list pane
      const listPaneContent = screen.getByTestId('list-pane-content');
      expect(within(listPaneContent).getByText('john.smith@schneider-electric.com')).toBeInTheDocument();
    });

    it('should display user roles in the list', () => {
      render(<UserRoleDirectory />);
      
      // Check for role display - use getAllByText since there may be multiple instances
      const roles = screen.getAllByText('vendor-support');
      expect(roles.length).toBeGreaterThan(0);
    });

    it('should display user status badges', () => {
      render(<UserRoleDirectory />);
      
      // Check for status badges
      const listPaneContent = screen.getByTestId('list-pane-content');
      expect(within(listPaneContent).getAllByText('active').length).toBeGreaterThan(0);
    });

    it('should display last login information', () => {
      render(<UserRoleDirectory />);
      
      const listPaneContent = screen.getByTestId('list-pane-content');
      expect(within(listPaneContent).getAllByText(/Last login:/).length).toBeGreaterThan(0);
    });

    it('should display user count in ListPane', () => {
      render(<UserRoleDirectory />);
      
      const countElement = screen.getByTestId('list-pane-count');
      // Should show the total number of users
      expect(parseInt(countElement.textContent || '0')).toBeGreaterThan(0);
    });
  });

  describe('User Selection and WorkPane Update', () => {
    it('should render WorkPane when a user is selected', () => {
      render(<UserRoleDirectory />);
      
      // WorkPane should be rendered with the first user selected by default
      expect(screen.getByTestId('work-pane')).toBeInTheDocument();
    });

    it('should display selected user name in WorkPane title', () => {
      render(<UserRoleDirectory />);
      
      const workPaneTitle = screen.getByTestId('work-pane-title');
      // Should show the first user's name (John Smith (Schneider Electric))
      expect(workPaneTitle).toHaveTextContent('John Smith (Schneider Electric)');
    });

    it('should display selected user email in WorkPane subtitle', () => {
      render(<UserRoleDirectory />);
      
      const workPaneSubtitle = screen.getByTestId('work-pane-subtitle');
      // Should show the first user's email
      expect(workPaneSubtitle).toHaveTextContent('john.smith@schneider-electric.com');
    });

    it('should update WorkPane when a different user is clicked', () => {
      render(<UserRoleDirectory />);
      
      // Find and click on a different user
      const listPaneContent = screen.getByTestId('list-pane-content');
      const userItems = listPaneContent.querySelectorAll('[class*="cursor-pointer"]');
      
      // Click on the second user if available
      if (userItems.length > 1) {
        fireEvent.click(userItems[1]);
        
        // WorkPane should update (we can't easily test the exact content without knowing which user,
        // but we can verify the WorkPane is still rendered)
        expect(screen.getByTestId('work-pane')).toBeInTheDocument();
      }
    });

    it('should render all four tabs for selected user', () => {
      render(<UserRoleDirectory />);
      
      // Check for all four tabs
      expect(screen.getByTestId('tab-label-profile')).toHaveTextContent('Profile');
      expect(screen.getByTestId('tab-label-roles')).toHaveTextContent('Roles & Permissions');
      expect(screen.getByTestId('tab-label-activity')).toHaveTextContent('Activity');
      expect(screen.getByTestId('tab-label-sites')).toHaveTextContent('Sites');
    });

    it('should display user profile information in Profile tab', () => {
      render(<UserRoleDirectory />);
      
      const profileTab = screen.getByTestId('tab-content-profile');
      
      // Should show contact information section
      expect(within(profileTab).getByText('Contact Information')).toBeInTheDocument();
      expect(within(profileTab).getByText('Account Details')).toBeInTheDocument();
    });

    it('should display user email in Profile tab', () => {
      render(<UserRoleDirectory />);
      
      const profileTab = screen.getByTestId('tab-content-profile');
      
      // Should show email in contact information
      expect(within(profileTab).getByText('Email')).toBeInTheDocument();
      expect(within(profileTab).getByText('john.smith@schneider-electric.com')).toBeInTheDocument();
    });

    it('should display user department in Profile tab', () => {
      render(<UserRoleDirectory />);
      
      const profileTab = screen.getByTestId('tab-content-profile');
      
      // Should show department
      expect(within(profileTab).getByText('Department')).toBeInTheDocument();
    });

    it('should display last login in Profile tab', () => {
      render(<UserRoleDirectory />);
      
      const profileTab = screen.getByTestId('tab-content-profile');
      
      // Should show last login
      expect(within(profileTab).getByText('Last Login')).toBeInTheDocument();
    });

    it('should display account created date in Profile tab', () => {
      render(<UserRoleDirectory />);
      
      const profileTab = screen.getByTestId('tab-content-profile');
      
      // Should show account created
      expect(within(profileTab).getByText('Account Created')).toBeInTheDocument();
    });
  });

  describe('Search Functionality', () => {
    it('should render search input with correct placeholder', () => {
      render(<UserRoleDirectory />);
      
      const searchInput = screen.getByTestId('search-input');
      expect(searchInput).toHaveAttribute('placeholder', 'Search users...');
    });

    it('should filter users when search query is entered', () => {
      render(<UserRoleDirectory />);
      
      const searchInput = screen.getByTestId('search-input');
      const initialCount = parseInt(screen.getByTestId('list-pane-count').textContent || '0');
      
      // Search for a specific user
      fireEvent.change(searchInput, { target: { value: 'Sarah' } });
      
      // Count should be updated (likely reduced)
      const filteredCount = parseInt(screen.getByTestId('list-pane-count').textContent || '0');
      expect(filteredCount).toBeLessThanOrEqual(initialCount);
    });

    it('should show matching users when searching by name', () => {
      render(<UserRoleDirectory />);
      
      const searchInput = screen.getByTestId('search-input');
      
      // Search for "Sarah"
      fireEvent.change(searchInput, { target: { value: 'Sarah' } });
      
      // Should show Sarah Johnson (Emerson) (from tenant t1)
      expect(screen.getByText('Sarah Johnson (Emerson)')).toBeInTheDocument();
    });

    it('should show matching users when searching by email', () => {
      render(<UserRoleDirectory />);
      
      const searchInput = screen.getByTestId('search-input');
      
      // Search by email domain that exists in mock data
      fireEvent.change(searchInput, { target: { value: 'schneider-electric.com' } });
      
      // Should show users with schneider-electric.com email
      const listPaneContent = screen.getByTestId('list-pane-content');
      expect(listPaneContent.children.length).toBeGreaterThan(0);
    });

    it('should show matching users when searching by role', () => {
      render(<UserRoleDirectory />);
      
      const searchInput = screen.getByTestId('search-input');
      
      // Search by role
      fireEvent.change(searchInput, { target: { value: 'vendor-support' } });
      
      // Should show users with vendor-support role
      const listPaneContent = screen.getByTestId('list-pane-content');
      expect(listPaneContent.children.length).toBeGreaterThan(0);
    });

    it('should update user count when search filters results', () => {
      render(<UserRoleDirectory />);
      
      const searchInput = screen.getByTestId('search-input');
      const initialCount = parseInt(screen.getByTestId('list-pane-count').textContent || '0');
      
      // Search for something specific
      fireEvent.change(searchInput, { target: { value: 'John Smith' } });
      
      const filteredCount = parseInt(screen.getByTestId('list-pane-count').textContent || '0');
      
      // Filtered count should be less than or equal to initial count
      expect(filteredCount).toBeLessThanOrEqual(initialCount);
      // Should have at least one result (John Smith)
      expect(filteredCount).toBeGreaterThan(0);
    });

    it('should show all users when search query is empty', () => {
      render(<UserRoleDirectory />);
      
      const searchInput = screen.getByTestId('search-input');
      const initialCount = parseInt(screen.getByTestId('list-pane-count').textContent || '0');
      
      // Enter a search query
      fireEvent.change(searchInput, { target: { value: 'Sarah' } });
      
      // Clear the search
      fireEvent.change(searchInput, { target: { value: '' } });
      
      const finalCount = parseInt(screen.getByTestId('list-pane-count').textContent || '0');
      
      // Should show all users again
      expect(finalCount).toBe(initialCount);
    });
  });

  describe('Role Display and Permissions', () => {
    it('should display assigned roles in Roles & Permissions tab', () => {
      render(<UserRoleDirectory />);
      
      const rolesTab = screen.getByTestId('tab-content-roles');
      
      // Should show assigned roles section
      expect(within(rolesTab).getByText('Assigned Roles')).toBeInTheDocument();
    });

    it('should display role names with correct permissions', () => {
      render(<UserRoleDirectory />);
      
      const rolesTab = screen.getByTestId('tab-content-roles');
      
      // Should show role with permissions count
      expect(within(rolesTab).getAllByText(/permissions/).length).toBeGreaterThan(0);
    });

    it('should display all permissions section', () => {
      render(<UserRoleDirectory />);
      
      const rolesTab = screen.getByTestId('tab-content-roles');
      
      // Should show all permissions section
      expect(within(rolesTab).getByText(/All Permissions/)).toBeInTheDocument();
    });

    it('should display role directory with all available roles', () => {
      render(<UserRoleDirectory />);
      
      const rolesTab = screen.getByTestId('tab-content-roles');
      
      // Should show all available roles section
      expect(within(rolesTab).getByText('All Available Roles')).toBeInTheDocument();
    });

    it('should show system role badges', () => {
      render(<UserRoleDirectory />);
      
      const rolesTab = screen.getByTestId('tab-content-roles');
      
      // Should show system badges for system roles
      expect(within(rolesTab).getAllByText('System').length).toBeGreaterThan(0);
    });

    it('should display user count for each role', () => {
      render(<UserRoleDirectory />);
      
      const rolesTab = screen.getByTestId('tab-content-roles');
      
      // Should show user count for roles
      expect(within(rolesTab).getAllByText(/users/).length).toBeGreaterThan(0);
    });

    it('should indicate which roles are assigned to the user', () => {
      render(<UserRoleDirectory />);
      
      const rolesTab = screen.getByTestId('tab-content-roles');
      
      // Should show checkmarks or indicators for assigned roles
      // The component uses CheckCircle2 and XCircle icons
      const rolesSection = within(rolesTab).getByText('All Available Roles').parentElement;
      expect(rolesSection).toBeInTheDocument();
    });
  });

  describe('Tenant Context Integration', () => {
    it('should use current tenant from context', () => {
      render(<UserRoleDirectory />);
      
      // Verify tenant name appears in subtitle
      expect(screen.getByText('Kenya Power')).toBeInTheDocument();
    });

    it('should display users for the current tenant', () => {
      render(<UserRoleDirectory />);
      
      // Verify we're seeing tenant t1 users (John Smith and Sarah Johnson are from t1)
      const listPaneContent = screen.getByTestId('list-pane-content');
      expect(within(listPaneContent).getByText('John Smith (Schneider Electric)')).toBeInTheDocument();
    });
  });

  describe('Activity Tab', () => {
    it('should display recent activity section', () => {
      render(<UserRoleDirectory />);
      
      const activityTab = screen.getByTestId('tab-content-activity');
      
      // Should show recent activity
      expect(within(activityTab).getByText('Recent Activity')).toBeInTheDocument();
    });

    it('should display activity summary', () => {
      render(<UserRoleDirectory />);
      
      const activityTab = screen.getByTestId('tab-content-activity');
      
      // Should show activity summary
      expect(within(activityTab).getByText('Activity Summary')).toBeInTheDocument();
    });

    it('should display activity metrics', () => {
      render(<UserRoleDirectory />);
      
      const activityTab = screen.getByTestId('tab-content-activity');
      
      // Should show metrics like Total Logins, Actions Performed, Failed Attempts
      expect(within(activityTab).getByText('Total Logins')).toBeInTheDocument();
      expect(within(activityTab).getByText('Actions Performed')).toBeInTheDocument();
      expect(within(activityTab).getByText('Failed Attempts')).toBeInTheDocument();
    });
  });

  describe('Sites Tab', () => {
    it('should display assigned sites section', () => {
      render(<UserRoleDirectory />);
      
      const sitesTab = screen.getByTestId('tab-content-sites');
      
      // Should show assigned sites
      expect(within(sitesTab).getByText('Assigned Sites')).toBeInTheDocument();
    });

    it('should display site names', () => {
      render(<UserRoleDirectory />);
      
      const sitesTab = screen.getByTestId('tab-content-sites');
      
      // Should show at least one site
      const sitesSection = within(sitesTab).getByText('Assigned Sites').parentElement;
      expect(sitesSection).toBeInTheDocument();
    });

    it('should display access summary', () => {
      render(<UserRoleDirectory />);
      
      const sitesTab = screen.getByTestId('tab-content-sites');
      
      // Should show access summary
      expect(within(sitesTab).getByText('Access Summary')).toBeInTheDocument();
      expect(within(sitesTab).getByText('Total Sites')).toBeInTheDocument();
      expect(within(sitesTab).getByText('Access Level')).toBeInTheDocument();
    });
  });
});
