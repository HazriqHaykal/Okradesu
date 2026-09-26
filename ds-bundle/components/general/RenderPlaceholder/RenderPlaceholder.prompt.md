RenderPlaceholder from @okradesu/ui. Use via `window.Okradesu.RenderPlaceholder` (bundle loaded from the root `_ds_bundle.js`).

Striped stand-in for a photo or 3D render (the system's image placeholder).
Swap for an `expo-image` <Image> once real okra and farm imagery exists.

## Props

```ts
interface RenderPlaceholderProps {
  label: string;
  height: number;
  radius?: number;
  style?: false | "" | ViewStyle | RecursiveArray<Falsy | ViewStyle>;
}
```

## Examples

### CameraFrame

```jsx
() => (
  <div style={{ width: 320 }}>
    <RenderPlaceholder label="Live camera · Classroom 2" height={200} radius={22} />
  </div>
);

/** Round and small, for onboarding collages. */
```

### Shapes

```jsx
() => (
  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
    <RenderPlaceholder label="Okra basket" height={140} radius={999} style={{ width: 140 }} />
    <RenderPlaceholder label="Okra pods" height={110} style={{ width: 150 }} />
  </div>
)
```
