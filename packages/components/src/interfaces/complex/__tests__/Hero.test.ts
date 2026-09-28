import { FormatRegistry } from "@sinclair/typebox"
import { Value } from "@sinclair/typebox/value"
import { describe, expect, it } from "vitest"

import { HERO_BLOCK_SHAPE, HeroSchema } from "../Hero"

FormatRegistry.Set("image", () => true)

interface HeroVariantSchema {
  title?: string
  required?: string[]
  properties?: {
    shape?: {
      title?: string
      format?: string
      default?: string
      anyOf?: { title?: string; const?: string }[]
    }
  }
}

const blockHero = {
  type: "hero",
  variant: "block",
  title: "Riverside Secondary School",
  backgroundUrl: "/hero.png",
}

const heroVariants = HeroSchema.anyOf as HeroVariantSchema[]
const blockSchema = heroVariants.find((branch) => branch.title === "Block")

describe("HeroSchema block shape", () => {
  it("exposes Shape as a block-only radio with Straight as the default", () => {
    // Arrange
    const shape = blockSchema?.properties?.shape

    // Act / Assert
    expect(shape?.title).toBe("Shape")
    expect(shape?.format).toBe("radio")
    expect(shape?.default).toBe(HERO_BLOCK_SHAPE.straight)
    expect(blockSchema?.required ?? []).not.toContain("shape")
    expect(shape?.anyOf?.map((option) => option.title)).toEqual([
      "Straight (Default)",
      "Curved",
    ])
    expect(shape?.anyOf?.map((option) => option.const)).toEqual([
      HERO_BLOCK_SHAPE.straight,
      HERO_BLOCK_SHAPE.curved,
    ])
    expect(
      heroVariants
        .filter((branch) => branch.title !== "Block")
        .every((branch) => branch.properties?.shape === undefined),
    ).toBe(true)
  })

  it("accepts a block hero without shape", () => {
    // Arrange / Act / Assert
    expect(Value.Check(HeroSchema, blockHero)).toBe(true)
  })

  it("accepts the straight shape on the block variant", () => {
    // Arrange / Act / Assert
    expect(
      Value.Check(HeroSchema, {
        ...blockHero,
        shape: HERO_BLOCK_SHAPE.straight,
      }),
    ).toBe(true)
  })

  it("accepts the curved shape on the block variant", () => {
    // Arrange / Act / Assert
    expect(
      Value.Check(HeroSchema, {
        ...blockHero,
        shape: HERO_BLOCK_SHAPE.curved,
      }),
    ).toBe(true)
  })

  it.each(["gradient", "largeImage", "floating", "searchbar"] as const)(
    "accepts a %s hero without shape",
    (variant) => {
      // Arrange / Act / Assert
      expect(Value.Check(HeroSchema, { ...blockHero, variant })).toBe(true)
    },
  )

  it("rejects an unknown shape on the block variant", () => {
    // Arrange / Act / Assert
    expect(Value.Check(HeroSchema, { ...blockHero, shape: "circle" })).toBe(
      false,
    )
  })
})
