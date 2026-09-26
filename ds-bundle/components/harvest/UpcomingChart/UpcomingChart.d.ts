import * as React from 'react';

/**
 * UpcomingChart — from @okradesu/ui@1.0.0.
 */
export interface UpcomingChartProps {
  days: { date: Date; pods: number; }[];
  height?: number;
  /** Draw its own card; turn off when it already sits inside a panel. */
  framed?: boolean;
}

export declare const UpcomingChart: React.ComponentType<UpcomingChartProps>;
