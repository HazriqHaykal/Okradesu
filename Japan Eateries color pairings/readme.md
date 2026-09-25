# Japan Eateries — design system

A mobile food-discovery app for travelers in Japan: browse dishes by category, see recommendations near you, open a dish to find where to eat it. This system turns direction **1b "Street poster"** from `Color and Type Pairings.dc.html` into tokens, components and a UI kit.

**Sources:** one reference screenshot (`uploads/pasted-1790341427040-0.png`) showing Welcome, Home and Detail screens. No codebase, Figma or brand files were provided. There is **no logo** — the name is set in Anton wherever a mark would go.

## Index
- `styles.css` — entry point (imports only) → `tokens/fonts.css`, `colors.css`, `typography.css`, `spacing.css`, `base.css`
- `components/` — `icons/Icon`, `actions/Button`, `actions/IconButton`, `forms/SearchField`, `content/SectionHeader`, `content/CategoryTile`, `content/FoodCard`, `content/InfoStat`, `content/Badge`, `content/AvatarStack`, `navigation/BottomNav`
- `guidelines/` — foundation specimen cards (colors, type, spacing, radius, shadows, wordmark)
- `ui_kits/app/` — interactive Welcome → Home → Detail
- `ds-loader.js` — preview helper: loads `_ds_bundle.js`, or compiles `components/` from source until the bundle exists
- `SKILL.md` — Agent Skill entry
- `Color and Type Pairings.dc.html` — the exploration this came from

**Intentional additions:** `Icon` (wraps Lucide so glyphs take token colors), `Badge` (status like "Open now"; not in the reference).

## Content fundamentals
- **Voice:** warm, helpful local guide. Speaks to the user as "you"; the app is "we/us" ("Leave your Japan tastes to us", "we'll get you there").
- **Casing:** display headlines and buttons in UPPERCASE (GET STARTED, LOG IN, LET'S GO EAT). Section titles in Title Case ("Browse by Food", "Recommendation"). Links in Title Case ("See All"). Meta labels uppercase micro ("LOCAL TIME", "RESTAURANT").
- **Length:** headlines 3–6 words; body 1–2 short sentences; dish descriptions ≤ 3 sentences, concrete (ingredients, broth, how to order).
- **Food names:** Japanese romanized, no italics or macrons in UI (Udon, Oden, Yakitori). Prices in yen with a thousands comma (¥1,200); ranges with an en dash (¥800–1,200).
- **No emoji.** Personality comes from food renders and the display face.

## Visual foundations
- **Color:** one accent, orange `#F29A1E`, on a cream ground `#FFF7EC` with warm ink `#1E1A16`. Orange is used as **fill** (primary buttons, active tab, rating stars) — labels on orange are always ink, never white (white fails contrast). Small orange text uses `--orange-700` `#A85E00`.
- **Backgrounds:** every screen uses `--gradient-hero` (peach at top → cream by 38%). No other gradients, no patterns, no full-bleed photos. Imagery is glossy 3D food renders on transparent backgrounds, floating over the gradient.
- **Type:** Anton (condensed, uppercase, +0.02em) for screen titles and onboarding headlines only. Manrope for everything else — 800 for headings and dish names, 600 for captions/links, 400 for body. Figures tabular for times, prices, ratings.
- **Cards:** white, radius 18, 8px inner padding, image well tinted `--orange-150` radius 14, no border, shadow `--shadow-card`. Tiles: white, radius 14, `--shadow-tile`.
- **Corners:** generous — 10/14/18/22, pills for buttons, search, badges and the tab bar; 40 for the device.
- **Shadows:** soft and low (≤ 8% opacity ink). The orange `--shadow-glow` marks the search field and primary buttons. No inner shadows.
- **Borders:** rare. Secondary button 1.5px ink outline; `--border-subtle` hairlines only to separate the facts row on Detail.
- **Layout:** 24px gutters, 12px grid gaps, 24px between sections. Two-column card grid. The tab bar floats 24px from the sides and 22px from the bottom; content scrolls beneath it.
- **Hover/press:** primary lightens to `--orange-400` on hover, darkens to `--orange-600` and scales to 0.97 on press. Outline/ghost tint to `--orange-100`. Cards lift 2px with `--shadow-float`.
- **Motion:** quick and soft — 120ms for color/press, 200ms for lift and tab expansion, `cubic-bezier(.2,.8,.2,1)`. No bounces, no page-level animation.
- **Transparency/blur:** none in UI chrome. Selected state = 2px orange ring + glow.

## Iconography
- **Lucide** (CDN, `lucide-static@0.460.0`), 2px stroke, rendered through `Icon` as a CSS mask so it inherits `currentColor` or any token.
- Set in use: search, map-pin, clock, bell, heart, star, house, bookmark, receipt, user, chevron-left, sliders-horizontal, utensils, arrow-right.
- Sizes: 12–14 inline meta, 16–18 in buttons/nav, ~20 inside 40px icon buttons.
- No icon font, no emoji, no unicode glyphs as icons. The reference's icon set is unknown; Lucide is a substitute.

## Fonts
Anton and Manrope load from Google Fonts. The reference headline uses a wider geometric display face; Anton was chosen in the exploration as the substitute. Swap in licensed files via `tokens/fonts.css` if you have them.
