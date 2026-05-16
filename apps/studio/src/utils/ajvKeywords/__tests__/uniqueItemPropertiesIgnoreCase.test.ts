import { describe, expect, it } from "vitest"
import { ajv } from "~/utils/ajv"

const uuid = "00000000-0000-4000-8000-000000000001"
const uuid2 = "00000000-0000-4000-8000-000000000002"
const uuid3 = "00000000-0000-4000-8000-000000000003"

describe("uniqueItemPropertiesIgnoreCase", () => {
  const schema = {
    type: "object",
    properties: {
      items: {
        type: "array",
        uniqueItemPropertiesIgnoreCase: ["label"],
        items: {
          type: "object",
          properties: {
            label: { type: "string" },
            id: { type: "string" },
          },
          required: ["label", "id"],
        },
      },
    },
    required: ["items"],
  }

  const schemaTwoKeys = {
    type: "object",
    properties: {
      items: {
        type: "array",
        uniqueItemPropertiesIgnoreCase: ["label", "slug"],
        items: {
          type: "object",
          properties: {
            label: { type: "string" },
            slug: { type: "string" },
            id: { type: "string" },
          },
          required: ["label", "slug", "id"],
        },
      },
    },
    required: ["items"],
  }

  const validate = ajv.compile(schema)
  const validateTwoKeys = ajv.compile(schemaTwoKeys)

  it("fails when two labels differ only by case", () => {
    // Arrange
    const data = {
      items: [
        { label: "Foo", id: uuid },
        { label: "foo", id: uuid2 },
      ],
    }

    // Act
    const ok = validate(data)

    // Assert
    expect(ok).toBe(false)
    expect(
      validate.errors?.some(
        (e) => e.keyword === "uniqueItemPropertiesIgnoreCase",
      ),
    ).toBe(true)
  })

  it("fails when two labels match after trim and case fold", () => {
    // Arrange
    const data = {
      items: [
        { label: "  Foo  ", id: uuid },
        { label: "foo", id: uuid2 },
      ],
    }

    // Act
    const ok = validate(data)

    // Assert
    expect(ok).toBe(false)
  })

  it("passes when labels are distinct after normalization", () => {
    // Arrange
    const data = {
      items: [
        { label: "Foo", id: uuid },
        { label: "Bar", id: uuid2 },
      ],
    }

    // Act
    const ok = validate(data)

    // Assert
    expect(ok).toBe(true)
  })

  it("passes when the array is empty", () => {
    // Arrange
    const data = { items: [] as { label: string; id: string }[] }

    // Act
    const ok = validate(data)

    // Assert
    expect(ok).toBe(true)
  })

  it("passes when there is only one item", () => {
    // Arrange
    const data = {
      items: [{ label: "Only", id: uuid }],
    }

    // Act
    const ok = validate(data)

    // Assert
    expect(ok).toBe(true)
  })

  it("does not mutate label casing", () => {
    // Arrange
    const data = {
      items: [
        { label: "Foo", id: uuid },
        { label: "Bar", id: uuid2 },
      ],
    }

    // Act
    validate(data)

    // Assert
    expect(data.items[0]?.label).toBe("Foo")
  })

  it("ignores empty or whitespace-only labels for duplicate detection", () => {
    // Arrange
    const data = {
      items: [
        { label: "  ", id: uuid },
        { label: "", id: uuid2 },
      ],
    }

    // Act
    const ok = validate(data)

    // Assert
    expect(ok).toBe(true)
  })

  describe("multiple listed properties", () => {
    it("fails when a duplicate appears on the second listed property even if labels differ", () => {
      // Arrange
      const data = {
        items: [
          { label: "Alpha", slug: "same-slug", id: uuid },
          { label: "Beta", slug: "Same-Slug", id: uuid2 },
        ],
      }

      // Act
      const ok = validateTwoKeys(data)

      // Assert
      expect(ok).toBe(false)
    })

    it("fails when a duplicate appears on the first listed property even if slugs differ", () => {
      // Arrange
      const data = {
        items: [
          { label: "Shared", slug: "s1", id: uuid },
          { label: "  shared  ", slug: "s2", id: uuid2 },
        ],
      }

      // Act
      const ok = validateTwoKeys(data)

      // Assert
      expect(ok).toBe(false)
    })

    it("passes when both properties are unique after normalization across items", () => {
      // Arrange
      const data = {
        items: [
          { label: "Alpha", slug: "a", id: uuid },
          { label: "Beta", slug: "b", id: uuid2 },
        ],
      }

      // Act
      const ok = validateTwoKeys(data)

      // Assert
      expect(ok).toBe(true)
    })
  })

  it("fails on the third item when the duplicate is not adjacent", () => {
    // Arrange
    const data = {
      items: [
        { label: "A", id: uuid },
        { label: "B", id: uuid2 },
        { label: "a", id: uuid3 },
      ],
    }

    // Act
    const ok = validate(data)

    // Assert
    expect(ok).toBe(false)
  })
})
