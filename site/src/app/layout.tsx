// Root layout for the fit-flush landing site.

import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
	title: 'fit-flush — fit text to its container',
	description:
		'Binary-search font-size fitting with variable-font axis safety. Part of the Liiift Studio type-tools suite.',
	metadataBase: new URL('https://fit-flush.com'),
}

export const viewport: Viewport = {
	width: 'device-width',
	initialScale: 1,
}

/** Root HTML shell with Inter Variable loaded via globals.css @font-face. */
export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en">
			<body className="min-h-screen">{children}</body>
		</html>
	)
}
