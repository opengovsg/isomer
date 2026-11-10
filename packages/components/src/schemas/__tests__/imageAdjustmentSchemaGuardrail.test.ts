import { describe, expect, it } from "vitest"

import { HeroCarouselSlideSchema } from "../../interfaces/complex/Hero"
import { IsomerComplexComponentsMap } from "../components"

// Components that intentionally never get image-adjustment -- mirrors
// Studio's own INTENTIONALLY_NOT_ADJUSTABLE list (adjustmentConfigRegistry.ts).
// Keep these two lists in sync: a component opted out here for a schema
// reason should also be opted out there, and vice versa.
const INTENTIONALLY_NOT_ADJUSTABLE = new Set(["logocloud", "video"])

// Pending: wired in a later PR of this stack.
const PENDING_COMPONENTS = new Set(["image", "imagegallery"])

interface ImageField {
  properties: Record<string, unknown>
  imageFieldName: string
}

// A plain-object walk of a compiled TypeBox schema (JSON-schema shaped at
// runtime: `.properties`, `.anyOf`/`.allOf` for unions/composites, `.items`
// for arrays). Returns every image-upload field (format: "image", from
// generateImageSrcSchema) with the properties object it lives in. Each such
// field should have a `${fieldName}ImageAdjustment` sibling (from
// generateAdjustableImageFields), not one shared "imageAdjustment" key, so two
// image fields on one node get distinct, non-colliding keys. A node whose own
// format is "hidden" (a beta or not-yet-editable variant like HeroSearchbar) is
// skipped, since nothing can set an adjustment on a field nobody can edit.
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
  // A component gaining an image-upload field (format: "image") but no
  // imageAdjustment sibling is exactly how the collection thumbnail shipped
  // with focal/fit controls in the editor that silently did nothing -- its
  // page.image field had no imageAdjustment to carry that data at all. This
  // test closes that gap one level up the stack from
  // imageAdjustmentWiringGuardrail (which assumes the schema field already
  // exists and checks it's actually *used*): every image field on a
  // registered component must have the field declared in the first place,
  // unless the component opted out above.
  for (const [componentType, schema] of Object.entries(
    IsomerComplexComponentsMap,
  )) {
    if (INTENTIONALLY_NOT_ADJUSTABLE.has(componentType)) continue
    if (PENDING_COMPONENTS.has(componentType)) continue

    it(`"${componentType}" pairs every image field with its ImageAdjustment sibling`, () => {
      for (const { properties, imageFieldName } of findImageFields(schema)) {
        // Pending: wired in a later PR of this stack.
        if (properties === HeroCarouselSlideSchema.properties) continue
        expect(properties).toHaveProperty(`${imageFieldName}ImageAdjustment`)
      }
    })
  }

  it("covers every component in IsomerComplexComponentsMap", () => {
    // Guards against a typo'd or stale entry in INTENTIONALLY_NOT_ADJUSTABLE
    // silently excluding a component that should be checked.
    const allComponentTypes = Object.keys(IsomerComplexComponentsMap).sort()
    for (const type of INTENTIONALLY_NOT_ADJUSTABLE) {
      expect(allComponentTypes).toContain(type)
    }
  })
})
