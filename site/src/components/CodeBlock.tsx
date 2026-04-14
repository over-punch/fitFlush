// Minimal code block with copy button — no syntax highlighting dependency.

'use client'

import { useCallback, useState } from 'react'

/** Props for the CodeBlock component. */
interface CodeBlockProps {
	/** Code string to display. */
	code: string
	/** Optional label shown above the block. */
	label?: string
}

/** Styled <pre> block with click-to-copy. */
export default function CodeBlock({ code, label }: CodeBlockProps) {
	const [copied, setCopied] = useState(false)

	const handleCopy = useCallback(async () => {
		try {
			await navigator.clipboard.writeText(code)
			setCopied(true)
			setTimeout(() => setCopied(false), 1500)
		} catch {
			// Clipboard API not available
		}
	}, [code])

	return (
		<div className="relative rounded-xl overflow-hidden border border-[var(--color-border)]">
			{label && (
				<div className="px-4 py-2 bg-[var(--color-surface)] border-b border-[var(--color-border)] text-xs text-[var(--color-text-muted)] font-mono">
					{label}
				</div>
			)}
			<pre className="p-4 bg-[var(--color-bg)] overflow-x-auto text-sm leading-relaxed">
				<code className="text-[var(--color-text)] font-mono whitespace-pre">
					{code}
				</code>
			</pre>
			<button
				type="button"
				onClick={handleCopy}
				aria-label="Copy code"
				className="absolute top-2 right-2 px-2 py-1 text-xs rounded-md bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:border-[var(--color-accent-dim)] transition-colors cursor-pointer"
			>
				{copied ? 'Copied' : 'Copy'}
			</button>
		</div>
	)
}
