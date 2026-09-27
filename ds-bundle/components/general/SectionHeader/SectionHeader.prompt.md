SectionHeader from @okradesu/ui. Use via `window.Okradesu.SectionHeader` (bundle loaded from the root `_ds_bundle.js`).

Section title in Manrope 800 with an optional small orange action link on the right (e.g. "See All").

## Props

```ts
interface SectionHeaderProps {
  title: string;
  action?: string;
  href?: string | { pathname: string; params?: Record<string, string>; };
}
```

## Examples

### WithAndWithoutAction

```jsx
() => (
  <div style={{ width: 340, display: 'flex', flexDirection: 'column', gap: 16 }}>
    <SectionHeader title="Pick in This Order" />
    <SectionHeader title="Harvest Map" action="Open" href="/harvest" />
    <SectionHeader title="Buyers This Week" action="See All" href="/market" />
  </div>
)
```
