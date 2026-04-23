// Public types, constants, and defaults for @liiift-studio/fit-flush.

/**
 * Options for fitting text into a container. All fields optional.
 */
export interface FitFlushOptions {
	/**
	 * Which container dimension(s) to fit.
	 *  - 'width'  : single-line, no wrap — fit width only (uses analytical fast path)
	 *  - 'height' : paragraph reflow — fit height only
	 *  - 'both'   : largest size that satisfies both width and height (default)
	 */
	mode?: 'width' | 'height' | 'both'

	/** Minimum font-size in px. Default: 8. */
	min?: number

	/** Maximum font-size in px. Default: 400. */
	max?: number

	/** Convergence precision in px — binary search stops within this. Default: 0.5. */
	precision?: number

	/** Inset from container edges in px. Number = all sides; object = per-axis. Default: 0. */
	padding?: number | { x?: number; y?: number }

	/**
	 * Variable-font axis ranges. When provided, measurement runs with every axis
	 * held at its `max`, so the computed size stays safe under later axis animation.
	 * Example: { wght: { max: 900 }, wdth: { max: 125 } }
	 */
	vfSettings?: Record<string, { min?: number; default?: number; max: number }>

	/** Optional container override. Defaults to `target.parentElement`. */
	container?: HTMLElement | null

	/** Called after every successful fit with the computed font-size in px. */
	onFit?: (size: number) => void
}

/**
 * Live handle returned by fitFlushLive. Auto-refits on container resize and
 * after web fonts load; call dispose() to stop observing and restore the original size.
 */
export interface FitFlushHandle {
	/** Most recent computed font-size in px. */
	readonly size: number
	/** Re-run the fit now, e.g. after changing text content. Returns the new size. */
	refit: () => number
	/** Stop observing, restore the original inline fontSize on the target. */
	dispose: () => void
}

/** CSS classes injected by fit-flush. Exposed for test mocks and advanced overrides. */
export const FIT_FLUSH_CLASSES = {
	probe: 'ff-probe',
} as const

/** Internal defaults applied when an option is not supplied. */
export const DEFAULTS = {
	mode: 'both' as const,
	min: 8,
	max: 400,
	precision: 0.5,
	padding: 0,
} as const
