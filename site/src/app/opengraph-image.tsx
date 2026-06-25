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
					background: '#e0fefd',
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
				<span style={{ fontSize: 13, letterSpacing: '0.18em', color: '#3a5252', textTransform: 'uppercase' }}>
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
									background: i % 2 === 0 ? '#3a5252' : '#788b8a',
									borderRadius: 2,
								}}
							/>
						))}
					</div>
					<div style={{ fontSize: 76, color: '#002c2c', lineHeight: 1.06, fontWeight: 300 }}>
						Fit text to
					</div>
					<div style={{ fontSize: 76, color: '#3a5252', lineHeight: 1.06, fontWeight: 300 }}>
						any container.
					</div>
				</div>

				{/* Footer */}
				<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
					<div style={{ fontSize: 14, color: '#3a5252', letterSpacing: '0.04em', display: 'flex', gap: 20 }}>
						<span>TypeScript</span>
						<span style={{ opacity: 0.4 }}>·</span>
						<span>Zero dependencies</span>
						<span style={{ opacity: 0.4 }}>·</span>
						<span>React + Vanilla JS</span>
					</div>
					<div style={{ fontSize: 13, color: '#586e6d', letterSpacing: '0.04em' }}>
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
