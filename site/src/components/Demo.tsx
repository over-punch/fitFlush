"use client"

// fitFlush demos — interactive text fitting with per-axis fill and container controls (default
// export), and the variable-font safety comparison: weight animated after a fit, without and with vfSettings.
import { useState, useEffect, useLayoutEffect, useRef, useDeferredValue, useCallback, useMemo } from "react"
import { useFitFlush } from "@overpunch/fit-flush/react"
import type { FitFlushOptions } from "@overpunch/fit-flush"

const DEFAULT_TEXT_SINGLE = "Binary Search"
const DEFAULT_TEXT_MULTI = "The quick brown fox jumps over the lazy dog while the five boxing wizards jump quickly at dawn."
const DEMO_FONT = "var(--font-sans)"

/** Lightest weight the variable-font demo animates from (Inter's wght axis runs 100–900). */
const WGHT_REST = 300
/** Heaviest weight the variable-font demo animates to, and the `max` passed in vfSettings. */
const WGHT_MAX = 900
/** Duration of one 300 → 900 → 300 weight cycle, in ms. */
const WGHT_CYCLE_MS = 3600
/** Text fitted in the variable-font demo. */
const VF_TEXT = "Variable Headline"
/** Colour marking an overflow in the variable-font demo. */
const OVERFLOW_COLOR = "oklch(0.52 0.2 28)"
/** vfSettings for the safe box: measure at the heaviest weight the animation reaches. */
const VF_SAFE = { wght: { max: WGHT_MAX } }

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
	const { ref, size } = useFitFlush<HTMLParagraphElement>(options)

	useEffect(() => {
		if (size > 0) onSizeChange(`${size}px`)
	}, [size, onSizeChange])

	return (
		<p
			ref={ref}
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
	title,
	inputId,
	onChange,
}: {
	label: string
	value: number
	min: number
	max: number
	step: number
	suffix: string
	ariaLabel: string
	title?: string
	inputId: string
	onChange: (v: number) => void
}) {
	return (
		<div className="flex flex-col gap-2">
			<label htmlFor={inputId} className="uppercase tracking-[0.18em] font-medium text-muted">
				{label} &mdash; {value}{suffix}
			</label>
			<input
				id={inputId}
				type="range" min={min} max={max} step={step} value={value}
				onChange={e => onChange(Number(e.target.value))}
				aria-label={ariaLabel}
				title={title}
				style={{ touchAction: "pan-y" }}
			/>
		</div>
	)
}

/**
 * One box of the variable-font comparison: a single line fitted to the box width with
 * `useFitFlush`, rendered at the current weight. Reports the weight the text had when it was
 * last fitted and how far it now overflows the box.
 */
function VfBox({
	title,
	code,
	wght,
	vfSettings,
}: {
	title: string
	code: string
	wght: number
	vfSettings?: FitFlushOptions["vfSettings"]
}) {
	const boxRef = useRef<HTMLDivElement>(null)
	// The weight at the moment of the last fit — a fit without vfSettings measures at this weight.
	const wghtRef = useRef(wght)
	wghtRef.current = wght
	const [fittedAt, setFittedAt] = useState<number | null>(null)
	const [over, setOver] = useState(0)
	const options: FitFlushOptions = useMemo(() => ({
		mode: "width",
		vfSettings,
		onFit: () => setFittedAt(Math.round(wghtRef.current)),
	}), [vfSettings])
	const { ref, size } = useFitFlush<HTMLParagraphElement>(options)

	// Overflow in layout px: rendered text width minus the box's inner width, after every weight
	// change or refit. Rects are visual (they include any CSS zoom or transform on an ancestor) and
	// clientWidth is layout, so the text's rect is divided by the box's visual/layout ratio first.
	useLayoutEffect(() => {
		const el = ref.current
		const box = boxRef.current
		if (!el || !box || box.offsetWidth === 0) return
		const range = document.createRange()
		range.selectNodeContents(el)
		const scale = box.getBoundingClientRect().width / box.offsetWidth || 1
		setOver(range.getBoundingClientRect().width / scale - box.clientWidth)
	}, [ref, wght, size])

	const overflowing = over > 0.5
	return (
		<div className="flex flex-col gap-2 min-w-0">
			<div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-xs">
				<span className="uppercase tracking-[0.18em] font-medium text-muted">{title}</span>
				<code className="font-mono text-muted">{code}</code>
			</div>
			{/* The box is narrower than the panel so an overflow shows past its edge instead of being clipped. */}
			<div
				ref={boxRef}
				className="rounded border"
				style={{
					width: "86%",
					borderColor: overflowing ? OVERFLOW_COLOR : "color-mix(in oklch, var(--foreground) 20%, transparent)",
					background: "color-mix(in oklch, var(--foreground) 4%, transparent)",
				}}
			>
				<p
					ref={ref}
					style={{
						fontFamily: DEMO_FONT,
						fontVariationSettings: `"wght" ${wght}`,
						lineHeight: 1.2,
						margin: 0,
						whiteSpace: "nowrap",
					}}
				>
					{VF_TEXT}
				</p>
			</div>
			<p className="text-xs tabular-nums" aria-live="off" style={{ color: overflowing ? OVERFLOW_COLOR : undefined }}>
				{size > 0 ? `${size}px` : "—"}
				{vfSettings ? ` · measured at wght ${WGHT_MAX}` : fittedAt !== null ? ` · measured at wght ${fittedAt}` : ""}
				{" · "}
				<strong className="font-semibold">{overflowing ? `${Math.round(over)} px too wide` : "fits"}</strong>
			</p>
		</div>
	)
}

/**
 * Variable-font safety demo: the same line fitted twice, without and with `vfSettings`, while a
 * slider or a looping animation drives the `wght` axis from 300 to 900 after the fit.
 */
export function VfSafetyDemo() {
	const [wght, setWght] = useState(WGHT_REST)
	const [animating, setAnimating] = useState(false)

	// Triangle wave 300 → 900 → 300, started from the rest weight each time it is switched on.
	useEffect(() => {
		if (!animating) return
		let raf = 0
		const start = performance.now()
		const tick = (now: number) => {
			const phase = ((now - start) % WGHT_CYCLE_MS) / WGHT_CYCLE_MS
			const up = phase < 0.5 ? phase * 2 : (1 - phase) * 2
			setWght(Math.round(WGHT_REST + (WGHT_MAX - WGHT_REST) * up))
			raf = requestAnimationFrame(tick)
		}
		raf = requestAnimationFrame(tick)
		return () => cancelAnimationFrame(raf)
	}, [animating])

	return (
		<div className="flex flex-col gap-8">
			<div className="flex flex-col gap-6">
				<VfBox title="Without vfSettings" code={`{ mode: 'width' }`} wght={wght} />
				<VfBox title="With vfSettings" code={`{ mode: 'width', vfSettings: { wght: { max: ${WGHT_MAX} } } }`} wght={wght} vfSettings={VF_SAFE} />
			</div>

			<div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs items-end">
				<Slider
					label="Weight" value={wght} min={WGHT_REST} max={WGHT_MAX} step={10}
					suffix="" ariaLabel="Font weight (wght axis) applied after the fit"
					inputId="slider-wght"
					title="Drag the weight after the text was fitted — heavier letters are wider"
					onChange={v => { setAnimating(false); setWght(v) }}
				/>
				<div>
					<button
						onClick={() => setAnimating(a => !a)}
						aria-pressed={animating}
						title="Loop the weight from 300 to 900 and back"
						className={`px-3 py-1.5 rounded-full border transition-colors ${
							animating
								? "border-foreground/60 bg-foreground/10"
								: "border-foreground/20 hover:border-foreground/40"
						}`}
					>
						{animating ? "Stop animation" : "Animate weight"}
					</button>
				</div>
			</div>

			<p className="text-xs text-muted italic" style={{ lineHeight: "1.8" }}>
				Both lines were fitted once. The first was measured at the weight it had; the second at the
				heaviest weight it will reach, so it is a little smaller at rest and never overflows.
			</p>
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
			if (!entries[0]) return
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

	const containerStyle: React.CSSProperties = useMemo(() => (
		multiLine
			? { width: `${widthPct}%`, height: `${heightPx}px`, overflow: "hidden" }
			: { width: `${widthPct}%`, overflow: "hidden" }
	), [multiLine, widthPct, heightPx])

	const options: FitFlushOptions = useMemo(() => ({
		mode,
		padding: { x: padX, y: padY },
		min: 8,
		max: 400,
	}), [mode, padX, padY])

	const handleSizeChange = useCallback((size: string) => setFontSize(size), [])

	// Re-mount FittedText only when mode changes; fill and container dimension
	// changes are handled by the ResizeObserver (no remount needed).
	const modeKey = mode

	return (
		<div className="flex flex-col gap-8">

			{/* Font-size readout */}
			<div className="flex items-baseline gap-3" aria-live="polite" aria-atomic="true">
				<span className="text-3xl font-mono font-bold tracking-tight tabular-nums">
					{fontSize || "—"}
				</span>
				<span className="text-xs uppercase tracking-[0.18em] font-medium text-muted">computed font-size</span>
			</div>

			{/* Container visualisation */}
			<div className="flex flex-col gap-3">
				<span className="text-xs uppercase tracking-[0.18em] font-medium text-muted">Container</span>
				<div
					className="w-full flex items-start"
					style={{ minHeight: multiLine ? `${heightPx + 16}px` : "80px" }}
				>
					<div
						ref={containerRef}
						aria-label="Live demo container — resize via the sliders below"
						className="relative rounded border border-foreground/20"
						style={{ ...containerStyle, background: "color-mix(in oklch, var(--foreground) 4%, transparent)" }}
					>
						<FittedText
							key={modeKey}
							text={dText || "Text"}
							options={options}
							multiLine={multiLine}
							onSizeChange={handleSizeChange}
						/>
					</div>
				</div>
			</div>

			{/* Controls */}
			<div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">

				{/* Text input — primary control */}
				<div className="flex flex-col gap-2 sm:col-span-2">
					<label htmlFor="demo-text-input" className="uppercase tracking-[0.18em] font-medium text-muted">Text</label>
					<input
						id="demo-text-input"
						type="text"
						value={text}
						placeholder="Text"
						onChange={e => { setText(e.target.value); setUserEdited(true) }}
						aria-label="Text to fit"
						title="Type any text to see fitFlush scale it flush to the container"
						className="w-full bg-foreground/5 rounded px-3 py-2 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-foreground/20"
					/>
				</div>

				{/* Single-line / Multi-line toggle */}
				<div className="flex flex-col gap-2 sm:col-span-2">
					<div role="group" aria-label="Fitting mode" className="flex gap-2">
						<button
							onClick={() => {
								setMultiLine(false)
								setFontSize("")
								if (!userEdited) setText(DEFAULT_TEXT_SINGLE)
							}}
							aria-pressed={!multiLine}
							title="Fit text on a single line — font-size scales so the text spans the full container width"
							className={`px-3 py-1.5 rounded-full border transition-colors ${
								!multiLine
									? "border-foreground/60 bg-foreground/10"
									: "border-foreground/20 hover:border-foreground/40"
							}`}
						>
							Single line
						</button>
						<button
							onClick={() => {
								setMultiLine(true)
								setFontSize("")
								if (!userEdited) setText(DEFAULT_TEXT_MULTI)
							}}
							aria-pressed={multiLine}
							title="Allow text to wrap across multiple lines — font-size scales to fill the container area"
							className={`px-3 py-1.5 rounded-full border transition-colors ${
								multiLine
									? "border-foreground/60 bg-foreground/10"
									: "border-foreground/20 hover:border-foreground/40"
							}`}
						>
							Multi-line
						</button>
					</div>
					<p className="text-muted mt-1">
						{multiLine
							? "Text wraps and scales to fill the container area"
							: "Text stays on one line and scales to fill the width"}
					</p>
				</div>

				{/* Container section */}
				<Slider
					label="Container width" value={widthPct} min={30} max={100} step={1}
					suffix="%" ariaLabel="Container width as percentage"
					inputId="slider-width"
					title="Resize the container width — the font-size recalculates instantly to stay flush"
					onChange={setWidthPct}
				/>
				{multiLine && (
					<Slider
						label="Container height" value={heightPx} min={40} max={400} step={4}
						suffix="px" ariaLabel="Container height in pixels"
						inputId="slider-height"
						title="Resize the container height — the font-size recalculates to fill the new area"
						onChange={setHeightPx}
					/>
				)}

				{/* Fill section */}
				<div className="flex flex-col gap-1">
					<Slider
						label="Fill X" value={fillX} min={50} max={100} step={1}
						suffix="%" ariaLabel="Horizontal text fill percentage — minimum 50%"
						inputId="slider-fill-x"
						title="Horizontal fill — 100% means the text spans the full container width; lower values add breathing room on each side. Minimum 50% (equal padding each side)."
						onChange={setFillX}
					/>
					<p className="text-xs text-subtle">Minimum 50% — equal breathing room on each side</p>
				</div>
				{multiLine && (
					<div className="flex flex-col gap-1">
						<Slider
							label="Fill Y" value={fillY} min={50} max={100} step={1}
							suffix="%" ariaLabel="Vertical text fill percentage — minimum 50%"
							inputId="slider-fill-y"
							title="Vertical fill — 100% means the text spans the full container height; lower values add breathing room above and below. Minimum 50% (equal padding each side)."
							onChange={setFillY}
						/>
						<p className="text-xs text-subtle">Minimum 50% — equal breathing room above and below</p>
					</div>
				)}

			</div>

			<p className="text-xs text-muted italic" style={{ lineHeight: "1.8" }}>
				Resize the container or adjust fill to see the font-size adapt.
				The size recalculates whenever the container is resized.
			</p>
		</div>
	)
}
