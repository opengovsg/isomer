// Builds the coverage fixture (plus a site notification) with `astro build --devOutput`, which turns
// on the islands' hydration check (apps/template-astro/src/islands/hydration-check.ts): Preact
// itself stays silent about most mismatches. Then runs the hydration and interaction tests against it.
//   node scripts/hydration-check.mjs
import { execFileSync, spawnSync } from "node:child_process"
import path from "node:path"

const EXP = path.resolve(import.meta.dirname, "..")
const APP = path.resolve(EXP, "../../apps/template-astro")
const fixture = path.join(EXP, "fixtures/hydration")

execFileSync("pnpm", ["fixture:make", fixture, "60", "--notification"], {
  cwd: EXP,
  stdio: "ignore",
})
execFileSync("node", ["scripts/fixture.mjs", "apply", fixture], { cwd: EXP })
let status = 1
try {
  execFileSync(
    "pnpm",
    ["exec", "astro", "build", "--devOutput", "--outDir", "out-dev"],
    {
      cwd: APP,
      stdio: "ignore",
    },
  )
  status = spawnSync(
    "pnpm",
    ["exec", "playwright", "test", "--project=astro-dev"],
    {
      cwd: EXP,
      stdio: "inherit",
    },
  ).status
} finally {
  execFileSync("node", ["scripts/fixture.mjs", "restore"], { cwd: EXP })
}
process.exit(status ?? 1)
