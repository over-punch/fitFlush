// React component wrapper for fit-flush — forwardRef with `as` prop.

import {
	forwardRef,
	type CSSProperties,
	type ElementType,
	type ReactNode,
	type Ref,
} from 'react'
import { useFitFlush } from './useFitFlush'
import type { FitFlushOptions } from '../core/types'

/** Props for <FitFlushText>. Spreads FitFlushOptions plus rendering props. */
export interface FitFlushTextProps extends FitFlushOptions {
	children: ReactNode
	as?: ElementType
	className?: string
	style?: CSSProperties
}

/**
 * Drop-in component that fits its children to the parent container.
 * Pass any FitFlushOptions as props, plus `as` to change the rendered element.
 */
export const FitFlushText = forwardRef<HTMLElement, FitFlushTextProps>(
	({ children, as: Tag = 'span', className, style, ...options }, forwardedRef) => {
		const innerRef = useFitFlush<HTMLElement>(options)

		// Merge forwarded ref with internal hook ref — both must point to the same node.
		const setRef = (node: HTMLElement | null) => {
			;(innerRef as { current: HTMLElement | null }).current = node
			if (typeof forwardedRef === 'function') {
				forwardedRef(node)
			} else if (forwardedRef) {
				;(forwardedRef as { current: HTMLElement | null }).current = node
			}
		}

		return (
			<Tag ref={setRef as Ref<HTMLElement>} className={className} style={style}>
				{children}
			</Tag>
		)
	},
)
FitFlushText.displayName = 'FitFlushText'
