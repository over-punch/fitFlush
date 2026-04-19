// fitFlush landing page — hero, live demo, how it works, usage, API, footer

import Demo from "@/components/Demo"
import CopyInstall from "@/components/CopyInstall"
import CodeBlock from "@/components/CodeBlock"
import SiteFooter from "@/components/SiteFooter"
import { version } from "../../../package.json"
import { version as siteVersion } from "../../package.json"

/** Landing page with hero demo, install command, and code examples. */
export default function Home() {
	return (
		<main className="flex flex-col items-center px-6 py-20 gap-24">

			{/* Hero */}
			<section className="w-full max-w-2xl lg:max-w-5xl flex flex-col gap-6">
				<div className="flex flex-col gap-2">
					<p className="text-xs uppercase tracking-widest opacity-50">fitFlush</p>
					<h1 className="text-4xl lg:text-8xl xl:text-9xl" style={{ lineHeight: "1.05em", letterSpacing: "-0.02em", fontFamily: "var(--font-merriweather), serif", fontWeight: 700 }}>
						Fit text to<br />
						<span style={{ opacity: 0.5, fontStyle: "italic" }}>any container.</span>
					</h1>
				</div>
				<div className="flex items-center gap-4">
					<CopyInstall />
					<a href="https://github.com/Liiift-Studio/fitFlush" className="text-sm opacity-50 hover:opacity-100 transition-opacity">GitHub</a>
				</div>
				<div className="flex flex-wrap gap-x-4 gap-y-1 text-xs opacity-50 tracking-wide">
					<span>TypeScript</span><span>&middot;</span><span>Zero dependencies</span><span>&middot;</span><span>React + Vanilla JS</span>
				</div>
				<p className="text-base opacity-60 leading-relaxed max-w-lg">
					CSS can&apos;t scale a font to fill a container — <code className="text-xs font-mono">font-size</code> doesn&apos;t know where to stop. Fit Flush binary-searches the right size to within half a pixel, with variable-font safety built in.
				</p>
			</section>

			{/* Demo */}
			<section className="w-full max-w-2xl lg:max-w-5xl flex flex-col gap-4">
				<p className="text-xs uppercase tracking-widest opacity-50">Live demo — drag the sliders</p>
				<div className="rounded-xl -mx-8 px-8 py-8" style={{ background: "rgba(0,0,0,0.25)", overflow: "hidden" }}>
					<Demo />
				</div>
			</section>

			{/* Explanation */}
			<section className="w-full max-w-2xl lg:max-w-5xl flex flex-col gap-6">
				<p className="text-xs uppercase tracking-widest opacity-50">How it works</p>
				<div className="prose-grid grid grid-cols-1 sm:grid-cols-2 gap-12 text-sm leading-relaxed opacity-70">
					<div className="flex flex-col gap-3">
						<p className="font-semibold opacity-100 text-base">CSS can&apos;t fit a font size</p>
						<p>There&apos;s no CSS property that says &ldquo;make this text as large as it can be while staying inside its container.&rdquo; <code className="text-xs font-mono">clamp()</code> just rescales, and <code className="text-xs font-mono">vw</code> units don&apos;t know about your layout. You need measurement.</p>
					</div>
					<div className="flex flex-col gap-3">
						<p className="font-semibold opacity-100 text-base">Binary search in 15–20 steps</p>
						<p>Fit Flush probes a hidden clone of the element — try a size, measure, compare to target, narrow the range. It converges to within 0.5 px in under 20 iterations with no visible reflow.</p>
					</div>
					<div className="flex flex-col gap-3">
						<p className="font-semibold opacity-100 text-base">Variable-font safe</p>
						<p>Pass <code className="text-xs font-mono">vfSettings</code> with your axis ranges and Fit Flush measures at the widest/heaviest axis values. The computed size stays correct even when a subsequent animation drives the axis to its maximum.</p>
					</div>
					<div className="flex flex-col gap-3">
						<p className="font-semibold opacity-100 text-base">Resize-aware, font-load-aware</p>
						<p>The live API wraps a ResizeObserver on the container and waits for <code className="text-xs font-mono">document.fonts.ready</code> before the first measurement. Widths from before the web font loaded are never committed.</p>
					</div>
				</div>
			</section>

			{/* Usage */}
			<section className="w-full max-w-2xl lg:max-w-5xl flex flex-col gap-6">
				<div className="flex items-baseline gap-4">
					<p className="text-xs uppercase tracking-widest opacity-50">Usage</p>
					<p className="text-xs opacity-50 tracking-wide">TypeScript + React &middot; Vanilla JS</p>
				</div>
				<div className="flex flex-col gap-8 text-sm">
					<div className="flex flex-col gap-3">
						<p className="opacity-50">Drop-in component</p>
						<CodeBlock code={`import { FitFlushText } from '@liiift-studio/fit-flush'

<FitFlushText mode="width">
  Display Headline
</FitFlushText>`} />
					</div>
					<div className="flex flex-col gap-3">
						<p className="opacity-50">Hook — attach to any element</p>
						<CodeBlock code={`import { useFitFlush } from '@liiift-studio/fit-flush'

const ref = useFitFlush({ mode: 'both' })
<h1 ref={ref}>Display Headline</h1>`} />
					</div>
					<div className="flex flex-col gap-3">
						<p className="opacity-50">Vanilla JS — one-shot</p>
						<CodeBlock code={`import { fitFlush } from '@liiift-studio/fit-flush'

const el = document.querySelector('h1')
fitFlush(el, { mode: 'width', min: 12, max: 400 })`} />
					</div>
					<div className="flex flex-col gap-3">
						<p className="opacity-50">Vanilla JS — live (ResizeObserver + fonts.ready)</p>
						<CodeBlock code={`import { fitFlushLive } from '@liiift-studio/fit-flush'

const handle = fitFlushLive(el, {
  mode: 'both',
  // Variable font safety — measure at widest axis
  vfSettings: { wdth: { max: 125 }, wght: { max: 900 } },
})

// Later:
handle.refit()  // force re-measurement
handle.dispose() // restore original fontSize`} />
					</div>
					<div className="flex flex-col gap-3">
						<p className="opacity-50">Options</p>
						<table className="w-full text-xs">
							<thead>
								<tr className="opacity-50 text-left">
									<th className="pb-2 pr-6 font-normal">Option</th>
									<th className="pb-2 pr-6 font-normal">Default</th>
									<th className="pb-2 font-normal">Description</th>
								</tr>
							</thead>
							<tbody className="opacity-70">
								<tr className="border-t border-white/10 hover:bg-white/5 transition-colors"><td className="py-2 pr-6 font-mono">mode</td><td className="py-2 pr-6">&apos;both&apos;</td><td className="py-2">Which dimension to fill: <code className="font-mono">&apos;width&apos;</code>, <code className="font-mono">&apos;height&apos;</code>, or <code className="font-mono">&apos;both&apos;</code>.</td></tr>
								<tr className="border-t border-white/10 hover:bg-white/5 transition-colors"><td className="py-2 pr-6 font-mono">min</td><td className="py-2 pr-6">8</td><td className="py-2">Minimum font-size in px.</td></tr>
								<tr className="border-t border-white/10 hover:bg-white/5 transition-colors"><td className="py-2 pr-6 font-mono">max</td><td className="py-2 pr-6">400</td><td className="py-2">Maximum font-size in px.</td></tr>
								<tr className="border-t border-white/10 hover:bg-white/5 transition-colors"><td className="py-2 pr-6 font-mono">precision</td><td className="py-2 pr-6">0.5</td><td className="py-2">Convergence tolerance in px — binary search stops within this gap.</td></tr>
								<tr className="border-t border-white/10 hover:bg-white/5 transition-colors"><td className="py-2 pr-6 font-mono">padding</td><td className="py-2 pr-6">0</td><td className="py-2">Inset from container edges in px. Number = all sides; <code className="font-mono">{`{ x, y }`}</code> = per-axis.</td></tr>
								<tr className="border-t border-white/10 hover:bg-white/5 transition-colors"><td className="py-2 pr-6 font-mono">vfSettings</td><td className="py-2 pr-6">—</td><td className="py-2">Variable-font axis ranges. Measurement uses each axis at its <code className="font-mono">max</code> for worst-case safety.</td></tr>
								<tr className="border-t border-white/10 hover:bg-white/5 transition-colors"><td className="py-2 pr-6 font-mono">container</td><td className="py-2 pr-6">parentElement</td><td className="py-2">Override the container element used for dimension measurement.</td></tr>
							</tbody>
						</table>
					</div>
				</div>
			</section>

			{/* Footer */}
			<SiteFooter current="fitFlush" npmVersion={version} siteVersion={siteVersion} />

		</main>
	)
}
