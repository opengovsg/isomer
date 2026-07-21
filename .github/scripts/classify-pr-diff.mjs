#!/usr/bin/env node
// Buckets every file in a PR's diff into App / Test / Doc / Ignore and sums
// added/deleted lines per bucket. Globs are derived from what this repo
// actually uses (see docs/risk-taxonomy.md and the vitest/playwright/storybook
// setups under apps/studio and packages/components) — not generic assumptions.
//
// Required env:
//   BASE_SHA   the PR base commit
//   HEAD_SHA   the PR head commit

import { execFileSync } from "node:child_process"
import { matchesGlob } from "node:path"

const BASE_SHA = requireEnv("BASE_SHA")
const HEAD_SHA = requireEnv("HEAD_SHA")

// Checked in this order — first match wins. Anything left over falls through
// to "app" by elimination.
const BUCKET_GLOBS = {
  // Only paths that can actually appear in a real diff: everything else that
  // was here previously (dist/, .next/, storybook-static/, *.tsbuildinfo,
  // next-env.d.ts, preview-tw.css, packages/db/prisma/generated/) is already
  // gitignored, so it can't show up here short of a force-add — in which
  // case it's arguably worth surfacing, not hiding. These two generated dirs
  // are the exception: verified with `git check-ignore` that neither is
  // actually covered by .gitignore, despite living next to dirs that are.
  ignore: ["pnpm-lock.yaml", "packages/db/src/generated/**", "apps/studio/src/theme/generated/**"],
  doc: ["**/*.md", "**/*.mdx"],
  test: [
    "**/__tests__/**",
    "**/*.test.ts",
    "**/*.test.tsx",
    "apps/studio/tests/e2e/**",
    "apps/studio/tests/integration/**",
    "apps/studio/tests/msw/**",
    "apps/studio/tests/load/**",
    "tooling/build/scripts/publishing/tests/**",
    "**/*.stories.ts",
    "**/*.stories.tsx",
    "**/stories/**",
    "**/*.snap",
  ],
}

// Classification priority (ignore > doc > test > app) — NOT the same as the
// table's row order below. Doc has to be checked before test so e.g. a
// .mdx file under a stories/ dir counts as Doc, not Test.
const BUCKET_ORDER = ["ignore", "doc", "test", "app"]

// Table row order — independent of classification priority above, purely
// for readability (App first, since that's usually what a reviewer cares
// about most).
const TABLE_ORDER = ["app", "test", "doc", "ignore"]

const BUCKET_LABELS = {
  ignore: "🚫 Ignore",
  doc: "📄 Doc",
  test: "🧪 Test",
  app: "⚙️ App",
}

function requireEnv(name) {
  const value = process.env[name]
  if (!value) throw new Error(`Missing required env var: ${name}`)
  return value
}

function classify(path) {
  for (const bucket of BUCKET_ORDER) {
    if (bucket === "app") return "app"
    if (BUCKET_GLOBS[bucket].some((glob) => matchesGlob(path, glob))) return bucket
  }
  return "app"
}

// `git diff --numstat` renders renames as either `old => new` or the more
// compact `prefix{old => new}suffix` for partial-path renames. Classify on
// the new path in both cases.
function resolveRenamedPath(rawPath) {
  const braceMatch = rawPath.match(/^(.*)\{.* => (.*)\}(.*)$/)
  if (braceMatch) {
    const [, prefix, newPart, suffix] = braceMatch
    return `${prefix}${newPart}${suffix}`
  }
  const plainMatch = rawPath.match(/^(?:.* => )(.*)$/)
  if (plainMatch) return plainMatch[1]
  return rawPath
}

const numstat = execFileSync(
  "git",
  [
    "diff",
    "--numstat",
    "-M", // detect renames explicitly — don't rely on the runner's diff.renames config
    `${BASE_SHA}...${HEAD_SHA}`, // three-dot: diff against the merge-base, not base's current tip
  ],
  { encoding: "utf8" },
)
  .trim()
  .split("\n")
  .filter(Boolean)

const totals = Object.fromEntries(
  [...BUCKET_ORDER].map((bucket) => [bucket, { add: 0, del: 0, files: 0 }]),
)

for (const line of numstat) {
  const [addRaw, delRaw, rawPath] = line.split("\t")
  // Binary files report "-" for both counts.
  const add = addRaw === "-" ? 0 : Number(addRaw)
  const del = delRaw === "-" ? 0 : Number(delRaw)
  const path = resolveRenamedPath(rawPath)
  const bucket = classify(path)
  totals[bucket].add += add
  totals[bucket].del += del
  totals[bucket].files += 1
}

// Wrapped in a start/end pair (rather than one marker line) so
// update-pr-description.mjs can find-and-replace this whole block inside a
// PR description on every push, instead of stacking a copy per push.
let body = "<!-- pr-diff-breakdown:start -->\n"
body += "### 📊 PR diff breakdown\n\n"
body += "| Bucket | Files | +Lines | -Lines |\n"
body += "|---|---|---|---|\n"
for (const bucket of TABLE_ORDER) {
  const t = totals[bucket]
  body += `| ${BUCKET_LABELS[bucket]} | ${t.files} | +${t.add} | -${t.del} |\n`
}
body += "<!-- pr-diff-breakdown:end -->\n"

process.stdout.write(body)
