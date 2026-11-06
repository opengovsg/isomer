import { describe, expect, it } from "vitest"

import { IsomerComplexComponentsMap } from "../components"

// Components that intentionally never get image-adjustment -- mirrors
// Studio's own INTENTIONALLY_NOT_ADJUSTABLE list (adjustmentConfigRegistry.ts).
// Keep these two lists in sync: a component opted out here for a schema
// reason should also be opted out there, and vice versa.
const INTENTIONALLY_NOT_ADJUSTABLE = new Set(["logocloud", "video"])

// A plain-object walk of a compiled TypeBox schema (JSON-schema shaped at
// runtime: `.properties`, `.anyOf`/`.allOf` for unions/composites, `.items`
// for arrays). Returns every object node that has an image-upload field
// (format: "image", set by generateImageSrcSchema) as a direct property --
// `imageAdjustment` is expected as a SIBLING of that field, not somewhere
// else in the tree.
const findImageFieldParents = (node: unknown, acc: object[] = []): object[] => {
  if (node === null || typeof node !== "object") return acc

  const record = node as Record<string, unknown>
  const properties = record.properties
  if (properties !== null && typeof properties === "object") {
    const values = Object.values(properties as Record<string, unknown>)
    const hasImageField = values.some(
      (prop) =>
        prop !== null &&
        typeof prop === "object" &&
        (prop as { format?: unknown }).format === "image",
    )
    if (hasImageField) acc.push(record)
    values.forEach((prop) => findImageFieldParents(prop, acc))
  }

  for (const key of ["anyOf", "oneOf", "allOf", "items"]) {
    const value = record[key]
    if (Array.isArray(value)) {
      value.forEach((child: unknown) => findImageFieldParents(child, acc))
    } else if (value !== undefined) {
      findImageFieldParents(value, acc)
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

    it(`"${componentType}" pairs every image field with imageAdjustment`, () => {
      const imageFieldParents = findImageFieldParents(schema)

      for (const parent of imageFieldParents) {
        // format: "hidden" on the node itself (not the image field) marks a
        // beta/not-yet-editable variant -- e.g. HeroSearchbar's backgroundUrl,
        // explicitly commented "we don't want to show this in the UI yet".
        // Nothing can set imageAdjustment on a field nobody can edit, so this
        // isn't the same gap as a shipped, editable field missing its sibling.
        if ((parent as { format?: unknown }).format === "hidden") continue

        const properties = (parent as { properties?: Record<string, unknown> })
          .properties
        expect(properties).toHaveProperty("imageAdjustment")
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
