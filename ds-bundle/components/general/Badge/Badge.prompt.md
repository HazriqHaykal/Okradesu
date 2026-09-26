Badge from @okradesu/ui. Use via `window.Okradesu.Badge` (bundle loaded from the root `_ds_bundle.js`).

Small uppercase status pill. Tones: accent (orange), neutral, success (green), solid (orange fill), danger (red).

## Props

```ts
interface BadgeProps {
  label: string;
  tone?: "accent" | "neutral" | "success" | "solid" | "danger";
  icon?: LucideIcon;
}
```

## Examples

### Tones

```jsx
() => (
  <div style={row}>
    <Badge label="Online" tone="success" />
    <Badge label="Local mode" tone="accent" />
    <Badge label="Mildew risk" tone="danger" />
    <Badge label="4 farms" tone="neutral" />
    <Badge label="9 ready" tone="solid" />
  </div>
);

/** With a leading icon. */
```

### WithIcon

```jsx
() => (
  <div style={row}>
    <Badge label="Online" tone="success" icon={Icons.RadioTower} />
    <Badge label="Rising" tone="danger" icon={Icons.TriangleAlert} />
    <Badge label="Picked 07:12" tone="success" icon={Icons.Check} />
  </div>
);

/** Row counts on the harvest map. */
```

### HarvestCounts

```jsx
() => (
  <div style={row}>
    <Badge label="3 must" tone="danger" />
    <Badge label="9 ready" tone="solid" />
    <Badge label="1 overgrown" tone="accent" />
  </div>
)
```
