// Compares first-load bytes of the Next (apps/template/out) and Astro (apps/template-astro/out)
// builds of the same fixture. Usage: node scripts/measure.mjs / /about/ ...
//
// - initial: everything first-party fetched until the `load` event
// - lazy:    first-party fetched afterwards (scroll to bottom + idle) — `visible`/`idle` islands
// - 3p:      third-party bytes (not counted in totals)
// Sizes are gzip (level 6) for text, raw for fonts. Images are excluded (framework-independent).
import path from "node:path"
import zlib from "node:zlib"
import { chromium } from "playwright"

const ROOT = path.resolve(import.meta.dirname, "../../../apps")
const BUILDS = {
  next: path.join(ROOT, "template/out"),
  astro: path.join(ROOT, "template-astro/out"),
}
const args = process.argv.slice(2)
const showFiles = args.includes("--files")
const pages = args.filter((a) => a !== "--files").length
  ? args.filter((a) => a !== "--files")
  : ["/"]

import { serve } from "./serve.mjs"

const kindOf = (url, contentType) => {
  if (contentType.includes("html")) return "html"
  if (contentType.includes("javascript")) return "js"
  if (contentType.includes("css")) return "css"
  if (contentType.includes("font")) return "font"
  if (url.includes("__next") || url.endsWith(".txt")) return "rsc"
  return "other"
}

// Bytes of framework data embedded in HTML: Next's RSC flight payload vs island props.
const embeddedPayload = (html) =>
  [...html.matchAll(/<script>self\.__next_f\.push\([\s\S]*?<\/script>/g)]
    .map((m) => m[0])
    .join("") + [...html.matchAll(/data-p="[^"]*"/g)].map((m) => m[0]).join("")

const gz = (buf) => zlib.gzipSync(buf).length

const measure = async (browser, build, pagePath) => {
  const server = await serve(BUILDS[build], 0)
  const origin = `http://localhost:${server.address().port}`
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })
  const errors = []
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()))
  page.on("pageerror", (e) => errors.push(e.message))

  let phase = "initial"
  const rows = []
  page.on("response", async (res) => {
    const url = res.url()
    const ct = res.headers()["content-type"] ?? ""
    const currentPhase = phase
    const body = await res.body().catch(() => Buffer.alloc(0))
    if (!url.startsWith(origin)) {
      rows.push({ phase: "3p", kind: kindOf(url, ct), bytes: body.length, url })
      return
    }
    const kind = kindOf(url, ct)
    if (kind === "other") return
    rows.push({
      phase: currentPhase,
      kind,
      bytes: kind === "font" ? body.length : gz(body),
      url,
      body,
    })
  })

  await page.goto(origin + pagePath, { waitUntil: "load" })
  phase = "lazy"
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 400) {
      window.scrollTo(0, y)
      await new Promise((r) => setTimeout(r, 50))
    }
  })
  await page.waitForLoadState("networkidle")
  await page.waitForTimeout(500)
  await page.close()
  server.close()

  const sum = (pred) => rows.filter(pred).reduce((a, r) => a + r.bytes, 0)
  const html = rows.find((r) => r.kind === "html")?.body.toString() ?? ""
  return {
    html: sum((r) => r.phase === "initial" && r.kind === "html"),
    payload: gz(Buffer.from(embeddedPayload(html))),
    js: sum((r) => r.phase === "initial" && r.kind === "js"),
    css: sum((r) => r.phase === "initial" && r.kind === "css"),
    font: sum((r) => r.phase === "initial" && r.kind === "font"),
    rsc: sum((r) => r.phase !== "3p" && r.kind === "rsc"),
    lazyJs: sum((r) => r.phase === "lazy" && r.kind === "js"),
    thirdParty: sum((r) => r.phase === "3p"),
    jsFiles: rows.filter((r) => r.phase !== "3p" && r.kind === "js").length,
    files: rows
      .filter((r) => r.phase !== "3p" && r.kind === "js")
      .sort((x, y) => y.bytes - x.bytes)
      .map(
        (r) =>
          `${kb(r.bytes).padStart(6)} KB  ${r.phase.padEnd(7)}  ${r.url.split("/").pop()}`,
      ),
    errors,
  }
}

const kb = (n) => (n / 1024).toFixed(1)
const delta = (a, b) => (a === 0 ? "—" : `${(((b - a) / a) * 100).toFixed(0)}%`)

const browser = await chromium.launch()
const out = [
  "| Page | Metric | Next (KB) | Astro (KB) | Δ |",
  "|---|---|---:|---:|---:|",
]
const errorLines = []
for (const p of pages) {
  const n = await measure(browser, "next", p)
  const a = await measure(browser, "astro", p)
  const total = (m) => m.html + m.js + m.css + m.font
  const metrics = [
    ["**Total first load**", total(n), total(a)],
    ["HTML", n.html, a.html],
    ["↳ embedded payload (RSC / island props)", n.payload, a.payload],
    ["**JS (initial)**", n.js, a.js],
    ["CSS", n.css, a.css],
    ["Fonts", n.font, a.font],
    ["JS (lazy, after load)", n.lazyJs, a.lazyJs],
    ["RSC fetches", n.rsc, a.rsc],
    ["Third-party (excluded)", n.thirdParty, a.thirdParty],
  ]
  for (const [label, x, y] of metrics)
    out.push(`| \`${p}\` | ${label} | ${kb(x)} | ${kb(y)} | ${delta(x, y)} |`)
  out.push(`| \`${p}\` | JS files fetched | ${n.jsFiles} | ${a.jsFiles} | |`)
  for (const [b, m] of [
    ["next", n],
    ["astro", a],
  ]) {
    if (showFiles) console.log(`\n${b} ${p}\n${m.files.join("\n")}`)
    for (const e of m.errors)
      errorLines.push(`- ${b} \`${p}\`: ${e.slice(0, 200)}`)
  }
}
await browser.close()

console.log(out.join("\n"))
console.log(
  errorLines.length
    ? `\nConsole errors:\n${errorLines.join("\n")}`
    : "\nNo console errors.",
)
