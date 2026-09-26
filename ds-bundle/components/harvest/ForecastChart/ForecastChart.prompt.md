ForecastChart from @okradesu/ui. Use via `window.Okradesu.ForecastChart` (bundle loaded from the root `_ds_bundle.js`).

Stacked daily bars: sold ahead (green) under not-yet-matched (orange 300).
@category Harvest

## Props

```ts
interface ForecastChartProps {
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
```

## Examples

### Phone

```jsx
() => (
  <div style={{ width: 340 }}>
    <ForecastChart />
  </div>
);

/** Dashboard width with kg units. */
```

### Dashboard

```jsx
() => (
  <div style={{ width: 620 }}>
    <ForecastChart height={150} barWidth={44} showUnit />
  </div>
)
```
