// Variable-font max-axis string builder.
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
