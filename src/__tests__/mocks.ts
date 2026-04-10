// Shared happy-dom measurement mocks for fit-flush tests.
// The probe class MUST return a size derived from the probe's current fontSize
// so the algorithm can find a valid fit. Containers return fixed dimensions.

import { jest } from '@jest/globals'
import { FIT_FLUSH_CLASSES } from '../core/types'

/** Configuration for the mock measurement layer installed before each test. */
export interface MockDims {
	/** Container width in px. */
	containerWidth: number
	/** Container height in px. */
	containerHeight: number
	/**
	 * Function mapping a probe's current fontSize (px) to its measured width.
	 * Default: perfectly linear — width = fontSize * textLength * 0.5.
	 */
	probeWidth?: (fontSizePx: number, text: string) => number
	/**
	 * Function mapping a probe's current fontSize (px) to its measured height.
	 * Default: roughly 1.2 * fontSize.
	 */
	probeHeight?: (fontSizePx: number, text: string) => number
}

/**
 * Install getBoundingClientRect / offsetWidth / offsetHeight mocks for tests.
 * Call at the top of each test with a fresh dims configuration.
 */
export function mockMeasurement(dims: MockDims) {
	const {
		containerWidth,
		containerHeight,
		probeWidth = (size, text) => size * text.length * 0.5,
		probeHeight = (size) => size * 1.2,
	} = dims

	const getSize = (el: HTMLElement): { w: number; h: number } => {
		if (el.classList?.contains(FIT_FLUSH_CLASSES.probe)) {
			const sizeStr = el.style.fontSize || '0px'
			const size = parseFloat(sizeStr) || 0
			const text = el.textContent ?? ''
			return { w: probeWidth(size, text), h: probeHeight(size, text) }
		}
		return { w: containerWidth, h: containerHeight }
	}

	jest
		.spyOn(Element.prototype, 'getBoundingClientRect')
		.mockImplementation(function (this: Element) {
			const { w, h } = getSize(this as HTMLElement)
			return {
				width: w,
				height: h,
				top: 0,
				left: 0,
				right: w,
				bottom: h,
				x: 0,
				y: 0,
				toJSON: () => ({}),
			} as DOMRect
		})
}

/** Restore all mocks installed by mockMeasurement. */
export function restoreMeasurement() {
	jest.restoreAllMocks()
}
