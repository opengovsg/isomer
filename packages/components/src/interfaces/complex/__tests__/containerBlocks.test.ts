import { Value } from "@sinclair/typebox/value"
import { describe, expect, it } from "vitest"
import {
  getComponentSchema,
  IsomerNativeComponentsMap,
} from "~/schemas/components"
import { IsomerPageSchema } from "~/types/schema"

// Prose (and its children) are referenced by `$id`, so the checker needs them
// as references to resolve nested content.
const references = Object.values(IsomerNativeComponentsMap)
const isValidPage = (page: unknown) =>
  Value.Check(IsomerPageSchema, references, page)

const prose = {
  type: "prose",
  content: [
    {
      type: "paragraph",
      content: [{ type: "text", text: "Hello" }],
    },
  ],
}

// TypeBox's checker has no registry entry for string formats such as `image`,
// `link` and `textarea`, so the fixtures only use prose blocks.
const secondProse = {
  type: "prose",
  content: [
    {
      type: "paragraph",
      content: [{ type: "text", text: "World" }],
    },
  ],
}

const column = {
  type: "column",
  variant: "twoEqual",
  columns: [[secondProse], [prose]],
}

const contentPage = (content: unknown[]) => ({
  version: "0.1.0",
  layout: "content",
  page: { title: "Page", permalink: "/page", lastModified: "2024-01-01" },
  content,
})

describe("container blocks", () => {
  describe("accordion", () => {
    it("still accepts the legacy prose-only shape", () => {
      // Arrange
      const page = contentPage([
        { type: "accordion", summary: "Title", details: prose },
      ])

      // Act + Assert
      expect(isValidPage(page)).toBe(true)
    })

    it("accepts content blocks, including a nested column", () => {
      // Arrange
      const page = contentPage([
        { type: "accordion", summary: "Title", content: [prose, column] },
      ])

      // Act + Assert
      expect(isValidPage(page)).toBe(true)
    })

    it("rejects an accordion inside an accordion", () => {
      // Arrange
      const page = contentPage([
        {
          type: "accordion",
          summary: "Outer",
          content: [{ type: "accordion", summary: "Inner", content: [] }],
        },
      ])

      // Act + Assert
      expect(isValidPage(page)).toBe(false)
    })

    it("rejects three equal columns inside an accordion", () => {
      // Arrange
      const page = contentPage([
        {
          type: "accordion",
          summary: "Title",
          content: [
            {
              type: "column",
              variant: "threeEqual",
              columns: [[prose], [prose], [prose]],
            },
          ],
        },
      ])

      // Act + Assert
      expect(isValidPage(page)).toBe(false)
    })
  })

  describe("column", () => {
    it("accepts a column with an empty slot", () => {
      // Arrange
      const page = contentPage([
        { type: "column", variant: "twoEqual", columns: [[prose], []] },
      ])

      // Act + Assert
      expect(isValidPage(page)).toBe(true)
    })

    it("rejects more than one block per column", () => {
      // Arrange
      const page = contentPage([
        {
          type: "column",
          variant: "twoEqual",
          columns: [[prose, secondProse], [prose]],
        },
      ])

      // Act + Assert
      expect(isValidPage(page)).toBe(false)
    })

    it("rejects a column inside a column", () => {
      // Arrange
      const page = contentPage([
        { type: "column", variant: "twoEqual", columns: [[column], [prose]] },
      ])

      // Act + Assert
      expect(isValidPage(page)).toBe(false)
    })

    it("rejects blocks that are not allowed in containers", () => {
      // Arrange
      const page = contentPage([
        {
          type: "column",
          variant: "twoEqual",
          columns: [[{ type: "callout", content: prose }], [prose]],
        },
      ])

      // Act + Assert
      expect(isValidPage(page)).toBe(false)
    })
  })

  describe("getComponentSchema", () => {
    const getLayoutOptions = (layout: "homepage" | "content") => {
      const schema = getComponentSchema({ component: "column", layout })
      const { variant } = schema.properties as {
        variant: { anyOf: { const: string }[] }
      }
      return variant.anyOf.map((option) => option.const)
    }

    it("offers three equal columns only on the homepage", () => {
      expect(getLayoutOptions("homepage")).toContain("threeEqual")
      expect(getLayoutOptions("content")).not.toContain("threeEqual")
    })

    it("hides the legacy prose body in the container accordion editor", () => {
      // Act
      const schema = getComponentSchema({
        component: "accordion",
        accordionEditor: "container",
      })

      // Assert
      const { details } = schema.properties as { details: { format: string } }
      expect(details.format).toBe("hidden")
      expect(schema.required).toContain("content")
    })
  })
})
