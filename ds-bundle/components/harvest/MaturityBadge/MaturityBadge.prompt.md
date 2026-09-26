MaturityBadge from @okradesu/ui. Use via `window.Okradesu.MaturityBadge` (bundle loaded from the root `_ds_bundle.js`).

Badge for a pod's maturity from the camera or phone check: Ready (orange), Overgrown (red) or Too small (neutral).
@category Harvest

## Props

```ts
interface MaturityBadgeProps {
  maturity: "too_small" | "ready" | "overgrown";
}
```

## Examples

### Outcomes

```jsx
() => (
  <div style={{ display: 'flex', gap: 8 }}>
    <MaturityBadge maturity="ready" />
    <MaturityBadge maturity="too_small" />
    <MaturityBadge maturity="overgrown" />
  </div>
)
```
