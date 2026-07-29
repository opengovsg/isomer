import { existsSync, readdirSync, readFileSync } from "node:fs"
import { join } from "node:path"

// Package names survive in webpack chunk module paths even after minification.
const ALGOLIA_MARKERS = ["react-instantsearch", "algoliasearch"] as const

export const scanBundleForAlgolia = (outDir: string) => {
  const staticDir = join(outDir, "_next/static")
  if (!existsSync(staticDir)) {
    throw new Error(
      `${staticDir} not found — did the template build emit a static export?`,
    )
  }

  const jsFiles = readdirSync(staticDir, { recursive: true, encoding: "utf-8" })
    .filter((name) => name.endsWith(".js"))
    .map((name) => join(staticDir, name))

  const matchedMarkers = new Set<string>()
  for (const file of jsFiles) {
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
