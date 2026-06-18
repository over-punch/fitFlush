// README visual capture for fit-flush.
// Serves the repo ROOT over HTTP (so /dist and /site/public resolve), renders
// site/scripts/capture.html in headless Chromium, and screenshots each `.scene`
// element to assets/<id>.png with transparent corners.
//
// Run from the repo root:  node site/scripts/capture.mjs
// Setup (once):  cd site && npm i -D playwright

import { createServer } from "node:http"
import { readFile } from "node:fs/promises"
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

await new Promise((r) => server.listen(0, r))
const { port } = server.address()

const browser = await chromium.launch()
const page = await browser.newPage({ deviceScaleFactor: 2 })
await page.goto(`http://localhost:${port}${PAGE}`, { waitUntil: "networkidle" })
await page.waitForFunction(() => window.__ready === true, { timeout: 8000 })
await page.waitForTimeout(400) // let variable-font glyphs settle

const ids = await page.$$eval(".scene", (els) => els.map((e) => e.id))
for (const id of ids) {
	const el = await page.$(`#${id}`)
	await el.screenshot({ path: join(ROOT, `assets/${id}.png`), omitBackground: true })
	console.log("captured assets/%s.png", id)
}

await browser.close()
server.close()
