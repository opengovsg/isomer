#!/usr/bin/env node
// Scores gzipped first-load JS for the checkout this file lives in.
// Builds apps/template with that checkout's `build:template` script, twice
// (searchSG and egazette-algolia). Prints this run's per-page bytes as JSON.
// Does not compare against a stored baseline and does not fail on size.

import { spawnSync } from "node:child_process"
import {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs"
import {
  dirname,
  isAbsolute,
  join,
  normalize,
  relative,
  resolve,
  sep,
} from "node:path"
import { fileURLToPath } from "node:url"

const templateDir = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const fixtureDir = join(templateDir, "benchmark", "first-load")
const outDir = join(templateDir, "out")
const configPath = join(templateDir, "data", "config.json")

export const PAGES = [
  "/",
  "/about",
  "/news",
  "/news/post-a",
  "/search",
  "/data/registry",
]

export const SEARCH_TYPES = ["searchSG", "egazette-algolia"]

// Public search-only credentials already used by the template's egazette test.
// They select the Algolia module graph; they are not a size baseline.
const EGAZETTE_SEARCH = {
  type: "egazette-algolia",
  appId: "1V7DZGZJKK",
  searchApiKey: "bbc5751b3f9b7fdfc08c99712adfa397",
  indexName: "staging_ogp_egazettes_index",
}

// Opening tag only. Next's export puts no `>` inside attribute values, so a
// tag ends at the first `>`. We scan tags rather than one URL regex because
// `src` / `href` / `rel` / `as` can appear in any order.
const TAG_RE = /<(script|link)\b[^>]*>/gi

// Quoted attribute. Next quotes every attribute on these tags. The name is
// a fixed token we pass in, not user input.
const attrRe = (name) =>
  new RegExp(String.raw`\b${name}\s*=\s*(?:"([^"]*)"|'([^']*)')`, "i")

const attr = (tag, name) => {
  const match = attrRe(name).exec(tag)
  return match?.[1] ?? match?.[2] ?? null
}

// Drop query and hash before the file extension check. Next sometimes
// fingerprints via the path, not the query, but a query must not hide `.js`.
const pathnameOf = (url) => url.split("#")[0].split("?")[0]

const isJsPath = (url) => pathnameOf(url).toLowerCase().endsWith(".js")

// `http:` / `https:` / `data:` are not files in the static export. The metric
// sizes files on disk and does not fetch them.
const hasScheme = (url) => /^[a-z][a-z0-9+.-]*:/i.test(pathnameOf(url))

export const referencedJsUrls = (html) => {
  const urls = new Set()
  for (const match of html.matchAll(TAG_RE)) {
    const tag = match[0]
    const kind = match[1].toLowerCase()
    if (kind === "script") {
      const src = attr(tag, "src")
      if (src && isJsPath(src) && !hasScheme(src) && !src.startsWith("//")) {
        urls.add(src)
      }
      continue
    }
    const href = attr(tag, "href")
    if (!href || !isJsPath(href) || hasScheme(href) || href.startsWith("//")) {
      continue
    }
    const rel = (attr(tag, "rel") ?? "").toLowerCase()
    const as = (attr(tag, "as") ?? "").toLowerCase()
    if (rel === "modulepreload" || (rel === "preload" && as === "script")) {
      urls.add(href)
    }
  }
  return [...urls]
}

// `relative` returns `../…` or an absolute path when `file` is outside
// `outRoot`. Either means the HTML pointed at JS that is not part of this export.
const insideOut = (outRoot, file) => {
  const rel = relative(outRoot, file)
  return rel !== ".." && !rel.startsWith(`..${sep}`) && !isAbsolute(rel)
}

const resolveJsFile = (outRoot, htmlFile, url) => {
  // Next percent-encodes `[` `]` in the HTML (`%5B%5B...permalink%5D%5D`)
  // but writes the chunk directory with literal brackets.
  const pathOnly = decodeURIComponent(pathnameOf(url))
  const abs = pathOnly.startsWith("/")
    ? join(outRoot, pathOnly)
    : join(dirname(htmlFile), pathOnly)
  const file = normalize(abs)
  if (!insideOut(outRoot, file)) {
    throw new Error(`JS URL escapes the export directory: ${url}`)
  }
  if (!existsSync(file)) {
    throw new Error(
      `First-load JS referenced by HTML is missing: ${url} (${file})`,
    )
  }
  return file
}

const gzipBytes = (file) => {
  const result = spawnSync("gzip", ["-c", file])
  if (result.error || result.status !== 0) {
    throw new Error(
      `gzip -c ${file} failed (${result.status}): ${result.stderr}`,
    )
  }
  return result.stdout.length
}

export const htmlForPage = (exportDir, page) =>
  page === "/"
    ? join(exportDir, "index.html")
    : join(exportDir, page.slice(1), "index.html")

const kb = (bytes) => Math.round((bytes / 1024) * 10) / 10

export const scoreExport = (exportDir, searchType) => {
  const outRoot = resolve(exportDir)
  const cache = new Map()
  const pages = []

  for (const page of PAGES) {
    const htmlFile = htmlForPage(outRoot, page)
    if (!existsSync(htmlFile)) {
      throw new Error(
        `Missing exported HTML for ${page} (${htmlFile}). The checkout build did not emit this page.`,
      )
    }
    const html = readFileSync(htmlFile, "utf8")
    const files = new Set(
      referencedJsUrls(html).map((url) =>
        resolveJsFile(outRoot, htmlFile, url),
      ),
    )
    let bytes = 0
    for (const file of files) {
      if (!cache.has(file)) cache.set(file, gzipBytes(file))
      bytes += cache.get(file)
    }
    pages.push({ searchType, page, bytes, kb: kb(bytes) })
  }

  return pages
}

const walkFiles = (dir) => {
  const out = []
  for (const name of readdirSync(dir)) {
    const abs = join(dir, name)
    if (statSync(abs).isDirectory()) out.push(...walkFiles(abs))
    else out.push(abs)
  }
  return out
}

const stageFixture = () => {
  const staged = []
  const files = walkFiles(fixtureDir)
  for (const src of files) {
    const rel = relative(fixtureDir, src)
    const dest = join(templateDir, rel)
    const backup = existsSync(dest) ? readFileSync(dest) : null
    mkdirSync(dirname(dest), { recursive: true })
    cpSync(src, dest)
    staged.push({ dest, backup })
  }
  return () => {
    for (const { dest, backup } of staged.reverse()) {
      if (backup === null) rmSync(dest)
      else writeFileSync(dest, backup)
    }
  }
}

const writeSearchType = (baseConfig, searchType) => {
  const config = JSON.parse(baseConfig)
  config.site.search =
    searchType === "egazette-algolia"
      ? EGAZETTE_SEARCH
      : { type: "searchSG", clientId: "benchmark-client-id" }
  writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`)
}

const buildTemplate = () => {
  rmSync(join(templateDir, ".next"), { recursive: true, force: true })
  rmSync(outDir, { recursive: true, force: true })
  // stdout is reserved for the JSON report. The branch's own script is what
  // we run, so a checkout that changed `build:template` is what gets measured.
  const result = spawnSync("pnpm", ["run", "build:template"], {
    cwd: templateDir,
    env: { ...process.env, NODE_ENV: "production", NODE_OPTIONS: "" },
    stdio: ["ignore", "pipe", "pipe"],
  })
  const log = `${result.stdout ?? ""}${result.stderr ?? ""}`
  process.stderr.write(log)
  if (result.error || result.status !== 0) {
    throw new Error(
      `pnpm run build:template exited with ${result.status ?? result.error}`,
    )
  }
}

const isMain = () => {
  const entry = process.argv[1]
  return Boolean(entry) && resolve(entry) === fileURLToPath(import.meta.url)
}

const main = () => {
  if (!existsSync(fixtureDir)) {
    throw new Error(`Missing fixture directory: ${fixtureDir}`)
  }
  const baseConfig = readFileSync(configPath, "utf8")
  const restore = stageFixture()
  const pages = []
  try {
    for (const searchType of SEARCH_TYPES) {
      process.stderr.write(`\nBuilding first-load fixture (${searchType})\n`)
      writeSearchType(baseConfig, searchType)
      buildTemplate()
      pages.push(...scoreExport(outDir, searchType))
    }
  } finally {
    writeFileSync(configPath, baseConfig)
    restore()
  }
  process.stdout.write(`${JSON.stringify({ pages }, null, 2)}\n`)
}

if (isMain()) {
  try {
    main()
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : error}\n`)
    process.exit(1)
  }
}
