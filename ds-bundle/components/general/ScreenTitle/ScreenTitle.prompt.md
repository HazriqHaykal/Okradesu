ScreenTitle from @okradesu/ui. Use via `window.Okradesu.ScreenTitle` (bundle loaded from the root `_ds_bundle.js`).

Small uppercase label above a screen title, with the Anton title below.

## Props

```ts
interface ScreenTitleProps {
  kicker: string;
  title: string;
  right?: React.ReactNode;
}
```

## Examples

### WithAction

```jsx
() => (
  <div style={{ width: 360 }}>
    <ScreenTitle
      kicker="Saturday 26 September"
      title="Harvest map"
      right={<IconButton icon={Icons.ScanLine} label="Check a pod" variant="accent" size={48} />}
    />
  </div>
);

/** Title only. */
```

### Plain

```jsx
() => (
  <div style={{ width: 360 }}>
    <ScreenTitle kicker="Sent to LINE as they happen" title="Alerts" />
  </div>
)
```
