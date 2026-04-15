"use client"

// fitFlush demo — interactive text fitting with per-axis fill and container controls
import { useState, useEffect, useRef, useDeferredValue, useCallback } from "react"
import { useFitFlush } from "@liiift-studio/fit-flush"
import type { FitFlushOptions } from "@liiift-studio/fit-flush"

const DEFAULT_TEXT_SINGLE = "Binary Search"
const DEFAULT_TEXT_MULTI = "The quick brown fox jumps over the lazy dog while the five boxing wizards jump quickly at dawn."
const DEMO_FONT = "var(--font-sans)"

/**
 * Inner component that uses the hook — re-mounts when mode or fill changes
 * so the ResizeObserver re-runs with fresh options.
 */
function FittedText({
	text,
	options,
	multiLine,
	onSizeChange,
}: {
	text: string
	options: FitFlushOptions
	multiLine: boolean
	onSizeChange: (size: string) => void
}) {
	const ref = useFitFlush<HTMLParagraphElement>(options)
	const observerRef = useRef<MutationObserver | null>(null)

	/** Read the current fontSize from the element and report it. */
	const readSize = useCallback(
		(el: HTMLElement) => {
			const fs = el.style.fontSize
			if (fs) onSizeChange(fs)
		},
		[onSizeChange],
	)

	/** Attach a MutationObserver to watch style changes on the target. */
	const setRef = useCallback(
		(el: HTMLParagraphElement | null) => {
			if (observerRef.current) {
				observerRef.current.disconnect()
				observerRef.current = null
			}

			if (typeof ref === "function") ref(el)
			else if (ref) (ref as React.MutableRefObject<HTMLParagraphElement | null>).current = el

			if (!el) return

			readSize(el)

			observerRef.current = new MutationObserver(() => readSize(el))
			observerRef.current.observe(el, { attributes: true, attributeFilter: ["style"] })
		},
		[ref, readSize],
	)

	useEffect(() => {
		return () => observerRef.current?.disconnect()
	}, [])

	return (
		<p
			ref={setRef}
			style={{
				fontFamily: DEMO_FONT,
				fontWeight: 700,
				lineHeight: 1.1,
				margin: 0,
				whiteSpace: multiLine ? "normal" : "nowrap",
			}}
		>
			{text}
		</p>
	)
}

/** Labeled range slider used throughout the controls panel. */
function Slider({
	label,
	value,
	min,
	max,
	step,
	suffix,
	ariaLabel,
	onChange,
}: {
	label: string
	value: number
	min: number
	max: number
	step: number
	suffix: string
	ariaLabel: string
	onChange: (v: number) => void
}) {
	return (
		<div className="flex flex-col gap-2">
			<span className="uppercase tracking-widest opacity-50">
				{label} — {value}{suffix}
			</span>
			<input
				type="range" min={min} max={max} step={step} value={value}
				onChange={e => onChange(Number(e.target.value))}
				aria-label={ariaLabel}
				style={{ touchAction: "none" }}
			/>
		</div>
	)
}

export default function Demo() {
	const [text,      setText]      = useState(DEFAULT_TEXT_SINGLE)
	const [multiLine, setMultiLine] = useState(false)
	// Track whether the user has manually edited the text
	const [userEdited, setUserEdited] = useState(false)
	// Per-axis fill percentage (50–100%)
	const [fillX,     setFillX]     = useState(100)
	const [fillY,     setFillY]     = useState(100)
	// Container dimensions
	const [widthPct,  setWidthPct]  = useState(100)
	const [heightPx,  setHeightPx]  = useState(160)
	// Computed font-size readout
	const [fontSize,  setFontSize]  = useState("")
	// Measured container pixel dimensions via ResizeObserver
	const [containerPx,  setContainerPx]  = useState(0)
	const [containerHPx, setContainerHPx] = useState(0)
	const containerRef = useRef<HTMLDivElement>(null)

	const dText = useDeferredValue(text)

	// Measure container pixel dimensions for fill% → padding conversion
	useEffect(() => {
		const el = containerRef.current
		if (!el) return
		const ro = new ResizeObserver((entries) => {
			setContainerPx(entries[0].contentRect.width)
			setContainerHPx(entries[0].contentRect.height)
		})
		ro.observe(el)
		return () => ro.disconnect()
	}, [])

	// Convert fill% to pixel padding per axis
	const padX = containerPx  > 0 ? containerPx  * (100 - fillX) / 200 : 0
	const padY = containerHPx > 0 ? containerHPx * (100 - fillY) / 200 : 0

	const mode = multiLine ? "both" : "width"

	const containerStyle: React.CSSProperties = multiLine
		? { width: `${widthPct}%`, height: `${heightPx}px`, overflow: "hidden" }
		: { width: `${widthPct}%`, overflow: "hidden" }

	const options: FitFlushOptions = {
		mode,
		padding: { x: padX, y: padY },
		min: 8,
		max: 400,
	}

	// Re-mount FittedText when mode or fill changes; container dimension
	// changes are handled by the ResizeObserver (no remount needed).
	const modeKey = `${mode}-${fillX}-${fillY}`

	return (
		<div className="flex flex-col gap-8">

			{/* Font-size readout */}
			<div className="flex items-baseline gap-3">
				<span className="text-3xl font-mono font-bold tracking-tight tabular-nums">
					{fontSize || "—"}
				</span>
				<span className="text-xs uppercase tracking-widest opacity-50">computed font-size</span>
			</div>

			{/* Container visualisation */}
			<div className="flex flex-col gap-3">
				<span className="text-xs uppercase tracking-widest opacity-50">Container</span>
				<div
					className="w-full flex items-start"
					style={{ minHeight: multiLine ? `${heightPx + 16}px` : "80px" }}
				>
					<div
						ref={containerRef}
						className="relative rounded border border-white/20"
						style={{ ...containerStyle, background: "rgba(255,255,255,0.04)" }}
					>
						<FittedText
							key={modeKey}
							text={dText || "Text"}
							options={options}
							multiLine={multiLine}
							onSizeChange={setFontSize}
						/>
					</div>
				</div>
			</div>

			{/* Controls */}
			<div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">

				{/* Text input — primary control */}
				<div className="flex flex-col gap-2 sm:col-span-2">
					<span className="uppercase tracking-widest opacity-50">Text</span>
					<input
						type="text"
						value={text}
						onChange={e => { setText(e.target.value); setUserEdited(true) }}
						aria-label="Text to fit"
						className="w-full bg-white/5 rounded px-3 py-2 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-white/20"
					/>
				</div>

				{/* Single-line / Multi-line toggle */}
				<div className="flex flex-col gap-2 sm:col-span-2">
					<div className="flex gap-2">
						<button
							onClick={() => {
								setMultiLine(false)
								if (!userEdited) setText(DEFAULT_TEXT_SINGLE)
							}}
							className={`px-3 py-1.5 rounded-full border transition-colors ${
								!multiLine
									? "border-white/60 bg-white/10"
									: "border-white/20 hover:border-white/40"
							}`}
						>
							Single line
						</button>
						<button
							onClick={() => {
								setMultiLine(true)
								if (!userEdited) setText(DEFAULT_TEXT_MULTI)
							}}
							className={`px-3 py-1.5 rounded-full border transition-colors ${
								multiLine
									? "border-white/60 bg-white/10"
									: "border-white/20 hover:border-white/40"
							}`}
						>
							Multi-line
						</button>
					</div>
					<p className="opacity-40 mt-1">
						{multiLine
							? "Text wraps and scales to fill the container area"
							: "Text stays on one line and scales to fill the width"}
					</p>
				</div>

				{/* Container section */}
				<Slider
					label="Container width" value={widthPct} min={30} max={100} step={1}
					suffix="%" ariaLabel="Container width as percentage"
					onChange={setWidthPct}
				/>
				{multiLine && (
					<Slider
						label="Container height" value={heightPx} min={40} max={400} step={4}
						suffix="px" ariaLabel="Container height in pixels"
						onChange={setHeightPx}
					/>
				)}

				{/* Fill section */}
				<Slider
					label="Fill X" value={fillX} min={50} max={100} step={1}
					suffix="%" ariaLabel="Horizontal text fill percentage"
					onChange={setFillX}
				/>
				{multiLine && (
					<Slider
						label="Fill Y" value={fillY} min={50} max={100} step={1}
						suffix="%" ariaLabel="Vertical text fill percentage"
						onChange={setFillY}
					/>
				)}

			</div>

			<p className="text-xs opacity-40 italic" style={{ lineHeight: "1.8" }}>
				Resize the container or adjust fill to see the font-size adapt.
				The size recalculates every frame via ResizeObserver.
			</p>
		</div>
	)
}
