import * as React from 'react';

/**
 * ForecastChart — from @okradesu/ui@1.0.0.
 */
export interface ForecastChartProps {
  height?: number;
  barWidth?: number;
  showUnit?: boolean;
  data?: ChartDay[];
  soldLabel?: string;
  openLabel?: string;
  /** Legend entry for red bars; shown only when set. */
  hotLabel?: string;
  maxKg?: number;
}

export declare const ForecastChart: React.ComponentType<ForecastChartProps>;
