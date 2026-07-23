import { existsSync, readdirSync, readFileSync } from "node:fs"
import { join } from "node:path"

// Package names survive in webpack chunk module paths even after minification.
const ALGOLIA_MARKERS = ["react-instantsearch", "algoliasearch"] as const

const collectJsFiles = (dir: string): string[] => {
  const files: string[] = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...collectJsFiles(path))
      continue
    }
    if (entry.isFile() && entry.name.endsWith(".js")) {
      files.push(path)
    }
  }
  return files
}

export const scanBundleForAlgolia = (outDir: string) => {
  const staticDir = join(outDir, "_next/static")
  if (!existsSync(staticDir)) {
    throw new Error(
      `${staticDir} not found — did the template build emit a static export?`,
    )
  }

  const matchedMarkers = new Set<string>()
  for (const file of collectJsFiles(staticDir)) {
    const content = readFileSync(file, "utf-8")
    for (const marker of ALGOLIA_MARKERS) {
      if (content.includes(marker)) {
        matchedMarkers.add(marker)
      }
    }
  }

  return {
    found: matchedMarkers.size > 0,
    matchedMarkers: [...matchedMarkers],
  }
}
