#!/usr/bin/env node
/**
 * Remove oxlint-disable comments incorrectly placed as JSX text children.
 * Keeps prop-level and non-JSX disables intact.
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
]

const walk = (relDir) => {
  const abs = path.join(ROOT, relDir)
  const out = []
  for (const entry of readdirSync(abs)) {
    const rel = path.join(relDir, entry)
    const full = path.join(ROOT, rel)
    if (statSync(full).isDirectory()) {
      out.push(...walk(rel))
    } else if (/\.tsx$/u.test(entry)) {
      out.push(rel)
    }
  }
  return out
}

const files = TARGETS.flatMap((t) => walk(t))
let changed = 0

for (const relFile of files) {
  const filePath = path.join(ROOT, relFile)
  const lines = readFileSync(filePath, "utf-8").split("\n")
  const original = lines.join("\n")
  const out = []
  let inJsx = 0

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()

    // Track rough JSX depth via tags
    const opens = (line.match(/<(?![/!?])[A-Za-z]/gu) ?? []).length
    const closes = (line.match(/<\//gu) ?? []).length
    const selfClose = (line.match(/\/>/gu) ?? []).length
    inJsx += opens - closes - selfClose

    const isDisableOnly =
      /^\/\/ oxlint-disable(?:-next-line)? /u.test(trimmed) ||
      trimmed ===
        "// oxlint-disable-next-line unicorn/no-use-before-define -- core" ||
      trimmed === "cleanup deferred"

    // Remove disable-only lines that are JSX children (indented, between elements)
    if (
      isDisableOnly &&
      /^\s+\/\//u.test(line) &&
      !line.includes("={") &&
      inJsx > 0
    ) {
      continue
    }

    out.push(line)
  }

  const content = out.join("\n").replace(/\n{3,}/gu, "\n\n")
  if (content !== original) {
    writeFileSync(filePath, content)
    changed++
    console.log(`cleaned ${relFile}`)
  }
}

console.log(`Cleaned ${changed} files`)
