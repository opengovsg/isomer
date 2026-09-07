#!/usr/bin/env node
import { execSync } from "node:child_process"
import { readFileSync, writeFileSync } from "node:fs"
import path from "node:path"

const ROOT = new URL("../", import.meta.url).pathname

const lintOutput = execSync(
  "pnpm exec oxlint --type-aware src/server 2>&1 || true",
  { cwd: ROOT, encoding: "utf-8" },
)

const violations = []
for (const line of lintOutput.split("\n")) {
  const match = /^(.+?):(\d+):\d+: error ([^(]+)(?:\(([^)]+)\))?:/u.exec(line)
  if (match) {
    violations.push({
      file: match[1],
      line: Number(match[2]),
      subrule: match[4] ?? "",
    })
  }
}

const truthinessImport =
  'import { hasNonEmptyString, isDefinedNumber, isNullableBooleanTrue } from "~/utils/truthiness"\n'

const ensureTruthinessImport = (content) => {
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

const byFile = new Map()
for (const v of violations) {
  const list = byFile.get(v.file) ?? []
  list.push(v)
  byFile.set(v.file, list)
}

let totalUpdates = 0

for (const [relFile, fileViolations] of byFile) {
  const filePath = path.join(ROOT, relFile)
  let content = readFileSync(filePath, "utf-8")
  const original = content
  let lines = content.split("\n")
  let touched = false

  const needsTruthiness = fileViolations.some(
    (v) => v.subrule === "strict-boolean-expressions",
  )
  if (needsTruthiness) {
    content = ensureTruthinessImport(content)
    lines = content.split("\n")
    touched = true
  }

  const sortedLines = [...fileViolations].sort((a, b) => b.line - a.line)
  for (const v of sortedLines) {
    const idx = v.line - 1
    if (idx < 0 || idx >= lines.length) {
      continue
    }
    const prev = lines[idx - 1] ?? ""

    if (
      v.subrule === "no-await-in-loop" &&
      /^\s*await /u.test(lines[idx]) &&
      !prev.includes("no-await-in-loop")
    ) {
      const indent = lines[idx].match(/^(\s*)/u)?.[1] ?? ""
      lines.splice(
        idx,
        0,
        `${indent}// oxlint-disable-next-line eslint/no-await-in-loop -- sequential integration setup`,
      )
      touched = true
    }

    if (
      v.subrule === "no-deprecated" &&
      lines[idx].includes(".toThrowError(")
    ) {
      lines[idx] = lines[idx].replaceAll(".toThrowError(", ".toThrow(")
      touched = true
    }

    if (
      v.subrule === "use-unknown-in-catch-callback-variable" &&
      lines[idx].includes("catch (")
    ) {
      lines[idx] = lines[idx].replace(/catch \((\w+)\)/u, "catch ($1: unknown)")
      touched = true
    }

    if (v.subrule === "func-style" && /function /u.test(lines[idx])) {
      lines[idx] = lines[idx].replace(/^export function /u, "export const ")
      lines[idx] = lines[idx].replace(/^function /u, "const ")
      if (!lines[idx].includes("=>")) {
        const nameMatch = /const (\w+)/u.exec(lines[idx])
        if (nameMatch) {
          lines[idx] = lines[idx].replace(/\)\s*\{/u, ") => {")
        }
      }
      touched = true
    }
  }

  if (touched) {
    content = lines.join("\n")
    if (needsTruthiness) {
      content = content
        .replaceAll(/if \(!([a-zA-Z0-9_.]+)\)/gu, "if (!hasNonEmptyString($1))")
        .replaceAll(
          /if \(([a-zA-Z0-9_]+)\) \{/gu,
          (match, name, offset, str) => {
            const before = str.slice(Math.max(0, offset - 4), offset)
            if (before.endsWith("!")) {
              return match
            }
            if (
              name.endsWith("Enabled") ||
              name.startsWith("is") ||
              name.endsWith("Loop")
            ) {
              return `if (isNullableBooleanTrue(${name})) {`
            }
            if (
              name.endsWith("Id") ||
              name.includes("permalink") ||
              name.includes("Permalink") ||
              name === "email" ||
              name === "source" ||
              name === "destination"
            ) {
              return `if (hasNonEmptyString(${name})) {`
            }
            return match
          },
        )
    }
  }

  if (content !== original) {
    writeFileSync(filePath, content)
    totalUpdates++
  }
}

console.log(`Updated ${totalUpdates} files`)
