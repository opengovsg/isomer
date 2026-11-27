import type { HeroStyleVariant } from "@opengovsg/isomer-components"
import fs from "node:fs"
import path from "node:path"

// Webpack's afterResolve resource for the built folder index. `Hero.tsx`
// imports `./HeroCarousel` and `./HeroLargeImage`, and those resolve to these
// `index.js` files. Replacing that file drops the client modules it
// re-exports. A null entry has no client module of its own, so it is never
// replaced. The key set is `HeroStyleVariant`: adding a style in
// `HERO_STYLE` fails typecheck here until it is either null or given a stub.
const HERO_VARIANT_STUBS = {
  gradient: null,
  block: null,
  largeImage: {
    module:
      /[\\/]templates[\\/]next[\\/]components[\\/]complex[\\/]Hero[\\/]HeroLargeImage[\\/]index\.js$/,
    stub: "stubs/HeroLargeImage.js",
  },
  floating: null,
  searchbar: null,
  carousel: {
    module:
      /[\\/]templates[\\/]next[\\/]components[\\/]complex[\\/]Hero[\\/]HeroCarousel[\\/]index\.js$/,
    stub: "stubs/HeroCarousel.js",
  },
} as const satisfies Record<
  HeroStyleVariant,
  { module: RegExp; stub: string } | null
>

interface HeroVariantStub {
  variant: HeroStyleVariant
  module: RegExp
  stub: string
}

const HERO_VARIANT_KEYS = new Set<string>(Object.keys(HERO_VARIANT_STUBS))

const isHeroStyleVariant = (value: unknown): value is HeroStyleVariant =>
  typeof value === "string" && HERO_VARIANT_KEYS.has(value)

export const heroVariantStubs = (): HeroVariantStub[] => {
  const stubs: HeroVariantStub[] = []
  for (const variant of Object.keys(HERO_VARIANT_STUBS) as HeroStyleVariant[]) {
    const entry = HERO_VARIANT_STUBS[variant]
    if (entry) stubs.push({ variant, module: entry.module, stub: entry.stub })
  }
  return stubs
}

const walkJsonFiles = (dir: string): string[] | null => {
  if (!fs.existsSync(dir)) return null
  const files: string[] = []
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
const collectFromValue = (
  value: unknown,
  variants: Set<HeroStyleVariant>,
): Set<HeroStyleVariant> | null => {
  if (Array.isArray(value)) {
    for (const item of value) {
      if (collectFromValue(item, variants) === null) return null
    }
    return variants
  }
  if (!value || typeof value !== "object") return variants
  if ("type" in value && value.type === "hero") {
    const variant = "variant" in value ? value.variant : undefined
    if (!isHeroStyleVariant(variant)) return null
    variants.add(variant)
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
 * whose variant is missing or not a `HeroStyleVariant`.
 */
export const collectUsedHeroVariants = (
  schemaDir: string,
): Set<HeroStyleVariant> | null => {
  let files: string[] | null
  try {
    files = walkJsonFiles(schemaDir)
  } catch {
    return null
  }
  if (files === null) return null

  const variants = new Set<HeroStyleVariant>()
  for (const file of files) {
    let data: unknown
    try {
      data = JSON.parse(fs.readFileSync(file, "utf8"))
    } catch {
      return null
    }
    if (collectFromValue(data, variants) === null) return null
  }
  return variants
}
