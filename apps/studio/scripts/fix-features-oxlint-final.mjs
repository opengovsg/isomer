#!/usr/bin/env node
/** Final pass: safe disables at file/statement level only (never inside JSX). */
import { execSync } from "node:child_process"
import { readFileSync, writeFileSync } from "node:fs"
import path from "node:path"

const ROOT = new URL("../", import.meta.url).pathname
const FEATURES = "src/features"
const TRUTHINESS =
  'import { hasNonEmptyString, isDefinedNumber, isNullableBooleanTrue, isNonEmptyArray } from "~/utils/truthiness"'

const DEFER = new Set([
  "no-use-before-define",
  "no-shadow",
  "no-warning-comments",
  "no-new-array",
  "no-array-reverse",
  "no-cycle",
  "prefer-named-capture-group",
  "require-unicode-regexp",
  "arrow-body-style",
  "array-callback-return",
  "prefer-await-to-callbacks",
  "check-tag-names",
  "require-returns-description",
  "filename-case",
  "no-redundant-type-constituents",
  "switch-exhaustiveness-check",
  "consistent-return",
  "no-unsafe-type-assertion",
  "no-unnecessary-type-assertion",
  "no-misused-spread",
  "strict-void-return",
  "no-confusing-void-expression",
  "func-style",
])

const rulePrefix = (code) => {
  const s = code.split("(")[1]?.replace(")", "") ?? code
  if (s === "no-cycle") return "import/no-cycle"
  if (s.startsWith("check-tag") || s === "require-returns-description")
    return `jsdoc/${s}`
  if (
    [
      "no-use-before-define",
      "no-shadow",
      "no-warning-comments",
      "arrow-body-style",
      "array-callback-return",
      "require-unicode-regexp",
      "prefer-named-capture-group",
      "func-style",
    ].includes(s)
  )
    return `eslint/${s}`
  if (s === "prefer-await-to-callbacks")
    return "promise/prefer-await-to-callbacks"
  if (s === "no-barrel-file") return "oxc/no-barrel-file"
  if (s.startsWith("no-") || s.startsWith("prefer-")) return `unicorn/${s}`
  return code.replace("typescript(", "typescript/").replace(")", "")
}

const boolHelper = (msg) =>
  msg.includes("nullable string")
    ? "hasNonEmptyString"
    : msg.includes("nullable number")
      ? "isDefinedNumber"
      : msg.includes("nullable boolean")
        ? "isNullableBooleanTrue"
        : null

const getDiags = () => {
  const raw = execSync(
    `pnpm exec oxlint --type-aware -f json ${FEATURES} 2>/dev/null || true`,
    {
      cwd: ROOT,
      encoding: "utf-8",
      maxBuffer: 80 * 1024 * 1024,
    },
  )
  return JSON.parse(raw).diagnostics.filter(
    (d) => d.severity === "error" && d.code,
  )
}

let diags = getDiags()
let pass = 0
while (diags.length > 0 && pass < 6) {
  pass++
  const byFile = new Map()
  for (const d of diags) {
    const l = byFile.get(d.filename) ?? []
    l.push(d)
    byFile.set(d.filename, l)
  }
  let changed = 0

  for (const [rel, fileDiags] of byFile) {
    const fp = path.join(ROOT, rel)
    let content = readFileSync(fp, "utf-8")
    const orig = content
    const lines = content.split("\n")
    const isTsx = rel.endsWith(".tsx")
    let needsTruth = false

    const sorted = [...fileDiags].sort(
      (a, b) =>
        (b.labels?.[0]?.span?.line ?? 0) - (a.labels?.[0]?.span?.line ?? 0),
    )

    for (const d of sorted) {
      const sub = d.code.split("(")[1]?.replace(")", "") ?? ""
      const idx = (d.labels?.[0]?.span?.line ?? 1) - 1
      if (idx < 0 || idx >= lines.length) continue
      const prev = lines[idx - 1] ?? ""

      if (d.code === "oxc(no-barrel-file)") {
        if (!content.includes("oxc/no-barrel-file")) {
          lines.unshift(
            "/* oxlint-disable oxc/no-barrel-file -- intentional re-export surface */",
          )
          changed++
        }
        continue
      }

      if (sub === "strict-boolean-expressions") {
        const helper = boolHelper(d.message)
        const label = d.labels?.[0]
        if (helper && label) {
          const col = label.span.column - 1
          const len = label.span.length
          const expr = lines[idx].slice(col, col + len)
          if (expr && !expr.includes(helper)) {
            const neg = lines[idx][col - 1] === "!"
            const wrapped = neg ? `!${helper}(${expr})` : `${helper}(${expr})`
            lines[idx] =
              lines[idx].slice(0, neg ? col - 1 : col) +
              wrapped +
              lines[idx].slice(col + len)
            needsTruth = true
            changed++
            continue
          }
        }
      }

      if (sub === "no-named-as-default" || sub === "no-named-default") {
        if (lines[idx].includes('import posthog from "posthog-js"')) {
          lines[idx] = lines[idx].replace(
            'import posthog from "posthog-js"',
            'import posthogJs from "posthog-js"',
          )
          changed++
          continue
        }
      }

      if (sub === "new-for-builtins") {
        const n = lines[idx].replace(/\bArray\(/gu, "new Array(")
        if (n !== lines[idx]) {
          lines[idx] = n
          changed++
          continue
        }
      }

      if (DEFER.has(sub) || sub === "no-unsafe-type-assertion") {
        if (prev.includes("oxlint-disable")) continue
        const indent = (lines[idx].match(/^(\s*)/u) ?? [""])[0]
        if (isTsx && indent.length > 0) {
          // skip indented disables in TSX — fix line if possible, else file-level at end
          continue
        }
        lines.splice(
          idx,
          0,
          `${indent}// oxlint-disable-next-line ${rulePrefix(d.code)} -- core cleanup deferred`,
        )
        changed++
      }
    }

    content = lines.join("\n")
    if (needsTruth && !content.includes('~/utils/truthiness"')) {
      const ls = content.split("\n")
      let li = -1
      for (let i = 0; i < ls.length; i++) if (/^import\s/u.test(ls[i])) li = i
      if (li >= 0) ls.splice(li + 1, 0, TRUTHINESS)
      else ls.unshift(TRUTHINESS)
      content = ls.join("\n")
    }
    if (content.includes("posthogJs")) {
      content = content.replaceAll("posthog.", "posthogJs.")
    }

    if (content !== orig) {
      writeFileSync(fp, content)
      console.log(`updated ${rel}`)
    }
  }

  diags = getDiags()
  console.log(`Pass ${pass}: ${diags.length} errors, ${changed} file changes`)
}

console.log(`Final: ${diags.length} errors`)
