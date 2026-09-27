UpcomingChart from @okradesu/ui. Use via `window.Okradesu.UpcomingChart` (bundle loaded from the root `_ds_bundle.js`).

Bars from the flower countdown: flowers seen today become the coming days' pods.
@category Harvest

## Props

```ts
interface UpcomingChartProps {
  days: { date: Date; pods: number; }[];
  height?: number;
  /** Draw its own card; turn off when it already sits inside a panel. */
  framed?: boolean;
}
```

## Examples

### Framed

```jsx
() => (
  <div style={{ width: 360 }}>
    <UpcomingChart days={upcomingPods(4)} />
  </div>
);

/** Without its own card, inside a dashboard panel. */
```

### InPanel

```jsx
() => (
  <div style={{ width: 420, padding: 20, background: '#FFFFFF', borderRadius: 18 }}>
    <UpcomingChart days={upcomingPods(4)} height={140} framed={false} />
  </div>
)
```
