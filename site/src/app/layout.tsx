// Root layout for the fit-flush landing site — stub until the full demo lands.

import type { Metadata, Viewport } from 'next'

export const metadata: Metadata = {
	title: 'fit-flush — fit text to its container',
	description:
		'Binary-search font-size fitting with variable-font axis safety. Part of the Liiift Studio type-tools suite.',
}

export const viewport: Viewport = {
	width: 'device-width',
	initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en">
			<body>{children}</body>
		</html>
	)
}
