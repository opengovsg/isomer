#!/usr/bin/env node
import { execSync } from "node:child_process"
import { readFileSync, writeFileSync } from "node:fs"
import path from "node:path"

const ROOT = new URL("../", import.meta.url).pathname
const SERVER = path.join(ROOT, "src/server")

const lintOutput = execSync(
  "pnpm exec oxlint --type-aware src/server 2>&1 || true",
  { cwd: ROOT, encoding: "utf-8" },
)

const violations = []
for (const line of lintOutput.split("\n")) {
  const match =
    /^(.+?):(\d+):\d+: error typescript\(strict-boolean-expressions\):/u.exec(
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

const truthinessImport =
  'import { hasNonEmptyString, isDefinedNumber, isNullableBooleanTrue } from "~/utils/truthiness"\n'

const ensureImport = (content) => {
  if (content.includes('from "~/utils/truthiness"')) {
    return content
  }
  const lines = content.split("\n")
  let lastImport = -1
  for (let i = 0; i < lines.length; i++) {
    if (/^import\s/u.test(lines[i])) {
      lastImport = i
    }
  }
  if (lastImport >= 0) {
    lines.splice(lastImport + 1, 0, truthinessImport.trimEnd())
    return lines.join("\n")
  }
  return `${truthinessImport}${content}`
}

const patterns = [
  [/\bif \(!([a-zA-Z0-9_.]+)\)/gu, "if (!hasNonEmptyString($1))"],
  [
    /\bif \(([a-zA-Z0-9_.]+)\)/gu,
    (match, name, offset, str) => {
      const before = str.slice(Math.max(0, offset - 4), offset)
      if (before.endsWith("!")) {
        return match
      }
      if (name.endsWith("Id") && name !== "siteId") {
        return `if (hasNonEmptyString(${name}))`
      }
      return match
    },
  ],
]

let changed = 0
for (const [relFile, lineNums] of byFile) {
  const filePath = path.join(ROOT, relFile)
  let content = readFileSync(filePath, "utf-8")
  const original = content
  const lines = content.split("\n")
  let touched = false

  for (const lineNum of new Set(lineNums)) {
    const idx = lineNum - 1
    let line = lines[idx]
    if (!line) {
      continue
    }

    if (/\bif \(!env\.[A-Z0-9_]+\)/u.test(line)) {
      line = line.replace(
        /if \(!env\.([A-Z0-9_]+)\)/u,
        "if (!hasNonEmptyString(env.$1))",
      )
      touched = true
    }
    if (/\bif \(env\.[A-Z0-9_]+\)/u.test(line)) {
      line = line.replace(
        /if \(env\.([A-Z0-9_]+)\)/u,
        "if (hasNonEmptyString(env.$1))",
      )
      touched = true
    }
    if (/\bif \(!([a-zA-Z]+Id)\)/u.test(line) && line.includes("resourceId")) {
      line = line.replace(
        /if \(!resourceId\)/u,
        "if (!isDefinedNumber(resourceId))",
      )
      touched = true
    }
    if (/\bif \(resourceId\)/u.test(line)) {
      line = line.replace(
        /if \(resourceId\)/u,
        "if (isDefinedNumber(resourceId))",
      )
      touched = true
    }
    if (/\bif \(!query\)/u.test(line)) {
      line = line.replace(/if \(!query\)/u, "if (!hasNonEmptyString(query))")
      touched = true
    }
    if (/\bif \(query\)/u.test(line)) {
      line = line.replace(/if \(query\)/u, "if (hasNonEmptyString(query))")
      touched = true
    }

    lines[idx] = line
  }

  if (touched) {
    content = lines.join("\n")
    content = ensureImport(content)
    if (content !== original) {
      writeFileSync(filePath, content)
      changed++
      console.log(relFile)
    }
  }
}

console.log(`Updated ${changed} files`)
