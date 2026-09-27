import * as React from 'react';

/**
 * HarvestGrid — from @okradesu/ui@1.0.0.
 */
export interface HarvestGridProps {
  grid: { farm: Farm; rows: PlanRow[]; }[];
  picked: Map<string, Date>;
  maxCell?: number;
}

export declare const HarvestGrid: React.ComponentType<HarvestGridProps>;
