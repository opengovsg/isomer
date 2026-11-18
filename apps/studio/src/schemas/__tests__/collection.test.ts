import type { ImageAdjustment } from "@opengovsg/isomer-components"
import type { z } from "zod"
import { TAG_CATEGORY_TYPE } from "@opengovsg/isomer-components"
import { describe, expect, expectTypeOf, it } from "vitest"

import type { editLinkSchema } from "../collection"
import { countFilterUsageSchema } from "../collection"

const VALID_RFC4122_UUID = "550e8400-e29b-41d4-a716-446655440000"

type EditLinkImageAdjustment = NonNullable<
  NonNullable<z.infer<typeof editLinkSchema>["image"]>["imageAdjustment"]
>

describe("editLinkSchema", () => {
  // A compile-time check. editLinkSchema's image.imageAdjustment (zod) is
  // hand-copied from imageAdjustmentSchema in @opengovsg/isomer-components
  // (typebox). zod strips unknown keys, so a field added there but not here
  // would be dropped on save. Typecheck fails when the two shapes differ.
  it("keeps image.imageAdjustment in sync with the components schema", () => {
    expectTypeOf<EditLinkImageAdjustment>().toEqualTypeOf<ImageAdjustment>()
  })
})

describe("countFilterUsageSchema", () => {
  it("accepts RFC 4122 UUIDs for text tag option ids", () => {
    // Arrange / Act
    const result = countFilterUsageSchema.safeParse({
      siteId: 1,
      pageId: 2,
      type: TAG_CATEGORY_TYPE.Text,
      tagOptionIds: [VALID_RFC4122_UUID],
    })

    // Assert
    expect(result.success).toBe(true)
  })

  it("accepts RFC 4122 UUID for date filter id", () => {
    // Arrange / Act
    const result = countFilterUsageSchema.safeParse({
      siteId: 1,
      pageId: 2,
      type: TAG_CATEGORY_TYPE.Date,
      dateFilterId: VALID_RFC4122_UUID,
    })

    // Assert
    expect(result.success).toBe(true)
  })

  it("rejects non-UUID tag option ids", () => {
    // Arrange / Act
    const result = countFilterUsageSchema.safeParse({
      siteId: 1,
      pageId: 2,
      type: TAG_CATEGORY_TYPE.Text,
      tagOptionIds: ["not-a-uuid"],
    })

    // Assert
    expect(result.success).toBe(false)
  })

  it("rejects non-UUID date filter ids", () => {
    // Arrange / Act
    const result = countFilterUsageSchema.safeParse({
      siteId: 1,
      pageId: 2,
      type: TAG_CATEGORY_TYPE.Date,
      dateFilterId: "not-a-uuid",
    })

    // Assert
    expect(result.success).toBe(false)
  })
})
