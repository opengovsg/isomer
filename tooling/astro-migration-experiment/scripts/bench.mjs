// Build-time benchmark: wall time + peak RSS (summed over the whole process tree, so Next's
// worker processes count) for Next and Astro variants at several site sizes.
//   node scripts/bench.mjs [sizes=100,1000,10000] [runs=3] [variants=next,astro,...]
// Sizes >= 10000 run once. Leaves apps/template restored to its committed sample site.
import { execFileSync, spawn } from "node:child_process"
import fs from "node:fs"
import path from "node:path"

const EXP = path.resolve(import.meta.dirname, "..")
const APP = path.resolve(EXP, "../../apps/template-astro")
const TEMPLATE = path.resolve(EXP, "../../apps/template")
const [sizesArg = "100,1000,10000", runsArg = "3", variantsArg] =
  process.argv.slice(2)
const sizes = sizesArg.split(",").map(Number)

const VARIANTS = {
  next: { cwd: TEMPLATE, clean: [".next", "out"], env: {} },
  // apps/template-astro as is (parallel prerendering). In results/bench-results.json the
  // "astro" rows are single-process and "astro-parallel" rows parallel.
  astro: { cwd: APP, clean: [".astro", "out"], env: {} },
  // Needs `git apply tooling/astro-migration-experiment/variants.patch`.
  "astro-single": {
    cwd: APP,
    clean: [".astro", "out"],
    env: { ASTRO_PARALLEL_PRERENDER: "0" },
  },
}

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

const buildOnce = ({ cwd, clean, env }) =>
  new Promise((resolve, reject) => {
    for (const dir of clean) {
      // Keep next's CLI retry state (the rest of .next, incl. webpack cache, goes) so cold builds
      // aren't interrupted by its one-time CLI prompt.
      const receipts = path.join(cwd, dir, "cache/next-agentic-upgrade-retries")
      const saved =
        fs.existsSync(receipts) &&
        fs.mkdtempSync(path.join(EXP, "fixtures/.receipts-"))
      if (saved) fs.cpSync(receipts, saved, { recursive: true })
      fs.rmSync(path.join(cwd, dir), { recursive: true, force: true })
      if (saved) {
        fs.cpSync(saved, receipts, { recursive: true })
        fs.rmSync(saved, { recursive: true })
      }
    }
    const start = performance.now()
    const child = spawn("pnpm", ["build:template"], {
      cwd,
      env: { ...process.env, ...env },
    })
    let output = ""
    child.stdout.on("data", (d) => (output += d))
    child.stderr.on("data", (d) => (output += d))
    let peak = 0
    const timer = setInterval(() => {
      try {
        peak = Math.max(peak, treeRss(child.pid))
      } catch {}
    }, 250)
    child.on("exit", (code) => {
      clearInterval(timer)
      const seconds = (performance.now() - start) / 1000
      code === 0
        ? resolve({ seconds, peak })
        : reject(Object.assign(new Error(output.slice(-2000)), { output }))
    })
  })

// next's CLI can stop once with a prompt; the same command succeeds on retry.
const build = async (variant) => {
  for (let attempt = 1; ; attempt++) {
    try {
      return await buildOnce(variant)
    } catch (e) {
      if (
        attempt < 4 &&
        /SecurityFatalError|upgrade recommendation/.test(e.output)
      )
        continue
      throw e
    }
  }
}

const median = (xs) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)]
const results = []
try {
  for (const size of sizes) {
    const dir = path.join(EXP, `fixtures/bench-${size}`)
    execFileSync("pnpm", ["fixture:make", dir, String(size)], {
      cwd: EXP,
      stdio: "inherit",
    })
    execFileSync("node", ["scripts/fixture.mjs", "apply", dir], { cwd: EXP })
    const runs = size >= 10000 ? 1 : Number(runsArg)
    for (const [name, variant] of Object.entries(VARIANTS)) {
      if (variantsArg && !variantsArg.split(",").includes(name)) continue
      const samples = []
      for (let i = 0; i < runs; i++) samples.push(await build(variant))
      const row = {
        size,
        variant: name,
        runs,
        seconds: median(samples.map((s) => s.seconds)),
        peakMb: median(samples.map((s) => s.peak)) / 1024 / 1024,
      }
      results.push(row)
      console.log(JSON.stringify(row))
      fs.writeFileSync(
        path.join(EXP, "results/bench-results.json"),
        JSON.stringify(results, null, 2),
      )
    }
  }
} finally {
  execFileSync("node", ["scripts/fixture.mjs", "restore"], { cwd: EXP })
}

console.log(
  "\n| Pages | Variant | Runs | Build (s, median) | Peak RSS (MB) |\n|---:|---|---:|---:|---:|",
)
for (const r of results)
  console.log(
    `| ${r.size} | ${r.variant} | ${r.runs} | ${r.seconds.toFixed(1)} | ${r.peakMb.toFixed(0)} |`,
  )
