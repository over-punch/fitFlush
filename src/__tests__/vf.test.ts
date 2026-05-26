// Tests for the variable-font axis string helpers.

import { buildMaxAxisString, mergeMaxAxisString } from '../core/vf'

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

	it('uses only the max field', () => {
		const result = buildMaxAxisString({ wght: { max: 900 } })
		expect(result).toBe('"wght" 900')
	})
})

describe('mergeMaxAxisString', () => {
	it('returns only max axes when existing string is empty', () => {
		const result = mergeMaxAxisString('', { wght: { max: 900 } })
		expect(result).toBe('"wght" 900')
	})

	it('returns only max axes when existing string is "normal"', () => {
		const result = mergeMaxAxisString('normal', { wght: { max: 900 } })
		expect(result).toBe('"wght" 900')
	})

	it('preserves existing axes not in vfSettings', () => {
		const result = mergeMaxAxisString('"opsz" 36', { wght: { max: 900 } })
		expect(result).toContain('"opsz" 36')
		expect(result).toContain('"wght" 900')
	})

	it('overrides an existing axis with the max value', () => {
		const result = mergeMaxAxisString('"wght" 400', { wght: { max: 900 } })
		// wght should be 900, not 400
		expect(result).toBe('"wght" 900')
	})

	it('merges multiple existing and new axes', () => {
		const result = mergeMaxAxisString(
			'"opsz" 36, "wght" 400',
			{ wght: { max: 900 }, wdth: { max: 125 } },
		)
		expect(result).toContain('"opsz" 36')
		expect(result).toContain('"wght" 900')
		expect(result).toContain('"wdth" 125')
		// wght should NOT appear as 400
		expect(result).not.toContain('"wght" 400')
	})

	it('returns empty string when no axes remain after empty inputs', () => {
		expect(mergeMaxAxisString('', undefined)).toBe('')
		expect(mergeMaxAxisString('normal', undefined)).toBe('')
	})
})
