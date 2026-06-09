import { CollectionPagePageSchema } from "@opengovsg/isomer-components"
import { describe, expect, it } from "vitest"

import { ajv } from "~/utils/ajv"

// Locks the contract that `CategoriesSchema` is composed into `CollectionPagePageSchema`
// and that each category option `label` carries the trimmed, non-empty `pattern`. The
// in-editor `hasBlankOptionLabel` gate is client-only; this guards the paths that bypass
// it (initial blob, programmatic mutation, future callers).
describe("CollectionPagePageSchema categoryOptions", () => {
  const validate = ajv.compile(CollectionPagePageSchema)

  const buildPage = (categoryOptions: { label: string; id: string }[]) => ({
    subtitle: "Summary",
    categoryOptions,
  })

  const VALID_ID = "11111111-1111-1111-1111-111111111111"

  it("accepts options with non-empty, trimmed labels", () => {
    // Arrange
    const page = buildPage([{ label: "Grants", id: VALID_ID }])

    // Act
    const isValid = validate(page)

    // Assert
    expect(isValid).toBe(true)
  })

  it("accepts a page with no categoryOptions (backward compatible)", () => {
    // Arrange
    const page = { subtitle: "Summary" }

    // Act
    const isValid = validate(page)

    // Assert
    expect(isValid).toBe(true)
  })

  it("rejects an empty option label", () => {
    // Arrange
    const page = buildPage([{ label: "", id: VALID_ID }])

    // Act
    const isValid = validate(page)

    // Assert
    expect(isValid).toBe(false)
  })

  it("rejects a whitespace-only option label", () => {
    // Arrange
    const page = buildPage([{ label: "   ", id: VALID_ID }])

    // Act
    const isValid = validate(page)

    // Assert
    expect(isValid).toBe(false)
  })

  it("rejects a label with leading/trailing spaces", () => {
    // Arrange
    const page = buildPage([{ label: " Grants ", id: VALID_ID }])

    // Act
    const isValid = validate(page)

    // Assert
    expect(isValid).toBe(false)
  })
})
