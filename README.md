# fit-flush

[![npm](https://img.shields.io/npm/v/%40overpunch%2Ffit-flush.svg)](https://www.npmjs.com/package/@overpunch/fit-flush) [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT) [![part of liiift type-tools](https://img.shields.io/badge/liiift-type--tools-blueviolet)](https://github.com/over-punch/type-tools)

**Fit text to its container.** Binary-search sizing with variable-font axis safety, for when neither `clamp()` nor container-query units will do the job.

[Live demo](https://fit-flush.com) · [npm](https://www.npmjs.com/package/@overpunch/fit-flush) · [GitHub](https://github.com/over-punch/fitFlush)

TypeScript · Zero runtime dependencies · 2.9 kB gzipped · React, vanilla JS, [Webflow and Framer](#webflow-framer-and-a-plain-script-tag)

![Animation: a dashed container narrows from 860 px to 400 px and widens again; the headline inside is re-fitted on every frame so it always spans the container, with the container width and font-size printed below. The box has 22 px of padding on each side and the headline is set at weight 800.](https://raw.githubusercontent.com/over-punch/fitFlush/main/assets/resize.gif?v=1)

**Use it when** a headline must be as large as possible inside a box of unknown size — a hero, a card title, a poster, an editorial layout — and CSS alone can't guarantee it fits. **Skip it if** plain `clamp()` or `cqw` units already look fine; this is for the cases they can't reach.

---

## The problem

CSS has no way to say *"size this text exactly as large as possible without overflowing its container."*

- `clamp()` is viewport-linear, not container-aware.
- Container-query units (`cqw`, `cqh`) give coarse scaling, not precise text-fit: `font-size: 12cqw` follows the container, but the factor that makes one headline flush is wrong for a longer or shorter one, so it has to be tuned by hand per string and per font.
- Neither is aware of **variable-font axis travel** — with a variable font you can animate an axis like weight (`wght`) from light to heavy, and heavier glyphs are wider, so text that fits at `wght 300` can overflow once it animates to `wght 900`.

`fit-flush` solves all three: it measures the text off-screen, searches for the largest font-size that fits width and/or height, and — if you pass `vfSettings` — holds every axis at its max during measurement so the fit survives future axis animation.

![A fixed 96px headline clipped mid-word in a narrow box, beside the same text fitted exactly to width by fit-flush.](https://raw.githubusercontent.com/over-punch/fitFlush/main/assets/beforeafter.png?v=2)

---

## Install

```bash
npm install @overpunch/fit-flush
```

No build step? See [Webflow, Framer and a plain script tag](#webflow-framer-and-a-plain-script-tag).

---

## Usage

> **Next.js App Router:** add `"use client"` at the top of any file using the hook or component — fit-flush touches `window` and `ResizeObserver`.

> **Import paths:** vanilla functions (`fitFlush`, `fitFlushLive`) come from the package root; the React layer (`useFitFlush`, `FitFlushText`) lives on the `@overpunch/fit-flush/react` subpath, so vanilla-JS bundles stay free of any React import.

> **Give the container a size.** The text is fitted to its container (the parent element, unless you pass `container`). `mode: 'width'` only needs a width. `'both'` (the default) and `'height'` need a container with a height of its own — a fixed height, a grid or flex track, `60vh`. In a container whose height just follows its content there is nothing to fill: the text keeps the size it has, or, if it has siblings in that container, grows refit by refit (see [Idempotence](#idempotence)).

### React component

```tsx
"use client"
import { FitFlushText } from "@overpunch/fit-flush/react"

export default function Hero() {
	return (
		<section style={{ width: "100%", height: "60vh" }}>
			<FitFlushText as="h1" mode="both" max={320} style={{ margin: 0 }}>
				Headline
			</FitFlushText>
		</section>
	)
}
```

`<FitFlushText>` accepts every [option](#options) as a prop, plus `as` (the rendered element — default `span`), `className`, `style`, and any ARIA / `data-*` / event-handler attribute, all forwarded to the DOM node. It forwards `ref` to that node. `children` can include inline markup (`<em>`, `<strong>`, `<br>`): the element is measured as a clone of itself, markup included, and its children are never rewritten. `style={{ margin: 0 }}` is there because margins on the fitted element aren't counted (see [Cost and limits](#cost-and-limits)).

### React hook

```tsx
"use client"
import { useFitFlush } from "@overpunch/fit-flush/react"

// Inside a React component:
export function Title() {
	const { ref } = useFitFlush<HTMLHeadingElement>({ mode: "width" })
	return <h1 ref={ref}>Resizing headline</h1>
}
```

The hook returns `{ ref, size }` — attach `ref` to the element and read `size` for the last computed font-size in px (0 before first measurement). The hook re-runs on container resize (ResizeObserver, width + height dedup) and after web fonts load (`document.fonts.ready`). It also re-runs when the text changes (a CMS headline, a counter) and when an option changes. It cleans up on unmount.

**Server rendering and the first paint.** Nothing is measured on the server, so server-rendered HTML arrives at whatever font-size your CSS gives the element, and the fitted size is written when the component mounts in the browser (in a layout effect, before that frame is painted). To avoid a visible jump between the two, give the element a CSS font-size close to the expected result (a `clamp()` is fine; fit-flush overrides it inline), or, with the hook, keep it `visibility: hidden` until `size` is above 0 (`size` stays 0 while the text is empty).

**A different container.** `container` takes an element, so in React keep it in state:

```tsx
"use client"
import { useState } from "react"
import { FitFlushText } from "@overpunch/fit-flush/react"

export function Card() {
	const [card, setCard] = useState<HTMLElement | null>(null)
	return (
		<article ref={setCard} style={{ height: 240 }}>
			<header>
				<FitFlushText as="h2" container={card} style={{ margin: 0 }}>Card title</FitFlushText>
			</header>
		</article>
	)
}
```

### Vanilla JS — one-shot

```ts
import { fitFlush } from "@overpunch/fit-flush"

const target = document.querySelector<HTMLElement>("h1")!
const size = fitFlush(target, { mode: "both", max: 240 })
```

### Vanilla JS — live handle

```ts
import { fitFlushLive } from "@overpunch/fit-flush"

const target = document.querySelector<HTMLElement>("h1")!
const handle = fitFlushLive(target, { mode: "both", max: 240 })

// Later — clean up:
// handle.dispose()
```

`fitFlushLive` attaches a `ResizeObserver` to the container, re-fits when the target's text changes, and re-fits as web fonts load. Call `handle.refit()` to re-run manually, read `handle.size` for the last computed size, and `handle.dispose()` to stop observing and restore the target's original inline styles. A second `fitFlushLive` on the same element replaces the first. To undo a one-shot `fitFlush`, call `removeFitFlush(target)`.

### Variable-font worst-case safety

If you animate variable-font axes elsewhere on the page, pass the full axis ranges so fit-flush measures at the worst case:

```ts
fitFlush(target, {
	mode: "width",
	vfSettings: {
		wght: { max: 900 },
		wdth: { max: 125 },
	},
})
```

The max isn't always the widest end. An optical-size axis is widest at its *minimum*: give `min` too (`opsz: { min: 8, max: 144 }`) and the size must fit at all the maxes and at all the given mins. Axis keys must be four-character tags (`wght`, not `weight`); an invalid entry is ignored with a console warning rather than invalidating every axis.

Two combinations are measured, not every one: all listed axes at their `max`, and (when any `min` is given) all listed axes at their `min`, with an axis that has no `min` held at its `max`. That covers axes that each get wider towards one end. It doesn't cover a font where some in-between value is the widest.

Below, the same headline is fitted twice. On the left, without `vfSettings`, it is fitted at the weight it has (`wght 300`) and overflows when the weight animates to `900`. On the right, with `vfSettings: { wght: { max: 900 } }`, it is fitted at `900`: slightly smaller at rest, and it still fits when the weight animates.

![Two panels. Left, without vfSettings: the headline fills its box at weight 300, and at weight 900 it is 27 px too wide and clipped. Right, with vfSettings: the headline has 27 px to spare at weight 300 and fits with 1 px to spare at weight 900.](https://raw.githubusercontent.com/over-punch/fitFlush/main/assets/vfsafety.png?v=2)

The picture is a two-word headline in a narrow box. The same comparison on a longer line, "Display Headlines" in an 860 px container (`npm run capture`, headless Chromium):

| Font | Fitted at `wght 300`, then animated to `900` | Fitted with `vfSettings: { wght: { max: 900 } }` |
|---|---|---|
| Merriweather (variable, `wght` 300–900) | 102.2 px; 61 px (7.1%) too wide at `900` | 95.2 px (6.8% smaller); fits at `900` with 2 px to spare |
| Inter (variable, `wght` 100–900) | 103.5 px; 72 px (8.4%) too wide at `900` | 95.2 px (8.0% smaller); fits at `900` with 3 px to spare |

Without `vfSettings`, fit-flush measures the text with the axis values it has at that moment. Changing an axis afterwards doesn't trigger a refit (only container size, text and font loading do), which is why an animated axis needs the worst case up front.

### Webflow, Framer and a plain script tag

**Webflow, or any page without a bundler.** Add one script (in Webflow: Site Settings → Custom Code → Footer, or an Embed element), then put `data-fitflush` on the text element (in the Webflow Designer: select the element, open its Settings panel and add `data-fitflush` under Custom attributes, with the options below as further attributes):

```html
<script src="https://cdn.jsdelivr.net/npm/@overpunch/fit-flush/dist/fitflush.webflow.min.js"></script>

<div style="height: 240px">
	<h1 data-fitflush data-ff-mode="both" data-ff-max="320" data-ff-vf="wght:900" style="margin: 0">Your headline</h1>
</div>
```

The script (9.3 kB, 3.8 kB gzipped) waits for web fonts, fits every `[data-fitflush]` element, keeps each one fitted as its container resizes, and picks up elements added later (CMS lists, interactions). Until fonts have loaded the text shows at its CSS size. Options are read from attributes:

| Attribute | Same as | Example |
|---|---|---|
| `data-ff-mode` | `mode` | `width`, `height` or `both` |
| `data-ff-min`, `data-ff-max` | `min`, `max` | `data-ff-max="320"` |
| `data-ff-precision` | `precision` | `0.25` |
| `data-ff-padding`, `data-ff-padding-x`, `data-ff-padding-y` | `padding` | `data-ff-padding-x="24"` |
| `data-ff-vf` | `vfSettings` (max values only) | `wght:900,wdth:125` |
| `data-ff-container` | `container` | A CSS selector; the nearest matching ancestor is used |

`window.FitFlush.init()`, `.refit(el?)` and `.destroy(el)` are there for manual control.

**Framer.** Insert → Code → New Component, then paste [`src/framer/FitFlush.tsx`](https://github.com/over-punch/fitFlush/blob/main/src/framer/FitFlush.tsx). It loads the core from esm.sh and shows the options in the property panel (text, font, fit mode, min and max size, padding, and max `wght` / `wdth` for axis safety). Height and Both need a frame with a fixed height.

**ES module, no install.** The same functions load straight from a CDN:

```html
<script type="module">
	import { fitFlushLive } from "https://esm.sh/@overpunch/fit-flush"
	fitFlushLive(document.querySelector("h1"), { mode: "width" })
</script>
```

### TypeScript

```ts
import { fitFlush, type FitFlushOptions } from "@overpunch/fit-flush"

const options: FitFlushOptions = { mode: "both", min: 12, max: 320, precision: 0.25 }
const size: number = fitFlush(document.querySelector<HTMLElement>("h1")!, options)
```

---

## Options

| Option | Type | Default | Description |
|---|---|---|---|
| `mode` | `'width' \| 'height' \| 'both'` | `'both'` | Which container dimension(s) to fit. `'width'` puts the text on one line and fills the width (a shortcut replaces most of the search, see [How it works](#how-it-works)). `'height'` lets the text wrap and fills the height. `'both'` takes the stricter of the two. |
| `min` | `number` | `8` | Minimum font-size in px. |
| `max` | `number` | `400` | Maximum font-size in px. |
| `precision` | `number` | `0.5` | Binary-search convergence precision in px. |
| `padding` | `number \| { x?, y? }` | `0` | Inset from container edges in px. A single number insets both axes. |
| `vfSettings` | `Record<string, { max: number; min?: number }>` | — | Variable-font axis ranges. When present, measurement runs at every axis' `max` (and, where given, every `min`) for worst-case safety. |
| `container` | `HTMLElement \| null` | `target.parentElement` | Override the container used for measurement. |
| `onFit` | `(size: number) => void` | — | Callback fired after each fit that wrote a size, receiving the resolved font-size in px. Not called when nothing was fitted (empty text, no container, no room left after padding). |

---

## How it works

1. **Snapshot container** — reads the container's content box (padding and border excluded, in layout px, so a transformed or zoomed parent works) and subtracts the `padding` option.
2. **Clone probe** — places a hidden, `aria-hidden` clone of the target right after it, absolutely positioned so it takes no space. The clone renders exactly as the target does: nested markup and `<br>`, letter- and word-spacing in their own units, `font-size-adjust`, small caps, hyphenation and `overflow-wrap`, and the target's own padding and `text-indent`.
3. **Apply VF axes** — if `vfSettings` is present, the clone is measured with every listed axis at its max (and at its min, where given).
4. **Search for size**
   - `mode: 'width'` uses an **analytical fast path**: measure at 100 px, predict the size linearly, then verify and correct (width isn't exactly linear in size: hinting, and optical-size axes that follow the size). Usually 3–12 measurements; 3 in every run of the table under [Cost and limits](#cost-and-limits). With `vfSettings`, width mode uses the binary search instead.
   - `mode: 'height'` and `'both'` use **binary search**: ~10 iterations to converge over `[8, 400]` at `0.5 px` precision, plus the checks at each end (12 measurements in the same table). `'both'` also rejects any size where something overflows sideways (a long word, a `nowrap` line).
5. **Write** — sets `target.style.fontSize` to the computed size, rounded *down* to 0.1 px so it never exceeds the fit, and removes the clone. Width mode also sets `white-space: nowrap` (or `pre`, when your own `white-space` is `pre`, `pre-wrap` or `break-spaces`, so line breaks you typed are kept and the widest line is the one fitted; the published 1.1.0 writes `nowrap` here and such text overflows, which is fixed in this repository for the next release); the other modes leave your `white-space` alone. The size is also written to a `--ff-size` custom property on the target, for use in your own CSS. A console warning says when the text doesn't fit even at `min`.
6. **Restore scroll** — saves `window.scrollY` before mutation and restores via `requestAnimationFrame` (iOS Safari does not honour `overflow-anchor: none`, so height mutations can trigger scroll jumps).

### Line break safety

For `mode: 'height'` and `'both'`, the probe is measured at the container's inner width with the target's own `white-space`. Line breaks are whatever the browser produces at the fitted size — the tool never rewrites word breaks or injects spans into your live DOM.

### SSR

`fitFlush` and `fitFlushLive` are SSR-safe. On the server, `fitFlush` returns `0` and `fitFlushLive` returns a no-op handle. The ESM build loads natively in Node and browsers (no bundler needed).

### Idempotence

Repeated calls give the same size. In `'both'` or `'height'` mode inside a container whose height follows its content, the current size is kept as a floor, so the text doesn't shrink a step on every call; such a container gives no room to grow either, so give it a height if you want the text to fill it.

That holds when the text is the container's only content. With a sibling in the same content-height container (a subtitle under the headline), the container's height includes the sibling, every fit finds that much room to spare, and the text grows on each refit until the width stops it: 24 px, then 45.6, 67.4, 89.1, 110.6, 132.3, 140.1 and 140.3 px over eight calls in the capture run. Give the headline a wrapper with a height of its own, or use `mode: 'width'`.

### `prefers-reduced-motion`

fit-flush is a one-shot size — no animation, nothing to honour. A future animated-transition mode will gate on `prefers-reduced-motion`.

### Cost and limits

Every measurement sets a font-size on the hidden clone and reads its box, which makes the browser lay the clone out. Counted per fit with `npm run capture` (headless Chromium, Merriweather, seven container widths from 240 to 1280 px; one line for width mode, a 95-character sentence in a 300 px tall box for the others):

| Mode | Measurements per fit |
|---|---|
| `'width'` | 3 |
| `'width'` with `vfSettings` (max only) | 12 |
| `'height'` | 12 |
| `'both'` | 12 |
| `'both'` with `vfSettings` (max only) | 12 |
| `'both'` with `vfSettings` (min and max) | 15–18 |

Across three such runs no `fitFlush` call took longer than 1.5 ms (105 timed calls per mode and run; the timer resolves 0.1 ms; the laptop was under heavy load). That is the call itself, on a nearly empty page and short text. It leaves out the layout and paint the browser does afterwards for the new size, and long text costs more per measurement, since the whole clone is laid out each time. Only headless Chromium was measured.

- **On resize** the live handle and the hook refit at most once per animation frame, and only when the container's rounded width or height actually changed. Each refit is a full fit as above; nothing is cached between fits.
- **How flush is flush.** The size is rounded down to 0.1 px. In the same run a width-mode fit left between 0.05 and 0.7 px of the container's width unused.
- **Margins on the fitted element aren't counted.** The box that is fitted is the element's own, without its margins. An `<h1>` with the browser's default margins, fitted with `mode: 'both'` into a 160 px tall container that has a border, ended up 97 px past the bottom of the container (its top margin, 0.67em, pushed it down). With `margin: 0` on the `<h1>` it fits. In a container with no border or padding the top margin collapses through the container and the text also fits, but don't rely on that: set `margin: 0`.
- **What it leaves in the DOM.** While measuring, a hidden clone of the target (class `ff-probe`, attribute `data-ff-probe`, `aria-hidden`) sits right after it and is removed before the call returns. `:last-child` or `:nth-child` rules can match differently on the clone during measurement, and a `MutationObserver` on the parent will see it come and go. On the target, the inline `font-size`, `--ff-size` and (in width mode) `white-space` are written; `removeFitFlush` and `dispose()` restore what was there.
- **Ink can still cross the edge.** The fit uses layout boxes. Glyphs that draw outside their advance width (a swash, an italic overhang) aren't measured.

### Requirements

Browser APIs: `ResizeObserver`, `document.fonts.ready`, and `getBoundingClientRect` — available in all evergreen browsers. No polyfills are bundled. React is an **optional** peer dependency (`>=17`); the vanilla functions need no React at all. The package ships ESM only, with zero runtime dependencies and `"sideEffects": false` for clean tree-shaking. The core (`fitFlush`, `fitFlushLive`, `removeFitFlush`) is 6.6 kB minified and 2.9 kB gzipped; the React entry including the core is 7.7 kB and 3.4 kB (esbuild `--bundle --minify`, then `gzip -9`, React itself excluded). For the exact install footprint see [Bundlephobia](https://bundlephobia.com/package/@overpunch/fit-flush).

---

## Future improvements

- Animated transitions between target sizes on resize (gated by `prefers-reduced-motion`)
- `shared` option — fit a group of elements to a common size for headline grids
- Measurement caching — skip re-measurement when text, container size, and options are unchanged

---

## Development

```bash
npm install
npm test          # Jest + happy-dom, 69 tests
npm run build     # tsc → dist/
npm run capture   # after a build: regenerates assets/ and prints the measurements quoted above (needs `cd site && npm install` once, and ffmpeg for the GIF)
```

Issues and pull requests: [github.com/over-punch/fitFlush](https://github.com/over-punch/fitFlush/issues).

---

## License

MIT © [Liiift Studio](https://overpunch.ca). Part of the [type-tools](https://github.com/over-punch/type-tools) suite.

<details>
<summary><strong>Maintainer note — <code>next</code> in devDependencies</strong></summary>

The root `package.json` lists `next` in `devDependencies`. This is intentional — Vercel inspects the root `package.json` to detect the framework for the `site/` subdirectory deploy. Removing `next` causes Vercel to fall back to a static build and skip the Next.js pipeline.
</details>
