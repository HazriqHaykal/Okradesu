HarvestGrid from @okradesu/ui. Use via `window.Okradesu.HarvestGrid` (bundle loaded from the root `_ds_bundle.js`).

The daily harvest map: one line per farm, one square per growing row.
Red = must pick today, orange = ready, green = picked, grey = not yet.
@category Harvest

## Props

```ts
interface HarvestGridProps {
  grid: { farm: Farm; rows: PlanRow[]; }[];
  picked: Map<string, Date>;
  maxCell?: number;
}
```

## Examples

### TodaysMap

```jsx
() => (
  <Card style={frame}>
    <HarvestGrid grid={allRows()} picked={new Map()} />
  </Card>
);

/** Mid-morning: two Field A rows already picked (green ticks). */
```

### PartlyPicked

```jsx
() => (
  <Card style={frame}>
    <HarvestGrid
      grid={allRows()}
      picked={
        new Map([
          ['field-a#2', new Date()],
          ['field-a#4', new Date()],
        ])
      }
    />
  </Card>
);

/** On a wide dashboard panel the squares grow to 40 px. */
```

### Dashboard

```jsx
() => (
  <Card style={{ width: 560, padding: 18 }}>
    <HarvestGrid grid={allRows()} picked={new Map()} maxCell={40} />
  </Card>
)
```
