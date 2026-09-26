import { ForecastChart } from '@okradesu/ui';

/** Seven-day sales forecast: sold ahead (green) under unmatched (light orange). */
export const Phone = () => (
  <div style={{ width: 340 }}>
    <ForecastChart />
  </div>
);

/** Dashboard width with kg units. */
export const Dashboard = () => (
  <div style={{ width: 620 }}>
    <ForecastChart height={150} barWidth={44} showUnit />
  </div>
);
