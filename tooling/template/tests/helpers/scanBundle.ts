import { existsSync, readdirSync, readFileSync } from "node:fs"
import { join } from "node:path"

// These dependency signatures survive webpack minification.
export const ALGOLIA_MARKERS = ["react-instantsearch", "algoliasearch"] as const
export const ZOD_MARKERS = ["ZodError", "invalid_type", "too_small"] as const

const scanBundleForMarkers = (outDir: string, markers: readonly string[]) => {
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
    for (const marker of markers) {
      if (content.includes(marker)) {
        matchedMarkers.add(marker)
      }
    }
  }

  return {
    found: markers.every((marker) => matchedMarkers.has(marker)),
    matchedMarkers: [...matchedMarkers],
  }
}

export const scanBundleForAlgolia = (outDir: string) =>
  scanBundleForMarkers(outDir, ALGOLIA_MARKERS)

export const scanBundleForZod = (outDir: string) =>
  scanBundleForMarkers(outDir, ZOD_MARKERS)
