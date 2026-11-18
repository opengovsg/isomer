import type { ImageAdjustment } from "@opengovsg/isomer-components"
import type { z } from "zod"
import { TAG_CATEGORY_TYPE } from "@opengovsg/isomer-components"
import { describe, expect, it } from "vitest"

import { countFilterUsageSchema, editLinkSchema } from "../collection"

const VALID_RFC4122_UUID = "550e8400-e29b-41d4-a716-446655440000"

// Compile-time guardrail, not a runtime one: editLinkSchema's
// image.imageAdjustment (zod) is hand-copied from imageAdjustmentSchema in
// @opengovsg/isomer-components (typebox). zod strips unknown keys, so if the
// typebox schema ever gains a field this one doesn't have, saves would
// silently drop it. This assignment fails to typecheck the moment that
// happens — update editLinkSchema's image.imageAdjustment to match.
type EditLinkImageAdjustment = NonNullable<
  NonNullable<z.infer<typeof editLinkSchema>["image"]>["imageAdjustment"]
>
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _imageAdjustmentSchemaStaysInSync: ImageAdjustment =
  {} as EditLinkImageAdjustment

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
