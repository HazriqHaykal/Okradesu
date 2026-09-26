Card from @okradesu/ui. Use via `window.Okradesu.Card` (bundle loaded from the root `_ds_bundle.js`).

White card, radius 18, soft shadow, no border.

## Props

```ts
interface CardProps {
  children: React.ReactNode;
  style?: false | "" | ViewStyle | RecursiveArray<Falsy | ViewStyle>;
}
```

## Examples

### BuyerList

```jsx
() => (
  <Card style={{ width: 340, paddingHorizontal: 16, paddingVertical: 4 }}>
    {buyers.map(([name, detail, status, tone], i) => (
      <div key={name}>
        {i > 0 ? <Divider /> : null}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0' }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Txt variant="bodyLg" weight={800}>
              {name}
            </Txt>
            <Txt variant="small" color={Colors.textSecondary}>
              {detail}
            </Txt>
          </div>
          <Badge label={status} tone={tone} />
        </div>
      </div>
    ))}
  </Card>
);

/** A padded card with one message. */
```

### Simple

```jsx
() => (
  <Card style={{ width: 340, padding: 16, gap: 8 }}>
    <Txt variant="heading">Row 2 · Plant 3</Txt>
    <Txt variant="body" color={Colors.textBody}>
      3 pods are 8–10 cm and ready now. Pick before 14:00, or they turn tough by tomorrow.
    </Txt>
  </Card>
)
```
