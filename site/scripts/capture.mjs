// README visual capture and measurements for fit-flush.
// Serves the repo ROOT over HTTP (so /dist and /site/public resolve), renders
// site/scripts/capture.html in headless Chromium, screenshots each `.scene`
// element to assets/<id>.png with transparent corners, steps the resize scene into
// assets/resize.gif (needs ffmpeg), and prints the measurements the README quotes.
//
// Run from the repo root:  npm run build && npm run capture
// Setup (once):  cd site && npm i   (Playwright is a site devDependency)

import { createServer } from "node:http"
import { spawnSync } from "node:child_process"
import { mkdtemp, readFile, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { extname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { chromium } from "playwright"

// Repo root is two levels up from this file (site/scripts/ -> repo root).
const HERE = fileURLToPath(new URL(".", import.meta.url))
const ROOT = resolve(HERE, "..", "..")
const PAGE = "/site/scripts/capture.html"

const MIME = {
	".html": "text/html",
	".js": "application/javascript",
	".mjs": "application/javascript",
	".css": "text/css",
	".json": "application/json",
	".map": "application/json",
	".png": "image/png",
	".svg": "image/svg+xml",
	".woff": "font/woff",
	".woff2": "font/woff2",
}

const server = createServer(async (req, res) => {
	try {
		const url = decodeURIComponent((req.url ?? "/").split("?")[0])
		const path = join(ROOT, url === "/" ? PAGE : url)
		let data = await readFile(path)
		// The built ESM uses extensionless relative imports (`from './measure'`),
		// which Node resolves but browsers do not. Rewrite them to `.js` on the fly
		// for served JS so the unmodified dist runs directly in the browser.
		if (extname(path) === ".js") {
			data = Buffer.from(
				data
					.toString("utf8")
					.replace(/from\s+(['"])(\.\.?\/[^'"]+?)\1/g, (m, q, spec) =>
						spec.endsWith(".js") ? m : `from ${q}${spec}.js${q}`,
					),
			)
		}
		res.writeHead(200, { "Content-Type": MIME[extname(path)] ?? "application/octet-stream" })
		res.end(data)
	} catch {
		res.writeHead(404)
		res.end("not found")
	}
})

/** Local port for the capture server; override with PORT when several captures run at once. */
const PORT = Number(process.env.PORT) || 5966
/** Frames in one loop of the resize GIF, and its playback rate. */
const GIF_FRAMES = 60
const GIF_FPS = 20

await new Promise((r) => server.listen(PORT, r))
const { port } = server.address()

const browser = await chromium.launch()
const page = await browser.newPage({ deviceScaleFactor: 2 })
await page.goto(`http://localhost:${port}${PAGE}`, { waitUntil: "networkidle" })
page.on("pageerror", (e) => console.error("Page error:", e.message))
await page.waitForFunction(() => window.__ready === true, { timeout: 60000 })
await page.waitForTimeout(400) // let variable-font glyphs settle

const ids = await page.$$eval(".scene", (els) => els.map((e) => e.id))
for (const id of ids) {
	if (id === "resize") continue // animated: captured as a GIF below
	const el = await page.$(`#${id}`)
	await el.screenshot({ path: join(ROOT, `assets/${id}.png`), omitBackground: true })
	console.log("Captured assets/%s.png", id)
}

// The measurements the README quotes (see measure() in capture.html).
console.log("Measurements:\n%s", JSON.stringify(await page.evaluate(() => window.__measurements), null, "\t"))

// Bundle sizes the README quotes: esbuild --bundle --minify, then gzip -9 (React left external).
try {
	const { build } = await import("esbuild")
	const { gzipSync } = await import("node:zlib")
	const sizes = {}
	for (const [label, entry] of [["core (index.js)", "dist/index.js"], ["react entry incl. core", "dist/react/index.js"]]) {
		const r = await build({ entryPoints: [join(ROOT, entry)], bundle: true, minify: true, format: "esm", external: ["react", "react-dom"], write: false })
		const code = r.outputFiles[0].contents
		sizes[label] = { minifiedBytes: code.length, gzipBytes: gzipSync(code, { level: 9 }).length }
	}
	const webflow = await readFile(join(ROOT, "dist/fitflush.webflow.min.js")).catch(() => null)
	if (webflow) sizes["webflow bundle (as built)"] = { minifiedBytes: webflow.length, gzipBytes: gzipSync(webflow, { level: 9 }).length }
	console.log("Bundle sizes:\n%s", JSON.stringify(sizes, null, "\t"))
} catch (e) {
	console.warn("Skipped bundle sizes (esbuild not available):", e.message)
}

// Resize GIF: step the scene frame by frame at 1x (each frame is a real fitFlush call), then
// assemble with ffmpeg using one shared palette.
const gifPage = await browser.newPage({ deviceScaleFactor: 1 })
await gifPage.goto(`http://localhost:${port}${PAGE}`, { waitUntil: "networkidle" })
await gifPage.waitForFunction(() => window.__ready === true, { timeout: 60000 })
const frames = await mkdtemp(join(tmpdir(), "fit-flush-gif-"))
const scene = await gifPage.$("#resize")
for (let i = 0; i < GIF_FRAMES; i++) {
	await gifPage.evaluate(([n, total]) => window.__resizeFrame(n, total), [i, GIF_FRAMES])
	await scene.screenshot({ path: join(frames, `${String(i).padStart(3, "0")}.png`) })
}
const gif = spawnSync("ffmpeg", [
	"-y", "-loglevel", "error", "-framerate", String(GIF_FPS), "-i", join(frames, "%03d.png"),
	"-filter_complex", "split[a][b];[a]palettegen=max_colors=64[p];[b][p]paletteuse=dither=none",
	"-loop", "0", join(ROOT, "assets/resize.gif"),
])
if (gif.status !== 0) console.error("Could not write assets/resize.gif (is ffmpeg installed?):", String(gif.stderr || gif.error))
else console.log("Captured assets/resize.gif (%d frames at %d fps)", GIF_FRAMES, GIF_FPS)
await rm(frames, { recursive: true, force: true })

await browser.close()
server.close()
