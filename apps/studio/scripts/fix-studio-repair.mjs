#!/usr/bin/env node
/**
 * Repair broken patterns from over-aggressive boolean/truthiness automation.
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs"
import path from "node:path"

const ROOT = new URL("../", import.meta.url).pathname
const TARGETS = [
  "src/components",
  "src/pages",
  "src/hooks",
  "src/lib",
  "src/utils",
  "tests",
  "prisma",
  "next.config.mjs",
  "instrumentation-client.ts",
  "src/env.mjs",
]

const walk = (relDir) => {
  const abs = path.join(ROOT, relDir)
  if (!statSync(abs).isDirectory()) {
    return [relDir]
  }
  const out = []
  for (const entry of readdirSync(abs)) {
    const rel = path.join(relDir, entry)
    const full = path.join(ROOT, rel)
    if (statSync(full).isDirectory()) {
      out.push(...walk(rel))
    } else if (/\.(ts|tsx|mjs|cjs|js)$/u.test(entry)) {
      out.push(rel)
    }
  }
  return out
}

const files = TARGETS.flatMap((t) => {
  const abs = path.join(ROOT, t)
  try {
    return statSync(abs).isDirectory() ? walk(t) : [t]
  } catch {
    return []
  }
})

const repairs = [
  // Broken ternary from boolean script
  [
    /hasNonEmptyString\(([^)]+)\) \?hasNonEmptyString\(\.message\) \?/gu,
    "$1?.message ?",
  ],
  [
    /hasNonEmptyString\(([^)]+)\) \?hasNonEmptyString\(\.message\) &&/gu,
    "$1?.message &&",
  ],
  [
    /hasNonEmptyString\(([^)]+)\) \?hasNonEmptyString\(\.id\) &&/gu,
    "$1?.id &&",
  ],
  [
    /hasNonEmptyString\(([^)]+)\) \?hasNonEmptyString\(\.draftBlobId\) \?/gu,
    "$1?.draftBlobId ?",
  ],
  [
    /hasNonEmptyString\(([^)]+)\) \?hasNonEmptyString\(\.pageId\) &&/gu,
    "$1?.pageId &&",
  ],
  [
    /getFixedBlockContent\(pageLayout\)\?hasNonEmptyString\(\.description\) \? \.description/gu,
    "getFixedBlockContent(pageLayout)?.description",
  ],
  // Wrong optional chaining on truthiness helper result
  [/hasNonEmptyString\(([^)]+)\)\?\.message/gu, "$1?.message"],
  [/hasNonEmptyString\(([^)]+)\)\?\.parentId/gu, "$1?.parentId"],
  [/hasNonEmptyString\(([^)]+)\)\?\.title/gu, "$1?.title"],
  [/hasNonEmptyString\(([^)]+)\)\?\.id/gu, "$1?.id"],
  [/hasNonEmptyString\(([^)]+)\)\?\.src/gu, "$1?.src"],
  [/hasNonEmptyString\(([^)]+)\)\?\.fullPermalink/gu, "$1?.fullPermalink"],
  [/hasNonEmptyString\(([^)]+)\)\?\.email/gu, "$1?.email"],
  [/hasNonEmptyString\(([^)]+)\)\?\.colors/gu, "$1?.colors"],
  [/hasNonEmptyString\(([^)]+)\)\?\.trim\(\)/gu, "$1?.trim()"],
  [/hasNonEmptyString\(([^)]+)\)\?\.thumbnail/gu, "$1?.thumbnail"],
  // Broken getSeedSiteId
  [/getSeedSiteId\(, "u"\)/gu, "getSeedSiteId()"],
  [/uuuuu\$\{getSeedSiteId\(\)\}/gu, "u${getSeedSiteId()}"],
  [/uuuuu\\d\+/gu, "u\\d+"],
  // Stray text from broken disable comments
  [/^\s+cleanup deferred\s*$/gmu, ""],
  // Broken notification state init
  [
    /hasNonEmptyString\(previousNotification\.notification\) \?hasNonEmptyString\(\.title\) \? previousNotification : \{\}/gu,
    "previousNotification.notification?.title ? previousNotification : {}",
  ],
  // colours.tsx broken chain
  [
    /!hasNonEmptyString\(siteTheme\)\?\.colors\.brand\.canvas\.inverse/gu,
    "!siteTheme?.colors.brand.canvas.inverse",
  ],
  // fullPermalink with ||
  [
    /hasNonEmptyString\(data\)\?\.fullPermalink \|\| ""/gu,
    'data?.fullPermalink ?? ""',
  ],
]

let changed = 0
for (const relFile of files) {
  const filePath = path.join(ROOT, relFile)
  let content = readFileSync(filePath, "utf-8")
  const original = content

  for (const [pattern, replacement] of repairs) {
    content = content.replace(pattern, replacement)
  }

  // Remove duplicate blank lines from cleanup
  content = content.replace(/\n{3,}/gu, "\n\n")

  if (content !== original) {
    writeFileSync(filePath, content)
    changed++
    console.log(`repaired ${relFile}`)
  }
}

console.log(`Repaired ${changed} files`)
