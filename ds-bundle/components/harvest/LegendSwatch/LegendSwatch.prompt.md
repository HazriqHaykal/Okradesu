LegendSwatch from @okradesu/ui. Use via `window.Okradesu.LegendSwatch` (bundle loaded from the root `_ds_bundle.js`).

Small coloured square plus a label, for chart and map legends.
@category Harvest

## Props

```ts
interface LegendSwatchProps {
  color: string;
  label: string;
  outlined?: boolean;
}
```

## Examples

### HarvestLegend

```jsx
() => (
  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
    <LegendSwatch color={Colors.danger} label="Must pick" />
    <LegendSwatch color={Colors.accent} label="Ready" />
    <LegendSwatch color={Colors.successFg} label="Picked" />
    <LegendSwatch color={Colors.surfaceSunken} label="Not yet" outlined />
  </div>
);

/** The sales chart legend. */
```

### SalesLegend

```jsx
() => (
  <div style={{ display: 'flex', gap: 16 }}>
    <LegendSwatch color={Colors.success} label="Sold ahead" />
    <LegendSwatch color={Palette.orange300} label="Not yet matched" />
  </div>
)
```
