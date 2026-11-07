import fs from "node:fs"
import path from "node:path"

// Keys from HERO_STYLE in packages/components. A value outside this set is an
// unknown shape: the caller must stub nothing.
const KNOWN_HERO_VARIANTS = new Set([
  "gradient",
  "block",
  "largeImage",
  "floating",
  "searchbar",
  "carousel",
])

const walkJsonFiles = (dir) => {
  if (!fs.existsSync(dir)) return null
  const files = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      const nested = walkJsonFiles(abs)
      if (nested === null) return null
      files.push(...nested)
    } else if (entry.isFile() && entry.name.endsWith(".json")) {
      files.push(abs)
    }
  }
  return files
}

// Returns null when the walk should fail open (stub nothing).
const collectFromValue = (value, variants) => {
  if (Array.isArray(value)) {
    for (const item of value) {
      if (collectFromValue(item, variants) === null) return null
    }
    return variants
  }
  if (!value || typeof value !== "object") return variants
  if (value.type === "hero") {
    if (
      typeof value.variant !== "string" ||
      !KNOWN_HERO_VARIANTS.has(value.variant)
    ) {
      return null
    }
    variants.add(value.variant)
  }
  for (const child of Object.values(value)) {
    if (child && typeof child === "object") {
      if (collectFromValue(child, variants) === null) return null
    }
  }
  return variants
}

/**
 * Union of `variant` on every `{ type: "hero" }` in schema JSON.
 * `null` means fail open: missing directory, a read/parse error, or a hero
 * whose variant is missing or not one of the six keys.
 * @param {string} schemaDir
 * @returns {Set<string> | null}
 */
export const collectUsedHeroVariants = (schemaDir) => {
  let files
  try {
    files = walkJsonFiles(schemaDir)
  } catch {
    return null
  }
  if (files === null) return null

  const variants = new Set()
  for (const file of files) {
    let data
    try {
      data = JSON.parse(fs.readFileSync(file, "utf8"))
    } catch {
      return null
    }
    if (collectFromValue(data, variants) === null) return null
  }
  return variants
}
