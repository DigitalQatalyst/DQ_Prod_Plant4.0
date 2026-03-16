/**
 * Tests for APM Empty State Components
 * 
 * Validates that empty states display appropriate messages and guidance
 * for tenants without transmission data.
 * 
 * Requirements: 31.8
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { APMEmptyState, APMErrorState, APMLoadingState } from '../APMEmptyState';

describe('APMEmptyState', () => {
  describe('Default messages by data type', () => {
    it('should display assets empty state', () => {
      render(<APMEmptyState dataType="assets" />);
      
      expect(screen.getByText('No Transmission Assets Found')).toBeInTheDocument();
      expect(screen.getByText(/no transmission assets configured/i)).toBeInTheDocument();
    });

    it('should display telemetry empty state', () => {
      render(<APMEmptyState dataType="telemetry" />);
      
      expect(screen.getByText('No Telemetry Data Available')).toBeInTheDocument();
      expect(screen.getByText(/telemetry data collection has not been configured/i)).toBeInTheDocument();
    });

    it('should display alerts empty state', () => {
      render(<APMEmptyState dataType="alerts" />);
      
      expect(screen.getByText('No Alerts')).toBeInTheDocument();
      expect(screen.getByText(/no active alerts/i)).toBeInTheDocument();
    });

    it('should display reports empty state', () => {
      render(<APMEmptyState dataType="reports" />);
      
      expect(screen.getByText('No Reports Available')).toBeInTheDocument();
      expect(screen.getByText(/no reports have been generated/i)).toBeInTheDocument();
    });

    it('should display grid empty state', () => {
      render(<APMEmptyState dataType="grid" />);
      
      expect(screen.getByText('No Grid Topology Configured')).toBeInTheDocument();
      expect(screen.getByText(/grid topology.*has not been configured/i)).toBeInTheDocument();
    });

    it('should display general empty state', () => {
      render(<APMEmptyState dataType="general" />);
      
      expect(screen.getByText('No Data Available')).toBeInTheDocument();
      expect(screen.getByText(/no data available for this view/i)).toBeInTheDocument();
    });
  });

  describe('Custom messages', () => {
    it('should display custom title and description', () => {
      render(
        <APMEmptyState
          dataType="assets"
          title="Custom Title"
          description="Custom description text"
        />
      );
      
      expect(screen.getByText('Custom Title')).toBeInTheDocument();
      expect(screen.getByText('Custom description text')).toBeInTheDocument();
    });
  });

  describe('Contact guidance', () => {
    it('should show contact guidance by default', () => {
      render(<APMEmptyState dataType="assets" />);
      
      expect(screen.getByText('Need Help?')).toBeInTheDocument();
      expect(screen.getByText(/contact your system administrator/i)).toBeInTheDocument();
    });

    it('should hide contact guidance when showContactGuidance is false', () => {
      render(<APMEmptyState dataType="assets" showContactGuidance={false} />);
      
      expect(screen.queryByText('Need Help?')).not.toBeInTheDocument();
    });
  });

  describe('Action button', () => {
    it('should display action button when provided', () => {
      const handleClick = vi.fn();
      
      render(
        <APMEmptyState
          dataType="assets"
          action={{
            label: 'Create Asset',
            onClick: handleClick
          }}
        />
      );
      
      expect(screen.getByRole('button', { name: 'Create Asset' })).toBeInTheDocument();
    });

    it('should call onClick when action button is clicked', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      
      render(
        <APMEmptyState
          dataType="assets"
          action={{
            label: 'Create Asset',
            onClick: handleClick
          }}
        />
      );
      
      await user.click(screen.getByRole('button', { name: 'Create Asset' }));
      
      expect(handleClick).toHaveBeenCalledOnce();
    });

    it('should not display action button when not provided', () => {
      render(<APMEmptyState dataType="assets" />);
      
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });
  });

  describe('Consistent UX', () => {
    it('should maintain consistent layout across all data types', () => {
      const dataTypes: Array<'assets' | 'telemetry' | 'alerts' | 'reports' | 'grid' | 'general'> = [
        'assets',
        'telemetry',
        'alerts',
        'reports',
        'grid',
        'general'
      ];
      
      dataTypes.forEach(dataType => {
        const { container } = render(<APMEmptyState dataType={dataType} />);
        
        // Should have card container
        expect(container.querySelector('.max-w-2xl')).toBeInTheDocument();
        
        // Should have icon
        expect(container.querySelector('svg')).toBeInTheDocument();
      });
    });
  });
});

describe('APMErrorState', () => {
  it('should display error message from Error object', () => {
    const error = new Error('Database connection failed');
    
    render(<APMErrorState error={error} />);
    
    expect(screen.getByText('Error Loading Data')).toBeInTheDocument();
    expect(screen.getByText('Database connection failed')).toBeInTheDocument();
  });

  it('should display error message from string', () => {
    render(<APMErrorState error="Network timeout" />);
    
    expect(screen.getByText('Error Loading Data')).toBeInTheDocument();
    expect(screen.getByText('Network timeout')).toBeInTheDocument();
  });

  it('should display troubleshooting guidance', () => {
    render(<APMErrorState error="Test error" />);
    
    expect(screen.getByText('What can you do?')).toBeInTheDocument();
    expect(screen.getByText(/check your internet connection/i)).toBeInTheDocument();
    expect(screen.getByText(/verify you have permission/i)).toBeInTheDocument();
    expect(screen.getByText(/try refreshing the page/i)).toBeInTheDocument();
    expect(screen.getByText(/contact your administrator/i)).toBeInTheDocument();
  });

  it('should display retry button when onRetry is provided', () => {
    const handleRetry = vi.fn();
    
    render(<APMErrorState error="Test error" onRetry={handleRetry} />);
    
    expect(screen.getByRole('button', { name: 'Try Again' })).toBeInTheDocument();
  });

  it('should call onRetry when retry button is clicked', async () => {
    const user = userEvent.setup();
    const handleRetry = vi.fn();
    
    render(<APMErrorState error="Test error" onRetry={handleRetry} />);
    
    await user.click(screen.getByRole('button', { name: 'Try Again' }));
    
    expect(handleRetry).toHaveBeenCalledOnce();
  });

  it('should not display retry button when onRetry is not provided', () => {
    render(<APMErrorState error="Test error" />);
    
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});

describe('APMLoadingState', () => {
  it('should display default loading message', () => {
    render(<APMLoadingState />);
    
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should display custom loading message', () => {
    render(<APMLoadingState message="Loading transmission assets..." />);
    
    expect(screen.getByText('Loading transmission assets...')).toBeInTheDocument();
  });

  it('should display loading spinner', () => {
    const { container } = render(<APMLoadingState />);
    
    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
  });
});
