/**
 * APM Empty State Component
 * 
 * Displays appropriate messages when no transmission data exists for a tenant.
 * Provides guidance for contacting administrators and maintains consistent UX
 * across all APM feature sets.
 * 
 * Requirements: 31.8
 */

import React from 'react';
import { AlertCircle, Database, HelpCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export interface APMEmptyStateProps {
  /**
   * The type of data that is missing
   */
  dataType: 'assets' | 'telemetry' | 'alerts' | 'reports' | 'grid' | 'general';
  
  /**
   * Optional custom title
   */
  title?: string;
  
  /**
   * Optional custom description
   */
  description?: string;
  
  /**
   * Whether to show contact administrator guidance
   */
  showContactGuidance?: boolean;
  
  /**
   * Optional action button
   */
  action?: {
    label: string;
    onClick: () => void;
  };
}

/**
 * Get default messages based on data type
 */
function getDefaultMessages(dataType: APMEmptyStateProps['dataType']): {
  title: string;
  description: string;
} {
  switch (dataType) {
    case 'assets':
      return {
        title: 'No Transmission Assets Found',
        description: 'There are no transmission assets configured for your organization. Assets must be created before you can use APM features.'
      };
    case 'telemetry':
      return {
        title: 'No Telemetry Data Available',
        description: 'Telemetry data collection has not been configured for this asset. Configure telemetry points to start monitoring asset health.'
      };
    case 'alerts':
      return {
        title: 'No Alerts',
        description: 'There are no active alerts for your transmission assets. This is a good sign - your assets are operating normally.'
      };
    case 'reports':
      return {
        title: 'No Reports Available',
        description: 'No reports have been generated yet. Schedule a report or generate one manually to get started.'
      };
    case 'grid':
      return {
        title: 'No Grid Topology Configured',
        description: 'Grid topology (substations, lines) has not been configured for your organization. Configure grid topology to visualize your transmission network.'
      };
    case 'general':
    default:
      return {
        title: 'No Data Available',
        description: 'There is no data available for this view. Please check back later or contact your administrator.'
      };
  }
}

/**
 * APM Empty State Component
 * 
 * @example
 * ```tsx
 * <APMEmptyState
 *   dataType="assets"
 *   showContactGuidance={true}
 * />
 * ```
 */
export function APMEmptyState({
  dataType,
  title,
  description,
  showContactGuidance = true,
  action
}: APMEmptyStateProps) {
  const defaultMessages = getDefaultMessages(dataType);
  const displayTitle = title || defaultMessages.title;
  const displayDescription = description || defaultMessages.description;

  return (
    <div className="flex items-center justify-center min-h-[400px] p-8">
      <Card className="max-w-2xl w-full">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-muted p-4">
              <Database className="h-8 w-8 text-muted-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl">{displayTitle}</CardTitle>
          <CardDescription className="text-base mt-2">
            {displayDescription}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {showContactGuidance && (
            <Alert>
              <HelpCircle className="h-4 w-4" />
              <AlertTitle>Need Help?</AlertTitle>
              <AlertDescription>
                If you believe this is an error or need assistance setting up transmission data,
                please contact your system administrator or Plant4.0 support team.
              </AlertDescription>
            </Alert>
          )}
          
          {action && (
            <div className="flex justify-center pt-4">
              <Button onClick={action.onClick}>
                {action.label}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * APM Error State Component
 * 
 * Displays error messages when data loading fails
 * 
 * @example
 * ```tsx
 * <APMErrorState
 *   error={error}
 *   onRetry={() => refetch()}
 * />
 * ```
 */
export interface APMErrorStateProps {
  /**
   * The error that occurred
   */
  error: Error | string;
  
  /**
   * Optional retry callback
   */
  onRetry?: () => void;
}

export function APMErrorState({ error, onRetry }: APMErrorStateProps) {
  const errorMessage = typeof error === 'string' ? error : error.message;

  return (
    <div className="flex items-center justify-center min-h-[400px] p-8">
      <Card className="max-w-2xl w-full border-destructive">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-destructive/10 p-4">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
          </div>
          <CardTitle className="text-2xl text-destructive">Error Loading Data</CardTitle>
          <CardDescription className="text-base mt-2">
            {errorMessage}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>What can you do?</AlertTitle>
            <AlertDescription>
              <ul className="list-disc list-inside space-y-1 mt-2">
                <li>Check your internet connection</li>
                <li>Verify you have permission to access this data</li>
                <li>Try refreshing the page</li>
                <li>Contact your administrator if the problem persists</li>
              </ul>
            </AlertDescription>
          </Alert>
          
          {onRetry && (
            <div className="flex justify-center pt-4">
              <Button onClick={onRetry} variant="outline">
                Try Again
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * APM Loading State Component
 * 
 * Displays loading indicator while data is being fetched
 * 
 * @example
 * ```tsx
 * {loading && <APMLoadingState message="Loading assets..." />}
 * ```
 */
export interface APMLoadingStateProps {
  /**
   * Optional loading message
   */
  message?: string;
}

export function APMLoadingState({ message = 'Loading...' }: APMLoadingStateProps) {
  return (
    <div className="flex items-center justify-center min-h-[400px] p-8">
      <div className="text-center space-y-4">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}
