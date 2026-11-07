#!/usr/bin/env node
// Turns the first-load JSON report into KEY=<bytes> lines.
// The post-comment job accepts only these lines, so a forked workflow cannot
// smuggle a shell command through the artifact. Size is not judged here.

import { readFileSync } from "node:fs"

const PAGE_KEY = {
  "/": "ROOT",
  "/about": "ABOUT",
  "/news": "NEWS",
  "/news/post-a": "NEWS_POST_A",
  "/search": "SEARCH",
  "/data/registry": "DATA_REGISTRY",
}

const TYPE_KEY = {
  searchSG: "SEARCHSG",
  "egazette-algolia": "EGAZETTE",
}

const file = process.argv[2]
const prefix = process.argv[3]
if (!file || !prefix || !/^[A-Z]+$/.test(prefix)) {
  process.stderr.write("usage: first-load-to-env.mjs <json> <PREFIX>\n")
  process.exit(1)
}

const report = JSON.parse(readFileSync(file, "utf8"))
const seen = new Set()
for (const row of report.pages ?? []) {
  const type = TYPE_KEY[row.searchType]
  const page = PAGE_KEY[row.page]
  if (!type || !page) {
    process.stderr.write(
      `unexpected row ${row.searchType} ${row.page}\n`,
    )
    process.exit(1)
  }
  if (!Number.isInteger(row.bytes) || row.bytes < 0) {
    process.stderr.write(`bad bytes for ${row.page}\n`)
    process.exit(1)
  }
  const key = `${prefix}_${type}_${page}`
  if (seen.has(key)) {
    process.stderr.write(`duplicate ${key}\n`)
    process.exit(1)
  }
  seen.add(key)
  process.stdout.write(`${key}=${row.bytes}\n`)
}

const expected = Object.keys(TYPE_KEY).length * Object.keys(PAGE_KEY).length
if (seen.size !== expected) {
  process.stderr.write(`expected ${expected} rows, got ${seen.size}\n`)
  process.exit(1)
}
