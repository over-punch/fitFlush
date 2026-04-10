// Tests for the variable-font max-axis string builder.

import { buildMaxAxisString } from '../core/vf'

describe('buildMaxAxisString', () => {
	it('returns empty string when no settings provided', () => {
		expect(buildMaxAxisString(undefined)).toBe('')
		expect(buildMaxAxisString({})).toBe('')
	})

	it('formats a single axis', () => {
		expect(buildMaxAxisString({ wght: { max: 900 } })).toBe('"wght" 900')
	})

	it('joins multiple axes with comma + space', () => {
		const result = buildMaxAxisString({
			wght: { max: 900 },
			wdth: { max: 125 },
			slnt: { max: 15 },
		})
		expect(result).toBe('"wght" 900, "wdth" 125, "slnt" 15')
	})

	it('ignores min and default fields — only max is used', () => {
		const result = buildMaxAxisString({
			wght: { min: 100, default: 400, max: 900 },
		})
		expect(result).toBe('"wght" 900')
	})
})
