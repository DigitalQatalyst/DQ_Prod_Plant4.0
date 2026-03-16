/**
 * Performance Access Guard Component
 * 
 * This component provides access control for performance features,
 * ensuring only authorized sectors can access specific performance pages.
 */

import React from 'react';
import { useApp } from '@/context/AppContext';
import { hasDetailedPerformanceAccess } from '@/lib/performanceAccessControl';
import { EmptyStates } from '@/components/shared';
import { Shield, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PerformanceAccessGuardProps {
  children: React.ReactNode;
  feature?: string;
  requiresPowerSector?: boolean;
}

export function PerformanceAccessGuard({ 
  children, 
  feature = 'Performance Management',
  requiresPowerSector = true
}: PerformanceAccessGuardProps) {
  const { currentSector } = useApp();

  // Check if current sector has access to detailed performance features
  if (requiresPowerSector && !hasDetailedPerformanceAccess(currentSector)) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <EmptyStates.Error
          icon={Shield}
          title="Access Restricted"
          description={`${feature} is only available for Power sector. Please switch to the Power sector to access these features.`}
          action={{
            label: "Go Back",
            onClick: () => window.history.back(),
            variant: "outline",
            icon: ArrowLeft
          }}
        />
      </div>
    );
  }

  return <>{children}</>;
}

/**
 * Higher-order component that wraps a component with performance access control
 */
export function withPerformanceAccess<P extends object>(
  Component: React.ComponentType<P>,
  feature?: string,
  requiresPowerSector?: boolean
) {
  const WrappedComponent = (props: P) => (
    <PerformanceAccessGuard feature={feature} requiresPowerSector={requiresPowerSector}>
      <Component {...props} />
    </PerformanceAccessGuard>
  );

  WrappedComponent.displayName = `withPerformanceAccess(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}