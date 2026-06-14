// OG image for fit-flush.com — renders at build time via Satori.

import { ImageResponse } from 'next/og'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

export const alt = 'Fit Flush — fit text to its container'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

/** Static OG image with the tool name and tagline. Uses local Inter WOFF. */
export default async function OGImage() {
	const fontData = await readFile(
		join(process.cwd(), 'public/fonts/inter-400.woff'),
	)

	return new ImageResponse(
		(
			<div
				style={{
					background: '#010800',
					width: '100%',
					height: '100%',
					display: 'flex',
					flexDirection: 'column',
					justifyContent: 'space-between',
					padding: '72px 80px',
					fontFamily: 'Inter, sans-serif',
				}}
			>
				{/* Label */}
				<span style={{ fontSize: 13, letterSpacing: '0.18em', color: '#b0bbac', textTransform: 'uppercase' }}>
					fitFlush
				</span>

				{/* Flush bars preview + headline */}
				<div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
					<div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 48 }}>
						{[1, 1, 1, 1, 1].map((scale, i) => (
							<div
								key={i}
								style={{
									width: `${scale * 600}px`,
									height: 3,
									background: i % 2 === 0 ? '#b0bbac' : '#2b2f29',
									borderRadius: 2,
								}}
							/>
						))}
					</div>
					<div style={{ fontSize: 76, color: '#f2f6f1', lineHeight: 1.06, fontWeight: 300 }}>
						Fit text to
					</div>
					<div style={{ fontSize: 76, color: '#b0bbac', lineHeight: 1.06, fontWeight: 300 }}>
						any container.
					</div>
				</div>

				{/* Footer */}
				<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
					<div style={{ fontSize: 14, color: '#b0bbac', letterSpacing: '0.04em', display: 'flex', gap: 20 }}>
						<span>TypeScript</span>
						<span style={{ opacity: 0.4 }}>·</span>
						<span>Zero dependencies</span>
						<span style={{ opacity: 0.4 }}>·</span>
						<span>React + Vanilla JS</span>
					</div>
					<div style={{ fontSize: 13, color: '#8c9589', letterSpacing: '0.04em' }}>
						fit-flush.com
					</div>
				</div>
			</div>
		),
		{
			...size,
			fonts: [{ name: 'Inter', data: fontData, style: 'normal', weight: 400 }],
		},
	)
}
