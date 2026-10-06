// Public API exports for @overpunch/fit-flush.
// React-specific exports (useFitFlush, FitFlushText) live in the ./react subpath
// to keep vanilla-JS bundles free of React imports.

export { fitFlush, fitFlushLive, removeFitFlush } from './core/adjust.js'
export { FIT_FLUSH_CLASSES, DEFAULTS } from './core/types.js'
export type { FitFlushOptions, FitFlushHandle } from './core/types.js'
