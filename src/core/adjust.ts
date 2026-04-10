// Core fit-flush API: one-shot `fitFlush()` and live `fitFlushLive()` handle.
// Framework-agnostic — no React imports.

import {
	analyticalWidthFit,
	binarySearchFit,
	configureProbe,
	createProbe,
} from './measure'
import { buildMaxAxisString } from './vf'
import { DEFAULTS, type FitFlushHandle, type FitFlushOptions } from './types'

/** Resolve the `padding` option to a normalized {x, y} pair in px. */
function resolvePadding(padding: FitFlushOptions['padding']): { x: number; y: number } {
	if (typeof padding === 'number') return { x: padding, y: padding }
	if (!padding) return { x: 0, y: 0 }
	return { x: padding.x ?? 0, y: padding.y ?? 0 }
}

/**
 * Fit the text inside `target` to its container by setting `target.style.fontSize`.
 * Returns the computed font-size in px. SSR-safe (returns 0 when window is undefined).
 * Always idempotent — safe to call repeatedly with the same inputs.
 */
export function fitFlush(target: HTMLElement, options: FitFlushOptions = {}): number {
	if (typeof window === 'undefined' || typeof document === 'undefined') return 0
	if (!target) return 0

	const mode = options.mode ?? DEFAULTS.mode
	const min = options.min ?? DEFAULTS.min
	const max = options.max ?? DEFAULTS.max
	const precision = options.precision ?? DEFAULTS.precision
	const pad = resolvePadding(options.padding)

	const container = options.container ?? target.parentElement
	if (!container) return 0

	// Save scroll — iOS Safari ignores overflow-anchor: none.
	const scrollY = window.scrollY

	// Batch-read container dimensions once — no interleaved reads and writes.
	const cRect = container.getBoundingClientRect()
	const innerWidth = Math.max(0, cRect.width - 2 * pad.x)
	const innerHeight = Math.max(0, cRect.height - 2 * pad.y)

	if (innerWidth <= 0) return min
	if (mode !== 'width' && innerHeight <= 0) return min

	const text = target.textContent ?? ''
	if (text.length === 0) return min

	const probe = createProbe(target, text)

	// Apply max-axis VF settings for worst-case safety when provided.
	const maxAxis = buildMaxAxisString(options.vfSettings)
	if (maxAxis) probe.style.fontVariationSettings = maxAxis

	configureProbe(probe, mode, innerWidth)

	let size: number
	if (mode === 'width') {
		size = analyticalWidthFit(probe, innerWidth, min, max, precision)
	} else {
		size = binarySearchFit(probe, mode, innerWidth, innerHeight, min, max, precision)
	}

	// Write — target gets the computed size.
	target.style.fontSize = `${size}px`

	// Dispose probe.
	probe.remove()

	// Restore scroll after DOM mutations settle.
	if (typeof requestAnimationFrame !== 'undefined') {
		requestAnimationFrame(() => {
			if (Math.abs(window.scrollY - scrollY) > 2) {
				window.scrollTo({ top: scrollY, behavior: 'instant' as ScrollBehavior })
			}
		})
	}

	return size
}

/**
 * Live version of fitFlush: auto-refits on container resize (ResizeObserver,
 * width-only dedup) and after `document.fonts.ready`. Returns a handle with
 * `.size`, `.refit()`, and `.dispose()`. Call dispose on unmount to restore
 * the original fontSize and stop observing.
 */
export function fitFlushLive(
	target: HTMLElement,
	options: FitFlushOptions = {},
): FitFlushHandle {
	if (typeof window === 'undefined' || typeof document === 'undefined') {
		return { size: 0, refit: () => 0, dispose: () => {} }
	}

	const originalFontSize = target.style.fontSize
	let currentSize = 0
	let disposed = false

	const run = (): number => {
		if (disposed) return currentSize
		currentSize = fitFlush(target, options)
		return currentSize
	}

	currentSize = run()

	// ResizeObserver on the container — width-only dedup to avoid thrashing.
	const container = options.container ?? target.parentElement
	let lastWidth = 0
	let rafId = 0
	let ro: ResizeObserver | null = null
	if (container && typeof ResizeObserver !== 'undefined') {
		ro = new ResizeObserver((entries) => {
			const w = Math.round(entries[0].contentRect.width)
			if (w === lastWidth) return
			lastWidth = w
			if (typeof cancelAnimationFrame !== 'undefined') cancelAnimationFrame(rafId)
			rafId =
				typeof requestAnimationFrame !== 'undefined'
					? requestAnimationFrame(run)
					: (run(), 0)
		})
		ro.observe(container)
	}

	// Re-run after fonts load — measurement before font swap gives wrong widths.
	if (document.fonts && document.fonts.ready) {
		document.fonts.ready.then(run).catch(() => {})
	}

	return {
		get size() {
			return currentSize
		},
		refit: run,
		dispose: () => {
			if (disposed) return
			disposed = true
			ro?.disconnect()
			if (typeof cancelAnimationFrame !== 'undefined') cancelAnimationFrame(rafId)
			target.style.fontSize = originalFontSize
		},
	}
}
