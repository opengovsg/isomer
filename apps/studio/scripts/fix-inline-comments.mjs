#!/usr/bin/env node
/**
 * Fix no-inline-comments violations using oxlint output line numbers.
 */
import { execSync } from "node:child_process"
import { readFileSync, writeFileSync } from "node:fs"

const ROOT = new URL("../", import.meta.url).pathname

const lintOutput = execSync("pnpm exec oxlint --type-aware . 2>&1 || true", {
  cwd: ROOT,
  encoding: "utf-8",
})

const violations = []
for (const line of lintOutput.split("\n")) {
  const match = /^(.+?):(\d+):\d+: error eslint\(no-inline-comments\)/u.exec(
    line,
  )
  if (match) {
    violations.push({ file: match[1], line: Number(match[2]) })
  }
}

const byFile = new Map()
for (const v of violations) {
  const list = byFile.get(v.file) ?? []
  list.push(v.line)
  byFile.set(v.file, list)
}

let fixed = 0
for (const [file, lines] of byFile) {
  const path = `${ROOT}${file}`
  const fileLines = readFileSync(path, "utf-8").split("\n")
  const lineSet = new Set(lines)

  for (const lineNum of [...lineSet].sort((a, b) => b - a)) {
    const idx = lineNum - 1
    const original = fileLines[idx]
    const match = /^(.*\S)\s+(\/\/(?!\s*eslint-disable).*)$/u.exec(original)
    if (
      !match ||
      original.includes("http://") ||
      original.includes("https://")
    ) {
      continue
    }
    const indent = (original.match(/^(\s*)/u) ?? [""])[0]
    fileLines.splice(idx, 1, match[1], `${indent}${match[2]}`)
    fixed += 1
  }

  writeFileSync(path, fileLines.join("\n"))
}

console.log(
  `Fixed ${fixed} no-inline-comments violations in ${byFile.size} files`,
)
