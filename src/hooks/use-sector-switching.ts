import { useEffect, useRef, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Sector } from '@/types/navigation';

export interface SectorSwitchNotification {
  message: string;
  type: 'info' | 'success' | 'warning';
  timestamp: number;
}

/**
 * Hook to provide enhanced sector switching functionality with user feedback
 */
export function useSectorSwitching() {
  const { 
    currentSector, 
    currentSubsector, 
    selectedAsset, 
    lastSelectedItemId 
  } = useApp();
  
  const [notification, setNotification] = useState<SectorSwitchNotification | null>(null);
  const previousSector = useRef<Sector | null>(null);
  const previousSubsector = useRef<string | null>(null);
  const previousSelectedId = useRef<string | null>(null);

  // Track sector changes and provide feedback
  useEffect(() => {
    // Skip on initial load
    if (!previousSector.current || !previousSubsector.current) {
      previousSector.current = currentSector;
      previousSubsector.current = currentSubsector;
      previousSelectedId.current = lastSelectedItemId;
      return;
    }

    // Check if sector actually changed
    const sectorChanged = previousSector.current.id !== currentSector.id;
    const subsectorChanged = previousSubsector.current !== currentSubsector;
    
    if (sectorChanged || subsectorChanged) {
      // Determine what happened to the selection
      let message = '';
      let type: 'info' | 'success' | 'warning' = 'info';

      if (previousSelectedId.current && lastSelectedItemId) {
        if (previousSelectedId.current === lastSelectedItemId) {
          // Same item preserved
          message = `Selection preserved while switching to ${currentSector.name} ${currentSubsector}`;
          type = 'success';
        } else {
          // Different item selected
          message = `Switched to similar item for ${currentSector.name} ${currentSubsector}`;
          type = 'info';
        }
      } else if (previousSelectedId.current && !lastSelectedItemId) {
        // Selection was lost
        message = `Selection cleared - no matching items in ${currentSector.name} ${currentSubsector}`;
        type = 'warning';
      } else {
        // Just sector change notification
        message = `Switched to ${currentSector.name} ${currentSubsector}`;
        type = 'info';
      }

      setNotification({
        message,
        type,
        timestamp: Date.now()
      });

      // Auto-clear notification after 3 seconds
      setTimeout(() => {
        setNotification(null);
      }, 3000);
    }

    // Update refs
    previousSector.current = currentSector;
    previousSubsector.current = currentSubsector;
    previousSelectedId.current = lastSelectedItemId;
  }, [currentSector, currentSubsector, lastSelectedItemId]);

  const clearNotification = () => {
    setNotification(null);
  };

  return {
    notification,
    clearNotification,
    isTransitioning: false // Could be enhanced to show loading state during transitions
  };
}

/**
 * Hook to get sector-aware navigation state
 */
export function useSectorAwareNavigation() {
  const { currentSector, currentSubsector } = useApp();
  
  return {
    sectorPath: `${currentSector.name}/${currentSubsector}`,
    sectorKey: `${currentSector.id}-${currentSubsector.toLowerCase().replace(/\s+/g, '-')}`,
    displayName: `${currentSector.name} - ${currentSubsector}`
  };
}

/**
 * Hook to check if content should be visible for current sector
 */
export function useSectorContentFilter() {
  const { currentSector, currentSubsector } = useApp();
  
  const shouldShowContent = (itemSector?: string, itemSubsector?: string) => {
    // Always show cross-sector core content
    if (!itemSector || !itemSubsector) {
      return true;
    }
    
    // Show sector-specific content that matches current selection
    return itemSector === currentSector.name && itemSubsector === currentSubsector;
  };

  const filterItems = <T extends { sector?: string; subsector?: string }>(items: T[]): T[] => {
    return items.filter(item => shouldShowContent(item.sector, item.subsector));
  };

  return {
    shouldShowContent,
    filterItems,
    currentSectorName: currentSector.name,
    currentSubsectorName: currentSubsector
  };
}