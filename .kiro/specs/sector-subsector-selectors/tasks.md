# Implementation Plan

- [x] 1. Set up data structures and type definitions





  - Create Sector interface in types/navigation.ts with id, name, and subsectors properties
  - Add sectors array to mockData.ts with all five sectors and their subsectors
  - Export sectors data for use in components
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [ ]* 1.1 Write unit test for data structure validation
  - Verify sectors array contains exactly five sectors
  - Verify each sector has required properties (id, name, subsectors)
  - Verify subsector arrays are non-empty
  - _Requirements: 4.3_

- [x] 2. Extend AppContext with sector and subsector state





  - Add currentSector, setCurrentSector, currentSubsector, setCurrentSubsector, and availableSubsectors to AppContextType interface
  - Initialize state with default values (Oil & Gas, Upstream)
  - Implement state update functions
  - Add computed availableSubsectors based on currentSector
  - _Requirements: 1.3, 2.4, 3.2, 3.3_

- [ ]* 2.1 Write property test for sector selection state updates
  - **Property 1: Sector selection updates state and UI**
  - **Validates: Requirements 1.3, 1.4**
  - Generate random sector selections and verify AppContext updates correctly
  - _Requirements: 1.3, 1.4_

- [ ]* 2.2 Write property test for subsector selection state updates
  - **Property 2: Subsector selection updates state and UI**
  - **Validates: Requirements 2.4, 2.5**
  - Generate random subsector selections and verify AppContext updates correctly
  - _Requirements: 2.4, 2.5_

- [ ]* 2.3 Write property test for state persistence
  - **Property 5: State persistence**
  - **Validates: Requirements 3.3, 3.4**
  - Generate random selection sequences and verify state persists across operations
  - _Requirements: 3.3, 3.4_

- [x] 3. Create Sector Selector component





  - Create SectorSelector component using DropdownMenu from shadcn/ui
  - Implement dropdown trigger button displaying currentSector name
  - Render dropdown menu items for all sectors from mockData
  - Handle sector selection and update AppContext
  - Apply same styling as Tenant Selector (font, colors, spacing, padding, hover effects, chevron icon)
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [ ]* 3.1 Write unit test for Sector Selector rendering
  - Verify Sector Selector renders with default sector
  - Verify clicking opens dropdown with all five sectors
  - _Requirements: 1.1, 1.2_

- [ ]* 3.2 Write property test for subsector filtering
  - **Property 3: Subsector filtering matches selected sector**
  - **Validates: Requirements 2.2, 2.3**
  - Generate random sector selections and verify subsector list updates correctly
  - _Requirements: 2.2, 2.3_

- [x] 4. Create Subsector Selector component





  - Create SubsectorSelector component using DropdownMenu from shadcn/ui
  - Implement dropdown trigger button displaying currentSubsector name
  - Render dropdown menu items for availableSubsectors from AppContext
  - Handle subsector selection and update AppContext
  - Apply same styling as Tenant Selector
  - Implement automatic subsector update when sector changes (select first subsector)
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 5.5_

- [ ]* 4.1 Write unit test for Subsector Selector rendering
  - Verify Subsector Selector renders with default subsector
  - Verify clicking opens dropdown with filtered subsectors
  - _Requirements: 2.1, 2.2_

- [ ]* 4.2 Write property test for automatic subsector selection
  - **Property 8: Automatic subsector selection on sector change**
  - **Validates: Requirements 5.5**
  - Generate random sector changes and verify subsector auto-updates to first subsector
  - _Requirements: 5.5_

- [x] 5. Integrate selectors into TopBar




  - Import SectorSelector and SubsectorSelector components into TopBar
  - Position selectors between Tenant Selector and Multi-Stream placeholder
  - Use flex layout with gap-3 spacing
  - Ensure proper z-index for dropdown menus
  - _Requirements: 1.1, 2.1, 5.4_

- [ ]* 5.1 Write unit test for TopBar integration
  - Verify TopBar renders with all three selectors in correct order
  - Verify selectors are positioned correctly
  - _Requirements: 1.1, 2.1_

- [x] 6. Implement dropdown interaction behaviors




  - Implement dropdown close on outside click for both selectors
  - Implement selected item highlighting in dropdown menus
  - Ensure dropdowns have proper z-index layering
  - _Requirements: 5.2, 5.3, 5.4_

- [ ]* 6.1 Write property test for dropdown highlighting
  - **Property 6: Dropdown highlighting**
  - **Validates: Requirements 5.2**
  - Generate random selections and verify selected item is highlighted
  - _Requirements: 5.2_

- [ ]* 6.2 Write property test for dropdown close behavior
  - **Property 7: Dropdown close on outside click**
  - **Validates: Requirements 5.3**
  - Generate random click positions and verify dropdown closes when outside
  - _Requirements: 5.3_

- [x] 7. Implement combined display format





  - Create utility function or component to format sector and subsector display
  - Display format: "Sector: {SectorName} | Subsector: {SubsectorName}"
  - Integrate display into appropriate UI location
  - _Requirements: 3.1_

- [ ]* 7.1 Write property test for display format
  - **Property 4: Combined display format**
  - **Validates: Requirements 3.1**
  - Generate random sector/subsector combinations and verify display format
  - _Requirements: 3.1_

- [x] 8. Add error handling and edge cases




  - Add fallback to default sector if invalid sector selected
  - Add fallback to first subsector if invalid subsector selected
  - Handle empty sectors array gracefully
  - Add error logging for state synchronization issues
  - Implement debouncing for rapid selector clicks
  - _Requirements: All requirements (error handling)_


- [x] 9. Checkpoint - Ensure all tests pass




  - Ensure all tests pass, ask the user if questions arise.
