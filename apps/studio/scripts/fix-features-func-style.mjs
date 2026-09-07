#!/usr/bin/env node
/**
 * Convert function declarations to arrow function expressions for func-style rule.
 */
import { execSync } from "node:child_process"
import { readFileSync, writeFileSync } from "node:fs"
import path from "node:path"

const ROOT = new URL("../", import.meta.url).pathname

const getFuncStyleFiles = () => {
  const raw = execSync(
    "pnpm exec oxlint --type-aware -f json src/features 2>/dev/null || true",
    { cwd: ROOT, encoding: "utf-8", maxBuffer: 50 * 1024 * 1024 },
  )
  const files = new Set()
  for (const d of JSON.parse(raw).diagnostics) {
    if (d.code === "eslint(func-style)") {
      files.add(d.filename)
    }
  }
  return [...files]
}

const convertFile = (relFile) => {
  const filePath = path.join(ROOT, relFile)
  const original = readFileSync(filePath, "utf-8")
  const lines = original.split("\n")
  let changed = false

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i]
    const trimmed = line.trimStart()
    const indent = line.slice(0, line.length - trimmed.length)

    if (/^export async function \w+\(/u.test(trimmed)) {
      lines[i] =
        indent +
        trimmed.replace(
          /^export async function (\w+)\(/u,
          "export const $1 = async (",
        )
      changed = true
    } else if (/^async function \w+\(/u.test(trimmed)) {
      lines[i] =
        indent +
        trimmed.replace(/^async function (\w+)\(/u, "const $1 = async (")
      changed = true
    } else if (/^export function \w+\(/u.test(trimmed)) {
      lines[i] =
        indent +
        trimmed.replace(/^export function (\w+)\(/u, "export const $1 = (")
      changed = true
    } else if (/^function \w+\(/u.test(trimmed)) {
      lines[i] = indent + trimmed.replace(/^function (\w+)\(/u, "const $1 = (")
      changed = true
    }

    if (
      /\)\s*:\s*[\w<>,\s|]+\s*\{$/u.test(lines[i]) &&
      !lines[i].includes("=>")
    ) {
      lines[i] = lines[i].replace(/\s*\{$/u, " => {")
      changed = true
    }
  }

  if (changed) {
    writeFileSync(filePath, lines.join("\n"))
    console.log(relFile)
  }
}

for (const file of getFuncStyleFiles()) {
  convertFile(file)
}
