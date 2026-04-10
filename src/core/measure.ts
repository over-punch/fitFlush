// Measurement primitives for fit-flush: off-screen probe construction, style
// copy, and the two size-search strategies (analytical fast path + binary search).

import { FIT_FLUSH_CLASSES } from './types'

/** Computed style properties copied from target → probe so measurement matches visual. */
const COPIED_STYLE_PROPS = [
	'font-family',
	'font-weight',
	'font-style',
	'font-stretch',
	'font-variation-settings',
	'font-feature-settings',
	'letter-spacing',
	'word-spacing',
	'text-transform',
	'line-height',
	'font-kerning',
] as const

/**
 * Create a detached measurement probe cloned stylistically from `target`.
 * The probe is position: fixed, off-screen, visibility: hidden, aria-hidden,
 * and appended to document.body — never injected into the target's subtree.
 */
export function createProbe(target: HTMLElement, text: string): HTMLElement {
	const probe = document.createElement('span')
	probe.className = FIT_FLUSH_CLASSES.probe
	probe.setAttribute('aria-hidden', 'true')
	probe.textContent = text

	const computed = window.getComputedStyle(target)
	for (const prop of COPIED_STYLE_PROPS) {
		const value = computed.getPropertyValue(prop)
		if (value) probe.style.setProperty(prop, value)
	}

	const s = probe.style
	s.position = 'fixed'
	s.left = '-99999px'
	s.top = '0'
	s.visibility = 'hidden'
	s.pointerEvents = 'none'
	s.margin = '0'
	s.padding = '0'
	s.border = '0'
	s.display = 'inline-block'

	document.body.appendChild(probe)
	return probe
}

/** Configure the probe for a given fit mode and container inner width. */
export function configureProbe(
	probe: HTMLElement,
	mode: 'width' | 'height' | 'both',
	innerWidth: number,
): void {
	if (mode === 'width') {
		probe.style.whiteSpace = 'nowrap'
		probe.style.width = 'auto'
	} else {
		probe.style.whiteSpace = 'normal'
		probe.style.width = `${innerWidth}px`
	}
}

/** Does the probe's current rendered box fit within the inner container bounds? */
export function fits(
	probe: HTMLElement,
	mode: 'width' | 'height' | 'both',
	innerWidth: number,
	innerHeight: number,
): boolean {
	const rect = probe.getBoundingClientRect()
	if (mode === 'width') return rect.width <= innerWidth
	if (mode === 'height') return rect.height <= innerHeight
	return rect.width <= innerWidth && rect.height <= innerHeight
}

/**
 * Analytical fast path for `mode: 'width'` single-line fit: measure once at a
 * reference size, then linearly predict the target size. Verifies the prediction
 * and bisects downward only if hinting non-linearity caused an overshoot.
 * Typical cost: 1 measurement + 1 verify.
 */
export function analyticalWidthFit(
	probe: HTMLElement,
	innerWidth: number,
	min: number,
	max: number,
	precision: number,
): number {
	const REFERENCE = 100
	probe.style.fontSize = `${REFERENCE}px`
	const measured = probe.getBoundingClientRect().width
	if (measured <= 0) return min

	let predicted = (REFERENCE * innerWidth) / measured
	predicted = Math.max(min, Math.min(max, predicted))

	// Verify — text rendering at small sizes can be slightly non-linear.
	probe.style.fontSize = `${predicted}px`
	if (probe.getBoundingClientRect().width <= innerWidth) {
		return predicted
	}

	// Overshot — bisect downward until it fits.
	let lo = min
	let hi = predicted
	while (hi - lo > precision) {
		const mid = (lo + hi) / 2
		probe.style.fontSize = `${mid}px`
		if (probe.getBoundingClientRect().width <= innerWidth) lo = mid
		else hi = mid
	}
	return lo
}

/**
 * Binary search across [min, max] for the largest font-size that fits the
 * configured mode. Converges in ~log2((max-min)/precision) iterations — for
 * [8, 400] at 0.5px precision, ~10 probe measurements.
 */
export function binarySearchFit(
	probe: HTMLElement,
	mode: 'width' | 'height' | 'both',
	innerWidth: number,
	innerHeight: number,
	min: number,
	max: number,
	precision: number,
): number {
	// Short-circuit: if the max already fits, no search needed.
	probe.style.fontSize = `${max}px`
	if (fits(probe, mode, innerWidth, innerHeight)) return max

	// Short-circuit: if even the min overflows, return min (can't do better).
	probe.style.fontSize = `${min}px`
	if (!fits(probe, mode, innerWidth, innerHeight)) return min

	let lo = min
	let hi = max
	while (hi - lo > precision) {
		const mid = (lo + hi) / 2
		probe.style.fontSize = `${mid}px`
		if (fits(probe, mode, innerWidth, innerHeight)) lo = mid
		else hi = mid
	}
	return lo
}
