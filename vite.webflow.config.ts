// vite.webflow.config.ts — standalone minified IIFE bundle for Webflow Custom Code Embed.
// Produces a single self-contained browser global (window.FitFlush) with no module loader,
// no React, and no external dependencies — droppable into a Webflow embed via one <script> tag.
import { defineConfig } from 'vite'

export default defineConfig({
	build: {
		// Do not wipe dist/ — the library build (tsc) writes index.js/.d.ts there too.
		emptyOutDir: false,
		lib: {
			entry: 'src/webflow/embed.ts',
			formats: ['iife'],
			// Exposes the module's exports (init, refit, destroy) as window.FitFlush.
			name: 'FitFlush',
			fileName: () => 'fitflush.webflow.min.js',
		},
		minify: true,
	},
})
