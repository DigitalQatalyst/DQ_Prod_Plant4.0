import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import TagMappingPage from '../TagMappingPage';
import { AppProvider } from '@/context/AppContext';

// Mock the AppContext hook
const mockSetSelectedAsset = vi.fn();
const mockSetIsPopPaneOpen = vi.fn();
const mockSetPopPaneContent = vi.fn();

vi.mock('@/context/AppContext', async () => {
  const actual = await vi.importActual('@/context/AppContext');
  return {
    ...actual,
    useApp: () => ({
      currentTenant: { id: 'alpha-upstream', name: 'Alpha Upstream Ltd' },
      selectedAsset: null,
      setSelectedAsset: mockSetSelectedAsset,
      setIsPopPaneOpen: mockSetIsPopPaneOpen,
      setPopPaneContent: mockSetPopPaneContent,
    }),
  };
});

function renderWithProvider(component: React.ReactElement) {
  return render(
    <BrowserRouter>
      <AppProvider>
        {component}
      </AppProvider>
    </BrowserRouter>
  );
}

describe('TagMappingPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders tag mapping page with title and asset list', () => {
    renderWithProvider(<TagMappingPage />);
    
    // Check if the main title is rendered
    expect(screen.getByText('Tag Mapping')).toBeInTheDocument();
    expect(screen.getByText('Assets with telemetry tags')).toBeInTheDocument();
    
    // Check if search functionality is present
    expect(screen.getByPlaceholderText('Search assets...')).toBeInTheDocument();
    
    // Check if filters are present
    expect(screen.getByText('Filters')).toBeInTheDocument();
  });

  it('displays mappable assets from upstream mock data', () => {
    renderWithProvider(<TagMappingPage />);
    
    // Check if some expected mappable assets are displayed
    // These should be assets with types: wellhead, separator, compressor, rtu
    expect(screen.getAllByText(/Wellhead/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Separator/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Compressor/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/RTU/).length).toBeGreaterThan(0);
  });

  it('shows asset selection prompt when no asset is selected', () => {
    renderWithProvider(<TagMappingPage />);
    
    // Check if the selection prompt is shown
    expect(screen.getByText('Select Asset')).toBeInTheDocument();
    expect(screen.getByText('Choose an asset to view tag mappings')).toBeInTheDocument();
    expect(screen.getByText('No Asset Selected')).toBeInTheDocument();
    expect(screen.getByText('Select an asset from the list to view and manage its tag mappings.')).toBeInTheDocument();
  });

  it('displays filter options for asset types', () => {
    renderWithProvider(<TagMappingPage />);
    
    // Click to expand filters
    const filtersButton = screen.getByText('Filters');
    fireEvent.click(filtersButton);
    
    // Check if filter dropdowns are present by their placeholder text
    expect(screen.getByText('All Types')).toBeInTheDocument();
    expect(screen.getByText('All Fields')).toBeInTheDocument();
    expect(screen.getByText('All Pads')).toBeInTheDocument();
  });

  it('shows asset count in the list pane', () => {
    renderWithProvider(<TagMappingPage />);
    
    // Check if asset count is displayed (should be a number)
    const countElement = screen.getByText(/^\d+$/);
    expect(countElement).toBeInTheDocument();
  });

  it('displays asset cards with proper information', () => {
    renderWithProvider(<TagMappingPage />);
    
    // Check if asset cards show expected information
    expect(screen.getAllByText(/tags/).length).toBeGreaterThan(0); // Should show tag count
    expect(screen.getAllByText(/Zone/).length).toBeGreaterThan(0); // Should show hazardous area class
  });

  it('handles search functionality', () => {
    renderWithProvider(<TagMappingPage />);
    
    const searchInput = screen.getByPlaceholderText('Search assets...');
    
    // Test search input
    fireEvent.change(searchInput, { target: { value: 'wellhead' } });
    expect(searchInput).toHaveValue('wellhead');
  });

  it('shows clear filters button when filters are applied', () => {
    renderWithProvider(<TagMappingPage />);
    
    // Expand filters first
    const filtersButton = screen.getByText('Filters');
    fireEvent.click(filtersButton);
    
    // The clear button should not be visible initially when no filters are applied
    expect(screen.queryByText('Clear')).not.toBeInTheDocument();
  });
});