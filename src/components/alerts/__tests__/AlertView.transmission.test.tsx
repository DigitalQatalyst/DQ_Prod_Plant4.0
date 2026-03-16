import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AlertView } from '../AlertView';
import { AppProvider } from '@/context/AppContext';
import { BrowserRouter } from 'react-router-dom';

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>
    <AppProvider>
      {children}
    </AppProvider>
  </BrowserRouter>
);

describe('AlertView - Transmission Context', () => {
  it('should render without errors when isTransmission is true', () => {
    render(
      <TestWrapper>
        <AlertView featureArea="energy" isTransmission={true} />
      </TestWrapper>
    );

    // Check that the basic alert view elements are present
    expect(screen.getByText('Energy Alerts')).toBeInTheDocument();
    expect(screen.getByText('Alerts')).toBeInTheDocument();
  });

  it('should render without errors when isTransmission is false', () => {
    render(
      <TestWrapper>
        <AlertView featureArea="energy" isTransmission={false} />
      </TestWrapper>
    );

    // The component should render without transmission-specific filters
    expect(screen.getByText('Energy Alerts')).toBeInTheDocument();
    expect(screen.getByText('Alerts')).toBeInTheDocument();
  });
});