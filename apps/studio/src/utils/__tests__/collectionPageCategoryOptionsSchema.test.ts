import { CollectionPagePageSchema } from "@opengovsg/isomer-components"
import { describe, expect, it } from "vitest"
import { ajv } from "~/utils/ajv"

const uuid1 = "00000000-0000-4000-8000-000000000001"
const uuid2 = "00000000-0000-4000-8000-000000000002"

const validate = ajv.compile(CollectionPagePageSchema)

/** Minimal CollectionPagePageSchema payload — only required props plus categoryOptions under test. */
const baseValid = {
  subtitle: "subtitle",
}

describe("CollectionPagePageSchema — categoryOptions composition", () => {
  it("passes when categoryOptions is omitted (optional for backward compatibility)", () => {
    // Act
    const valid = validate(baseValid)

    // Assert
    expect(valid).toBe(true)
  })

  it("passes for a valid set of unique option labels", () => {
    // Arrange
    const data = {
      ...baseValid,
      categoryOptions: [
        { label: "Apple", id: uuid1 },
        { label: "Banana", id: uuid2 },
      ],
    }

    // Act
    const valid = validate(data)

    // Assert
    expect(valid).toBe(true)
  })

  it("fails when two option labels duplicate each other (case-insensitive, trimmed)", () => {
    // Arrange
    const data = {
      ...baseValid,
      categoryOptions: [
        { label: "  Apple  ", id: uuid1 },
        { label: "apple", id: uuid2 },
      ],
    }

    // Act
    const valid = validate(data)

    // Assert
    expect(valid).toBe(false)
    expect(
      validate.errors?.some(
        (e) => e.keyword === "uniqueItemPropertiesIgnoreCase",
      ),
    ).toBe(true)
  })
})
