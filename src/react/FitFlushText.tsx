// React component wrapper for fit-flush — forwardRef with `as` prop.

import {
	forwardRef,
	useCallback,
	type AriaAttributes,
	type CSSProperties,
	type ElementType,
	type HTMLAttributes,
	type ReactNode,
	type Ref,
} from 'react'
import { useFitFlush } from './useFitFlush'
import type { FitFlushOptions } from '../core/types'

/** Props for <FitFlushText>. Spreads FitFlushOptions plus HTML/ARIA attributes. */
export interface FitFlushTextProps
	extends FitFlushOptions,
		AriaAttributes,
		Omit<HTMLAttributes<HTMLElement>, 'style' | 'className' | 'children'> {
	children: ReactNode
	as?: ElementType
	className?: string
	style?: CSSProperties
}

/**
 * Drop-in component that fits its children to the parent container.
 * Pass any FitFlushOptions as props, plus `as` to change the rendered element,
 * and any ARIA or HTML attributes — they are forwarded to the DOM element.
 */
export const FitFlushText = forwardRef<HTMLElement, FitFlushTextProps>(
	(
		{
			children,
			as: Tag = 'span',
			className,
			style,
			// FitFlushOptions — consumed by the hook, not spread to DOM
			mode, min, max, precision, padding, vfSettings, container, onFit,
			// Everything else (ARIA, data-*, event handlers, etc.)
			...htmlProps
		},
		forwardedRef,
	) => {
		const { ref: innerRef } = useFitFlush<HTMLElement>({
			mode, min, max, precision, padding, vfSettings, container, onFit,
		})

		// Merge forwarded ref with internal hook ref — both must point to the same node.
		// Memoised so the callback ref identity stays stable across renders, preventing
		// React from calling the old ref with null + new ref with node on every render.
		const setRef = useCallback((node: HTMLElement | null) => {
			;(innerRef as { current: HTMLElement | null }).current = node
			if (typeof forwardedRef === 'function') {
				forwardedRef(node)
			} else if (forwardedRef) {
				;(forwardedRef as { current: HTMLElement | null }).current = node
			}
		}, [forwardedRef]) // innerRef is a stable React ref object

		return (
			<Tag
				ref={setRef as Ref<HTMLElement>}
				className={className}
				style={style}
				{...htmlProps}
			>
				{children}
			</Tag>
		)
	},
)
FitFlushText.displayName = 'FitFlushText'
