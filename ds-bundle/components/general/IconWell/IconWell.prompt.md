IconWell from @okradesu/ui. Use via `window.Okradesu.IconWell` (bundle loaded from the root `_ds_bundle.js`).

Tinted square that holds an icon, like the category tiles' image well.

## Props

```ts
interface IconWellProps {
  icon: LucideIcon;
  size?: number;
  radius?: number;
  bg?: string;
  fg?: string;
}
```

## Examples

### Default

```jsx
() => (
  <div style={row}>
    <IconWell icon={Icons.Tractor} />
    <IconWell icon={Icons.School} />
    <IconWell icon={Icons.Droplets} />
    <IconWell icon={Icons.RadioTower} size={36} radius={10} />
  </div>
);

/** Status colours: success for LINE connected, danger for alerts. */
```

### StatusColours

```jsx
() => (
  <div style={row}>
    <IconWell icon={Icons.MessageCircle} size={48} bg={Colors.successBg} fg={Colors.successFg} />
    <IconWell icon={Icons.TriangleAlert} size={48} bg={Colors.dangerBg} fg={Colors.dangerFg} />
  </div>
)
```
