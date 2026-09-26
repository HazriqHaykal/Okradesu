# Okradesu — building with this design system

Okradesu (Connected Okra Farm) is a farm app for okra growers: harvest maps, farm monitoring, market. These are the app's real React Native components compiled for the web with react-native-web. Everything is on `window.Okradesu`:

```jsx
const { Card, Txt, Badge, Button, IconButton, Icons, Colors, HarvestGrid, allRows } = window.Okradesu;
```

## Setup and gotchas
- No provider or wrapper is needed. `styles.css` loads the fonts (Anton, Manrope) and the CSS variables.
- Components are flex-column Views. When you put several `Txt` in your own `<div>`, give that div `display: flex; flex-direction: column`, or the texts run together on one line.
- Components fill their parent's width. Size them with a wrapper, e.g. `<div style={{ width: 360 }}>`.
- `href` props (Button, IconButton, SectionHeader) do nothing in designs. Use `onPress` for interaction.
- Style components with the `style` prop (React Native style objects), never CSS classes.

## Styling idiom
Two layers:
1. **Components and their props.** Use them for anything they cover. Colors in JS come from the token exports: `Colors.accent`, `Colors.textPrimary`, `Colors.textSecondary`, `Colors.textAccent`, `Colors.surfaceCard`, `Colors.surfaceTint`, `Colors.danger`, `Colors.dangerFg`, `Colors.success`, `Colors.successFg`, `Palette.orange300`. Sizes come from `Radius` (`sm` 10, `md` 14, `lg` 18, `xl` 22, `pill`), `Spacing` (`gutter` 24) and `Shadow` (`card`, `tile`, `float`, `glow`).
2. **Your layout glue (plain HTML/CSS).** Use the CSS variables from `styles.css`: `--bg-app`, `--gradient-hero`, `--surface-card`, `--surface-tint`, `--text-primary`, `--text-secondary`, `--text-accent`, `--accent`, `--border-subtle`, `--success`, `--success-bg`, `--danger`, `--danger-bg`, `--radius-md`, `--radius-lg`, `--shadow-card`, `--space-4`, `--space-6`, `--font-display`, `--font-body`.

## Brand rules
- Cream page (`--bg-app`) with the peach-to-cream `--gradient-hero` at the top of screens, and white cards (`Card`).
- Orange `#F29A1E` is the one accent, used as a fill. Labels on orange are always ink, never white.
- Type: `<Txt variant>`. `display`, `displayXl` and `displaySm` are Anton uppercase, for screen titles and hero numbers only. Everything else is Manrope: `title`, `heading`, `bodyLg`, `body`, `small`, `caption`, and `micro` (uppercase labels). `weight` takes 400–800; `tabular` lines up numbers.
- Status meaning: red (`danger`) = must pick today or risk; orange = ready; `Palette.orange300` = tomorrow or not yet sold; green (`success`) = picked, online or sold.
- Buttons are uppercase pills: `primary` (orange), `secondary` (ink outline), `ghost`, and `surface` (white, on orange).
- No emoji. For icons use `Icons.<Name>` (Sprout, Store, Bell, Camera, ScanLine, Check, ListChecks, RadioTower, TriangleAlert, Tractor, School, …). Pass one as an `icon` prop, or render `<Icons.Sprout size={18} color={Colors.accent} />`.

## Where the truth lives
Each component's `.prompt.md` and `.d.ts` list its props. `styles.css` and `_ds_bundle.css` hold the variables. `allRows()`, `harvestPlan()`, `planTotals()`, `upcomingPods(4)` and `FARMS` return the demo farm's data (6 farms, 112 ready pods), so compositions look real.

## Example
```jsx
<div style={{ width: 360, display: 'flex', flexDirection: 'column', gap: 16, padding: 24, background: 'var(--gradient-hero)' }}>
  <Txt variant="display">Harvest map</Txt>
  <div style={{ display: 'flex', gap: 8 }}>
    <Badge label="21 must pick" tone="danger" />
    <Badge label="112 ready" tone="solid" />
  </div>
  <Card style={{ padding: 14 }}>
    <HarvestGrid grid={allRows()} picked={new Map()} />
  </Card>
  <Button label="Start picking" icon={Icons.ListChecks} block />
</div>
```
