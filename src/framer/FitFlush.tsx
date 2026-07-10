// fitFlush/src/framer/FitFlush.tsx — Framer code component wrapping the fitFlush core.
//
// Distribution: paste this file into Framer (Insert → Code → New Component), or host it as an
// ES module and add it by URL. It imports the framework-agnostic core straight from the CDN, so
// it needs no build step — the core functions take a DOM element, not React, so there is no
// React version/externalisation issue.
//
// The rendering logic mirrors the already-proven `useFitFlush` hook: fitFlushLive() fits the text
// to its container and auto-refits on resize (the live handle's dispose() is our cleanup, exactly
// like a start→stop animation). The only Framer-specific additions are the property controls,
// RenderTarget gating (live/observing on canvas+preview, a single static fit on export), and
// layout annotations.
//
// Unlike a wave tool, fitFlush WRITES the font-size (it is the output, not an input): min/max are
// the size bounds, so no `fontSize` style control is surfaced. Output depends on container layout,
// so the component renders an outer container div (sized by Framer) wrapping the text target.
import { useEffect, useRef } from "react"
import { addPropertyControls, ControlType, RenderTarget } from "framer"
// Pin to a published version so shared instances stay stable. Bump when the core changes.
// The core is framework-agnostic (operates on a DOM element), so no React externalisation is needed.
import { fitFlush, fitFlushLive } from "https://esm.sh/@liiift-studio/fit-flush@1.0.9"

/** Props surfaced to the Framer UI via addPropertyControls, plus base text styling.
 *  Option fields are declared explicitly so the component needs no type import over HTTP. */
interface FitFlushFramerProps {
	/** The text to fit. */
	text: string
	/** CSS font-family — a variable font (e.g. Roboto Flex) unlocks the wght/wdth safety options. */
	fontFamily: string
	/** Text colour. */
	color: string
	/** Horizontal text alignment. */
	textAlign: "left" | "center" | "right"
	/** Which container dimension(s) to fit. 'width' is single-line (analytical fast path). */
	mode: "width" | "height" | "both"
	/** Minimum font-size in px. */
	min: number
	/** Maximum font-size in px. */
	max: number
	/** Convergence precision in px — binary search stops within this. */
	precision: number
	/** Horizontal inset from container edges in px. */
	paddingX: number
	/** Vertical inset from container edges in px. */
	paddingY: number
	/** Max wght axis held during measurement so the fit stays safe under later weight animation (0 = off). */
	maxWght: number
	/** Max wdth axis held during measurement so the fit stays safe under later width animation (0 = off). */
	maxWdth: number
}

/**
 * Binary-search font-size fitting — locks text to its container width, height, or both,
 * with variable-font axis safety, as a Framer code component.
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 */
export default function FitFlush(props: Partial<FitFlushFramerProps>) {
	const {
		text = "Fit to width",
		fontFamily = "Roboto Flex",
		color = "#111111",
		textAlign = "left",
		mode = "width",
		min = 8,
		max = 400,
		precision = 0.5,
		paddingX = 0,
		paddingY = 0,
		maxWght = 0,
		maxWdth = 0,
	} = props

	// Outer div is the container fitFlush measures against; inner div is the fit target.
	const containerRef = useRef<HTMLDivElement>(null)
	const targetRef = useRef<HTMLDivElement>(null)

	useEffect(() => {
		const container = containerRef.current
		const target = targetRef.current
		if (!container || !target) return

		// Build the variable-font axis-safety map only for axes the designer opted into.
		const vf: Record<string, { max: number }> = {}
		if (maxWght > 0) vf.wght = { max: maxWght }
		if (maxWdth > 0) vf.wdth = { max: maxWdth }
		const vfSettings = Object.keys(vf).length > 0 ? vf : undefined

		const options = {
			mode,
			min,
			max,
			precision,
			padding: { x: paddingX, y: paddingY },
			vfSettings,
			container,
		}

		// Observe-and-refit on the live site and the editing canvas (so the designer sees it track
		// the frame); do a single static fit on export / thumbnails where an observer is undesirable.
		const rt = RenderTarget.current()
		const live = rt === RenderTarget.preview || rt === RenderTarget.canvas

		if (live) {
			const handle = fitFlushLive(target, options)
			return () => {
				handle.dispose()
			}
		}

		// Static branch: fit once. Restore the inline fontSize on cleanup to stay idempotent.
		const originalFontSize = target.style.fontSize
		fitFlush(target, options)
		return () => {
			target.style.fontSize = originalFontSize
		}
	}, [text, mode, min, max, precision, paddingX, paddingY, maxWght, maxWdth, fontFamily])

	return (
		<div
			ref={containerRef}
			style={{
				width: "100%",
				display: "flex",
				alignItems: "flex-start",
				justifyContent:
					textAlign === "center" ? "center" : textAlign === "right" ? "flex-end" : "flex-start",
				overflow: "hidden",
			}}
		>
			<div
				ref={targetRef}
				style={{
					fontFamily,
					color,
					textAlign,
					lineHeight: 1.05,
					margin: 0,
				}}
			>
				{text}
			</div>
		</div>
	)
}

// Map every meaningful FitFlushOptions field to a Framer control.
// Omitted (cannot be a control): `container` (element ref — set internally to the wrapper div)
// and `onFit` (callback). `vfSettings` (an arbitrary axis→{max} record) is partially surfaced as
// the two common safety axes, maxWght and maxWdth. `fontSize` is intentionally not a control —
// fitFlush computes and writes it; min/max are the bounds.
addPropertyControls(FitFlush, {
	text: {
		type: ControlType.String,
		title: "Text",
		defaultValue: "Fit to width",
		displayTextArea: true,
	},
	fontFamily: {
		type: ControlType.String,
		title: "Font",
		defaultValue: "Roboto Flex",
		description: "A variable font unlocks the weight/width axis-safety options below.",
	},
	color: { type: ControlType.Color, title: "Colour", defaultValue: "#111111" },
	textAlign: {
		type: ControlType.Enum,
		title: "Align",
		options: ["left", "center", "right"],
		optionTitles: ["Left", "Center", "Right"],
		defaultValue: "left",
		displaySegmentedControl: true,
	},
	mode: {
		type: ControlType.Enum,
		title: "Fit",
		options: ["width", "height", "both"],
		optionTitles: ["Width", "Height", "Both"],
		defaultValue: "width",
		description: "Height / Both need a fixed-height frame; Width fits a single line.",
	},
	min: { type: ControlType.Number, title: "Min size", defaultValue: 8, min: 1, max: 400, unit: "px" },
	max: { type: ControlType.Number, title: "Max size", defaultValue: 400, min: 8, max: 1000, unit: "px" },
	precision: {
		type: ControlType.Number,
		title: "Precision",
		defaultValue: 0.5,
		min: 0.01,
		max: 5,
		step: 0.01,
		unit: "px",
	},
	paddingX: { type: ControlType.Number, title: "Pad X", defaultValue: 0, min: 0, max: 200, unit: "px" },
	paddingY: { type: ControlType.Number, title: "Pad Y", defaultValue: 0, min: 0, max: 200, unit: "px" },
	maxWght: {
		type: ControlType.Number,
		title: "Max wght",
		defaultValue: 0,
		min: 0,
		max: 1000,
		description: "Hold this weight during measurement so the fit stays safe under animation (0 = off).",
	},
	maxWdth: {
		type: ControlType.Number,
		title: "Max wdth",
		defaultValue: 0,
		min: 0,
		max: 200,
		description: "Hold this width during measurement so the fit stays safe under animation (0 = off).",
	},
})
