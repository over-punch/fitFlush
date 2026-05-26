// Core algorithm tests for fit-flush.

import { jest } from '@jest/globals'
import { fitFlush, fitFlushLive } from '../core/adjust'
import { mockMeasurement, restoreMeasurement } from './mocks'

afterEach(() => {
	restoreMeasurement()
	document.body.innerHTML = ''
})

/** Create a container → target structure for tests. */
function setupDOM(text = 'Hello world'): {
	container: HTMLElement
	target: HTMLElement
} {
	const container = document.createElement('div')
	const target = document.createElement('h1')
	target.textContent = text
	container.appendChild(target)
	document.body.appendChild(container)
	return { container, target }
}

describe('fitFlush — mode: width', () => {
	it('returns a size within [min, max]', () => {
		mockMeasurement({ containerWidth: 500, containerHeight: 200 })
		const { target } = setupDOM('abcdef')
		const size = fitFlush(target, { mode: 'width', min: 8, max: 400 })
		expect(size).toBeGreaterThanOrEqual(8)
		expect(size).toBeLessThanOrEqual(400)
	})

	it('analytical fast path predicts correctly for linear probe', () => {
		// probeWidth(size, text) = size * 10 * 0.5 = 5*size. 5*size = 500 → size = 100.
		mockMeasurement({ containerWidth: 500, containerHeight: 200 })
		const { target } = setupDOM('abcdefghij') // 10 chars
		const size = fitFlush(target, { mode: 'width', min: 8, max: 400, precision: 0.5 })
		expect(size).toBeCloseTo(100, 0)
	})

	it('respects max cap', () => {
		mockMeasurement({ containerWidth: 100000, containerHeight: 100000 })
		const { target } = setupDOM('hi')
		const size = fitFlush(target, { mode: 'width', min: 8, max: 50 })
		expect(size).toBeLessThanOrEqual(50)
	})

	it('respects min floor on a too-small container', () => {
		mockMeasurement({ containerWidth: 1, containerHeight: 200 })
		const { target } = setupDOM('abcdefghijklmnop')
		const size = fitFlush(target, { mode: 'width', min: 12, max: 400 })
		expect(size).toBeGreaterThanOrEqual(12)
	})
})

describe('fitFlush — mode: height', () => {
	it('binary-searches to within precision', () => {
		// probeHeight(size) = 1.2*size. 1.2*size = 240 → size = 200.
		mockMeasurement({ containerWidth: 1000, containerHeight: 240 })
		const { target } = setupDOM('text')
		const size = fitFlush(target, {
			mode: 'height',
			min: 8,
			max: 400,
			precision: 0.5,
		})
		expect(size).toBeGreaterThan(199)
		expect(size).toBeLessThanOrEqual(200)
	})
})

describe('fitFlush — mode: both', () => {
	it('wraps text within container width and fits height', () => {
		// 10 chars in 100px container: text wraps. At ~60px font-size,
		// intrinsic width = 300 → 3 lines → height = 3 * 60 * 1.2 = 216 < 240. Fits.
		// At ~67px: intrinsic = 335 → 4 lines → height = 4 * 67 * 1.2 = 321 > 240. Too tall.
		// Binary search converges around 59–60px.
		mockMeasurement({ containerWidth: 100, containerHeight: 240 })
		const { target } = setupDOM('abcdefghij')
		const size = fitFlush(target, { mode: 'both', min: 8, max: 400 })
		expect(size).toBeGreaterThan(55)
		expect(size).toBeLessThanOrEqual(66)
	})
})

describe('fitFlush — edge cases', () => {
	it('returns min for empty text', () => {
		mockMeasurement({ containerWidth: 500, containerHeight: 200 })
		const { target } = setupDOM('')
		const size = fitFlush(target, { min: 12 })
		expect(size).toBe(12)
	})

	it('returns 0 when target is nullish', () => {
		expect(fitFlush(null as unknown as HTMLElement)).toBe(0)
	})

	it('returns 0 when no container is found', () => {
		const orphan = document.createElement('span')
		orphan.textContent = 'hi'
		expect(fitFlush(orphan)).toBe(0)
	})

	it('is idempotent — same inputs yield same output', () => {
		mockMeasurement({ containerWidth: 500, containerHeight: 200 })
		const { target } = setupDOM('Hello world')
		const a = fitFlush(target, { mode: 'width' })
		const b = fitFlush(target, { mode: 'width' })
		expect(a).toBe(b)
	})

	it('removes probe from DOM after one-shot call', () => {
		mockMeasurement({ containerWidth: 500, containerHeight: 200 })
		const { target } = setupDOM('hi')
		fitFlush(target)
		expect(document.querySelectorAll('.ff-probe').length).toBe(0)
	})

	it('padding shrinks the effective inner width', () => {
		mockMeasurement({ containerWidth: 500, containerHeight: 200 })
		const { target } = setupDOM('abcdefghij')
		const without = fitFlush(target, { mode: 'width', padding: 0 })
		const withPad = fitFlush(target, { mode: 'width', padding: 50 })
		expect(withPad).toBeLessThan(without)
	})

	it('padding object supports per-axis insets', () => {
		mockMeasurement({ containerWidth: 500, containerHeight: 200 })
		const { target } = setupDOM('abcdefghij')
		const xOnly = fitFlush(target, { mode: 'width', padding: { x: 50, y: 0 } })
		const both = fitFlush(target, { mode: 'width', padding: 50 })
		expect(xOnly).toBe(both)
	})

	it('applies final size to target inline style', () => {
		mockMeasurement({ containerWidth: 500, containerHeight: 200 })
		const { target } = setupDOM('text')
		const size = fitFlush(target, { mode: 'width' })
		expect(target.style.fontSize).toBe(`${size}px`)
	})
})

describe('fitFlush — CSS padding/border subtraction', () => {
	it('subtracts container CSS padding from available width', () => {
		// Container BCR = 500, but 20px padding each side → content = 460
		mockMeasurement({ containerWidth: 500, containerHeight: 200 })
		const { container, target } = setupDOM('abcdefghij')
		container.style.padding = '20px'
		const withPadding = fitFlush(target, { mode: 'width' })
		container.style.padding = '0px'
		const without = fitFlush(target, { mode: 'width' })
		expect(withPadding).toBeLessThan(without)
	})

	it('subtracts container CSS border from available width', () => {
		mockMeasurement({ containerWidth: 500, containerHeight: 200 })
		const { container, target } = setupDOM('abcdefghij')
		container.style.border = '10px solid black'
		const withBorder = fitFlush(target, { mode: 'width' })
		container.style.border = '0px solid black'
		const without = fitFlush(target, { mode: 'width' })
		expect(withBorder).toBeLessThan(without)
	})

	it('subtracts container CSS padding from available height', () => {
		mockMeasurement({ containerWidth: 1000, containerHeight: 240 })
		const { container, target } = setupDOM('text')
		container.style.padding = '20px'
		const withPadding = fitFlush(target, { mode: 'height', precision: 0.5 })
		container.style.padding = '0px'
		const without = fitFlush(target, { mode: 'height', precision: 0.5 })
		expect(withPadding).toBeLessThan(without)
	})
})

describe('fitFlush — whiteSpace management', () => {
	it('sets whiteSpace to nowrap in width mode', () => {
		mockMeasurement({ containerWidth: 500, containerHeight: 200 })
		const { target } = setupDOM('Hello world')
		fitFlush(target, { mode: 'width' })
		expect(target.style.whiteSpace).toBe('nowrap')
	})

	it('clears whiteSpace in height mode', () => {
		mockMeasurement({ containerWidth: 500, containerHeight: 200 })
		const { target } = setupDOM('Hello world')
		target.style.whiteSpace = 'nowrap'
		fitFlush(target, { mode: 'height' })
		expect(target.style.whiteSpace).toBe('')
	})

	it('clears whiteSpace in both mode', () => {
		mockMeasurement({ containerWidth: 500, containerHeight: 200 })
		const { target } = setupDOM('Hello world')
		target.style.whiteSpace = 'nowrap'
		fitFlush(target, { mode: 'both' })
		expect(target.style.whiteSpace).toBe('')
	})
})

describe('fitFlushLive — whiteSpace restore', () => {
	it('dispose restores the original whiteSpace', () => {
		mockMeasurement({ containerWidth: 500, containerHeight: 200 })
		const { target } = setupDOM('hi')
		target.style.whiteSpace = 'pre-wrap'
		const handle = fitFlushLive(target, { mode: 'width' })
		expect(target.style.whiteSpace).toBe('nowrap')
		handle.dispose()
		expect(target.style.whiteSpace).toBe('pre-wrap')
	})
})

describe('fitFlushLive', () => {
	it('returns a handle with size, refit, dispose', () => {
		mockMeasurement({ containerWidth: 500, containerHeight: 200 })
		const { target } = setupDOM('hi')
		const handle = fitFlushLive(target, { mode: 'width' })
		expect(typeof handle.size).toBe('number')
		expect(typeof handle.refit).toBe('function')
		expect(typeof handle.dispose).toBe('function')
		handle.dispose()
	})

	it('dispose restores the original inline fontSize', () => {
		mockMeasurement({ containerWidth: 500, containerHeight: 200 })
		const { target } = setupDOM('hi')
		target.style.fontSize = '42px'
		const handle = fitFlushLive(target, { mode: 'width' })
		handle.dispose()
		expect(target.style.fontSize).toBe('42px')
	})

	it('refit returns the current size', () => {
		mockMeasurement({ containerWidth: 500, containerHeight: 200 })
		const { target } = setupDOM('hi')
		const handle = fitFlushLive(target, { mode: 'width' })
		const newSize = handle.refit()
		expect(newSize).toBe(handle.size)
		handle.dispose()
	})
})

describe('fitFlush — container override', () => {
	it('uses the explicit container option instead of parentElement', () => {
		// Two containers with different widths. Pass the outer as the explicit container.
		mockMeasurement({ containerWidth: 200, containerHeight: 200 })
		const outer = document.createElement('div')
		const inner = document.createElement('div')
		const target = document.createElement('h1')
		target.textContent = 'abcdefghij' // 10 chars
		inner.appendChild(target)
		outer.appendChild(inner)
		document.body.appendChild(outer)

		const sizeWithParent = fitFlush(target, { mode: 'width' })
		// Now override with a custom container that getBCR reports differently.
		// Since our mock returns containerWidth for all non-probe elements,
		// we just verify that passing an explicit container doesn't error.
		const sizeWithContainer = fitFlush(target, { mode: 'width', container: outer })
		expect(typeof sizeWithContainer).toBe('number')
		expect(sizeWithContainer).toBeGreaterThanOrEqual(8)
		// Both point to elements that the mock treats the same — sizes should match.
		expect(sizeWithContainer).toBe(sizeWithParent)
	})
})

describe('fitFlush — onFit callback', () => {
	it('calls onFit with the computed font-size after each fit', () => {
		mockMeasurement({ containerWidth: 500, containerHeight: 200 })
		const { target } = setupDOM('abcdefghij')
		const received: number[] = []
		const size = fitFlush(target, { mode: 'width', onFit: (s) => received.push(s) })
		expect(received).toHaveLength(1)
		expect(received[0]).toBe(size)
	})

	it('onFit receives the same value written to target.style.fontSize', () => {
		mockMeasurement({ containerWidth: 500, containerHeight: 200 })
		const { target } = setupDOM('hello')
		let reported = 0
		fitFlush(target, { mode: 'width', onFit: (s) => { reported = s } })
		expect(target.style.fontSize).toBe(`${reported}px`)
	})
})

describe('fitFlush — analytical fallback with non-linear probe', () => {
	it('converges when linear prediction overshoots due to hinting non-linearity', () => {
		// Non-linear probeWidth: slightly wider at small sizes (simulates hinting)
		// so the linear prediction overshoots and the bisect fallback must activate.
		mockMeasurement({
			containerWidth: 500,
			containerHeight: 200,
			probeWidth: (size, text) => {
				// Add a flat +20px at any size to force overshoot when size≈100
				return size * text.length * 0.5 + 20
			},
		})
		const { target } = setupDOM('abcdefghij') // 10 chars
		const size = fitFlush(target, { mode: 'width', min: 8, max: 400, precision: 0.5 })
		// Should still converge to a value within the container
		expect(size).toBeGreaterThanOrEqual(8)
		expect(size).toBeLessThanOrEqual(400)
		// The fitted element should not overflow: probeWidth(size, text) ≤ 500
		const probeW = size * 10 * 0.5 + 20
		expect(probeW).toBeLessThanOrEqual(500 + 0.5) // within precision
	})
})

describe('fitFlush — CSS custom property', () => {
	it('writes --ff-size to the target after fitting', () => {
		mockMeasurement({ containerWidth: 500, containerHeight: 200 })
		const { target } = setupDOM('text')
		const size = fitFlush(target, { mode: 'width' })
		expect(target.style.getPropertyValue('--ff-size')).toBe(`${size}px`)
	})
})

describe('fitFlush — vfSettings integration', () => {
	it('sets font-variation-settings on the probe when vfSettings is provided', () => {
		mockMeasurement({ containerWidth: 500, containerHeight: 200 })

		const vfCalls: string[] = []
		const origSetProperty = CSSStyleDeclaration.prototype.setProperty
		jest
			.spyOn(CSSStyleDeclaration.prototype, 'setProperty')
			.mockImplementation(function (
				this: CSSStyleDeclaration,
				prop: string,
				value: string | null,
				priority?: string,
			) {
				if (prop === 'font-variation-settings' && value) vfCalls.push(value)
				return origSetProperty.call(this, prop, value, priority)
			})

		const { target } = setupDOM('test')
		fitFlush(target, { mode: 'width', vfSettings: { wght: { max: 900 } } })

		expect(vfCalls.some((v) => v.includes('"wght" 900'))).toBe(true)
	})

	it('merges vfSettings with existing copied font-variation-settings', () => {
		mockMeasurement({ containerWidth: 500, containerHeight: 200 })

		// Mock getComputedStyle to return a known font-variation-settings on the target.
		const realGetComputedStyle = window.getComputedStyle.bind(window)
		jest.spyOn(window, 'getComputedStyle').mockImplementation((el, pseudo) => {
			const cs = realGetComputedStyle(el as Element, pseudo as string | null)
			return new Proxy(cs, {
				get(target, prop) {
					if (prop === 'getPropertyValue') {
						return (name: string) =>
							name === 'font-variation-settings'
								? '"opsz" 36'
								: (cs as CSSStyleDeclaration).getPropertyValue(name)
					}
					return (target as unknown as Record<string | symbol, unknown>)[prop]
				},
			})
		})

		const vfCalls: string[] = []
		const origSetProperty = CSSStyleDeclaration.prototype.setProperty
		jest
			.spyOn(CSSStyleDeclaration.prototype, 'setProperty')
			.mockImplementation(function (
				this: CSSStyleDeclaration,
				prop: string,
				value: string | null,
				priority?: string,
			) {
				if (prop === 'font-variation-settings' && value) vfCalls.push(value)
				return origSetProperty.call(this, prop, value, priority)
			})

		const { target } = setupDOM('test')
		fitFlush(target, { mode: 'width', vfSettings: { wght: { max: 900 } } })

		const merged = vfCalls.find((v) => v.includes('"wght" 900'))
		expect(merged).toBeDefined()
		expect(merged).toContain('"opsz" 36')
		expect(merged).toContain('"wght" 900')
	})
})

describe('fitFlush — size rounding', () => {
	it('rounds the written font-size to one decimal place', () => {
		mockMeasurement({ containerWidth: 500, containerHeight: 200 })
		const { target } = setupDOM('abcdefghij')
		fitFlush(target, { mode: 'width' })
		// fontSize should have at most one decimal digit
		const fs = target.style.fontSize
		const match = fs.match(/^(\d+\.?\d*)px$/)
		expect(match).not.toBeNull()
		const value = parseFloat(match![1])
		expect(value).toBeCloseTo(Math.round(value * 10) / 10, 10)
	})
})
