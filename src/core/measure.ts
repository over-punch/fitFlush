// Measurement primitives for fit-flush: a hidden clone of the target as the measuring probe,
// the fit test, and the two size-search strategies (analytical fast path + binary search).

import { FIT_FLUSH_CLASSES } from './types.js'

/** Attribute marking the measuring clone, so observers and embeds can ignore it. */
export const PROBE_ATTR = 'data-ff-probe'

/**
 * The transform scale of an element (1 when untransformed): getBoundingClientRect is visual,
 * offsetWidth is layout. Differences of a pixel or less are sub-pixel rounding, not a transform.
 */
export function layoutScale(el: HTMLElement): number {
	const visual = el.getBoundingClientRect().width
	const layout = el.offsetWidth
	if (!(layout > 0) || !(visual > 0) || Math.abs(visual - layout) <= 1) return 1
	return visual / layout
}

/**
 * Create the measuring probe: a hidden clone of `target` placed right after it, in the same
 * parent, so it inherits exactly what the target renders with — nested markup and <br>, letter-
 * and word-spacing in their own units, font-size-adjust, small caps, hyphens, overflow-wrap, and
 * the target's own padding and text-indent. Only font-size (and, for vfSettings, the axes)
 * change between measurements.
 */
export function createProbe(target: HTMLElement): HTMLElement {
	const probe = target.cloneNode(true) as HTMLElement
	probe.removeAttribute('id')
	probe.querySelectorAll('[id]').forEach((n) => n.removeAttribute('id'))
	probe.classList.add(FIT_FLUSH_CLASSES.probe)
	probe.setAttribute('aria-hidden', 'true')
	probe.setAttribute(PROBE_ATTR, '')

	const s = probe.style
	s.position = 'absolute'
	s.left = '0'
	s.top = '0'
	s.visibility = 'hidden'
	s.pointerEvents = 'none'
	s.margin = '0'
	s.transition = 'none'
	s.animation = 'none'
	s.boxSizing = 'border-box'
	s.minWidth = '0'
	s.maxWidth = 'none'
	s.minHeight = '0'
	s.maxHeight = 'none'
	s.height = 'auto'
	// display and width are set by configureProbe based on mode

	target.insertAdjacentElement('afterend', probe)
	return probe
}

/**
 * The white-space a width-mode fit uses for an element whose author white-space is `author`:
 * 'pre' when the author's value preserves line breaks (pre, pre-wrap, break-spaces), so the text
 * keeps its own lines and no others; otherwise 'nowrap'. The probe is measured with this value
 * and the target is written with it — they must match, or the fitted size is for a different layout.
 */
export function widthModeWhiteSpace(author: string): 'pre' | 'nowrap' {
	return author === 'pre' || author === 'pre-wrap' || author === 'break-spaces' ? 'pre' : 'nowrap'
}

/** Configure the probe for a given fit mode and container inner width (layout px). */
export function configureProbe(
	probe: HTMLElement,
	mode: 'width' | 'height' | 'both',
	innerWidth: number,
	authorWhiteSpace: string,
): void {
	if (mode === 'width') {
		// One line at its natural width. Preserved whitespace (pre) keeps its own line breaks.
		probe.style.display = 'inline-block'
		probe.style.whiteSpace = widthModeWhiteSpace(authorWhiteSpace)
		probe.style.width = 'max-content'
	} else {
		// Block at the container's width: text wraps exactly as the real element would
		// (the author's own white-space, hyphens and overflow-wrap apply).
		probe.style.display = 'block'
		probe.style.width = `${innerWidth}px`
	}
}

/**
 * Does the probe's current rendered box fit within the inner container bounds (layout px)?
 * Width mode compares the single-line width. Height mode compares height. Both mode also
 * requires that nothing overflows sideways — a long word or a nowrap line wider than the box.
 */
export function fits(
	probe: HTMLElement,
	mode: 'width' | 'height' | 'both',
	innerWidth: number,
	innerHeight: number,
	scale = 1,
): boolean {
	const rect = probe.getBoundingClientRect()
	if (mode === 'width') return rect.width / scale <= innerWidth
	if (rect.height / scale > innerHeight) return false
	if (mode === 'both' && probe.scrollWidth > probe.clientWidth) return false
	return true
}

/**
 * Analytical fast path for `mode: 'width'` single-line fit: measure once at a reference size,
 * predict the target size linearly, then correct. Width isn't exactly linear in font size
 * (hinting, and optical-size axes that follow the size), so the prediction is verified and
 * bisected — downward if it overflows, upward if it leaves more than `precision` of size unused.
 */
export function analyticalWidthFit(
	probe: HTMLElement,
	innerWidth: number,
	min: number,
	max: number,
	precision: number,
	ok: (size: number) => boolean,
	scale = 1,
): number {
	const REFERENCE = 100
	probe.style.fontSize = `${REFERENCE}px`
	const measured = probe.getBoundingClientRect().width / scale
	if (measured <= 0) return min

	const predicted = Math.max(min, Math.min(max, (REFERENCE * innerWidth) / measured))

	let lo: number
	let hi: number
	if (ok(predicted)) {
		// Fits: done if the next step up would overflow (or the cap is reached).
		if (predicted >= max || !ok(Math.min(max, predicted + precision))) return predicted
		lo = predicted
		hi = Math.min(max, predicted * 1.5)
		if (ok(hi)) return hi
	} else {
		if (!ok(min)) return min
		lo = min
		hi = predicted
	}
	while (hi - lo > precision) {
		const mid = (lo + hi) / 2
		if (ok(mid)) lo = mid
		else hi = mid
	}
	return lo
}

/**
 * Binary search across [min, max] for the largest font-size that `ok` accepts. Converges in
 * ~log2((max-min)/precision) iterations — for [8, 400] at 0.5px precision, ~10 measurements.
 * `floor` is a size already known to fit (e.g. the current size), searched up from.
 */
export function binarySearchFit(
	min: number,
	max: number,
	precision: number,
	ok: (size: number) => boolean,
	floor?: number,
): number {
	// Short-circuit: if the max already fits, no search needed.
	if (ok(max)) return max

	let lo = min
	if (floor !== undefined && floor > min && floor < max && ok(floor)) {
		lo = floor
	} else if (!ok(min)) {
		// Even the min overflows: return min (can't do better).
		return min
	}

	let hi = max
	while (hi - lo > precision) {
		const mid = (lo + hi) / 2
		if (ok(mid)) lo = mid
		else hi = mid
	}
	return lo
}
