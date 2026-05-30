// Variable-font axis string helpers.
// Used to hold every axis at its worst-case value during measurement, so the
// final fit stays safe when axes animate to their max later.

import type { FitFlushOptions } from './types'

/**
 * Build a `font-variation-settings` string holding every axis at its max value.
 * Returns an empty string when no settings are supplied.
 *
 * Example:
 *   { wght: { max: 900 }, wdth: { max: 125 } }
 *   → '"wght" 900, "wdth" 125'
 */
export function buildMaxAxisString(vfSettings: FitFlushOptions['vfSettings']): string {
	if (!vfSettings) return ''
	const entries = Object.entries(vfSettings)
	if (entries.length === 0) return ''
	return entries.map(([axis, range]) => `"${axis}" ${range.max}`).join(', ')
}

/** Parse a CSS `font-variation-settings` string into an axis → value map. */
function parseAxisSettings(str: string): Record<string, number> {
	const result: Record<string, number> = {}
	// Use -?[\d.]+ so negative axis values (e.g. "slnt" -12) are captured correctly.
	for (const [, axis, value] of str.matchAll(/"([^"]+)"\s+(-?[\d.]+)/g)) {
		result[axis] = parseFloat(value)
	}
	return result
}

/**
 * Merge an existing `font-variation-settings` string with vfSettings max values.
 * Axes already present in `existing` are preserved; only listed axes are overridden
 * to their max. Returns the merged serialised string, or empty string if nothing
 * to set.
 *
 * Example:
 *   existing: '"opsz" 36, "wght" 400'
 *   vfSettings: { wght: { max: 900 }, wdth: { max: 125 } }
 *   → '"opsz" 36, "wght" 900, "wdth" 125'
 */
export function mergeMaxAxisString(
	existing: string,
	vfSettings: FitFlushOptions['vfSettings'],
): string {
	const axes: Record<string, number> =
		existing && existing !== 'normal' ? parseAxisSettings(existing) : {}
	if (vfSettings) {
		for (const [axis, range] of Object.entries(vfSettings)) {
			axes[axis] = range.max
		}
	}
	const entries = Object.entries(axes)
	if (entries.length === 0) return ''
	return entries.map(([axis, value]) => `"${axis}" ${value}`).join(', ')
}
