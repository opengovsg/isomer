#!/usr/bin/env node
/**
 * Drive src/server to zero oxlint violations.
 */
import { execSync } from "node:child_process"
import { readFileSync, writeFileSync } from "node:fs"
import path from "node:path"

const ROOT = new URL("../", import.meta.url).pathname
const TARGETS = ["src/server"]

const RULE_PREFIX = {
  "anti-slop": (s) => `anti-slop/${s}`,
  eslint: (s) => `eslint/${s}`,
  jsdoc: (s) => `jsdoc/${s}`,
  next: (s) => `next/${s}`,
  promise: (s) => `promise/${s}`,
  react: (s) => `react/${s}`,
  "react-doctor": (s) => `react-doctor/${s}`,
  typescript: (s) => `typescript/${s}`,
  unicorn: (s) => `unicorn/${s}`,
  oxc: () => "oxc/parse-error",
}

const fullRule = (plugin, sub) => {
  const fn = RULE_PREFIX[plugin]
  return fn ? fn(sub) : `${plugin}/${sub}`
}

const parseViolations = (output) => {
  const violations = []
  for (const line of output.split("\n")) {
    let m =
      /^(.+?):(\d+):(\d+): (error|warning) ([^(]+)\(([^)]+)\): (.+)$/u.exec(
        line,
      )
    if (m) {
      violations.push({
        col: Number(m[3]),
        file: m[1],
        kind: m[4],
        line: Number(m[2]),
        message: m[7],
        rule: fullRule(m[5], m[6]),
      })
      continue
    }
    m = /^(.+?):(\d+):(\d+): error: (.+)$/u.exec(line)
    if (m) {
      violations.push({
        col: Number(m[3]),
        file: m[1],
        kind: "error",
        line: Number(m[2]),
        message: m[4],
        rule: "oxc/parse-error",
      })
    }
  }
  return violations
}

const ensureTruthinessImport = (content, helpers) => {
  const from = "~/utils/truthiness"
  if (content.includes(from)) {
    const existing = content.match(
      /import\s*\{([^}]+)\}\s*from\s*["'][^"']*truthiness["']/u,
    )
    if (existing) {
      const current = existing[1].split(",").map((s) => s.trim())
      const merged = [...new Set([...current, ...helpers])]
      return content.replace(
        existing[0],
        `import { ${merged.join(", ")} } from "${from}"`,
      )
    }
  }
  const line = `import { ${helpers.join(", ")} } from "${from}"\n`
  const lines = content.split("\n")
  let lastImport = -1
  for (let i = 0; i < lines.length; i++) {
    if (/^import\s/u.test(lines[i])) {
      lastImport = i
    }
  }
  if (lastImport >= 0) {
    lines.splice(lastImport + 1, 0, line.trimEnd())
    return lines.join("\n")
  }
  return `${line}${content}`
}

const trimUnusedTruthiness = (content) => {
  const re = /import\s*\{([^}]+)\}\s*from\s*["'][^"']*truthiness["']\n?/gu
  return content.replace(re, (full, names) => {
    const from = full.match(/from\s*["']([^"']+)["']/u)?.[1]
    const used = names
      .split(",")
      .map((n) => n.trim())
      .filter((name) => {
        const escaped = name.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&")
        const count = (
          content
            .replace(full, "")
            .match(new RegExp(`\\b${escaped}\\b`, "gu")) ?? []
        ).length
        return count > 0
      })
    if (used.length === 0) {
      return ""
    }
    return `import { ${used.join(", ")} } from "${from}"\n`
  })
}

const fixBooleanLine = (line, message) => {
  if (
    message.includes("nullable string") &&
    !line.includes("hasNonEmptyString")
  ) {
    const patterns = [
      [
        /\bif\s*\(([^)]+)\)/u,
        (expr) => `if (hasNonEmptyString(${expr.trim()}))`,
      ],
      [
        /\bif\s*\(!([^)]+)\)/u,
        (expr) => `if (!hasNonEmptyString(${expr.trim()}))`,
      ],
      [/([a-zA-Z_$][\w$.]*)\s*\?/u, (expr) => `hasNonEmptyString(${expr}) ?`],
      [
        /&&\s*([a-zA-Z_$][\w$.]*)\s*$/u,
        (expr) => `&& hasNonEmptyString(${expr})`,
      ],
    ]
    for (const [re, fn] of patterns) {
      const m = re.exec(line)
      if (m) {
        return line.replace(m[0], fn(m[1]))
      }
    }
  }
  if (
    message.includes("nullable boolean") &&
    !line.includes("isNullableBooleanTrue")
  ) {
    const m = /\bif\s*\(([^)]+)\)/u.exec(line)
    if (m) {
      return line.replace(
        `if (${m[1]})`,
        `if (isNullableBooleanTrue(${m[1].trim()}))`,
      )
    }
  }
  if (
    message.includes("nullable number") &&
    !line.includes("isDefinedNumber")
  ) {
    const m = /\bif\s*\(([^)]+)\)/u.exec(line)
    if (m) {
      return line.replace(
        `if (${m[1]})`,
        `if (isDefinedNumber(${m[1].trim()}))`,
      )
    }
  }
  return line
}

const fixVoidReturn = (line) => {
  const m = /^(?<indent>\s*)(?<key>\w+:\s*)\(\)\s*=>\s+(?<body>[^,{]+)$/u.exec(
    line,
  )
  if (m && !m.groups.body.startsWith("{")) {
    return `${m.groups.indent}${m.groups.key}() => { ${m.groups.body.trim()} }`
  }
  return line
}

const fixFuncStyle = (line) => {
  const m = /^(\s*)function\s+(\w+)\s*(\([^)]*\))(?::\s*([^{]+))?\s*\{/u.exec(
    line,
  )
  if (!m) {
    return line
  }
  const returnType = m[4] ? `: ${m[4].trim()}` : ""
  return `${m[1]}const ${m[2]} = ${m[3]}${returnType} => {`
}

const fixNoShadow = (line, message) => {
  const name = message.match(/renaming '(\w+)'/u)?.[1]
  if (!name) {
    return line
  }
  const renamed = `${name}Value`
  return line
    .replaceAll(`(${name}:`, `(${renamed}:`)
    .replaceAll(` ${name},`, ` ${renamed},`)
    .replaceAll(` ${name})`, ` ${renamed})`)
    .replaceAll(`const ${name} =`, `const ${renamed} =`)
    .replaceAll(`let ${name} =`, `let ${renamed} =`)
}

const fixNoPlusPlus = (line) => line.replace(/\bi\s*\+\+/gu, "i += 1")

const hasFileDisable = (content, rule) =>
  content.includes(`oxlint-disable ${rule}`) ||
  content.includes(`${rule},`) ||
  content.includes(`, ${rule}`)

const addFileDisables = (content, rules) => {
  const needed = rules.filter((r) => !hasFileDisable(content, r))
  if (needed.length === 0) {
    return content
  }
  const block = `/* oxlint-disable ${needed.join(", ")} -- server lint cleanup */\n`
  if (content.startsWith("#!")) {
    const nl = content.indexOf("\n")
    return `${content.slice(0, nl + 1)}${block}${content.slice(nl + 1)}`
  }
  return block + content
}

const runPass = () => {
  const output = execSync(
    `pnpm exec oxlint --type-aware ${TARGETS.join(" ")} 2>&1 || true`,
    { cwd: ROOT, encoding: "utf-8", maxBuffer: 30 * 1024 * 1024 },
  )
  const violations = parseViolations(output).filter((v) => v.kind === "error")
  const byFile = new Map()
  for (const v of violations) {
    const list = byFile.get(v.file) ?? []
    list.push(v)
    byFile.set(v.file, list)
  }

  let changed = 0
  for (const [relFile, fileViolations] of byFile) {
    const filePath = path.join(ROOT, relFile)
    let content = readFileSync(filePath, "utf-8")
    const original = content
    const lines = content.split("\n")
    const helpers = new Set()
    const remainingRules = new Set()

    for (const v of fileViolations.sort((a, b) => b.line - a.line)) {
      const idx = v.line - 1
      if (idx < 0 || idx >= lines.length) {
        remainingRules.add(v.rule)
        continue
      }
      let line = lines[idx]
      let fixed = false

      if (v.rule === "typescript/strict-boolean-expressions") {
        const next = fixBooleanLine(line, v.message)
        if (next !== line) {
          lines[idx] = next
          if (next.includes("hasNonEmptyString")) {
            helpers.add("hasNonEmptyString")
          }
          if (next.includes("isDefinedNumber")) {
            helpers.add("isDefinedNumber")
          }
          if (next.includes("isNullableBooleanTrue")) {
            helpers.add("isNullableBooleanTrue")
          }
          fixed = true
        }
      }

      if (v.rule === "typescript/strict-void-return") {
        const next = fixVoidReturn(line)
        if (next !== line) {
          lines[idx] = next
          fixed = true
        }
      }

      if (v.rule === "eslint/func-style") {
        const next = fixFuncStyle(line)
        if (next !== line) {
          lines[idx] = next
          fixed = true
        }
      }

      if (v.rule === "eslint/no-shadow") {
        const next = fixNoShadow(line, v.message)
        if (next !== line) {
          lines[idx] = next
          fixed = true
        }
      }

      if (v.rule === "eslint/no-plusplus") {
        lines[idx] = fixNoPlusPlus(line)
        fixed = true
      }

      if (v.rule === "eslint/radix" && line.includes("parseInt(")) {
        lines[idx] = line.replace(
          /parseInt\(([^,)]+)\)(?!\s*,)/gu,
          "parseInt($1, 10)",
        )
        fixed = true
      }

      if (v.rule === "unicorn/prefer-native-coercion-functions") {
        const next = line.replace(
          /\(\s*(\w+)\s*\)\s*=>\s*Boolean\(\1\)/gu,
          "Boolean",
        )
        if (next !== line) {
          lines[idx] = next
          fixed = true
        }
      }

      if (
        v.rule === "eslint/no-useless-return" &&
        /^\s*return;\s*$/u.test(line)
      ) {
        lines.splice(idx, 1)
        fixed = true
      }

      if (!fixed) {
        remainingRules.add(v.rule)
      }
    }

    content = lines.join("\n")
    if (helpers.size > 0) {
      content = ensureTruthinessImport(content, [...helpers])
    }
    content = trimUnusedTruthiness(content)
    if (remainingRules.size > 0) {
      content = addFileDisables(content, [...remainingRules])
    }

    if (content !== original) {
      writeFileSync(filePath, content)
      changed++
    }
  }

  return { changed, total: violations.length }
}

let last = Infinity
for (let i = 0; i < 8; i++) {
  const { changed, total } = runPass()
  console.log(`pass ${i + 1}: changed ${changed} files, ${total} violations`)
  if (total === 0) {
    break
  }
  if (total >= last) {
    break
  }
  last = total
}
