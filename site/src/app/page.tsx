// Landing page for fit-flush.com — interactive demo with code examples.

import Demo from '@/components/Demo'
import CopyInstall from '@/components/CopyInstall'
import CodeBlock from '@/components/CodeBlock'

/** React component usage example. */
const EXAMPLE_COMPONENT = `import { FitFlushText } from '@liiift-studio/fit-flush'

export function Hero() {
  return (
    <div style={{ width: '100%' }}>
      <FitFlushText as="h1" mode="width" max={400}>
        Your Headline
      </FitFlushText>
    </div>
  )
}`

/** React hook usage example. */
const EXAMPLE_HOOK = `import { useFitFlush } from '@liiift-studio/fit-flush'

export function Title({ text }: { text: string }) {
  const ref = useFitFlush({ mode: 'width', precision: 0.25 })

  return (
    <div style={{ width: '100%' }}>
      <h1 ref={ref}>{text}</h1>
    </div>
  )
}`

/** Vanilla JS usage example. */
const EXAMPLE_VANILLA = `import { fitFlushLive } from '@liiift-studio/fit-flush'

const el = document.querySelector('h1')
const handle = fitFlushLive(el, {
  mode: 'width',
  max: 400,
  vfSettings: { wght: { max: 900 } },
})

// Later: handle.dispose()`

/** Landing page with hero demo, install command, and code examples. */
export default function Home() {
	return (
		<main className="mx-auto max-w-3xl px-6 py-16 flex flex-col gap-16">
			{/* Hero */}
			<header className="flex flex-col gap-4">
				<p className="text-sm font-mono text-[var(--color-accent)] tracking-wide uppercase">
					Liiift Studio / type-tools
				</p>
				<h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
					fit-flush
				</h1>
				<p className="text-lg text-[var(--color-text-muted)] max-w-xl leading-relaxed">
					Fit text to its container with binary-search precision. Variable-font
					axis safety keeps headlines stable when weight, width, or any axis
					animates to its max.
				</p>
				<div className="pt-2">
					<CopyInstall />
				</div>
			</header>

			{/* Live demo */}
			<section className="flex flex-col gap-4">
				<h2 className="text-xl font-semibold">Try it</h2>
				<Demo />
			</section>

			{/* Code examples */}
			<section className="flex flex-col gap-6">
				<h2 className="text-xl font-semibold">Usage</h2>
				<CodeBlock label="Component" code={EXAMPLE_COMPONENT} />
				<CodeBlock label="Hook" code={EXAMPLE_HOOK} />
				<CodeBlock label="Vanilla JS" code={EXAMPLE_VANILLA} />
			</section>

			{/* Features */}
			<section className="flex flex-col gap-4">
				<h2 className="text-xl font-semibold">How it works</h2>
				<ul className="flex flex-col gap-3 text-[var(--color-text-muted)] leading-relaxed">
					<li>
						<strong className="text-[var(--color-text)]">Width mode</strong>
						{' '}— analytical fast path. Measures once, predicts the exact size,
						verifies with a single corrective pass. No iteration needed.
					</li>
					<li>
						<strong className="text-[var(--color-text)]">Height / both modes</strong>
						{' '}— binary search converges within your precision threshold
						(default 0.5px). Handles paragraph reflow where analytical prediction
						is unreliable.
					</li>
					<li>
						<strong className="text-[var(--color-text)]">Variable font safety</strong>
						{' '}— pass axis ranges and the measurement probe holds every axis
						at its worst-case max, so the computed size stays safe under later
						axis animation.
					</li>
					<li>
						<strong className="text-[var(--color-text)]">SSR safe</strong>
						{' '}— returns 0 on the server, no hydration mismatch. The fit runs
						on first layout effect.
					</li>
					<li>
						<strong className="text-[var(--color-text)]">Scroll restoration</strong>
						{' '}— built into the core, not the React layer. iOS Safari ignores{' '}
						<code className="text-xs font-mono text-[var(--color-accent)]">
							overflow-anchor
						</code>
						, so rAF restore catches every jump.
					</li>
				</ul>
			</section>

			{/* Footer */}
			<footer className="flex gap-6 text-sm text-[var(--color-text-muted)] border-t border-[var(--color-border)] pt-8">
				<a
					href="https://github.com/Liiift-Studio/FitFlush"
					className="hover:text-[var(--color-text)] transition-colors"
				>
					GitHub
				</a>
				<a
					href="https://www.npmjs.com/package/@liiift-studio/fit-flush"
					className="hover:text-[var(--color-text)] transition-colors"
				>
					npm
				</a>
				<a
					href="https://liiift.studio"
					className="hover:text-[var(--color-text)] transition-colors"
				>
					Liiift Studio
				</a>
			</footer>
		</main>
	)
}
