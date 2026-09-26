RowSnapshot from @okradesu/ui. Use via `window.Okradesu.RowSnapshot` (bundle loaded from the root `_ds_bundle.js`).

Illustrated camera frame of one row with the Edge AI's boxes on it:
red = must pick today, orange = ready, grey = too small, brown = overgrown,
green = new flower.
@category Illustrations

## Props

```ts
interface RowSnapshotProps {
  det: DetectionRow;
  kind: "outdoor" | "indoor";
  seed: number;
  width: number;
  height: number;
  labels?: boolean;
}
```

## Examples

### OutdoorRow

```jsx
() => (
  <div style={frame}>
    <RowSnapshot det={fieldA.rows[1]} kind="outdoor" seed={2} width={340} height={230} labels />
  </div>
);

/** An indoor row under LEDs. */
```

### IndoorRow

```jsx
() => (
  <div style={frame}>
    <RowSnapshot det={classroom.rows[2]} kind="indoor" seed={3} width={340} height={230} labels />
  </div>
);

/** Small thumbnails for list rows. */
```

### Thumbnails

```jsx
() => (
  <div style={{ display: 'flex', gap: 8 }}>
    {fieldA.rows.slice(0, 4).map((r, i) => (
      <div key={r.row} style={{ ...frame, borderRadius: 10 }}>
        <RowSnapshot det={r} kind="outdoor" seed={i + 1} width={64} height={78} />
      </div>
    ))}
  </div>
)
```
