// Core algorithm tests for fit-flush.

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
	it('respects the stricter of width and height constraints', () => {
		// width: 5*size <= 100 → size <= 20
		// height: 1.2*size <= 240 → size <= 200
		// both → 20 wins
		mockMeasurement({ containerWidth: 100, containerHeight: 240 })
		const { target } = setupDOM('abcdefghij')
		const size = fitFlush(target, { mode: 'both', min: 8, max: 400 })
		expect(size).toBeGreaterThan(19)
		expect(size).toBeLessThanOrEqual(20)
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
