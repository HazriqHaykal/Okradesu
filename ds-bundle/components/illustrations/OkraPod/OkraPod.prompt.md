OkraPod from @okradesu/ui. Use via `window.Okradesu.OkraPod` (bundle loaded from the root `_ds_bundle.js`).

Flat okra pod illustration; `tone` is fresh, small or overgrown.
@category Illustrations

## Props

```ts
interface OkraPodProps {
  width?: number;
  tone?: "overgrown" | "fresh" | "small";
}
```

## Examples

### Tones

```jsx
() => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
    <OkraPod width={200} tone="fresh" />
    <OkraPod width={140} tone="small" />
    <OkraPod width={240} tone="overgrown" />
  </div>
)
```
