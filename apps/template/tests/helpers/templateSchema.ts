import { readFileSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { dirname } from "node:path"
import { fileURLToPath } from "node:url"

const TEMPLATE_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "..")

const HERO_SCHEMA_FILES = [
  "schema/_index.json",
  "schema/not-found.json",
] as const

const carouselHero = {
  type: "hero",
  variant: "carousel",
  carousel: { layout: "gradient", contentAlignment: "left" },
  slides: [
    {
      title: "Ministry of Trade and Industry",
      subtitle:
        "A leading global city of enterprise and talent, a vibrant nation of innovation and opportunity",
      buttonLabel: "Main CTA",
      buttonUrl: "/",
      secondaryButtonLabel: "Sub CTA",
      secondaryButtonUrl: "/",
      backgroundUrl: "https://ohno.isomer.gov.sg/images/hero-banner.png",
    },
    {
      title: "Second slide",
      subtitle: "Second slide so the carousel meets the minimum slide count",
      buttonLabel: "Main CTA",
      buttonUrl: "/",
      backgroundUrl: "https://ohno.isomer.gov.sg/images/hero-banner.png",
    },
  ],
} as const

export type HeroSchemaVariant = "gradient" | "carousel" | "largeImage"

export const readHeroSchemaBackups = (): Record<string, string> => {
  const backups: Record<string, string> = {}
  for (const rel of HERO_SCHEMA_FILES) {
    backups[rel] = readFileSync(join(TEMPLATE_DIR, rel), "utf-8")
  }
  return backups
}

export const restoreHeroSchemas = (backups: Record<string, string>) => {
  for (const [rel, contents] of Object.entries(backups)) {
    writeFileSync(join(TEMPLATE_DIR, rel), contents, "utf-8")
  }
}

export const rewriteSchemaHeroVariant = (variant: HeroSchemaVariant) => {
  for (const rel of HERO_SCHEMA_FILES) {
    const path = join(TEMPLATE_DIR, rel)
    const data = JSON.parse(readFileSync(path, "utf-8")) as {
      content: Array<{ type: string }>
    }
    const heroIndex = data.content.findIndex((block) => block.type === "hero")
    if (heroIndex === -1) {
      throw new Error(`${rel} has no hero block`)
    }
    if (variant === "carousel") {
      data.content[heroIndex] = { ...carouselHero }
    } else {
      data.content[heroIndex] = {
        ...data.content[heroIndex],
        variant,
      }
    }
    writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`, "utf-8")
  }
}
