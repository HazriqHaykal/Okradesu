IconButton from @okradesu/ui. Use via `window.Okradesu.IconButton` (bundle loaded from the root `_ds_bundle.js`).

Round icon-only button (44 px by default). `surface` is white; `accent` is orange for the one primary action. Always pass `label` for screen readers.

## Props

```ts
interface IconButtonProps {
  icon: LucideIcon;
  label: string;
  onPress?: () => void;
  href?: string | { pathname: string; params?: Record<string, string>; };
  variant?: "accent" | "surface";
  size?: number;
  dot?: boolean;
}
```

## Examples

### Surface

```jsx
() => (
  <div style={row}>
    <IconButton icon={Icons.Bell} label="Alerts, 2 new" dot />
    <IconButton icon={Icons.LayoutDashboard} label="Open web dashboard" />
    <IconButton icon={Icons.ChevronLeft} label="Back" />
  </div>
);

/** Orange accent for the one primary icon action, like the pod check camera. */
```

### Accent

```jsx
() => (
  <div style={row}>
    <IconButton icon={Icons.ScanLine} label="Check a pod with the camera" variant="accent" size={48} />
    <IconButton icon={Icons.Send} label="Send question" variant="accent" size={46} />
  </div>
);

/** Sizes from 36 to 52. */
```

### Sizes

```jsx
() => (
  <div style={row}>
    <IconButton icon={Icons.Camera} label="Camera" size={36} />
    <IconButton icon={Icons.Camera} label="Camera" size={44} />
    <IconButton icon={Icons.Camera} label="Camera" size={52} />
  </div>
)
```
