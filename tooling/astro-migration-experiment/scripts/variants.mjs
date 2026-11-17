// Builds every Astro variant on the coverage fixture, runs the parity suite against each and
// records its first-load bytes vs Next. Results land in results/variants/<variant>.md.
//   node scripts/variants.mjs [variant...]
import { execFileSync, spawnSync } from "node:child_process"
import fs from "node:fs"
import path from "node:path"

const EXP = path.resolve(import.meta.dirname, "..")
const APP = path.resolve(EXP, "../../apps/template-astro")
const TEMPLATE = path.resolve(EXP, "../../apps/template")
const PAGES = [
  "/",
  "/content/",
  "/collection-1/",
  "/collection-1/article-1/",
  "/database/",
]
const VARIANTS = {
  "preact-islands": {}, // the default
  "react-islands": { ISLANDS_RUNTIME: "react" },
  // These two need `git apply tooling/astro-migration-experiment/variants.patch` (+ the
  // @tanstack/redact dependency); they were removed from apps/template-astro after the experiment.
  "redact-islands": { ISLANDS_RUNTIME: "redact" },
  "whole-tree-react": { ISLANDS_MODE: "whole-tree", ISLANDS_RUNTIME: "react" },
}
// --reuse-next: skip building Next and recording its screenshots; reuse the ones already on disk.
// packages/components has been simplified for Astro on this branch, so apps/template no longer
// builds here: the Next reference must come from an earlier build (main, or commit 0df990a56).
const args = process.argv.slice(2)
const reuseNext = args.includes("--reuse-next")
const names = args.filter((arg) => arg !== "--reuse-next")
const selected = names.length ? names : Object.keys(VARIANTS)

const run = (cmd, args, opts = {}) => {
  const r = spawnSync(cmd, args, {
    encoding: "utf8",
    ...opts,
    env: { ...process.env, ...opts.env },
  })
  return { ok: r.status === 0, out: `${r.stdout}${r.stderr}` }
}

// next's CLI can stop once with a prompt; the same command succeeds on retry.
const buildNext = () => {
  for (let i = 0; i < 4; i++)
    if (run("pnpm", ["build:template"], { cwd: TEMPLATE }).ok) return
  throw new Error("next build failed")
}

const outDir = path.join(EXP, "results/variants")
fs.mkdirSync(outDir, { recursive: true })
const fixture = path.join(EXP, "fixtures/coverage")
execFileSync("pnpm", ["fixture:make", fixture, "60"], {
  cwd: EXP,
  stdio: "ignore",
})
execFileSync("node", ["scripts/fixture.mjs", "apply", fixture], { cwd: EXP })
try {
  if (!reuseNext) {
    buildNext()
    const nextBaseline = run(
      "pnpm",
      ["exec", "playwright", "test", "--project=next", "--update-snapshots"],
      { cwd: EXP },
    )
    if (!nextBaseline.ok)
      throw new Error(`next baseline failed:\n${nextBaseline.out.slice(-3000)}`)
  }

  for (const name of selected) {
    const env = VARIANTS[name]
    const build = run("pnpm", ["build:template"], { cwd: APP, env })
    if (!build.ok) {
      fs.writeFileSync(
        path.join(outDir, `${name}.md`),
        `BUILD FAILED\n\n\`\`\`\n${build.out.slice(-4000)}\n\`\`\`\n`,
      )
      console.log(`${name}: build failed`)
      continue
    }
    const tests = run(
      "pnpm",
      ["exec", "playwright", "test", "--project=astro", "--reporter=line"],
      { cwd: EXP },
    )
    const summary =
      tests.out
        .match(/(\d+) passed|(\d+) failed|PASS \(\d+\) FAIL \(\d+\)/g)
        ?.join(", ") ?? "?"
    const failures = [...tests.out.matchAll(/✘.*›\s*(.*)/g)].map(
      (m) => `- ${m[1].trim()}`,
    )
    const measure = run("node", ["scripts/measure.mjs", "--files", ...PAGES], {
      cwd: EXP,
    })
    fs.writeFileSync(
      path.join(outDir, `${name}.md`),
      `# ${name}\n\nenv: \`${JSON.stringify(env)}\`\n\nParity suite: ${summary}\n${failures.join("\n")}\n\n${measure.out}\n`,
    )
    console.log(`${name}: tests ${summary}`)
  }
} finally {
  execFileSync("node", ["scripts/fixture.mjs", "restore"], { cwd: EXP })
}
