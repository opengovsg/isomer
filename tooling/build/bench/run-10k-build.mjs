// Next.js only: times `next build --webpack` for apps/template (static export).
// Does not run Astro. Applies a fixture directory (data/, schema/, sitemap.json).
// Usage: node tooling/build/bench/run-10k-build.mjs <fixtureDir> [label]
import { execFileSync, spawn } from "node:child_process"
import fs from "node:fs"
import path from "node:path"
import { performance } from "node:perf_hooks"

const TEMPLATE = path.resolve("apps/template")
const fixtureDir = path.resolve(
  process.argv[2] ?? "tooling/build/fixtures/bench-10k",
)
const label = process.argv[3] ?? "cached"
const ENTRIES = ["data", "schema", "sitemap.json"]

const treeRss = (rootPid) => {
  const rows = execFileSync("ps", ["-A", "-o", "pid=,ppid=,rss="], {
    encoding: "utf8",
  })
    .trim()
    .split("\n")
    .map((l) => l.trim().split(/\s+/).map(Number))
  const pids = new Set([rootPid])
  let grew = true
  while (grew) {
    grew = false
    for (const [pid, ppid] of rows)
      if (pids.has(ppid) && !pids.has(pid)) (pids.add(pid), (grew = true))
  }
  return (
    rows.filter(([pid]) => pids.has(pid)).reduce((a, [, , rss]) => a + rss, 0) *
    1024
  )
}

for (const dir of [".next", "out"]) {
  fs.rmSync(path.join(TEMPLATE, dir), { recursive: true, force: true })
}

for (const entry of ENTRIES) {
  fs.rmSync(path.join(TEMPLATE, entry), { recursive: true, force: true })
  fs.cpSync(path.join(fixtureDir, entry), path.join(TEMPLATE, entry), {
    recursive: true,
  })
}

const pageCount = Number(
  execFileSync("find", [path.join(TEMPLATE, "out"), "-name", "index.html"], {
    encoding: "utf8",
  })
    .trim()
    .split("\n")
    .filter(Boolean).length,
)

const started = performance.now()
const child = spawn("pnpm", ["run", "build:template"], {
  cwd: TEMPLATE,
  env: { ...process.env, NODE_ENV: "production" },
  stdio: ["ignore", "pipe", "pipe"],
})

let stderr = ""
child.stderr.on("data", (d) => (stderr += d))

let peak = 0
const timer = setInterval(() => {
  try {
    peak = Math.max(peak, treeRss(child.pid))
  } catch {}
}, 500)

const exitCode = await new Promise((resolve) => child.on("exit", resolve))
clearInterval(timer)

const seconds = (performance.now() - started) / 1000
const outExists = fs.existsSync(path.join(TEMPLATE, "out"))

const result = {
  label,
  fixtureDir,
  schemaFiles: pageCount,
  exitCode,
  seconds: Math.round(seconds * 10) / 10,
  peakRssGb: Math.round((peak / 1024 ** 3) * 100) / 100,
  outExists,
  stderrTail: stderr.slice(-500),
}

console.log(JSON.stringify(result, null, 2))

if (!outExists) process.exit(1)
