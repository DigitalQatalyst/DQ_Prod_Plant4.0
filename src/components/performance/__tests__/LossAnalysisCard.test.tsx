import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LossAnalysisCard } from '../LossAnalysisCard';
import { PerformanceLoss } from '@/types/performance';

describe('LossAnalysisCard - Crash Fixes', () => {
  it('should render without crashing when losses is undefined', () => {
    // @ts-expect-error - Testing undefined case
    expect(() => render(<LossAnalysisCard losses={undefined} />)).not.toThrow();
  });

  it('should render without crashing when losses is null', () => {
    // @ts-expect-error - Testing null case
    expect(() => render(<LossAnalysisCard losses={null} />)).not.toThrow();
  });

  it('should render without crashing when losses is an empty array', () => {
    expect(() => render(<LossAnalysisCard losses={[]} />)).not.toThrow();
  });

  it('should display "No losses recorded" message when losses is empty', () => {
    render(<LossAnalysisCard losses={[]} />);
    expect(screen.getByText('No losses recorded')).toBeInTheDocument();
  });

  it('should display "No losses recorded" message when losses is undefined', () => {
    // @ts-expect-error - Testing undefined case
    render(<LossAnalysisCard losses={undefined} />);
    expect(screen.getByText('No losses recorded')).toBeInTheDocument();
  });

  it('should render with valid loss data', () => {
    const validLosses: PerformanceLoss[] = [
      {
        loss_id: '1',
        asset_id: 'asset-1',
        loss_category: 'technical',
        loss_type: 'equipment_failure',
        duration_minutes: 120,
        frequency_count: 3,
        impact_percentage: 5.5,
        energy_lost_mwh: 10.5,
        timestamp: '2024-01-01T00:00:00Z',
        description: 'Test loss',
        root_cause: 'Test cause',
        corrective_action: 'Test action'
      }
    ];

    expect(() => render(<LossAnalysisCard losses={validLosses} />)).not.toThrow();
  });

  it('should handle losses with missing numeric properties', () => {
    const lossesWithMissingProps: PerformanceLoss[] = [
      {
        loss_id: '1',
        asset_id: 'asset-1',
        loss_category: 'technical',
        loss_type: 'equipment_failure',
        // @ts-expect-error - Testing missing properties
        duration_minutes: undefined,
        // @ts-expect-error - Testing missing properties
        frequency_count: undefined,
        // @ts-expect-error - Testing missing properties
        impact_percentage: undefined,
        energy_lost_mwh: 10.5,
        timestamp: '2024-01-01T00:00:00Z',
        description: 'Test loss',
        root_cause: 'Test cause',
        corrective_action: 'Test action'
      }
    ];

    expect(() => render(<LossAnalysisCard losses={lossesWithMissingProps} />)).not.toThrow();
  });

  it('should handle losses with invalid loss objects', () => {
    const lossesWithInvalidObjects: any[] = [
      null,
      undefined,
      { loss_category: 'technical' }, // Missing other properties
      {
        loss_id: '1',
        asset_id: 'asset-1',
        loss_category: 'technical',
        loss_type: 'equipment_failure',
        duration_minutes: 120,
        frequency_count: 3,
        impact_percentage: 5.5,
        energy_lost_mwh: 10.5,
        timestamp: '2024-01-01T00:00:00Z',
        description: 'Valid loss',
        root_cause: 'Test cause',
        corrective_action: 'Test action'
      }
    ];

    expect(() => render(<LossAnalysisCard losses={lossesWithInvalidObjects} />)).not.toThrow();
  });
});
