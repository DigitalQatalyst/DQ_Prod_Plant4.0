import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppProvider } from '@/context/AppContext';
import EnergyControlIntegration from '../EnergyControlIntegration';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
  },
});

const renderWithProviders = (sector: string, subsector: string) => {
  return render(
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <AppProvider initialSector={sector} initialSubsector={subsector}>
          <EnergyControlIntegration />
        </AppProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
};

describe('EnergyControlIntegration', () => {
  describe('Transmission Mode', () => {
    it('should render transmission control integrations when sector is Power/Transmission', () => {
      renderWithProviders('Power', 'Transmission');
      
      // Check for transmission-specific content
      expect(screen.getByText('System Integration')).toBeInTheDocument();
      
      // Should show transmission integrations
      expect(screen.getByText(/SCADA System - Dubai Main/i)).toBeInTheDocument();
      expect(screen.getByText(/Central EMS/i)).toBeInTheDocument();
      expect(screen.getByText(/DERMS Platform/i)).toBeInTheDocument();
    });

    it('should display transmission protocol information', () => {
      renderWithProviders('Power', 'Transmission');
      
      // Check for protocol-specific content
      expect(screen.getByText(/IEC 61850/i)).toBeInTheDocument();
      expect(screen.getByText(/DNP3/i)).toBeInTheDocument();
      expect(screen.getByText(/OPC UA/i)).toBeInTheDocument();
    });

    it('should show integration statistics', () => {
      renderWithProviders('Power', 'Transmission');
      
      // Check for statistics cards
      expect(screen.getByText('Total Integrations')).toBeInTheDocument();
      expect(screen.getByText('Connected')).toBeInTheDocument();
      expect(screen.getByText('Total Data Points')).toBeInTheDocument();
    });

    it('should display SCADA systems section', () => {
      renderWithProviders('Power', 'Transmission');
      
      // Check for SCADA systems section
      expect(screen.getByText('SCADA Systems')).toBeInTheDocument();
      expect(screen.getByText(/Dubai Main Substation/i)).toBeInTheDocument();
      expect(screen.getByText(/Jebel Ali Substation/i)).toBeInTheDocument();
    });

    it('should display EMS & DERMS systems section', () => {
      renderWithProviders('Power', 'Transmission');
      
      // Check for EMS/DERMS section
      expect(screen.getByText('EMS & DERMS Systems')).toBeInTheDocument();
    });

    it('should display support systems section', () => {
      renderWithProviders('Power', 'Transmission');
      
      // Check for support systems section
      expect(screen.getByText('Support Systems')).toBeInTheDocument();
      expect(screen.getByText(/PI Historian/i)).toBeInTheDocument();
    });
  });

  describe('Upstream Mode', () => {
    it('should render upstream backup systems when sector is Oil & Gas/Upstream', () => {
      renderWithProviders('Oil & Gas', 'Upstream');
      
      // Check for upstream-specific content
      expect(screen.getByText('System Integration')).toBeInTheDocument();
      
      // Should show upstream generators/UPS/solar
      expect(screen.getByText(/Emergency Diesel Generator/i)).toBeInTheDocument();
    });

    it('should display upstream resilience information', () => {
      renderWithProviders('Oil & Gas', 'Upstream');
      
      // Check for upstream-specific tabs and content
      expect(screen.getByText('Generators')).toBeInTheDocument();
      expect(screen.getByText('UPS Systems')).toBeInTheDocument();
      expect(screen.getByText('Solar Systems')).toBeInTheDocument();
    });
  });

  describe('Sector Switching', () => {
    it('should switch between transmission and upstream content based on sector', () => {
      const { rerender } = renderWithProviders('Power', 'Transmission');
      
      // Verify transmission content
      expect(screen.getByText(/SCADA System - Dubai Main/i)).toBeInTheDocument();
      
      // Switch to upstream
      rerender(
        <BrowserRouter>
          <QueryClientProvider client={queryClient}>
            <AppProvider initialSector="Oil & Gas" initialSubsector="Upstream">
              <EnergyControlIntegration />
            </AppProvider>
          </QueryClientProvider>
        </BrowserRouter>
      );
      
      // Verify upstream content
      expect(screen.getByText(/Emergency Diesel Generator/i)).toBeInTheDocument();
    });
  });

  describe('Integration Details', () => {
    it('should display connectivity status badges', () => {
      renderWithProviders('Power', 'Transmission');
      
      // Check for status badges
      const connectedBadges = screen.getAllByText('connected');
      expect(connectedBadges.length).toBeGreaterThan(0);
    });

    it('should show protocol versions', () => {
      renderWithProviders('Power', 'Transmission');
      
      // Check for protocol versions
      expect(screen.getByText(/v2.0/i)).toBeInTheDocument();
      expect(screen.getByText(/v1.04/i)).toBeInTheDocument();
    });

    it('should display endpoint information', () => {
      renderWithProviders('Power', 'Transmission');
      
      // Check for endpoint details
      expect(screen.getByText(/scada-dxb.dewa.local/i)).toBeInTheDocument();
    });

    it('should show read-only vs read/write access modes', () => {
      renderWithProviders('Power', 'Transmission');
      
      // Check for access mode badges
      expect(screen.getByText('Read Only')).toBeInTheDocument();
      expect(screen.getByText('Read/Write')).toBeInTheDocument();
    });
  });
});
