// Interactive demo for fit-flush — sliders, mode toggle, VF toggle, live preview.

'use client'

import { useDeferredValue, useState } from 'react'
import { FitFlushText } from '@liiift-studio/fit-flush'
import type { FitFlushOptions } from '@liiift-studio/fit-flush'

/** Default headline shown in the demo. */
const DEFAULT_TEXT = 'Fit Flush'

/** Mode options for the radio group. */
const MODES: FitFlushOptions['mode'][] = ['width', 'height', 'both']

/** Slider definition for reuse. */
interface SliderDef {
	label: string
	min: number
	max: number
	step: number
	value: number
	onChange: (v: number) => void
}

/** Single labeled range input with accessibility and mobile touch-action. */
function Slider({ label, min, max, step, value, onChange }: SliderDef) {
	return (
		<label className="flex flex-col gap-1">
			<span className="text-sm text-[var(--color-text-muted)] flex justify-between">
				<span>{label}</span>
				<span className="tabular-nums font-mono">{value}</span>
			</span>
			<input
				type="range"
				aria-label={label}
				min={min}
				max={max}
				step={step}
				value={value}
				onChange={(e) => onChange(Number(e.target.value))}
				className="w-full accent-[var(--color-accent)] h-2 rounded-full cursor-pointer"
				style={{ touchAction: 'none' }}
			/>
		</label>
	)
}

/** Interactive fit-flush demo with live preview headline and control sliders. */
export default function Demo() {
	const [text, setText] = useState(DEFAULT_TEXT)
	const [mode, setMode] = useState<FitFlushOptions['mode']>('width')
	const [min, setMin] = useState(8)
	const [max, setMax] = useState(400)
	const [precision, setPrecision] = useState(0.5)
	const [padding, setPadding] = useState(0)
	const [vfEnabled, setVfEnabled] = useState(false)
	const [wghtMax, setWghtMax] = useState(900)

	// Defer all values that drive the fit so sliders stay responsive under drag.
	const deferredText = useDeferredValue(text)
	const deferredMode = useDeferredValue(mode)
	const deferredMin = useDeferredValue(min)
	const deferredMax = useDeferredValue(max)
	const deferredPrecision = useDeferredValue(precision)
	const deferredPadding = useDeferredValue(padding)
	const deferredVfEnabled = useDeferredValue(vfEnabled)
	const deferredWghtMax = useDeferredValue(wghtMax)

	const fitOptions: FitFlushOptions = {
		mode: deferredMode,
		min: deferredMin,
		max: deferredMax,
		precision: deferredPrecision,
		padding: deferredPadding,
		...(deferredVfEnabled
			? { vfSettings: { wght: { max: deferredWghtMax } } }
			: {}),
	}

	return (
		<section className="flex flex-col gap-8">
			{/* Live preview */}
			<div
				className="relative w-full overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]"
				style={{ minHeight: mode === 'width' ? '12rem' : '20rem' }}
			>
				<div className="absolute inset-0 flex items-center justify-center p-6">
					<FitFlushText
						as="h2"
						className="font-serif text-center leading-none"
						style={{ fontWeight: vfEnabled ? wghtMax : 400 }}
						{...fitOptions}
					>
						{deferredText}
					</FitFlushText>
				</div>
			</div>

			{/* Controls */}
			<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
				{/* Left column — text + mode */}
				<div className="flex flex-col gap-5">
					{/* Editable text */}
					<label className="flex flex-col gap-1">
						<span className="text-sm text-[var(--color-text-muted)]">
							Headline text
						</span>
						<input
							type="text"
							aria-label="Headline text"
							value={text}
							onChange={(e) => setText(e.target.value)}
							className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-[var(--color-text)] focus:outline-none focus:border-[var(--color-accent)]"
						/>
					</label>

					{/* Mode radio */}
					<fieldset className="flex flex-col gap-2">
						<legend className="text-sm text-[var(--color-text-muted)] mb-1">
							Fit mode
						</legend>
						<div className="flex gap-2">
							{MODES.map((m) => (
								<button
									key={m}
									type="button"
									onClick={() => setMode(m)}
									className={`px-3 py-1.5 rounded-lg text-sm font-mono transition-colors ${
										mode === m
											? 'bg-[var(--color-accent)] text-[var(--color-bg)]'
											: 'bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-accent-dim)]'
									}`}
								>
									{m}
								</button>
							))}
						</div>
					</fieldset>

					{/* VF toggle */}
					<label className="flex items-center gap-3 cursor-pointer">
						<input
							type="checkbox"
							aria-label="Enable variable font safety"
							checked={vfEnabled}
							onChange={(e) => setVfEnabled(e.target.checked)}
							className="w-4 h-4 accent-[var(--color-accent)]"
						/>
						<span className="text-sm text-[var(--color-text-muted)]">
							Variable font safety (wght axis)
						</span>
					</label>

					{vfEnabled && (
						<Slider
							label="wght max"
							min={100}
							max={900}
							step={100}
							value={wghtMax}
							onChange={setWghtMax}
						/>
					)}
				</div>

				{/* Right column — numeric sliders */}
				<div className="flex flex-col gap-5">
					<Slider
						label="Min size (px)"
						min={4}
						max={100}
						step={1}
						value={min}
						onChange={setMin}
					/>
					<Slider
						label="Max size (px)"
						min={50}
						max={800}
						step={10}
						value={max}
						onChange={setMax}
					/>
					<Slider
						label="Precision (px)"
						min={0.1}
						max={5}
						step={0.1}
						value={precision}
						onChange={setPrecision}
					/>
					<Slider
						label="Padding (px)"
						min={0}
						max={100}
						step={1}
						value={padding}
						onChange={setPadding}
					/>
				</div>
			</div>
		</section>
	)
}
