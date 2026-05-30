// Public API exports for @liiift-studio/fit-flush.
// React-specific exports (useFitFlush, FitFlushText) live in the ./react subpath
// to keep vanilla-JS bundles free of React imports.

export { fitFlush, fitFlushLive } from './core/adjust'
export { FIT_FLUSH_CLASSES, DEFAULTS } from './core/types'
export type { FitFlushOptions, FitFlushHandle } from './core/types'
