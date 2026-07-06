// fitFlush/src/webflow/embed.ts — zero-config browser bundle for Webflow Custom Code Embed.
// Auto-fits any element marked with [data-fitflush] to its container, reading options from
// data-* attributes, and keeps re-fitting on resize / font load via the core's live handle.
// Exposes a small window.FitFlush API for manual control.
import { fitFlushLive } from '../core/adjust'
import type { FitFlushHandle, FitFlushOptions } from '../core/types'

/** Attribute that opts an element in to fit-flush sizing. */
const OPT_IN_ATTR = 'data-fitflush'

/** Valid fit modes for data-ff-mode. */
const VALID_MODES: readonly string[] = ['width', 'height', 'both']

/**
 * Tracks live handles keyed by their element — WeakMap so removed nodes are GC'd.
 * fitFlushLive owns its own ResizeObserver and fonts.ready re-fit, so the handle is
 * the complete teardown record: dispose() stops observing and restores the original size.
 */
const INSTANCES = new WeakMap<HTMLElement, FitFlushHandle>()

/**
 * Parse the data-ff-vf attribute into the core's vfSettings shape.
 * Format: a comma-separated list of `axis:maxValue` pairs, e.g. "wght:900,wdth:125".
 * Each pair fixes that variable-font axis at its max during measurement so the fitted
 * size stays safe under later axis animation. Malformed pairs are skipped.
 *
 * @param raw - The raw attribute string
 * @returns A vfSettings record, or undefined when nothing valid parsed
 */
function parseVfSettings(raw: string): Record<string, { max: number }> | undefined {
	const out: Record<string, { max: number }> = {}
	for (const part of raw.split(',')) {
		const [tag, valueStr] = part.split(':').map((s) => s.trim())
		if (!tag || valueStr === undefined) continue
		const n = parseFloat(valueStr)
		if (isNaN(n)) continue
		out[tag] = { max: n }
	}
	return Object.keys(out).length > 0 ? out : undefined
}

/**
 * Read fitFlush options from an element's data-* attributes.
 * Unset attributes fall through to the library defaults.
 *
 * Supported attributes:
 *   data-ff-mode       — width | height | both (default: both)
 *   data-ff-min        — minimum font-size in px (default: 8)
 *   data-ff-max        — maximum font-size in px (default: 400)
 *   data-ff-precision  — binary-search convergence precision in px (default: 0.5)
 *   data-ff-padding    — inset from container edges in px (all sides)
 *   data-ff-padding-x  — horizontal inset in px (overrides data-ff-padding on x)
 *   data-ff-padding-y  — vertical inset in px (overrides data-ff-padding on y)
 *   data-ff-vf         — variable-font max axes, e.g. "wght:900,wdth:125"
 *   data-ff-container  — CSS selector for a container override (default: parent element)
 *
 * @param el - The opted-in element
 */
function readOptions(el: HTMLElement): FitFlushOptions {
	const d = el.dataset
	const opts: FitFlushOptions = {}

	if (d.ffMode && VALID_MODES.includes(d.ffMode)) {
		opts.mode = d.ffMode as FitFlushOptions['mode']
	}
	if (d.ffMin !== undefined) { const n = parseFloat(d.ffMin); if (!isNaN(n)) opts.min = n }
	if (d.ffMax !== undefined) { const n = parseFloat(d.ffMax); if (!isNaN(n)) opts.max = n }
	if (d.ffPrecision !== undefined) { const n = parseFloat(d.ffPrecision); if (!isNaN(n)) opts.precision = n }

	// Padding: a single all-sides value, optionally refined per-axis.
	let padX: number | undefined
	let padY: number | undefined
	if (d.ffPadding !== undefined) {
		const n = parseFloat(d.ffPadding)
		if (!isNaN(n)) { padX = n; padY = n }
	}
	if (d.ffPaddingX !== undefined) { const n = parseFloat(d.ffPaddingX); if (!isNaN(n)) padX = n }
	if (d.ffPaddingY !== undefined) { const n = parseFloat(d.ffPaddingY); if (!isNaN(n)) padY = n }
	if (padX !== undefined || padY !== undefined) {
		opts.padding = { x: padX ?? 0, y: padY ?? 0 }
	}

	if (d.ffVf) {
		const vf = parseVfSettings(d.ffVf)
		if (vf) opts.vfSettings = vf
	}
	if (d.ffContainer) {
		const container = document.querySelector<HTMLElement>(d.ffContainer)
		if (container) opts.container = container
	}

	return opts
}

/**
 * Fit a single element and register its live handle for teardown.
 * Idempotent — re-initialising an element disposes the previous handle first.
 *
 * @param el - Element to fit
 */
function initElement(el: HTMLElement): void {
	// Tear down any previous run so re-init doesn't leave a stale observer.
	destroy(el)
	const handle = fitFlushLive(el, readOptions(el))
	INSTANCES.set(el, handle)
}

/**
 * Re-fit a single element now, or every tracked element when no element is given.
 * Useful after changing an element's text content, since the live handle only
 * observes container size — not the text it holds.
 *
 * @param el - Element to re-fit; omit to re-fit all tracked elements
 */
function refit(el?: HTMLElement): void {
	if (el) {
		INSTANCES.get(el)?.refit()
		return
	}
	document.querySelectorAll<HTMLElement>(`[${OPT_IN_ATTR}]`).forEach((node) => {
		INSTANCES.get(node)?.refit()
	})
}

/**
 * Dispose and restore a single element if it has a live handle.
 *
 * @param el - Element previously initialised
 */
function destroy(el: HTMLElement): void {
	const handle = INSTANCES.get(el)
	if (!handle) return
	handle.dispose()
	INSTANCES.delete(el)
}

/**
 * Scan a root for opted-in elements and fit each one.
 *
 * @param root - Element or document to search (default: document)
 */
function init(root: ParentNode = document): void {
	root.querySelectorAll<HTMLElement>(`[${OPT_IN_ATTR}]`).forEach(initElement)
}

/**
 * Auto-initialise once the DOM is parsed and web fonts have loaded.
 * Fonts must settle first: the fitted size depends on final glyph metrics,
 * which shift when a web font swaps in. The live handle re-fits again on its
 * own fonts.ready, but gating here avoids an initial flash at the fallback size.
 */
function autoInit(): void {
	const run = () => {
		if (document.fonts?.ready) {
			document.fonts.ready.then(() => init()).catch(() => init())
		} else {
			init()
		}
	}
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', run, { once: true })
	} else {
		run()
	}
}

autoInit()

// Public browser API — assigned to window.FitFlush via the IIFE global name.
export { init, refit, destroy }
