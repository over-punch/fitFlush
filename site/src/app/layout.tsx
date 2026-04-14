// Root layout for the fit-flush landing site

import type { Metadata } from "next"
import "./globals.css"
import { Inter } from "next/font/google"

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" })

export const metadata: Metadata = {
	title: "Fit Flush — Fit text to any container",
	icons: { icon: "/icon.svg", shortcut: "/icon.svg", apple: "/icon.svg" },
	description: "Binary-search font-size fitting with variable-font axis safety. Makes any text fill its container exactly — width, height, or both.",
	keywords: ["fit text", "text fit", "font size", "container fit", "variable font", "binary search", "responsive type", "typography", "TypeScript", "react"],
	openGraph: {
		title: "Fit Flush — Fit text to any container",
		description: "Binary-search font-size fitting with variable-font axis safety. Makes any text fill its container exactly.",
		url: "https://fit-flush.com",
		siteName: "Fit Flush",
		type: "website",
	},
	twitter: {
		card: "summary_large_image",
		title: "Fit Flush — Fit text to any container",
		description: "Binary-search font-size fitting with variable-font axis safety. Makes any text fill its container exactly.",
	},
	metadataBase: new URL("https://fit-flush.com"),
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
	return (
		<html lang="en" className={`h-full antialiased ${inter.variable}`}>
			<body className="min-h-full flex flex-col">{children}</body>
		</html>
	)
}
