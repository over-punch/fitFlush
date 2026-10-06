// Core fit-flush API: one-shot `fitFlush()`, live `fitFlushLive()` handle and `removeFitFlush()`.
// Framework-agnostic — no React imports.

import {
	analyticalWidthFit,
	binarySearchFit,
	configureProbe,
	createProbe,
	fits,
	layoutScale,
} from './measure.js'
import { mergeAxisString, validateVfSettings } from './vf.js'
import { DEFAULTS, type FitFlushHandle, type FitFlushOptions } from './types.js'

/** Inline styles a fit writes, saved before the first fit so they can be restored. */
interface SavedStyles {
	fontSize: string
	whiteSpace: string
	ffSize: string
	/** Whether the element had a style attribute at all (removeFitFlush leaves none if it had none). */
	hadStyleAttr: boolean
}

/** Per-element originals, saved on the first fit and restored by removeFitFlush / dispose. */
const saved = new WeakMap<HTMLElement, SavedStyles>()

/** The live handle currently attached to each element (a second fitFlushLive replaces it). */
const liveHandles = new WeakMap<HTMLElement, FitFlushHandle>()

/** Warnings already printed, so a refit on every resize warns once. */
const warned = new Set<string>()

/** Prints a console warning the first time it is seen. */
function warnOnce(message: string): void {
	if (warned.has(message)) return
	warned.add(message)
	console.warn(message)
}

/** Resolve the `padding` option to a normalized {x, y} pair in px (non-finite values become 0). */
function resolvePadding(padding: FitFlushOptions['padding']): { x: number; y: number } {
	const clean = (n: number | undefined, label: string) => {
		if (n === undefined) return 0
		if (!Number.isFinite(n)) {
			warnOnce(`[fit-flush] padding${label} must be a finite number; got ${n}, using 0`)
			return 0
		}
		return n
	}
	if (typeof padding === 'number') { const n = clean(padding, ''); return { x: n, y: n } }
	if (!padding) return { x: 0, y: 0 }
	return { x: clean(padding.x, '.x'), y: clean(padding.y, '.y') }
}

/**
 * Fit the text inside `target` to its container by setting `target.style.fontSize`.
 * Returns the computed font-size in px. SSR-safe (returns 0 when window is undefined).
 * Idempotent — safe to call repeatedly with the same inputs.
 */
export function fitFlush(target: HTMLElement, options: FitFlushOptions = {}): number {
	if (typeof window === 'undefined' || typeof document === 'undefined') return 0
	if (!target) return 0

	let mode = options.mode ?? DEFAULTS.mode
	if (mode !== 'width' && mode !== 'height' && mode !== 'both') {
		warnOnce(`[fit-flush] mode must be 'width', 'height' or 'both'; got ${JSON.stringify(mode)}, using '${DEFAULTS.mode}'`)
		mode = DEFAULTS.mode
	}
	// Clamp precision to a safe minimum to prevent infinite binary-search loops.
	const rawPrecision = options.precision ?? DEFAULTS.precision
	const precision = Math.max(0.01, isFinite(rawPrecision) ? rawPrecision : DEFAULTS.precision)
	// Ensure min/max are finite and ordered (an inverted pair is swapped, with a warning).
	const rawMin = options.min ?? DEFAULTS.min
	const rawMax = options.max ?? DEFAULTS.max
	let min = isFinite(rawMin) && rawMin > 0 ? rawMin : DEFAULTS.min
	let max = isFinite(rawMax) && rawMax > 0 ? rawMax : DEFAULTS.max
	if (max < min) {
		warnOnce(`[fit-flush] max (${max}) is below min (${min}); swapping them`)
		;[min, max] = [max, min]
	}
	const pad = resolvePadding(options.padding)
	const vf = validateVfSettings(options.vfSettings, warnOnce)

	const container = options.container ?? target.parentElement
	if (!container) return 0

	const text = target.textContent ?? ''
	if (text.trim().length === 0) return min

	// Save originals on the first fit; reset the white-space this library wrote so the author's
	// own value is what the probe copies.
	if (!saved.has(target)) {
		saved.set(target, {
			fontSize: target.style.fontSize,
			whiteSpace: target.style.whiteSpace,
			ffSize: target.style.getPropertyValue('--ff-size'),
			hadStyleAttr: target.hasAttribute('style'),
		})
	}
	const orig = saved.get(target)!
	target.style.whiteSpace = orig.whiteSpace

	// Save scroll — iOS Safari ignores overflow-anchor: none.
	const scrollY = window.scrollY

	// Container content box in layout px: border-box minus padding and border, divided by any
	// transform's scale (a scaled parent's visual size isn't the size its text lays out in).
	const scale = layoutScale(container)
	const cRect = container.getBoundingClientRect()
	const cs = window.getComputedStyle(container)
	const px = (v: string) => parseFloat(v) || 0
	const innerWidth = Math.max(0, cRect.width / scale - px(cs.paddingLeft) - px(cs.paddingRight) - px(cs.borderLeftWidth) - px(cs.borderRightWidth) - 2 * pad.x)
	const innerHeight = Math.max(0, cRect.height / scale - px(cs.paddingTop) - px(cs.paddingBottom) - px(cs.borderTopWidth) - px(cs.borderBottomWidth) - 2 * pad.y)

	if (innerWidth <= 0 || (mode !== 'width' && innerHeight <= 0)) {
		warnOnce('[fit-flush] the container has no room left after padding; nothing was fitted')
		return min
	}

	const targetCS = window.getComputedStyle(target)
	const currentSize = parseFloat(targetCS.fontSize) || 0
	const authorWhiteSpace = targetCS.whiteSpace
	const baseFVS = targetCS.getPropertyValue('font-variation-settings')

	// Axis variants the size must fit at: every listed axis at its max, and — when any axis also
	// gives a min (e.g. opsz, widest at its minimum) — the listed mins too.
	const variants: string[] = []
	if (vf) {
		const maxes: Record<string, number> = {}
		const mins: Record<string, number> = {}
		let hasMin = false
		for (const [axis, r] of Object.entries(vf)) {
			maxes[axis] = r.max
			mins[axis] = r.min ?? r.max
			if (r.min !== undefined) hasMin = true
		}
		variants.push(mergeAxisString(baseFVS, maxes))
		if (hasMin) variants.push(mergeAxisString(baseFVS, mins))
	}

	const probe = createProbe(target)
	let size: number
	try {
		configureProbe(probe, mode, innerWidth, authorWhiteSpace)
		const probeScale = layoutScale(container)
		const ok = (s: number): boolean => {
			probe.style.fontSize = `${s}px`
			if (!variants.length) return fits(probe, mode, innerWidth, innerHeight, probeScale)
			for (const fvs of variants) {
				probe.style.setProperty('font-variation-settings', fvs)
				if (!fits(probe, mode, innerWidth, innerHeight, probeScale)) return false
			}
			return true
		}

		if (mode === 'width' && variants.length === 0) {
			size = analyticalWidthFit(probe, innerWidth, min, max, precision, ok, probeScale)
		} else {
			// Height-based modes search up from the current size when it already fits, so a
			// container whose height follows its content keeps the size instead of shrinking it
			// by a step on every call.
			size = binarySearchFit(min, max, precision, ok, mode === 'width' ? undefined : currentSize)
		}
		if (size <= min && !ok(min)) {
			warnOnce(`[fit-flush] the text doesn't fit even at the minimum size (${min}px); it will overflow`)
		}
	} finally {
		// Dispose probe, even if a measurement throws.
		probe.remove()
	}

	// Round down to one decimal: rounding up could push a fitted size past the container.
	const rounded = Math.max(min, Math.floor(size * 10) / 10)

	// Write — target gets the computed size. Width mode keeps the text on one line; the other
	// modes leave the author's white-space alone.
	target.style.fontSize = `${rounded}px`
	target.style.setProperty('--ff-size', `${rounded}px`)
	if (mode === 'width') target.style.whiteSpace = 'nowrap'

	// Restore scroll after DOM mutations settle.
	if (typeof requestAnimationFrame !== 'undefined') {
		requestAnimationFrame(() => {
			if (Math.abs(window.scrollY - scrollY) > 2) {
				window.scrollTo({ top: scrollY, behavior: 'instant' as ScrollBehavior })
			}
		})
	}

	options.onFit?.(rounded)

	return rounded
}

/**
 * Undo fitFlush: restore the target's original inline font-size, white-space and --ff-size,
 * and leave no empty style attribute behind. No-op if the element was never fitted.
 */
export function removeFitFlush(target: HTMLElement): void {
	const orig = target ? saved.get(target) : undefined
	if (!orig) return
	target.style.fontSize = orig.fontSize
	target.style.whiteSpace = orig.whiteSpace
	if (orig.ffSize) target.style.setProperty('--ff-size', orig.ffSize)
	else target.style.removeProperty('--ff-size')
	if (!orig.hadStyleAttr && !target.getAttribute('style')) target.removeAttribute('style')
	saved.delete(target)
}

/**
 * Live version of fitFlush: auto-refits on container resize (ResizeObserver, width + height
 * dedup), when the target's text changes, and after web fonts load. Returns a handle with
 * `.size`, `.refit()`, and `.dispose()`. Call dispose on unmount to restore the original styles
 * and stop observing. A second fitFlushLive on the same element replaces the first.
 */
export function fitFlushLive(
	target: HTMLElement,
	options: FitFlushOptions = {},
): FitFlushHandle {
	if (typeof window === 'undefined' || typeof document === 'undefined' || !target) {
		if (typeof window !== 'undefined' && !target) warnOnce('[fit-flush] fitFlushLive was called without a target element')
		return { size: 0, refit: () => 0, dispose: () => {} }
	}

	// One live handle per element: replace (and clean up) an earlier one.
	liveHandles.get(target)?.dispose()

	let currentSize = 0
	let disposed = false
	let rafId = 0

	const run = (): number => {
		if (disposed) return currentSize
		currentSize = fitFlush(target, options)
		return currentSize
	}
	const schedule = () => {
		if (typeof cancelAnimationFrame !== 'undefined') cancelAnimationFrame(rafId)
		rafId = typeof requestAnimationFrame !== 'undefined' ? requestAnimationFrame(() => { run() }) : (run(), 0)
	}

	currentSize = run()

	// ResizeObserver on the container — dedup by width+height to avoid thrashing.
	const container = options.container ?? target.parentElement
	let lastWidth = 0
	let lastHeight = 0
	let ro: ResizeObserver | null = null
	if (container && typeof ResizeObserver !== 'undefined') {
		ro = new ResizeObserver((entries) => {
			if (!entries.length) return
			const w = Math.round(entries[0].contentRect.width)
			const h = Math.round(entries[0].contentRect.height)
			if (w === lastWidth && h === lastHeight) return
			lastWidth = w
			lastHeight = h
			schedule()
		})
		ro.observe(container)
	}

	// Refit when the text changes. Attributes aren't observed, so the fit's own style writes
	// don't retrigger it, and the probe is a sibling, outside the observed subtree.
	let mo: MutationObserver | null = null
	if (typeof MutationObserver !== 'undefined') {
		mo = new MutationObserver(schedule)
		mo.observe(target, { childList: true, characterData: true, subtree: true })
	}

	// Re-run after fonts load — measurement before font swap gives wrong widths. 'loadingdone'
	// covers fonts that load later (fonts.ready settles only once).
	document.fonts?.ready?.then(() => { run() }).catch(() => {})
	const onFonts = () => schedule()
	document.fonts?.addEventListener?.('loadingdone', onFonts)

	const handle: FitFlushHandle = {
		get size() {
			return currentSize
		},
		refit: run,
		dispose: () => {
			if (disposed) return
			disposed = true
			ro?.disconnect()
			mo?.disconnect()
			document.fonts?.removeEventListener?.('loadingdone', onFonts)
			if (typeof cancelAnimationFrame !== 'undefined') cancelAnimationFrame(rafId)
			if (liveHandles.get(target) === handle) liveHandles.delete(target)
			removeFitFlush(target)
		},
	}
	liveHandles.set(target, handle)
	return handle
}
