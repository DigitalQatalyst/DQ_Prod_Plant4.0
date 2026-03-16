import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { AssetCatalogPage } from '../AssetCatalogPage';

describe('AssetCatalogPage', () => {
  it('renders asset catalog page with title and categories', () => {
    render(<AssetCatalogPage />);

    // Check if the main title is rendered (using getAllByText to handle multiple instances)
    expect(screen.getAllByText('Asset Types')).toHaveLength(2); // One in ListPane, one in tabs
    expect(screen.getByText('Power Transmission Catalog')).toBeInTheDocument();

    // Check if category filters are rendered
    expect(screen.getByText(/All \(\d+\)/)).toBeInTheDocument();
    expect(screen.getByText(/Electrical \(\d+\)/)).toBeInTheDocument();
    expect(screen.getByText(/Protection \(\d+\)/)).toBeInTheDocument();
    expect(screen.getByText(/Switching \(\d+\)/)).toBeInTheDocument();
    expect(screen.getByText(/Measurement \(\d+\)/)).toBeInTheDocument();
  });

  it('displays asset types from mock data', () => {
    render(<AssetCatalogPage />);

    // Check if some expected asset types are displayed (using getAllByText for duplicates)
    expect(screen.getAllByText('Power Transformer').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Circuit Breaker').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Energy Meter').length).toBeGreaterThan(0);
  });

  it('shows asset type catalog when no type is selected', () => {
    render(<AssetCatalogPage />);

    // Check if the catalog view is shown by default
    expect(screen.getByText('Asset Type Catalog')).toBeInTheDocument();
    expect(screen.getByText('Manage Power Transmission asset types and configurations')).toBeInTheDocument();
  });
});