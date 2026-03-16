import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SecurityErrorBoundary } from '@/components/security/ErrorBoundary';
import { 
  EmptyState, 
  NoAlertsEmptyState, 
  NoUsersEmptyState,
  NoSearchResultsEmptyState,
  LoadingState,
  ErrorState,
  NetworkErrorState
} from '@/components/security/EmptyStates';
import { useSecurityData, useTenantSecurityData, useAsyncOperation } from '@/hooks/useSecurityData';
import { renderHook, act } from '@testing-library/react';

// Mock component that throws an error
const ErrorThrowingComponent = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>Component rendered successfully</div>;
};

describe('Error Handling and Empty States', () => {
  beforeEach(() => {
    // Clear console errors for clean test output
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  describe('SecurityErrorBoundary', () => {
    it('should render children when no error occurs', () => {
      render(
        <SecurityErrorBoundary>
          <ErrorThrowingComponent shouldThrow={false} />
        </SecurityErrorBoundary>
      );

      expect(screen.getByText('Component rendered successfully')).toBeInTheDocument();
    });

    it('should render error UI when child component throws', () => {
      render(
        <SecurityErrorBoundary>
          <ErrorThrowingComponent shouldThrow={true} />
        </SecurityErrorBoundary>
      );

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      expect(screen.getByText(/An error occurred while loading this security feature/)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
    });

    it('should allow retry after error', () => {
      let shouldThrow = true;
      const TestComponent = () => {
        if (shouldThrow) {
          throw new Error('Test error');
        }
        return <div>Component rendered successfully</div>;
      };

      const { rerender } = render(
        <SecurityErrorBoundary>
          <TestComponent />
        </SecurityErrorBoundary>
      );

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();

      const retryButton = screen.getByRole('button', { name: /try again/i });
      fireEvent.click(retryButton);

      // After retry, the component should be reset - simulate fixing the error
      shouldThrow = false;
      
      // Force a re-render by changing the key
      rerender(
        <SecurityErrorBoundary key="retry">
          <TestComponent />
        </SecurityErrorBoundary>
      );

      expect(screen.getByText('Component rendered successfully')).toBeInTheDocument();
    });

    it('should render custom fallback when provided', () => {
      const customFallback = <div>Custom error fallback</div>;

      render(
        <SecurityErrorBoundary fallback={customFallback}>
          <ErrorThrowingComponent shouldThrow={true} />
        </SecurityErrorBoundary>
      );

      expect(screen.getByText('Custom error fallback')).toBeInTheDocument();
    });
  });

  describe('Empty States', () => {
    it('should render basic empty state with title and description', () => {
      render(
        <EmptyState
          title="No Data"
          description="No data available for this view"
        />
      );

      expect(screen.getByText('No Data')).toBeInTheDocument();
      expect(screen.getByText('No data available for this view')).toBeInTheDocument();
    });

    it('should render empty state with action button', () => {
      const mockAction = vi.fn();

      render(
        <EmptyState
          title="No Data"
          description="No data available"
          action={{
            label: "Add Data",
            onClick: mockAction
          }}
        />
      );

      const actionButton = screen.getByRole('button', { name: 'Add Data' });
      expect(actionButton).toBeInTheDocument();

      fireEvent.click(actionButton);
      expect(mockAction).toHaveBeenCalledOnce();
    });

    it('should render NoAlertsEmptyState with refresh action', () => {
      const mockRefresh = vi.fn();

      render(<NoAlertsEmptyState onRefresh={mockRefresh} />);

      expect(screen.getByText('No Security Alerts')).toBeInTheDocument();
      expect(screen.getByText(/No security alerts found for this tenant/)).toBeInTheDocument();

      const refreshButton = screen.getByRole('button', { name: 'Refresh' });
      fireEvent.click(refreshButton);
      expect(mockRefresh).toHaveBeenCalledOnce();
    });

    it('should render NoUsersEmptyState with add user action', () => {
      const mockAddUser = vi.fn();

      render(<NoUsersEmptyState onAddUser={mockAddUser} />);

      expect(screen.getByText('No Users Found')).toBeInTheDocument();
      expect(screen.getByText(/No users have been configured for this tenant/)).toBeInTheDocument();

      const addButton = screen.getByRole('button', { name: 'Add User' });
      fireEvent.click(addButton);
      expect(mockAddUser).toHaveBeenCalledOnce();
    });

    it('should render NoSearchResultsEmptyState with clear search action', () => {
      const mockClearSearch = vi.fn();

      render(
        <NoSearchResultsEmptyState 
          searchQuery="test query" 
          onClearSearch={mockClearSearch} 
        />
      );

      expect(screen.getByText('No Results Found')).toBeInTheDocument();
      expect(screen.getByText(/No results found for "test query"/)).toBeInTheDocument();

      const clearButton = screen.getByRole('button', { name: 'Clear Search' });
      fireEvent.click(clearButton);
      expect(mockClearSearch).toHaveBeenCalledOnce();
    });
  });

  describe('Loading and Error States', () => {
    it('should render loading state with default message', () => {
      render(<LoadingState />);

      expect(screen.getByText('Loading...')).toBeInTheDocument();
      // Check for spinner (element with animate-spin class)
      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });

    it('should render loading state with custom message', () => {
      render(<LoadingState message="Loading security data..." />);

      expect(screen.getByText('Loading security data...')).toBeInTheDocument();
    });

    it('should render error state with retry action', () => {
      const mockRetry = vi.fn();

      render(<ErrorState onRetry={mockRetry} />);

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      expect(screen.getByText(/An error occurred while loading data/)).toBeInTheDocument();

      const retryButton = screen.getByRole('button', { name: /try again/i });
      fireEvent.click(retryButton);
      expect(mockRetry).toHaveBeenCalledOnce();
    });

    it('should render network error state', () => {
      const mockRetry = vi.fn();

      render(<NetworkErrorState onRetry={mockRetry} />);

      expect(screen.getByText('Connection Error')).toBeInTheDocument();
      expect(screen.getByText(/Unable to connect to the server/)).toBeInTheDocument();

      const retryButton = screen.getByRole('button', { name: /try again/i });
      fireEvent.click(retryButton);
      expect(mockRetry).toHaveBeenCalledOnce();
    });
  });

  describe('useSecurityData hook', () => {
    it('should handle successful data fetching', async () => {
      const mockData = { id: '1', name: 'Test Data' };
      const mockFetchFn = vi.fn().mockResolvedValue(mockData);

      const { result } = renderHook(() =>
        useSecurityData({ fetchFn: mockFetchFn })
      );

      expect(result.current.loading).toBe(true);
      expect(result.current.data).toBe(null);
      expect(result.current.error).toBe(null);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).toEqual(mockData);
      expect(result.current.error).toBe(null);
      expect(mockFetchFn).toHaveBeenCalledOnce();
    });

    it('should handle fetch errors', async () => {
      const mockError = new Error('Fetch failed');
      const mockFetchFn = vi.fn().mockRejectedValue(mockError);
      const mockOnError = vi.fn();

      const { result } = renderHook(() =>
        useSecurityData({ 
          fetchFn: mockFetchFn,
          onError: mockOnError
        })
      );

      expect(result.current.loading).toBe(true);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).toBe(null);
      expect(result.current.error).toEqual(mockError);
      expect(mockOnError).toHaveBeenCalledWith(mockError);
    });

    it('should allow retry after error', async () => {
      const mockError = new Error('Fetch failed');
      const mockData = { id: '1', name: 'Test Data' };
      const mockFetchFn = vi.fn()
        .mockRejectedValueOnce(mockError)
        .mockResolvedValueOnce(mockData);

      const { result } = renderHook(() =>
        useSecurityData({ fetchFn: mockFetchFn })
      );

      // Wait for initial error
      await waitFor(() => {
        expect(result.current.error).toEqual(mockError);
      });

      // Retry
      act(() => {
        result.current.retry();
      });

      expect(result.current.loading).toBe(true);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).toEqual(mockData);
      expect(result.current.error).toBe(null);
      expect(mockFetchFn).toHaveBeenCalledTimes(2);
    });
  });

  describe('useTenantSecurityData hook', () => {
    it('should pass tenant ID to fetch function', async () => {
      const mockData = { id: '1', name: 'Tenant Data' };
      const mockFetchFn = vi.fn().mockResolvedValue(mockData);
      const tenantId = 'tenant-123';

      const { result } = renderHook(() =>
        useTenantSecurityData(tenantId, mockFetchFn)
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockFetchFn).toHaveBeenCalledWith(tenantId);
      expect(result.current.data).toEqual(mockData);
    });

    it('should refetch when tenant ID changes', async () => {
      const mockData1 = { id: '1', name: 'Tenant 1 Data' };
      const mockData2 = { id: '2', name: 'Tenant 2 Data' };
      const mockFetchFn = vi.fn()
        .mockResolvedValueOnce(mockData1)
        .mockResolvedValueOnce(mockData2);

      const { result, rerender } = renderHook(
        ({ tenantId }) => useTenantSecurityData(tenantId, mockFetchFn),
        { initialProps: { tenantId: 'tenant-1' } }
      );

      await waitFor(() => {
        expect(result.current.data).toEqual(mockData1);
      });

      // Change tenant ID
      rerender({ tenantId: 'tenant-2' });

      await waitFor(() => {
        expect(result.current.data).toEqual(mockData2);
      });

      expect(mockFetchFn).toHaveBeenCalledTimes(2);
      expect(mockFetchFn).toHaveBeenNthCalledWith(1, 'tenant-1');
      expect(mockFetchFn).toHaveBeenNthCalledWith(2, 'tenant-2');
    });
  });

  describe('useAsyncOperation hook', () => {
    it('should handle successful async operation', async () => {
      const mockResult = { success: true };
      const mockOperation = vi.fn().mockResolvedValue(mockResult);

      const { result } = renderHook(() => useAsyncOperation());

      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);

      let operationResult: any;
      await act(async () => {
        operationResult = await result.current.execute(mockOperation);
      });

      expect(operationResult).toEqual(mockResult);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
      expect(mockOperation).toHaveBeenCalledOnce();
    });

    it('should handle async operation errors', async () => {
      const mockError = new Error('Operation failed');
      const mockOperation = vi.fn().mockRejectedValue(mockError);

      const { result } = renderHook(() => useAsyncOperation());

      let operationResult: any;
      await act(async () => {
        operationResult = await result.current.execute(mockOperation);
      });

      expect(operationResult).toBe(null);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toEqual(mockError);
    });

    it('should clear error when requested', async () => {
      const mockError = new Error('Operation failed');
      const mockOperation = vi.fn().mockRejectedValue(mockError);

      const { result } = renderHook(() => useAsyncOperation());

      await act(async () => {
        await result.current.execute(mockOperation);
      });

      expect(result.current.error).toEqual(mockError);

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBe(null);
    });
  });
});