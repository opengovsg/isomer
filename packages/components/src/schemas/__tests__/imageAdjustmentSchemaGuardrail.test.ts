import { describe, expect, it } from "vitest"

import {
  HeroCarouselSlideSchema,
  HeroFloatingSchema,
} from "../../interfaces/complex/Hero"
import { IsomerComplexComponentsMap } from "../components"

// Keep in sync with Studio's INTENTIONALLY_NOT_ADJUSTABLE in
// adjustmentConfigRegistry.ts.
const INTENTIONALLY_NOT_ADJUSTABLE = new Set(["logocloud", "video"])

// Pending: wired in a later PR of this stack.
const PENDING_COMPONENTS = new Set([
  "image",
  "imagegallery",
  "blockquote",
  "infocards",
])

interface ImageField {
  properties: Record<string, unknown>
  imageFieldName: string
}

// Walks a compiled TypeBox schema and returns every format: "image" field
// with the properties object it lives in. Skips format: "hidden" nodes such
// as HeroSearchbar, since nobody can edit those fields.
const findImageFields = (
  node: unknown,
  acc: ImageField[] = [],
): ImageField[] => {
  if (node === null || typeof node !== "object") return acc

  const record = node as Record<string, unknown>
  const properties = record.properties
  if (properties !== null && typeof properties === "object") {
    const props = properties as Record<string, unknown>
    const isHidden = (record as { format?: unknown }).format === "hidden"
    for (const [name, prop] of Object.entries(props)) {
      if (
        !isHidden &&
        prop !== null &&
        typeof prop === "object" &&
        (prop as { format?: unknown }).format === "image"
      ) {
        acc.push({ properties: props, imageFieldName: name })
      }
      findImageFields(prop, acc)
    }
  }

  for (const key of ["anyOf", "oneOf", "allOf", "items"]) {
    const value = record[key]
    if (Array.isArray(value)) {
      value.forEach((child: unknown) => findImageFields(child, acc))
    } else if (value !== undefined) {
      findImageFields(value, acc)
    }
  }

  return acc
}

describe("imageAdjustment schema guardrail", () => {
  // The collection thumbnail shipped focal controls that did nothing,
  // because its image field had no adjustment sibling to hold the data.
  for (const [componentType, schema] of Object.entries(
    IsomerComplexComponentsMap,
  )) {
    if (INTENTIONALLY_NOT_ADJUSTABLE.has(componentType)) continue
    if (PENDING_COMPONENTS.has(componentType)) continue

    it(`"${componentType}" pairs every image field with its ImageAdjustment sibling`, () => {
      for (const { properties, imageFieldName } of findImageFields(schema)) {
        // Pending: wired in a later PR of this stack.
        if (properties === HeroCarouselSlideSchema.properties) continue
        if (properties === HeroFloatingSchema.properties) continue
        expect(properties).toHaveProperty(`${imageFieldName}ImageAdjustment`)
      }
    })
  }

  it("covers every component in IsomerComplexComponentsMap", () => {
    // Catches a typo or stale entry in INTENTIONALLY_NOT_ADJUSTABLE.
    const allComponentTypes = Object.keys(IsomerComplexComponentsMap).sort()
    for (const type of INTENTIONALLY_NOT_ADJUSTABLE) {
      expect(allComponentTypes).toContain(type)
    }
  })
})
