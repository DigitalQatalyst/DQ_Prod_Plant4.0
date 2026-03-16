import { 
  performancePanels, 
  simBoards, 
  ciProjects, 
  optimisationOpportunities 
} from '@/data/mockData';
import { 
  PerformancePanel, 
  SIMBoard, 
  CIProject, 
  OptimisationOpportunity 
} from '@/types/optimise';

export type SelectableItem = PerformancePanel | SIMBoard | CIProject | OptimisationOpportunity;

export interface SectorSwitchContext {
  previousSector: string;
  previousSubsector: string;
  newSector: string;
  newSubsector: string;
  selectedItemId: string;
  selectedItemType: string;
}

/**
 * Attempts to find a matching item when switching sectors
 * Priority order:
 * 1. Exact ID match (same item exists in new sector)
 * 2. Similar item in new sector (same type, similar properties)
 * 3. Cross-sector core item (fallback)
 * 4. First available item of same type in new sector
 */
export function findMatchingItemAfterSectorSwitch(
  context: SectorSwitchContext
): SelectableItem | null {
  const { newSector, newSubsector, selectedItemId, selectedItemType } = context;

  let dataSource: SelectableItem[] = [];
  
  // Determine which data source to search
  switch (selectedItemType) {
    case 'performance-panel':
    case 'upstream-performance':
    case 'transmission-performance':
    case 'fmcg-performance':
      dataSource = performancePanels;
      break;
    case 'sim-board':
      dataSource = simBoards;
      break;
    case 'ci-project':
      dataSource = ciProjects;
      break;
    case 'optimization-opportunity':
      dataSource = optimisationOpportunities;
      break;
    default:
      return null;
  }

  // Filter items available in the new sector context
  const availableItems = dataSource.filter(item => {
    // Always include cross-sector core content
    if (!('sector' in item) || !item.sector || !('subsector' in item) || !item.subsector) {
      return true;
    }
    // Include sector-specific content that matches new selection
    return item.sector === newSector && item.subsector === newSubsector;
  });

  if (availableItems.length === 0) {
    return null;
  }

  // Priority 1: Exact ID match
  const exactMatch = availableItems.find(item => item.id === selectedItemId);
  if (exactMatch) {
    return exactMatch;
  }

  // Priority 2: Similar item in new sector (sector-specific content)
  const sectorSpecificItems = availableItems.filter(item => 
    ('sector' in item) && item.sector === newSector && 
    ('subsector' in item) && item.subsector === newSubsector
  );
  
  if (sectorSpecificItems.length > 0) {
    // Return the first sector-specific item (could be enhanced with similarity scoring)
    return sectorSpecificItems[0];
  }

  // Priority 3: Cross-sector core item
  const crossSectorItems = availableItems.filter(item => 
    !('sector' in item) || !item.sector || !('subsector' in item) || !item.subsector
  );
  
  if (crossSectorItems.length > 0) {
    return crossSectorItems[0];
  }

  // Priority 4: First available item
  return availableItems[0];
}

/**
 * Determines if the currently selected item should be preserved when switching sectors
 */
export function shouldPreserveSelection(
  selectedItem: SelectableItem | null,
  newSector: string,
  newSubsector: string
): boolean {
  if (!selectedItem) {
    return false;
  }

  // If it's cross-sector content, always preserve
  if (!('sector' in selectedItem) || !selectedItem.sector || 
      !('subsector' in selectedItem) || !selectedItem.subsector) {
    return true;
  }

  // If it matches the new sector, preserve
  if (selectedItem.sector === newSector && selectedItem.subsector === newSubsector) {
    return true;
  }

  // Otherwise, don't preserve (will trigger search for alternative)
  return false;
}

/**
 * Gets a user-friendly message about selection preservation
 */
export function getSelectionPreservationMessage(
  originalItem: SelectableItem | null,
  newItem: SelectableItem | null,
  newSector: string,
  newSubsector: string
): string | null {
  if (!originalItem) {
    return null;
  }

  if (!newItem) {
    return `Selection cleared - no matching items found in ${newSector} ${newSubsector}`;
  }

  if (originalItem.id === newItem.id) {
    return null; // Same item, no message needed
  }

  const itemType = getItemTypeName(originalItem);
  return `Switched to similar ${itemType} for ${newSector} ${newSubsector}`;
}

function getItemTypeName(item: SelectableItem): string {
  if ('oee' in item) return 'performance panel';
  if ('shift' in item) return 'SIM board';
  if ('stage' in item) return 'CI project';
  if ('rank' in item) return 'optimization opportunity';
  return 'item';
}

/**
 * Enhanced selection preservation that provides better user feedback
 */
export function preserveSelectionWithFeedback(
  context: SectorSwitchContext,
  onSelectionChange: (item: SelectableItem | null) => void,
  onMessage?: (message: string) => void
): void {
  const matchingItem = findMatchingItemAfterSectorSwitch(context);
  
  onSelectionChange(matchingItem);
  
  if (onMessage) {
    const message = getSelectionPreservationMessage(
      null, // We don't have the original item here, but could be passed
      matchingItem,
      context.newSector,
      context.newSubsector
    );
    
    if (message) {
      onMessage(message);
    }
  }
}