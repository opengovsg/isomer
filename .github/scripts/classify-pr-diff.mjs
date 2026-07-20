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

const BASE_SHA = requireEnv("BASE_SHA")
const HEAD_SHA = requireEnv("HEAD_SHA")

// Checked in this order — first match wins. Anything left over falls through
// to "app" by elimination.
const BUCKET_GLOBS = {
  ignore: [
    "pnpm-lock.yaml",
    "**/*.lock",
    "packages/db/src/generated/**",
    "packages/db/prisma/generated/**",
    "apps/studio/src/theme/generated/**",
    "apps/studio/public/assets/css/preview-tw.css",
    "**/dist/**",
    "**/.next/**",
    "**/storybook-static/**",
    "**/*.tsbuildinfo",
    "next-env.d.ts",
  ],
  doc: [
    "docs/**",
    "**/README.md",
    "**/CONTEXT.md",
    "**/CLAUDE.md",
    "**/*.mdx",
    "**/*.md",
    ".github/pull_request_template.md",
  ],
  test: [
    "**/__tests__/**",
    "**/*.test.ts",
    "**/*.test.tsx",
    "apps/studio/tests/e2e/**",
    "apps/studio/tests/integration/**",
    "apps/studio/tests/msw/**",
    "apps/studio/tests/load/**",
    "tooling/build/scripts/publishing/tests/**",
    "**/*.stories.tsx",
    "**/stories/**",
    "**/*.snap",
    "**/vitest*.config.*",
    "**/playwright.config.ts",
  ],
}

const BUCKET_ORDER = ["ignore", "doc", "test", "app"]
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

// Minimal glob->RegExp: this repo's bucket globs only ever use `*` and `**`,
// so a full glob library (brace expansion, extglob, etc.) would be unused
// surface area — this covers exactly what's needed.
function globToRegExp(glob) {
  let pattern = "^"
  for (let i = 0; i < glob.length; ) {
    const char = glob[i]
    if (char === "*" && glob[i + 1] === "*") {
      pattern += ".*"
      i += 2
      if (glob[i] === "/") i += 1
      continue
    }
    if (char === "*") {
      pattern += "[^/]*"
      i += 1
      continue
    }
    if ("\\^$.|?+()[]{}".includes(char)) {
      pattern += `\\${char}`
      i += 1
      continue
    }
    pattern += char
    i += 1
  }
  return new RegExp(`${pattern}$`)
}

const matchers = Object.fromEntries(
  Object.entries(BUCKET_GLOBS).map(([bucket, globs]) => [
    bucket,
    globs.map(globToRegExp),
  ]),
)

function classify(path) {
  for (const bucket of BUCKET_ORDER) {
    if (bucket === "app") return "app"
    if (matchers[bucket].some((re) => re.test(path))) return bucket
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

const grandTotal = BUCKET_ORDER.reduce(
  (sum, bucket) => sum + totals[bucket].files,
  0,
)

// Wrapped in a start/end pair (rather than one marker line) so
// update-pr-description.mjs can find-and-replace this whole block inside a
// PR description on every push, instead of stacking a copy per push.
let body = "<!-- pr-diff-breakdown:start -->\n"
body += "### 📊 PR diff breakdown\n\n"
body += "| Bucket | Files | +Lines | -Lines |\n"
body += "|---|---|---|---|\n"
for (const bucket of BUCKET_ORDER) {
  const t = totals[bucket]
  body += `| ${BUCKET_LABELS[bucket]} | ${t.files} | +${t.add} | -${t.del} |\n`
}
body += `\n${grandTotal} file(s) changed. Buckets derived from [\`docs/risk-taxonomy.md\`](../blob/main/docs/risk-taxonomy.md) conventions.\n`
body += "<!-- pr-diff-breakdown:end -->\n"

process.stdout.write(body)
