Button from @okradesu/ui. Use via `window.Okradesu.Button` (bundle loaded from the root `_ds_bundle.js`).

Pill button with an uppercase label. Labels on orange stay ink.

## Props

```ts
interface ButtonProps {
  label: string;
  onPress?: () => void;
  href?: string | { pathname: string; params?: Record<string, string>; };
  variant?: "primary" | "secondary" | "ghost" | "surface";
  size?: "sm" | "md" | "lg";
  icon?: LucideIcon;
  block?: boolean;
  disabled?: boolean;
  style?: false | "" | ViewStyle | RecursiveArray<Falsy | ViewStyle>;
}
```

## Examples

### Variants

```jsx
() => (
  <div style={row}>
    <Button label="Start picking" icon={Icons.ListChecks} />
    <Button label="Log in with LINE" variant="secondary" />
    <Button label="See all 6" variant="ghost" icon={Icons.ChevronDown} />
  </div>
);

/** Surface buttons sit on the orange hero card. */
```

### OnHeroCard

```jsx
() => (
  <div
    style={{
      width: 340,
      padding: 20,
      borderRadius: 22,
      background: '#F29A1E',
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
    }}>
    <Button label="Start harvest" variant="surface" icon={Icons.ArrowRight} block />
  </div>
);

/** Small, medium and large. */
```

### Sizes

```jsx
() => (
  <div style={row}>
    <Button label="Accept" size="sm" />
    <Button label="Apply to fans" size="md" />
    <Button label="Get started" size="lg" />
  </div>
);

/** Full width, and disabled when there is nothing left to do. */
```

### BlockAndDisabled

```jsx
() => (
  <div style={{ width: 340, display: 'flex', flexDirection: 'column', gap: 10 }}>
    <Button label="Offer 78 kg to buyers" icon={Icons.Store} block />
    <Button label="All picked" icon={Icons.ListChecks} block disabled />
  </div>
)
```
