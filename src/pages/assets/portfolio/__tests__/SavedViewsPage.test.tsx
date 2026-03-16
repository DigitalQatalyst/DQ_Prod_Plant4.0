/**
 * SavedViewsPage Component Tests
 * 
 * Smoke tests to verify the SavedViewsPage renders correctly
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi } from 'vitest';
import { SavedViewsPage } from '../SavedViewsPage';

// Mock the data provider
vi.mock('@/hooks/useDataProvider', () => ({
  useDataProvider: () => ({
    provider: {
      getDefaultTransmissionTenantId: vi.fn().mockResolvedValue('test-tenant-id'),
      getSavedViewsByTenant: vi.fn().mockResolvedValue({ data: [], total: 0 }),
      getSitesByTenant: vi.fn().mockResolvedValue([]),
      getAssetTypesByTenant: vi.fn().mockResolvedValue([]),
      createSavedView: vi.fn(),
      deleteSavedView: vi.fn()
    }
  })
}));

const renderWithProviders = (component: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {component}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('SavedViewsPage', () => {
  it('renders the page title and description', async () => {
    renderWithProviders(<SavedViewsPage />);
    
    expect(screen.getByText('Saved Views')).toBeInTheDocument();
    expect(screen.getByText('Manage your saved asset portfolio filter presets')).toBeInTheDocument();
  });

  it('renders the create view button', async () => {
    renderWithProviders(<SavedViewsPage />);
    
    expect(screen.getByRole('button', { name: /create view/i })).toBeInTheDocument();
  });

  it('shows empty state when no saved views exist', async () => {
    renderWithProviders(<SavedViewsPage />);
    
    // Wait for loading to complete and empty state to appear
    await screen.findByText('No saved views');
    expect(screen.getByText('Create your first saved view to quickly access filtered asset lists.')).toBeInTheDocument();
  });
});