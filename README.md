V1.1
# fit-flush

[![npm](https://img.shields.io/npm/v/%40liiift-studio%2Ffit-flush.svg)](https://www.npmjs.com/package/@liiift-studio/fit-flush) [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT) [![part of liiift type-tools](https://img.shields.io/badge/liiift-type--tools-blueviolet)](https://github.com/Liiift-Studio/type-tools)

**Fit text to its container.** Binary-search sizing with variable-font axis safety, for the rare case neither `clamp()` nor container-query units will do the job.

[Site](https://fit-flush.com) · [npm](https://www.npmjs.com/package/@liiift-studio/fit-flush) · [GitHub](https://github.com/Liiift-Studio/fitFlush)

TypeScript · Zero runtime dependencies · React + Vanilla JS

---

## The problem

CSS has no way to say *"size this text exactly as large as possible without overflowing its container."*

- `clamp()` is viewport-linear, not container-aware.
- Container-query units (`cqw`, `cqh`) give coarse scaling, not precise text-fit.
- Neither is aware of **variable-font axis travel** — text that fits today will overflow tomorrow when an axis animates to its max.

`fit-flush` solves all three: it measures the text off-screen, searches for the largest font-size that fits width and/or height, and — if you pass `vfSettings` — holds every axis at its max during measurement so the fit survives future axis animation.

---

## Install

```bash
npm install @liiift-studio/fit-flush
```

---

## Usage

> **Next.js App Router:** add `"use client"` at the top of any file using the hook or component — fit-flush touches `window` and `ResizeObserver`.

### React component

```tsx
"use client"
import { FitFlushText } from "@liiift-studio/fit-flush"

export default function Hero() {
	return (
		<section style={{ width: "100%", height: "60vh" }}>
			<FitFlushText as="h1" mode="both" max={320}>
				Headline
			</FitFlushText>
		</section>
	)
}
```

### React hook

```tsx
"use client"
import { useFitFlush } from "@liiift-studio/fit-flush"

// Inside a React component:
export function Title() {
	const ref = useFitFlush<HTMLHeadingElement>({ mode: "width" })
	return <h1 ref={ref}>Resizing headline</h1>
}
```

The hook re-runs on container resize (ResizeObserver, width-only dedup) and after web fonts load (`document.fonts.ready`). It cleans up on unmount.

### Vanilla JS — one-shot

```ts
import { fitFlush } from "@liiift-studio/fit-flush"

const target = document.querySelector<HTMLElement>("h1")!
const size = fitFlush(target, { mode: "both", max: 240 })
```

### Vanilla JS — live handle

```ts
import { fitFlushLive } from "@liiift-studio/fit-flush"

const target = document.querySelector<HTMLElement>("h1")!
const handle = fitFlushLive(target, { mode: "both", max: 240 })

// Later — clean up:
// handle.dispose()
```

`fitFlushLive` attaches a `ResizeObserver` to the container and re-fits after `document.fonts.ready`. Call `handle.refit()` to re-run manually after changing the text, and `handle.dispose()` to stop observing and restore the original `fontSize`.

### Variable-font worst-case safety

If you animate variable-font axes elsewhere on the page, pass the full axis ranges so fit-flush measures at the worst case:

```ts
fitFlush(target, {
	mode: "width",
	vfSettings: {
		wght: { min: 100, default: 400, max: 900 },
		wdth: { min: 75,  default: 100, max: 125 },
	},
})
```

### TypeScript

```ts
import { fitFlush, type FitFlushOptions } from "@liiift-studio/fit-flush"

const options: FitFlushOptions = { mode: "both", min: 12, max: 320, precision: 0.25 }
const size: number = fitFlush(document.querySelector<HTMLElement>("h1")!, options)
```

---

## Options

| Option | Type | Default | Description |
|---|---|---|---|
| `mode` | `'width' \| 'height' \| 'both'` | `'both'` | Which container dimension(s) to fit. `'width'` uses an analytical fast path (no-wrap single line). `'height'` reflows normally. `'both'` takes the stricter of the two. |
| `min` | `number` | `8` | Minimum font-size in px. |
| `max` | `number` | `400` | Maximum font-size in px. |
| `precision` | `number` | `0.5` | Binary-search convergence precision in px. |
| `padding` | `number \| { x?, y? }` | `0` | Inset from container edges in px. A single number insets both axes. |
| `vfSettings` | `Record<string, { max: number }>` | — | Variable-font axis ranges. When present, measurement runs at every axis' `max` for worst-case safety. |
| `container` | `HTMLElement` | `target.parentElement` | Override the container used for measurement. |

---

## How it works

1. **Snapshot container** — reads container dimensions in a single batch, subtracts `padding`.
2. **Clone probe** — creates a `position: fixed; left: -99999px; visibility: hidden` measurement span, style-copied from the target via `getComputedStyle`. The probe is `aria-hidden` and appended to `document.body` — never injected into the target's subtree, so there is zero visible layout disruption during measurement.
3. **Apply max VF axis** — if `vfSettings` is present, the probe's `font-variation-settings` is set to the maximum of every axis before the search begins.
4. **Search for size**
   - `mode: 'width'` uses an **analytical fast path**: measure at 100 px, linearly predict the target size, verify in one write. Typically one or two measurements.
   - `mode: 'height'` and `'both'` use **binary search**: ~10 iterations to converge over `[8, 400]` at `0.5 px` precision.
5. **Write** — sets `target.style.fontSize` to the computed size and removes the probe.
6. **Restore scroll** — saves `window.scrollY` before mutation and restores via `requestAnimationFrame` (iOS Safari does not honour `overflow-anchor: none`, so heightmutations can trigger scroll jumps).

### Line break safety

For `mode: 'height'` and `'both'`, the probe is measured with the same inner width and `white-space: normal` as the target. Line breaks are whatever the browser produces at the fitted size — the tool never rewrites word breaks or injects spans into your live DOM.

### SSR

`fitFlush` and `fitFlushLive` are SSR-safe. On the server, `fitFlush` returns `0` and `fitFlushLive` returns a no-op handle.

### `prefers-reduced-motion`

fit-flush v0.0.1 is a one-shot size — no animation, nothing to honour. A future animated-transition mode will gate on `prefers-reduced-motion`.

---

## Dev note — `next` in devDependencies

The root `package.json` lists `next` in `devDependencies`. This is intentional — Vercel inspects the root `package.json` to detect the framework for the `site/` subdirectory deploy. Removing `next` causes Vercel to fall back to a static build and skip the Next.js pipeline.

---

## Future improvements

- Animated transitions between target sizes on resize (gated by `prefers-reduced-motion`)
- `shared` option — fit a group of elements to a common size for headline grids
- Rich inline HTML preservation in the probe (currently text-only)
- Measurement caching — skip re-measurement when text, container size, and options are unchanged

---

## Current version: v1.0.1
