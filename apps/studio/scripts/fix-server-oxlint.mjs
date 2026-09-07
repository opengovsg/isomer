#!/usr/bin/env node
/**
 * Batch-fix common oxlint core violations in src/server.
 */
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
  const match = /^(.+?):(\d+):\d+: error ([^(]+)(?:\(([^)]+)\))?:/u.exec(line)
  if (match) {
    violations.push({
      file: match[1],
      line: Number(match[2]),
      rule: match[3],
      subrule: match[4] ?? "",
    })
  }
}

const byFile = new Map()
for (const v of violations) {
  const list = byFile.get(v.file) ?? []
  list.push(v)
  byFile.set(v.file, list)
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

let filesChanged = 0

for (const [relFile, fileViolations] of byFile) {
  const filePath = path.join(ROOT, relFile)
  let content = readFileSync(filePath, "utf-8")
  const original = content
  const lines = content.split("\n")

  for (const v of fileViolations) {
    const idx = v.line - 1
    if (idx < 0 || idx >= lines.length) {
      continue
    }
    let line = lines[idx]

    if (v.subrule === "no-deprecated" && line.includes("toThrowError")) {
      line = line.replaceAll(".toThrowError(", ".toThrow(")
    }

    if (v.subrule === "use-unknown-in-catch-callback-variable") {
      line = line.replace(/\.catch\(\((\w+)\) =>/gu, ".catch(($1: unknown) =>")
      line = line.replace(/catch \((\w+)\) \{/gu, "catch ($1: unknown) {")
    }

    if (v.subrule === "radix" && line.includes("parseInt(")) {
      line = line.replace(/parseInt\(([^,)]+)\)(?!\s*,)/gu, "parseInt($1, 10)")
    }

    if (v.subrule === "no-plusplus") {
      line = line.replace(/\bi\+\+/gu, "i += 1")
      line = line.replace(/\+\+(\w+)/gu, "$1 += 1")
    }

    if (v.subrule === "no-unneeded-ternary") {
      line = line.replace(/\?\s*true\s*:\s*false/gu, "")
    }

    if (v.subrule === "prefer-native-coercion-functions") {
      line = line.replace(/\(\s*(\w+)\s*\)\s*=>\s*Boolean\(\1\)/gu, "Boolean")
    }

    if (v.subrule === "no-unnecessary-type-conversion") {
      line = line.replaceAll("Number(siteId)", "siteId")
      line = line.replaceAll("String(resourceId)", "resourceId")
    }

    if (v.subrule === "strict-boolean-expressions") {
      if (line.includes("if (!") && line.includes("HEARTBEAT_URL")) {
        line = line.replace(/if \(!([^)]+)\)/u, "if (!hasNonEmptyString($1))")
      }
      if (
        line.includes("if (resourceId)") ||
        line.includes("if (!resourceId)")
      ) {
        line = line.replaceAll(
          "if (resourceId)",
          "if (isDefinedNumber(resourceId))",
        )
        line = line.replaceAll(
          "if (!resourceId)",
          "if (!isDefinedNumber(resourceId))",
        )
      }
      if (line.includes("!clientVersion")) {
        line = line.replace(
          "!clientVersion",
          'typeof clientVersion !== "string" || !hasNonEmptyString(clientVersion)',
        )
      }
    }

    if (v.subrule === "no-array-sort" && line.includes(".sort(")) {
      line = line.replace(/(?<!to)\.sort\(/gu, ".toSorted(")
    }

    if (v.subrule === "no-array-reverse" && line.includes(".reverse(")) {
      line = line.replace(/(?<!to)\.reverse\(/gu, ".toReversed(")
    }

    lines[idx] = line
  }

  content = lines.join("\n")

  if (
    fileViolations.some((v) => v.subrule === "strict-boolean-expressions") &&
    content.includes("hasNonEmptyString") &&
    !original.includes('from "~/utils/truthiness"')
  ) {
    content = ensureTruthinessImport(content)
  }

  if (content !== original) {
    writeFileSync(filePath, content)
    filesChanged++
    console.log(`updated ${relFile}`)
  }
}

console.log(`Updated ${filesChanged} files`)
