InfoStat from @okradesu/ui. Use via `window.Okradesu.InfoStat` (bundle loaded from the root `_ds_bundle.js`).

Uppercase meta label over a bold value (Detail facts row).

## Props

```ts
interface InfoStatProps {
  label: string;
  value: React.ReactNode;
}
```

## Examples

### FactsRow

```jsx
() => (
  <div
    style={{
      width: 340,
      display: 'flex',
      gap: 8,
      padding: '12px 0',
      borderTop: '1px solid #EADCC6',
      borderBottom: '1px solid #EADCC6',
    }}>
    <InfoStat label="Building" value="Hinode School" />
    <InfoStat label="Plants" value="48 · day 62" />
    <InfoStat label="Last sync" value="2 min ago" />
  </div>
);

/** Facts under a pod check result. */
```

### PodCheck

```jsx
() => (
  <div style={{ width: 340, display: 'flex', gap: 8 }}>
    <InfoStat label="Grade" value="A" />
    <InfoStat label="Confidence" value="94%" />
    <InfoStat label="Scale" value="¥100 coin" />
  </div>
)
```
