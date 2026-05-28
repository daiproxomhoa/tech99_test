# Currency Swap

Token-swap UI — **Vite + React 18 + TypeScript + Tailwind**.

![tests](https://img.shields.io/badge/tests-160%20passing-success)
![embed](https://img.shields.io/badge/embed-174KB%20gzipped-blue)

## Run

```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # tsc + production bundle
npm test             # 160 tests
npm run coverage     # v8 coverage
npm run build:embed  # dist/embed/swap.iife.js — Web Component bundle
```

## Features

- Live prices from `interview.switcheo.com/prices.json` (deduped, freshest wins, bad entries dropped)
- Virtualized token picker, debounced quote, fee / slippage / min-received
- Mock submit → toast → history (last 20, localStorage)
- Form via **react-hook-form**, validation via **zod**
- i18n (en / vi) via **react-intl**, locale auto-detect + persist
- Light / dark theme, follows `prefers-color-scheme`
- A11y: focus trap, restore-focus, `aria-invalid`, keyboard close, role=alert
- MSW-backed integration tests + E2E tests driving `<App />`

## Layout

```
src/
  lib/         pure logic (tokens, swap math, format, storage, sparkline, cn, widgetMode)
  hooks/       usePrices, useSettings, useHistory, useMockSwap, useTheme, ...
  components/  SwapCard, TokenPicker, Settings, History, ui/{Dialog, Button, Skeleton}
  schemas/     zod swap schema
  i18n/        messages, LocaleProvider, compiled catalogs
  test/        MSW handlers + setup
  __tests__/   App.e2e.test.tsx
  embed.tsx    <swap-widget> custom element entry
```

Rule: anything that can be pure goes in `lib/` and is unit-tested in isolation. Hooks + components stay thin.

## Embed as a Web Component

Drop into any page with one script tag. Shadow DOM isolates styles both ways.

```bash
npm run build:embed   # → dist/embed/swap.iife.js (~174 KB gzipped)
```

```html
<script src="https://your-cdn/swap.iife.js"></script>
<swap-widget></swap-widget>
<swap-widget theme="dark"></swap-widget>
```

### Attributes

| Attr | Values | Default |
| --- | --- | --- |
| `theme` | `auto` \| `dark` \| `light` | `auto` (follows `prefers-color-scheme` live) |

Locale auto-detected from `navigator.language`.

### Host CSS

Layout works directly (`width`, `margin`, `border-radius`, `box-shadow`, …).

Theme tokens are exposed as CSS variables (HSL triplets, no `hsl()` wrapper). Every light token has a `-dark` counterpart:

```
--swap-bg          --swap-bg-dark
--swap-surface     --swap-surface-dark
--swap-surface-2   --swap-surface-2-dark
--swap-border      --swap-border-dark
--swap-fg          --swap-fg-dark
--swap-muted       --swap-muted-dark
--swap-accent      --swap-accent-dark
--swap-accent-fg   --swap-accent-fg-dark
--swap-danger      --swap-danger-dark
--swap-success     --swap-success-dark
```

Plus `--swap-radius`, `--swap-min-height`, `--swap-font-family`.

```css
swap-widget {
  --swap-accent: 14 90% 55%;
  --swap-bg: 30 30% 97%;
  --swap-radius: 20px;
  max-width: 440px;
}
```

### Embed-mode UX

- Page header + footer hidden (language / theme toggles live inside Settings)
- Settings is a screen swap, not a Dialog (back arrow returns)
- TokenPicker stays a Dialog (portaled inside the shadow root)

### Wiring

- `src/embed.tsx` — custom element, shadow root, injects compiled Tailwind CSS + Google Fonts link
- `src/lib/widgetMode.ts` — `WidgetMode` context (`'page' | 'embed'`); `App` / `SwapCard` / `Settings` branch on it
- `vite.config.embed.ts` — IIFE library build, CSS inlined, everything bundled

Demo: open `embed-demo.html` after running `npm run build:embed`.

## Out of scope

- Wallet connect / on-chain submission
- Decimal-safe arithmetic (`decimal.js`)
- Playwright (integration + E2E tests already drive the real DOM)
