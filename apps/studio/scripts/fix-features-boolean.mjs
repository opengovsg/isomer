#!/usr/bin/env node
/**
 * Fix typescript(strict-boolean-expressions) in src/features using truthiness helpers.
 */
import { execSync } from "node:child_process"
import { readFileSync, writeFileSync } from "node:fs"
import path from "node:path"

const ROOT = new URL("../", import.meta.url).pathname
const FEATURES = "src/features"

const truthinessImport =
  'import { hasNonEmptyString, isDefinedNumber, isNullableBooleanTrue, isNonEmptyArray } from "~/utils/truthiness"\n'

const getDiagnostics = () => {
  const raw = execSync(
    `pnpm exec oxlint --type-aware -f json ${FEATURES} 2>/dev/null || true`,
    { cwd: ROOT, encoding: "utf-8", maxBuffer: 50 * 1024 * 1024 },
  )
  try {
    return JSON.parse(raw).diagnostics.filter(
      (d) =>
        d.severity === "error" &&
        d.code === "typescript(strict-boolean-expressions)",
    )
  } catch {
    return []
  }
}

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

const helperForMessage = (message) => {
  if (message.includes("nullable string")) {
    return "hasNonEmptyString"
  }
  if (message.includes("nullable boolean")) {
    return "isNullableBooleanTrue"
  }
  if (message.includes("nullable number")) {
    return "isDefinedNumber"
  }
  if (message.includes("object value")) {
    return "isNonEmptyArray"
  }
  return null
}

const alreadyWrapped = (expr, helper) =>
  expr.includes(`${helper}(`) || expr.includes(`!${helper}(`)

const wrapIdentifier = (expr, helper, negate = false) => {
  const trimmed = expr.trim()
  if (!/^[\w.$[\]?]+$/u.test(trimmed) || alreadyWrapped(trimmed, helper)) {
    return null
  }
  return negate ? `!${helper}(${trimmed})` : `${helper}(${trimmed})`
}

const fixLine = (line, message) => {
  const helper = helperForMessage(message)
  if (!helper) {
    return line
  }

  let updated = line

  updated = updated.replace(/([\w.$]+)\s+\|\|\s+/gu, (match, expr) => {
    const wrapped = wrapIdentifier(expr, helper)
    return wrapped ? `${wrapped} ? ${expr} : ` : match
  })

  if (helper === "isNullableBooleanTrue") {
    updated = updated.replace(/!!([\w.]+)/gu, (_, expr) =>
      alreadyWrapped(expr, helper) ? `!!${expr}` : `${helper}(${expr})`,
    )
  }

  updated = updated.replace(/enabled:\s*([\w.]+)/gu, (match, expr) => {
    const wrapped = wrapIdentifier(expr, helper)
    return wrapped ? `enabled: ${wrapped}` : match
  })

  updated = updated.replace(/if\s*\(!([\w.]+)\)/gu, (match, expr) => {
    const wrapped = wrapIdentifier(expr, helper, true)
    return wrapped ? `if (${wrapped})` : match
  })

  updated = updated.replace(/if\s*\(([\w.]+)\)/gu, (match, expr) => {
    const wrapped = wrapIdentifier(expr, helper)
    return wrapped ? `if (${wrapped})` : match
  })

  updated = updated.replace(/return\s+([\w.]+)\s&&/gu, (match, expr) => {
    const wrapped = wrapIdentifier(expr, helper)
    return wrapped ? `return ${wrapped} &&` : match
  })

  updated = updated.replace(/([\w.]+)\s&&/gu, (match, expr, offset, str) => {
    const before = str.slice(Math.max(0, offset - 1), offset)
    if (before === "!") {
      return match
    }
    const wrapped = wrapIdentifier(expr, helper)
    return wrapped ? `${wrapped} &&` : match
  })

  updated = updated.replace(
    /([\w.]+)\s*\?\s*/gu,
    (match, expr, offset, str) => {
      const before = str.slice(Math.max(0, offset - 2), offset)
      if (before.endsWith("??")) {
        return match
      }
      const wrapped = wrapIdentifier(expr, helper)
      return wrapped ? `${wrapped} ? ` : match
    },
  )

  updated = updated.replace(/\{([\w.]+)\s&&/gu, (match, expr) => {
    const wrapped = wrapIdentifier(expr, helper)
    return wrapped ? `{${wrapped} &&` : match
  })

  return updated
}

const diagnostics = getDiagnostics()
const byFile = new Map()

for (const diag of diagnostics) {
  const lineNum = diag.labels?.[0]?.span?.line
  if (!lineNum) {
    continue
  }
  const list = byFile.get(diag.filename) ?? []
  list.push(diag)
  byFile.set(diag.filename, list)
}

let changed = 0
for (const [relFile, fileDiags] of byFile) {
  const filePath = path.join(ROOT, relFile)
  const original = readFileSync(filePath, "utf-8")
  const lines = original.split("\n")
  let touched = false

  for (const diag of fileDiags) {
    const lineNum = diag.labels?.[0]?.span?.line
    if (!lineNum) {
      continue
    }
    const idx = lineNum - 1
    const prev = lines[idx]
    lines[idx] = fixLine(prev, diag.message)
    if (lines[idx] !== prev) {
      touched = true
    }
  }

  if (touched) {
    let content = lines.join("\n")
    content = ensureTruthinessImport(content)
    writeFileSync(filePath, content)
    changed++
    console.log(relFile)
  }
}

console.log(`Updated ${changed} files`)
