#!/usr/bin/env node
/**
 * Repair broken strict-void-return transforms and strip junk disable blocks.
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs"
import path from "node:path"

const ROOT = new URL("../", import.meta.url).pathname

const walk = (relDir) => {
  const abs = path.join(ROOT, relDir)
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

const files = [
  ...walk("src/components"),
  ...walk("src/pages"),
  ...walk("src/hooks"),
  ...walk("src/lib"),
  ...walk("src/utils"),
  ...walk("tests"),
  ...walk("prisma"),
  "next.config.mjs",
  "instrumentation-client.ts",
  "src/env.mjs",
]

const repairs = [
  // Broken void-return transform
  [
    /\(\) => \{ editor\.chain\(\) \}\.focus\(\)(.+?)\.run\(\)/gu,
    "() => { editor.chain().focus()$1.run() }",
  ],
  // Remove blocks of lint cleanup disable comments
  [/(?:^[ \t]*\/\/ oxlint-disable-next-line [^\n]*-- lint cleanup\n)+/gmu, ""],
  // Remove bad parse-error disables
  [/^[ \t]*\/\/ oxlint-disable-next-line \/parse-error[^\n]*\n/gmu, ""],
  // Remove orphaned "core cleanup deferred" lines
  [
    /^[ \t]*\/\/ oxlint-disable-next-line[^\n]*-- core cleanup deferred\n/gmu,
    "",
  ],
  [
    /^[ \t]*\/\/ oxlint-disable-next-line unicorn\/no-use-before-define -- core\n\n?/gmu,
    "",
  ],
]

let changed = 0
for (const relFile of files) {
  const filePath = path.join(ROOT, relFile)
  let content
  try {
    content = readFileSync(filePath, "utf-8")
  } catch {
    continue
  }
  const original = content
  for (const [pattern, replacement] of repairs) {
    content = content.replace(pattern, replacement)
  }
  content = content.replace(/\n{3,}/gu, "\n\n")
  if (content !== original) {
    writeFileSync(filePath, content)
    changed++
    console.log(`fixed ${relFile}`)
  }
}

console.log(`Fixed ${changed} files`)
