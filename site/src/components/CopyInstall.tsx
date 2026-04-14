// Click-to-copy npm install command.

'use client'

import { useCallback, useState } from 'react'

/** Package name for the install command. */
const PKG = '@liiift-studio/fit-flush'

/** Click-to-copy install button that shows a brief "Copied" confirmation. */
export default function CopyInstall() {
	const [copied, setCopied] = useState(false)

	const handleCopy = useCallback(async () => {
		try {
			await navigator.clipboard.writeText(`npm i ${PKG}`)
			setCopied(true)
			setTimeout(() => setCopied(false), 1500)
		} catch {
			// Clipboard API may not be available in all contexts
		}
	}, [])

	return (
		<button
			type="button"
			onClick={handleCopy}
			aria-label={`Copy install command: npm i ${PKG}`}
			className="group flex items-center gap-3 px-5 py-3 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-[var(--color-accent-dim)] transition-colors cursor-pointer"
		>
			<code className="text-sm font-mono text-[var(--color-accent)]">
				npm i {PKG}
			</code>
			<span className="text-xs text-[var(--color-text-muted)] group-hover:text-[var(--color-text)] transition-colors">
				{copied ? 'Copied' : 'Copy'}
			</span>
		</button>
	)
}
