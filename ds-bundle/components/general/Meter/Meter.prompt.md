Meter from @okradesu/ui. Use via `window.Okradesu.Meter` (bundle loaded from the root `_ds_bundle.js`).

Horizontal fill bar (risk meters).

## Props

```ts
interface MeterProps {
  value: number;
  color: string;
  track?: string;
}
```

## Examples

### Risk

```jsx
() => (
  <div style={box}>
    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
      <Txt variant="small" weight={700} color={Colors.dangerFg}>
        High risk · 68%
      </Txt>
      <Txt variant="small" weight={600} color={Colors.textSecondary}>
        before symptoms show
      </Txt>
    </div>
    <Meter value={68} color={Colors.danger} />
  </div>
);

/** Progress: tasks done and rows picked. */
```

### Progress

```jsx
() => (
  <div style={{ ...box, gap: 14 }}>
    <Meter value={33} color={Colors.success} />
    <Meter value={75} color={Colors.accent} />
    <Meter value={100} color={Colors.successFg} />
  </div>
)
```
