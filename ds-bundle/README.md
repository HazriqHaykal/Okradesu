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

# Okradesu (@okradesu/ui@1.0.0)

This design system is the published @okradesu/ui React library, bundled as a single
browser global. All 23 components are the real upstream code.

## Where things are

- `_ds_bundle.js` — the whole-DS bundle at the project root; loads every component to `window.Okradesu`. First line is a `/* @ds-bundle: … */` metadata header.
- `styles.css` — the single stylesheet entry: it `@import`s the tokens, fonts, and component styles (`_ds_bundle.css`). Link this one file.
- `components/<group>/<Name>/<Name>.prompt.md` (example JSX + variants), `<Name>.d.ts` (types), `<Name>.html` (variant grid).
- `tokens/*.css` — CSS custom properties, names verbatim from upstream.
- `fonts/` — `@font-face` files + `fonts.css` (when the package ships fonts).

For a specific component, `read_file("components/<group>/<Name>/<Name>.prompt.md")`.

## Loading

Add these two lines to your page once (React must be on the page first):

```html
<link rel="stylesheet" href="styles.css">
<script src="_ds_bundle.js"></script>
```

Components are then available at `window.Okradesu.*`. Mount into a dedicated child node (e.g. `<div id="ds-root">`), not the host page's own React root, so the two trees don't collide:

```jsx
const { Badge } = window.Okradesu;
ReactDOM.createRoot(document.getElementById('ds-root')).render(<Badge />);
```

## Tokens

85 CSS custom properties from @okradesu/ui. Names are
preserved verbatim from upstream. They are declared inside `_ds_bundle.css` (this DS ships one compiled stylesheet rather than separate token files).

- **color** (20): `--bg-app`, `--surface-card`, `--surface-tint`, …
- **spacing** (9): `--space-1`, `--space-2`, `--space-3`, …
- **typography** (9): `--font-display`, `--font-body`, `--weight-regular`, …
- **radius** (6): `--radius-sm`, `--radius-md`, `--radius-lg`, …
- **shadow** (4): `--shadow-card`, `--shadow-tile`, `--shadow-float`, …
- **other** (37): `--orange-50`, `--orange-100`, `--orange-150`, …

## Components

### general
- `Badge` — Small uppercase status pill. Tones: accent (orange), neutral, success (green), solid (orange fill), danger (red).
- `Button` — Pill button with an uppercase label. Labels on orange stay ink.
- `Card` — White card, radius 18, soft shadow, no border.
- `Divider` — Hairline separator in the subtle border colour, for lists inside a Card.
- `IconButton` — Round icon-only button (44 px by default). surface is white accent is orange for the one primary action. Always pass label for screen reader
- `IconWell` — Tinted square that holds an icon, like the category tiles' image well.
- `InfoStat` — Uppercase meta label over a bold value (Detail facts row).
- `Meter` — Horizontal fill bar (risk meters).
- `RenderPlaceholder` — Striped stand-in for a photo or 3D render (the system's image placeholder).
- `ScreenTitle` — Small uppercase label above a screen title, with the Anton title below.
- `SearchField` — White field with the orange glow ring turns solid on focus.
- `SectionHeader` — Section title in Manrope 800 with an optional small orange action link on the right (e.g. See All).
- `Toggle` — Orange-filled switch the platform Switch ignores thumb colors on web.
- `Txt` — Anton for screen titles only Manrope for everything else.

### harvest
- `ForecastChart` — Stacked daily bars: sold ahead (green) under not-yet-matched (orange 300).
- `HarvestGrid` — The daily harvest map: one line per farm, one square per growing row.
- `LegendSwatch` — Small coloured square plus a label, for chart and map legends.
- `MaturityBadge` — Badge for a pod's maturity from the camera or phone check: Ready (orange), Overgrown (red) or Too small (neutral).
- `UpcomingChart` — Bars from the flower countdown: flowers seen today become the coming days' pods.

### illustrations
- `OkraFlower` — Flat okra flower illustration: pale yellow petals with a maroon centre.
- `OkraPod` — Flat okra pod illustration tone is fresh, small or overgrown.
- `RowSnapshot` — Illustrated camera frame of one row with the Edge AI's boxes on it:

### monitor
- `TodayPlan` — Today's to-do card: a progress bar plus tickable tasks, each with an icon and a tap target that opens its farm.
