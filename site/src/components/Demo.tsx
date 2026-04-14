"use client"

// fitFlush demo — resizable container showing automatic font-size fitting
import { useState, useRef, useCallback, useDeferredValue } from "react"
import { useFitFlush } from "@liiift-studio/fit-flush"
import type { FitFlushOptions } from "@liiift-studio/fit-flush"

type FitMode = "width" | "height" | "both"

const MODES: { value: FitMode; label: string; description: string }[] = [
	{ value: "width",  label: "Width",  description: "Single line — scales to fill the exact width" },
	{ value: "height", label: "Height", description: "Wrapping — scales to fill the exact height"  },
	{ value: "both",   label: "Both",   description: "Largest size that fits width and height"      },
]

const DEFAULT_TEXT = "Binary Search"
const DEMO_FONT = "var(--font-sans)"

/**
 * Inner component that uses the hook — needs to re-mount when mode changes
 * so the ResizeObserver re-runs with fresh options.
 */
function FittedText({ text, options }: { text: string; options: FitFlushOptions }) {
	const ref = useFitFlush<HTMLParagraphElement>(options)
	return (
		<p
			ref={ref}
			style={{ fontFamily: DEMO_FONT, fontWeight: 700, lineHeight: 1.1, margin: 0 }}
		>
			{text}
		</p>
	)
}

export default function Demo() {
	const [text,    setText]    = useState(DEFAULT_TEXT)
	const [mode,    setMode]    = useState<FitMode>("width")
	const [padding, setPadding] = useState(0)
	// Container width as % of the demo panel
	const [widthPct, setWidthPct] = useState(60)
	// Container height in px (for height/both modes)
	const [heightPx, setHeightPx] = useState(120)

	const dText = useDeferredValue(text)

	const containerStyle: React.CSSProperties =
		mode === "width"
			? { width: `${widthPct}%`, overflow: "hidden" }
			: mode === "height"
			? { width: "100%", height: `${heightPx}px`, overflow: "hidden" }
			: { width: `${widthPct}%`, height: `${heightPx}px`, overflow: "hidden" }

	const options: FitFlushOptions = {
		mode,
		padding,
		min: 8,
		max: 400,
	}

	// Re-mount FittedText when mode changes so options take effect cleanly
	const modeKey = `${mode}-${widthPct}-${heightPx}-${padding}`

	return (
		<div className="flex flex-col gap-8">

			{/* Container visualisation */}
			<div className="flex flex-col gap-3">
				<span className="text-xs uppercase tracking-widest opacity-50">Container</span>
				<div
					className="w-full flex items-start"
					style={{ minHeight: mode === "width" ? "80px" : `${heightPx + 16}px` }}
				>
					<div
						className="relative rounded border border-white/20 p-3 transition-all"
						style={{ ...containerStyle, background: "rgba(255,255,255,0.04)" }}
					>
						<FittedText key={modeKey} text={dText || "Text"} options={options} />
					</div>
				</div>
			</div>

			{/* Controls */}
			<div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">

				{/* Mode */}
				<div className="flex flex-col gap-2 sm:col-span-2">
					<span className="uppercase tracking-widest opacity-50">Mode</span>
					<div className="flex gap-2 flex-wrap">
						{MODES.map(m => (
							<button
								key={m.value}
								onClick={() => setMode(m.value)}
								className={`px-3 py-1.5 rounded-full border transition-colors ${
									mode === m.value
										? "border-white/60 bg-white/10"
										: "border-white/20 hover:border-white/40"
								}`}
							>
								{m.label}
							</button>
						))}
					</div>
					<p className="opacity-40 mt-1">
						{MODES.find(m => m.value === mode)?.description}
					</p>
				</div>

				{/* Width slider — shown in width/both mode */}
				{(mode === "width" || mode === "both") && (
					<div className="flex flex-col gap-2">
						<span className="uppercase tracking-widest opacity-50">
							Container width — {widthPct}%
						</span>
						<input
							type="range" min={10} max={100} step={1} value={widthPct}
							onChange={e => setWidthPct(Number(e.target.value))}
							aria-label="Container width as percentage"
						/>
					</div>
				)}

				{/* Height slider — shown in height/both mode */}
				{(mode === "height" || mode === "both") && (
					<div className="flex flex-col gap-2">
						<span className="uppercase tracking-widest opacity-50">
							Container height — {heightPx}px
						</span>
						<input
							type="range" min={40} max={300} step={4} value={heightPx}
							onChange={e => setHeightPx(Number(e.target.value))}
							aria-label="Container height in pixels"
						/>
					</div>
				)}

				{/* Padding */}
				<div className="flex flex-col gap-2">
					<span className="uppercase tracking-widest opacity-50">
						Padding — {padding}px
					</span>
					<input
						type="range" min={0} max={40} step={2} value={padding}
						onChange={e => setPadding(Number(e.target.value))}
						aria-label="Container padding in pixels"
					/>
				</div>

				{/* Text input */}
				<div className="flex flex-col gap-2">
					<span className="uppercase tracking-widest opacity-50">Text</span>
					<input
						type="text"
						value={text}
						onChange={e => setText(e.target.value)}
						aria-label="Text to fit"
						className="w-full bg-white/5 rounded px-3 py-2 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-white/20"
					/>
				</div>

			</div>

			<p className="text-xs opacity-40 italic" style={{ lineHeight: "1.8" }}>
				Drag the sliders to resize the container. The text recalculates its font-size
				every frame via ResizeObserver — no rerenders, no style recalculations
				outside the target element.
			</p>
		</div>
	)
}
