#!/usr/bin/env node
/**
 * Fix require-unicode-regexp violations using oxlint output line numbers.
 */
import { execSync } from "node:child_process"
import { readFileSync, writeFileSync } from "node:fs"

const lintOutput = execSync("pnpm exec oxlint --type-aware . 2>&1 || true", {
  cwd: new URL("../", import.meta.url).pathname,
  encoding: "utf-8",
})

const violations = []
for (const line of lintOutput.split("\n")) {
  const match =
    /^(.+?):(\d+):\d+: error eslint\(require-unicode-regexp\)/u.exec(line)
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
  const path = `${new URL("../", import.meta.url).pathname}${file}`
  const content = readFileSync(path, "utf-8")
  const fileLines = content.split("\n")
  const lineSet = new Set(lines)

  for (const lineNum of lineSet) {
    const idx = lineNum - 1
    const original = fileLines[idx]
    const updated = original.replaceAll(
      /\/((?:\\.|[^/u\\\n])+)\/([gimsy]*)/gu,
      (match, pattern, flags) => {
        if (flags.includes("u")) {
          return match
        }
        return `/${pattern}/${flags}u`
      },
    )
    if (updated !== original) {
      fileLines[idx] = updated
      fixed += 1
    }
  }

  writeFileSync(path, fileLines.join("\n"))
}

console.log(
  `Fixed ${fixed} require-unicode-regexp violations in ${byFile.size} files`,
)
