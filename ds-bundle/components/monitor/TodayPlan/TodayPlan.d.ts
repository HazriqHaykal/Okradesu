import * as React from 'react';

/**
 * TodayPlan — from @okradesu/ui@1.0.0.
 */
export interface TodayPlanProps {
  tasks: Task[];
  onOpen: (farmId: string) => void;
  /** Show only the first N tasks; progress still counts them all. */
  limit?: number;
}

export declare const TodayPlan: React.ComponentType<TodayPlanProps>;
