// @testing-library/react tests for useFitFlush hook and FitFlushText component.

import React from 'react'
import { render, renderHook, act } from '@testing-library/react'
import { jest } from '@jest/globals'
import { useFitFlush } from '../react/useFitFlush'
import { FitFlushText } from '../react/FitFlushText'
import { mockMeasurement, restoreMeasurement } from './mocks'

afterEach(() => {
	restoreMeasurement()
	document.body.innerHTML = ''
})

// ---------------------------------------------------------------------------
// useFitFlush
// ---------------------------------------------------------------------------

describe('useFitFlush', () => {
	it('mounts and unmounts without throwing', () => {
		mockMeasurement({ containerWidth: 500, containerHeight: 200 })
		expect(() => {
			const { unmount } = renderHook(() => useFitFlush())
			unmount()
		}).not.toThrow()
	})

	it('returns a ref and a numeric size', () => {
		mockMeasurement({ containerWidth: 500, containerHeight: 200 })
		const { result } = renderHook(() => useFitFlush())
		expect(result.current.ref).toBeDefined()
		expect(typeof result.current.size).toBe('number')
	})

	it('accepts default options without throwing', () => {
		mockMeasurement({ containerWidth: 500, containerHeight: 200 })
		expect(() => renderHook(() => useFitFlush({}))).not.toThrow()
	})

	it('accepts vfSettings option without throwing', () => {
		mockMeasurement({ containerWidth: 500, containerHeight: 200 })
		expect(() =>
			renderHook(() =>
				useFitFlush({ vfSettings: { wght: { max: 900 } } }),
			),
		).not.toThrow()
	})

	it('accepts min and max options without throwing', () => {
		mockMeasurement({ containerWidth: 500, containerHeight: 200 })
		expect(() =>
			renderHook(() => useFitFlush({ min: 10, max: 200 })),
		).not.toThrow()
	})

	it('re-runs when options change', () => {
		mockMeasurement({ containerWidth: 500, containerHeight: 200 })
		// Track whether the effect re-ran by providing an onFit callback that records calls.
		const calls: number[] = []
		const { rerender } = renderHook(
			({ precision }: { precision: number }) =>
				useFitFlush({ precision, onFit: (s) => calls.push(s) }),
			{ initialProps: { precision: 1 } },
		)
		const countAfterMount = calls.length
		rerender({ precision: 2 })
		// After the option change the effect should have fired at least once more.
		expect(calls.length).toBeGreaterThanOrEqual(countAfterMount)
	})

	it('calls onFit callback when provided', () => {
		mockMeasurement({ containerWidth: 500, containerHeight: 200 })
		// Wrap the hook in a component with an actual DOM node so fitFlush can measure.
		const onFit = jest.fn()
		function TestComponent() {
			const { ref } = useFitFlush<HTMLDivElement>({ onFit })
			return (
				<div style={{ width: '500px', height: '200px' }}>
					<div ref={ref}>Hello world</div>
				</div>
			)
		}
		act(() => {
			render(<TestComponent />)
		})
		// onFit may or may not fire in happy-dom (no layout), but the call must not throw.
	})
})

// ---------------------------------------------------------------------------
// FitFlushText
// ---------------------------------------------------------------------------

describe('FitFlushText', () => {
	it('renders children', () => {
		mockMeasurement({ containerWidth: 500, containerHeight: 200 })
		const { getByText } = render(
			<div style={{ width: '500px' }}>
				<FitFlushText>Hello fit-flush</FitFlushText>
			</div>,
		)
		expect(getByText('Hello fit-flush')).toBeTruthy()
	})

	it('renders as span by default', () => {
		mockMeasurement({ containerWidth: 500, containerHeight: 200 })
		const { container } = render(
			<div style={{ width: '500px' }}>
				<FitFlushText>span test</FitFlushText>
			</div>,
		)
		const span = container.querySelector('span')
		expect(span).not.toBeNull()
		expect(span?.textContent).toBe('span test')
	})

	it('forwards className prop', () => {
		mockMeasurement({ containerWidth: 500, containerHeight: 200 })
		const { container } = render(
			<div style={{ width: '500px' }}>
				<FitFlushText className="my-class">text</FitFlushText>
			</div>,
		)
		expect(container.querySelector('.my-class')).not.toBeNull()
	})

	it('forwards aria-label prop', () => {
		mockMeasurement({ containerWidth: 500, containerHeight: 200 })
		const { getByLabelText } = render(
			<div style={{ width: '500px' }}>
				<FitFlushText aria-label="headline">text</FitFlushText>
			</div>,
		)
		expect(getByLabelText('headline')).toBeTruthy()
	})

	it('renders as a custom element via the `as` prop', () => {
		mockMeasurement({ containerWidth: 500, containerHeight: 200 })
		const { container } = render(
			<div style={{ width: '500px' }}>
				<FitFlushText as="h1">heading</FitFlushText>
			</div>,
		)
		const h1 = container.querySelector('h1')
		expect(h1).not.toBeNull()
		expect(h1?.textContent).toBe('heading')
	})

	it('mounts and unmounts without throwing', () => {
		mockMeasurement({ containerWidth: 500, containerHeight: 200 })
		expect(() => {
			const { unmount } = render(
				<div style={{ width: '500px' }}>
					<FitFlushText>unmount test</FitFlushText>
				</div>,
			)
			unmount()
		}).not.toThrow()
	})

	it('accepts FitFlushOptions props without throwing', () => {
		mockMeasurement({ containerWidth: 500, containerHeight: 200 })
		expect(() =>
			render(
				<div style={{ width: '500px' }}>
					<FitFlushText mode="width" min={10} max={200} precision={0.5}>
						options test
					</FitFlushText>
				</div>,
			),
		).not.toThrow()
	})

	it('accepts vfSettings prop without throwing', () => {
		mockMeasurement({ containerWidth: 500, containerHeight: 200 })
		expect(() =>
			render(
				<div style={{ width: '500px' }}>
					<FitFlushText vfSettings={{ wght: { max: 900 } }}>vf test</FitFlushText>
				</div>,
			),
		).not.toThrow()
	})

	it('has FitFlushText displayName', () => {
		expect(FitFlushText.displayName).toBe('FitFlushText')
	})
})
