import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { LifecycleConfigPage } from '../LifecycleConfigPage';

describe('LifecycleConfigPage', () => {
  it('renders lifecycle configuration page with title and categories', () => {
    render(<LifecycleConfigPage />);

    // Check if the main title is rendered
    expect(screen.getAllByText('Lifecycle Configuration')).toHaveLength(2); // One in ListPane, one in WorkPane
    expect(screen.getByText('Power Transmission States')).toBeInTheDocument();

    // Check if category filters are rendered
    expect(screen.getByText(/All \(\d+\)/)).toBeInTheDocument();
    expect(screen.getByText(/Electrical \(\d+\)/)).toBeInTheDocument();
    expect(screen.getByText(/Protection \(\d+\)/)).toBeInTheDocument();
    expect(screen.getByText(/Measurement \(\d+\)/)).toBeInTheDocument();
    expect(screen.getByText(/Switching \(\d+\)/)).toBeInTheDocument();
  });

  it('displays lifecycle states from mock data', () => {
    render(<LifecycleConfigPage />);

    // Check if some expected lifecycle states are displayed
    expect(screen.getAllByText('Commissioning').length).toBeGreaterThan(0);
    expect(screen.getAllByText('In Service').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Standby').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Outage').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Decommissioned').length).toBeGreaterThan(0);
  });

  it('shows lifecycle overview when no specific category is selected', () => {
    render(<LifecycleConfigPage />);

    // Check if the overview is shown by default
    expect(screen.getByText('Lifecycle Overview')).toBeInTheDocument();
    expect(screen.getByText('Manage Power Transmission asset lifecycle states and transitions')).toBeInTheDocument();
  });
});