# Impact Tracking UI Implementation

## Overview
Implemented Task 22: Impact Tracking UI for the Continuous Improvement (CI) feature set in the Operational Excellence module.

## Implementation Details

### File Modified
- `src/pages/optimise/ci/ImpactTracking.tsx`

### Key Features Implemented

#### 1. KPI Selection and Linking
- Projects can be linked to multiple KPIs for impact tracking
- Link KPI modal allows selecting KPIs and entering initial values
- Projects display count of linked KPIs in the list view

#### 2. Baseline, Target, and Actual Value Inputs
- Each KPI-project link can have:
  - **Baseline**: Starting value before improvement
  - **Target**: Desired value after improvement
  - **Actual**: Current measured value
  - **Notes**: Additional context about the measurement
- Inline editing interface for updating values
- Form validation for numeric inputs

#### 3. Impact Value Calculation
- Automatic calculation using the formula: `(actual - baseline) / (target - baseline) * 100`
- Visual display of impact percentage
- Color-coded status indicators:
  - Green (≥80%): Excellent progress
  - Yellow (50-79%): On track
  - Red (<50%): Needs attention
- Progress bar visualization

#### 4. Impact Charts and Trends
- **KPIs & Impact Tab**: Displays all linked KPIs with their values and calculated impact
- **Trends Tab**: Shows progress visualization for each KPI with baseline → actual → target flow
- **Analysis Tab**: Provides summary statistics and recommendations:
  - Average impact value across all KPIs
  - Count of KPIs exceeding target, on track, and at risk
  - Overall project status assessment
  - Actionable recommendations based on performance

### UI Components

#### List Pane
- Displays all CI projects with impact tracking
- Shows project metadata: owner, KPI count, average impact
- Filter by project
- Search functionality
- Status badges based on average impact value

#### Work Pane Tabs
1. **KPIs & Impact**: Main tab for viewing and editing KPI values
2. **Trends**: Visual representation of progress for each KPI
3. **Analysis**: Summary statistics and recommendations

#### Overview Dashboard
- KPI cards showing:
  - Total projects
  - Projects with impacts
  - Total KPIs tracked
  - Average impact value
- List of projects with impact measurements

### Data Integration

#### Provider Methods Used
- `listCiProjects()`: Fetch all CI projects
- `listCiProjectKpis()`: Fetch KPIs linked to a project
- `upsertCiImpact()`: Create or update impact measurements

#### Type Definitions
- `CIProject`: Project entity
- `CIKPI`: KPI definition
- `CIImpact`: Impact measurement with baseline, target, actual values
- `UpsertImpactRequest`: Request payload for updating impact values

### Requirements Satisfied

✅ **8.1**: KPI selection and linking to projects  
✅ **8.2**: Baseline, target, actual value inputs  
✅ **8.3**: Impact value calculation: (actual - baseline) / (target - baseline) * 100  
✅ **8.4**: Display impact charts and trends  
✅ **8.5**: Visual progress indicators  
✅ **8.6**: Analysis and recommendations  
✅ **16.3**: CI navigation integration  
✅ **16.6**: nLVE pattern implementation  

### Acceptance Criteria Met

✅ Can link KPIs to projects  
✅ Can enter baseline, target, and actual values  
✅ Impact calculation works correctly  
✅ Visual displays show progress and trends  
✅ Analysis tab provides insights and recommendations  

## Testing Recommendations

### Manual Testing
1. Navigate to `/optimise/ci/impact-tracking`
2. Select a CI project from the list
3. Click "Link KPI" to add a KPI to the project
4. Enter baseline, target, and actual values
5. Verify impact calculation: (actual - baseline) / (target - baseline) * 100
6. Check that progress bar and status badge reflect the calculated impact
7. View Trends tab to see visual representation
8. View Analysis tab to see summary statistics

### Edge Cases to Test
- Division by zero: When target equals baseline (handled: returns 100%)
- Negative impact values: When actual is worse than baseline
- Missing values: When baseline, target, or actual are not set
- Multiple KPIs: Verify average calculation across multiple KPIs

## Future Enhancements

1. **Historical Tracking**: Store impact measurements over time to show trends
2. **Charts**: Add line charts showing progress over time
3. **Export**: Export impact data to CSV/PDF
4. **Bulk Edit**: Update multiple KPI values at once
5. **Alerts**: Notify when impact values fall below thresholds
6. **Forecasting**: Predict when targets will be achieved based on current trends

## Notes

- The implementation follows the nLVE (Navigate, List, View, Edit) pattern
- Uses ErrorAwareListPane and ErrorAwareWorkPane for consistent error handling
- Integrates with the hybrid data provider for sector-based routing
- All database operations are performed through the DataProvider interface
- Impact calculation formula matches the requirement specification exactly
