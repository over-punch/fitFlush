// OG image for fit-flush.com — renders at build time via Satori.

import { ImageResponse } from 'next/og'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

export const alt = 'fit-flush — fit text to its container'
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
					width: '100%',
					height: '100%',
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'center',
					justifyContent: 'center',
					backgroundColor: '#0e0618',
					color: '#f0eaf8',
					fontFamily: 'Inter',
				}}
			>
				<div
					style={{
						display: 'flex',
						flexDirection: 'column',
						alignItems: 'center',
						gap: 24,
					}}
				>
					<div
						style={{
							fontSize: 80,
							fontWeight: 400,
							letterSpacing: '-0.02em',
						}}
					>
						fit-flush
					</div>
					<div
						style={{
							fontSize: 28,
							color: '#a78bfa',
							maxWidth: 700,
							textAlign: 'center',
							lineHeight: 1.4,
						}}
					>
						Fit text to its container with binary-search precision
						and variable-font safety.
					</div>
					<div
						style={{
							fontSize: 18,
							color: '#a89bc2',
							marginTop: 16,
						}}
					>
						Liiift Studio / type-tools
					</div>
				</div>
			</div>
		),
		{
			...size,
			fonts: [
				{
					name: 'Inter',
					data: fontData,
					weight: 400,
					style: 'normal',
				},
			],
		},
	)
}
