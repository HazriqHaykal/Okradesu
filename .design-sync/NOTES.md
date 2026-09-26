# design-sync notes: Okradesu → Claude Design

Project: https://claude.ai/design/p/8135a171-cc78-4172-a3ed-b3a27e556fe6 (window.Okradesu)

## How this repo is synced
- The app is Expo / React Native, not a web component package. `node .design-sync/build-web.mjs` compiles `src/design-system/index.ts` for the web into `.design-sync/pkg/dist` (the `@okradesu/ui` mini-package the converter reads):
  - esbuild aliases `react-native` → `react-native-web` and resolves `.web.*` files first;
  - `expo-router` is swapped for `.design-sync/shims/expo-router.tsx` (inert router, `Link` renders its children);
  - `tsc -p .design-sync/tsconfig.dts.json` emits types, then the script rewrites `@/…` aliases and `expo-router` imports in the `.d.ts` to relative paths (ts-morph can't read the app's tsconfig paths) and writes a root `dist/types/index.d.ts`.
- Run the build before the converter: `--entry .design-sync/pkg/dist/index.js --node-modules ./node_modules`.
- The converter only reads `cssEntry`/`extraFonts` from inside the package dir, so `tokens.css` and `fonts.css` live in `.design-sync/pkg/`.
  - `tokens.css` is a hand-made copy of the Japan Eateries `tokens/*.css` plus the app's success/danger tints. Keep it in step with `src/constants/theme.ts`.
  - `fonts.css` maps the `@expo-google-fonts` TTFs to the exact family names the components use (`Manrope_800ExtraBold` …).
- `tokensGlob` can't be used: it only reads from an npm package (`tokensPkg`).
- Token and data exports (`Colors`, `Palette`, `Icons`, `FARMS`, …) are excluded from cards via `componentSrcMap: null` but stay in the bundle for the design agent.
- `componentSrcMap` pins every component to its source file so JSDoc and `@category` grouping apply. File names like `harvest-map.tsx` don't match the converter's name guess.
- Playwright must be **1.58.0**, which matches the cached chromium-1208 in `%LOCALAPPDATA%\ms-playwright`. Install it in `.ds-sync/`.

## Preview authoring
- Several `Txt` inside a plain `<div>` render inline. Give the div `display:flex; flex-direction:column` (this broke the Divider and Toggle previews the first time).
- Components fill their parent's width. Wrap previews in a sized div.
- The cream band under every capture cell is `base.css`'s page background, not a defect.

## Known render warns
- `[RENDER_THIN]` OkraFlower and OkraPod: "mounts have no text and paint nothing". Benign. They are SVG-only, and the check's paint test matches uppercase `SVG` tag names while HTML-namespace `<svg>` is lowercase. The screenshots show them rendering.

## Render-check gotcha (fixed in build-web.mjs)
- react-native-web injects `<style id="react-native-stylesheet">` and fills it via the CSSOM (empty innerHTML). The validator takes the first element matching `#root, [id^="r"]` as the preview root, so every card read "root empty". `build-web.mjs` renames the id to `okradesu-native-styles`. The new id must not start with "r"; `rnw-stylesheet` failed the same way.
- 11 wide components use `overrides.<Name>.cardMode: "column"` so previews aren't cropped in the grid.

## Re-sync risks
- `tokens.css` is a copy. If `theme.ts` or the Japan Eateries tokens change, update it by hand.
- Previews use the demo data (`allRows()`, `upcomingPods()`), so a change to `src/data/*` changes preview renders and their grades.
- `.design-sync/shims/expo-router.tsx` has to cover every expo-router API the exported components import. Adding a component that uses a new one (`useSegments`, …) will fail the web build until the shim grows.
- `TodayPlan` lives in the teammate's `src/components/monitor/` folder; edits there change the card.
- Toolchain assumed: TypeScript 6 (needs `rootDir` in the dts tsconfig), esbuild from `.ds-sync/node_modules`.
