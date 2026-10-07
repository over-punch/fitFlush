// fitFlush landing page — hero, live demo, variable-font safety demo, how it works, usage, API, footer

import Demo, { VfSafetyDemo } from "@/components/Demo"
import Hero from "@/components/Hero"
import CodeBlock from "@/components/CodeBlock"
import SiteFooter from "@/components/SiteFooter"
import PortsSection from "@/components/PortsSection"
import { version } from "../../../package.json"
import { version as siteVersion } from "../../package.json"

/** Landing page with hero demo, install command, and code examples. */
export default function Home() {
	return (
		<main className="flex flex-col items-center px-6 py-20 gap-24">

			{/* Hero */}
			<Hero
				eyebrow="text-to-fit sizing"
				title={[{ text: "Fit text to" }, { text: "any container.", italic: true, subtle: true }]}
				install="@overpunch/fit-flush"
				github="https://github.com/over-punch/fitFlush"
				tech={["TypeScript", "Zero dependencies", "React + Vanilla JS"]}
			>
				<p className="text-base leading-relaxed max-w-lg">
					CSS can&rsquo;t scale a font to fill a container — <code className="text-xs font-mono">font-size</code>{" "}doesn&rsquo;t know where to stop. Fit Flush binary-searches the right size to within half a pixel, with variable-font safety built in.
				</p>
			</Hero>

			{/* Demo */}
			<section className="w-full max-w-2xl lg:max-w-5xl flex flex-col gap-4">
				<h2 className="text-xs uppercase tracking-[0.18em] font-medium text-muted">Live demo — drag the sliders</h2>
				<div className="rounded-xl -mx-6 px-6 sm:-mx-8 sm:px-8 py-8" style={{ background: "var(--panel)", overflow: "hidden" }}>
					<Demo />
				</div>
			</section>

			{/* Variable-font safety demo */}
			<section className="w-full max-w-2xl lg:max-w-5xl flex flex-col gap-4">
				<h2 className="text-xs uppercase tracking-[0.18em] font-medium text-muted">Variable fonts — animate the weight after the fit</h2>
				<div className="rounded-xl -mx-6 px-6 sm:-mx-8 sm:px-8 py-8" style={{ background: "var(--panel)", overflow: "hidden" }}>
					<VfSafetyDemo />
				</div>
			</section>

			{/* Explanation */}
			<section className="w-full max-w-2xl lg:max-w-5xl flex flex-col gap-6">
				<h2 className="text-xs uppercase tracking-[0.18em] font-medium text-muted">How it works</h2>
				<div className="prose-grid grid grid-cols-1 sm:grid-cols-2 gap-12 text-sm leading-relaxed">
					<div className="flex flex-col gap-3">
						<p className="font-semibold text-base">CSS can&rsquo;t fit a font size</p>
						<p>There&rsquo;s no CSS property that says &ldquo;make this text as large as it can be while staying inside its container.&rdquo; <code className="text-xs font-mono">clamp()</code> just rescales, and <code className="text-xs font-mono">vw</code> units don&rsquo;t know about your layout. You need measurement.</p>
					</div>
					<div className="flex flex-col gap-3">
						<p className="font-semibold text-base">About a dozen measurements</p>
						<p>Fit Flush probes a hidden clone of the element — try a size, measure, narrow the range. In height and both modes it binary-searches to within 0.5 px in about 12 measurements; a single line in width mode is predicted from one measurement and checked, usually 3 in all. Nothing visible moves until the final size is written.</p>
					</div>
					<div className="flex flex-col gap-3">
						<p className="font-semibold text-base">Variable-font safe</p>
						<p>Pass <code className="text-xs font-mono">vfSettings</code> with your axis ranges and Fit Flush measures with every axis at its <code className="text-xs font-mono">max</code>, so the size still fits when an animation drives the axis there. An optical-size axis is widest at its minimum: give <code className="text-xs font-mono">min</code> too and both ends are checked.</p>
					</div>
					<div className="flex flex-col gap-3">
						<p className="font-semibold text-base">Resize-aware, font-load-aware</p>
						<p>The live API fits straight away, then refits when the container resizes (a ResizeObserver), when the text changes, and when web fonts finish loading (<code className="text-xs font-mono">document.fonts.ready</code>), so a size measured with the fallback font is replaced.</p>
					</div>
				</div>
			</section>

			{/* Usage */}
			<section className="w-full max-w-2xl lg:max-w-5xl flex flex-col gap-6">
				<div className="flex items-baseline gap-4">
					<h2 className="text-xs uppercase tracking-[0.18em] font-medium text-muted">Usage</h2>
					<p className="text-xs text-muted tracking-wide">TypeScript + React &middot; Vanilla JS</p>
				</div>
				<div className="flex flex-col gap-8 text-sm">
					<div className="flex flex-col gap-3">
						<p className="text-muted">Drop-in component</p>
						<CodeBlock code={`import { FitFlushText } from '@overpunch/fit-flush/react'

<FitFlushText mode="width">
  Display Headline
</FitFlushText>`} />
					</div>
					<div className="flex flex-col gap-3">
						<p className="text-muted">Hook — attach to any element</p>
						<CodeBlock code={`import { useFitFlush } from '@overpunch/fit-flush/react'

const { ref } = useFitFlush({ mode: 'both' })
<h1 ref={ref}>Display Headline</h1>`} />
					</div>
					<div className="flex flex-col gap-3">
						<p className="text-muted">Vanilla JS — one-shot</p>
						<CodeBlock code={`import { fitFlush } from '@overpunch/fit-flush'

const el = document.querySelector('h1')
fitFlush(el, { mode: 'width', min: 12, max: 400 })

// Undo it: restores the original inline styles
// removeFitFlush(el)`} />
					</div>
					<div className="flex flex-col gap-3">
						<p className="text-muted">Vanilla JS — live (refits on resize, text change and font load)</p>
						<CodeBlock code={`import { fitFlushLive } from '@overpunch/fit-flush'

const handle = fitFlushLive(el, {
  mode: 'both',
  // Variable font safety — measure at each axis' widest end
  vfSettings: { wdth: { max: 125 }, wght: { max: 900 } },
})

// Later:
handle.refit()  // force re-measurement
handle.dispose() // restore original fontSize, whiteSpace, and --ff-size`} />
					</div>
					<div className="flex flex-col gap-3">
						<p className="text-muted">Options</p>
						<table className="w-full text-xs" aria-label="fitFlush options reference">
							<thead>
								<tr className="text-subtle text-left">
									<th className="pb-2 pr-6 font-normal">Option</th>
									<th className="pb-2 pr-6 font-normal">Default</th>
									<th className="pb-2 font-normal">Description</th>
								</tr>
							</thead>
							<tbody className="text-muted zebra">
								<tr className="hover:bg-foreground/5 transition-colors"><td className="py-2 pr-6 font-mono">mode</td><td className="py-2 pr-6">&apos;both&apos;</td><td className="py-2">Which dimension to fill: <code className="font-mono">&apos;width&apos;</code> (one line), <code className="font-mono">&apos;height&apos;</code>, or <code className="font-mono">&apos;both&apos;</code>. Height and both need a container with a height of its own.</td></tr>
								<tr className="hover:bg-foreground/5 transition-colors"><td className="py-2 pr-6 font-mono">min</td><td className="py-2 pr-6">8</td><td className="py-2">Minimum font-size in px.</td></tr>
								<tr className="hover:bg-foreground/5 transition-colors"><td className="py-2 pr-6 font-mono">max</td><td className="py-2 pr-6">400</td><td className="py-2">Maximum font-size in px.</td></tr>
								<tr className="hover:bg-foreground/5 transition-colors"><td className="py-2 pr-6 font-mono">precision</td><td className="py-2 pr-6">0.5</td><td className="py-2">Convergence tolerance in px — binary search stops within this gap.</td></tr>
								<tr className="hover:bg-foreground/5 transition-colors"><td className="py-2 pr-6 font-mono">padding</td><td className="py-2 pr-6">0</td><td className="py-2">Inset from container edges in px. Number = all sides; <code className="font-mono">{`{ x, y }`}</code> = per-axis.</td></tr>
								<tr className="hover:bg-foreground/5 transition-colors"><td className="py-2 pr-6 font-mono">vfSettings</td><td className="py-2 pr-6">—</td><td className="py-2">Variable-font axis ranges, e.g. <code className="font-mono">{`{ wght: { max: 900 } }`}</code>. Measurement uses each axis at its <code className="font-mono">max</code> (and at its <code className="font-mono">min</code>, where given) for worst-case safety.</td></tr>
								<tr className="hover:bg-foreground/5 transition-colors"><td className="py-2 pr-6 font-mono">container</td><td className="py-2 pr-6">parentElement</td><td className="py-2">Override the container element used for dimension measurement.</td></tr>
								<tr className="hover:bg-foreground/5 transition-colors"><td className="py-2 pr-6 font-mono">onFit</td><td className="py-2 pr-6">—</td><td className="py-2">Callback fired after each fit that wrote a size, receiving the resolved font-size in px.</td></tr>
							</tbody>
						</table>
					</div>
				</div>
			</section>

			<PortsSection
				npm="@overpunch/fit-flush"
				bundle="fitflush"
				attr="data-fitflush" figma="partial"
				framerComponent="FitFlush"
				repo="over-punch/fitFlush"
			/>

			{/* Footer */}
			<SiteFooter current="fitFlush" npmVersion={version} siteVersion={siteVersion} />

		</main>
	)
}
