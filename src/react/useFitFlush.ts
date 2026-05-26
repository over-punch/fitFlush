// React hook wrapping fitFlush with ResizeObserver + fonts.ready auto-refit.

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { fitFlush } from '../core/adjust'
import type { FitFlushOptions } from '../core/types'

/** useLayoutEffect warns in SSR; fall back to useEffect when window is missing. */
const useIsomorphicLayoutEffect =
	typeof window !== 'undefined' ? useLayoutEffect : useEffect

/**
 * React hook that fits text inside the ref'd element to its parent container.
 * Re-runs on container resize (width + height), after web fonts load, and
 * whenever options change. Returns { ref, size } — size is the last computed
 * font-size in px (0 before first measurement).
 */
export function useFitFlush<T extends HTMLElement = HTMLElement>(
	options: FitFlushOptions = {},
): { ref: React.RefObject<T | null>; size: number } {
	const ref = useRef<T>(null)
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
		const el = ref.current
		if (!el) return

		let lastWidth = 0
		let lastHeight = 0
		let rafId = 0
		let cancelled = false

		const run = () => {
			if (cancelled) return
			const s = fitFlush(el, optionsRef.current)
			setSize(s)
		}

		run()

		const resolvedContainer = optionsRef.current.container ?? el.parentElement
		let ro: ResizeObserver | null = null
		if (resolvedContainer && typeof ResizeObserver !== 'undefined') {
			ro = new ResizeObserver((entries) => {
				const w = Math.round(entries[0].contentRect.width)
				const h = Math.round(entries[0].contentRect.height)
				if (w === lastWidth && h === lastHeight) return
				lastWidth = w
				lastHeight = h
				cancelAnimationFrame(rafId)
				rafId = requestAnimationFrame(run)
			})
			ro.observe(resolvedContainer)
		}

		document.fonts?.ready?.then(() => { if (!cancelled) run() }).catch(() => {})

		return () => {
			cancelled = true
			ro?.disconnect()
			cancelAnimationFrame(rafId)
		}
	}, [mode, min, max, precision, padX, padY, vfKey, container])

	return { ref, size }
}
