// React hook wrapping fitFlush with ResizeObserver + fonts.ready auto-refit.

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { fitFlushLive } from '../core/adjust.js'
import type { FitFlushOptions } from '../core/types.js'

/** useLayoutEffect warns in SSR; fall back to useEffect when window is missing. */
const useIsomorphicLayoutEffect =
	typeof window !== 'undefined' ? useLayoutEffect : useEffect

/**
 * React hook that fits text inside the ref'd element to its parent container.
 * Re-runs on container resize (width + height), when the text changes, after web fonts load,
 * and whenever options change; follows the element if React replaces it. Returns { ref, size } — size is the last computed
 * font-size in px (0 before first measurement).
 */
export function useFitFlush<T extends HTMLElement = HTMLElement>(
	options: FitFlushOptions = {},
): { ref: React.RefObject<T | null>; size: number } {
	// A ref that re-renders when React attaches a different element (a conditional remount, a
	// changed `as`), so the live fit moves to the new element instead of the detached old one.
	const [node, setNode] = useState<T | null>(null)
	const ref = useMemo(() => {
		let current: T | null = null
		return {
			get current() { return current },
			set current(el: T | null) {
				if (el === current) return
				current = el
				setNode(el)
			},
		} as React.RefObject<T | null>
	}, [])
	const optionsRef = useRef(options)
	optionsRef.current = options
	const [size, setSize] = useState(0)

	// Pull out primitives that should trigger a re-run when they change.
	const { mode, min, max, precision } = options
	const padX =
		typeof options.padding === 'number' ? options.padding : options.padding?.x ?? 0
	const padY =
		typeof options.padding === 'number' ? options.padding : options.padding?.y ?? 0
	// Stringify vfSettings so object identity doesn't prevent updates.
	const vfKey = options.vfSettings ? JSON.stringify(options.vfSettings) : ''
	// Include container directly — if it changes, re-attach the ResizeObserver.
	const container = options.container ?? null

	useIsomorphicLayoutEffect(() => {
		const el = node
		if (!el) return

		// The live handle refits on container resize, text changes (children) and font loads,
		// and restores the element's styles when disposed.
		const handle = fitFlushLive(el, {
			...optionsRef.current,
			onFit: (s) => {
				setSize(s)
				optionsRef.current.onFit?.(s)
			},
		})

		return () => handle.dispose()
	}, [node, mode, min, max, precision, padX, padY, vfKey, container])

	return { ref, size }
}
