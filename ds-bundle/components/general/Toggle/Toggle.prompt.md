Toggle from @okradesu/ui. Use via `window.Okradesu.Toggle` (bundle loaded from the root `_ds_bundle.js`).

Orange-filled switch; the platform Switch ignores thumb colors on web.

## Props

```ts
interface ToggleProps {
  value: boolean;
  onValueChange: (next: boolean) => void;
  label: string;
}
```

## Examples

### States

```jsx
() => (
  <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
    <Toggle value label="Automatic control" onValueChange={() => {}} />
    <Toggle value={false} label="Buyer orders alerts" onValueChange={() => {}} />
  </div>
);

/** In a settings row, working. */
```

### SettingRow

```jsx
() => {
  const [on, setOn] = useState(true);
  return (
    <div style={{ width: 340, display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Txt variant="bodyLg" weight={800}>
          Air fans
        </Txt>
        <Txt variant="small" color={Colors.textSecondary}>
          {on ? 'Auto · runs when humidity is above 75%' : 'Manual · held at current speed'}
        </Txt>
      </div>
      <Toggle value={on} onValueChange={setOn} label="Automatic control for Air fans" />
    </div>
  );
}
```
