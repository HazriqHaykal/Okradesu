Divider from @okradesu/ui. Use via `window.Okradesu.Divider` (bundle loaded from the root `_ds_bundle.js`).

Hairline separator in the subtle border colour, for lists inside a Card.

## Props

```ts
interface DividerProps {
  style?: false | "" | ViewStyle | RecursiveArray<Falsy | ViewStyle>;
}
```

## Examples

### InAList

```jsx
() => (
  <Card style={{ width: 320, paddingHorizontal: 16, paddingVertical: 4 }}>
    {rows.map((t, i) => (
      <div key={t}>
        {i > 0 ? <Divider /> : null}
        <div style={{ padding: '12px 0', display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Txt variant="bodyLg" weight={800}>
            {t}
          </Txt>
          <Txt variant="small" color={Colors.textSecondary}>
            Sent to LINE as it happens
          </Txt>
        </div>
      </div>
    ))}
  </Card>
)
```
