// React hook wrapping fitFlush with ResizeObserver + fonts.ready auto-refit.

import { useEffect, useLayoutEffect, useRef } from 'react'
import { fitFlush } from '../core/adjust'
import type { FitFlushOptions } from '../core/types'

/** useLayoutEffect warns in SSR; fall back to useEffect when window is missing. */
const useIsomorphicLayoutEffect =
	typeof window !== 'undefined' ? useLayoutEffect : useEffect

/**
 * React hook that fits text inside the ref'd element to its parent container.
 * Re-runs on container resize (width + height) and after web fonts load.
 * Cleans up observers on unmount.
 */
export function useFitFlush<T extends HTMLElement = HTMLElement>(
	options: FitFlushOptions = {},
) {
	const ref = useRef<T>(null)
	const optionsRef = useRef(options)
	optionsRef.current = options

	// Pull out the primitive options that should trigger a re-run.
	const { mode, min, max, precision } = options
	const padX =
		typeof options.padding === 'number' ? options.padding : options.padding?.x ?? 0
	const padY =
		typeof options.padding === 'number' ? options.padding : options.padding?.y ?? 0

	useIsomorphicLayoutEffect(() => {
		const el = ref.current
		if (!el) return

		let lastWidth = 0
		let lastHeight = 0
		let rafId = 0
		let cancelled = false

		const run = () => {
			if (cancelled) return
			fitFlush(el, optionsRef.current)
		}

		run()

		const container = optionsRef.current.container ?? el.parentElement
		let ro: ResizeObserver | null = null
		if (container && typeof ResizeObserver !== 'undefined') {
			ro = new ResizeObserver((entries) => {
				const w = Math.round(entries[0].contentRect.width)
				const h = Math.round(entries[0].contentRect.height)
				if (w === lastWidth && h === lastHeight) return
				lastWidth = w
				lastHeight = h
				cancelAnimationFrame(rafId)
				rafId = requestAnimationFrame(run)
			})
			ro.observe(container)
		}

		if (typeof document !== 'undefined' && document.fonts && document.fonts.ready) {
			document.fonts.ready
				.then(() => {
					if (!cancelled) run()
				})
				.catch(() => {})
		}

		return () => {
			cancelled = true
			ro?.disconnect()
			cancelAnimationFrame(rafId)
		}
	}, [mode, min, max, precision, padX, padY])

	return ref
}
