import { describe, expect, it } from "vitest"
import { StepsSchema } from "~/interfaces/complex/Steps"
import { ArticlePageHeaderSchema } from "~/interfaces/internal/ArticlePageHeader"
import {
  LINK_HREF_PATTERN,
  NO_STYLIZED_UNICODE_REGEX,
} from "~/utils/validation"

const STYLIZED = "𝐡𝐞𝐥𝐥𝐨"

const patternOf = (schema: { pattern?: string }) => {
  if (!schema.pattern) {
    throw new Error(`expected a string pattern, got ${JSON.stringify(schema)}`)
  }
  return schema.pattern
}

describe("human-readable fields added on main", () => {
  describe("StepsSchema", () => {
    const step = StepsSchema.properties.steps.items.properties

    const textFields = {
      title: patternOf(StepsSchema.properties.title),
      subtitle: patternOf(StepsSchema.properties.subtitle),
      stepTitle: patternOf(step.title),
      stepDescription: patternOf(step.description),
      buttonLabel: patternOf(step.buttonLabel),
    }

    it("rejects stylized unicode in block and step text", () => {
      Object.entries(textFields).forEach(([field, pattern]) => {
        // Arrange
        const combined = new RegExp(pattern)

        // Act
        const plain = combined.test("How to apply")
        const stylized = combined.test(STYLIZED)
        const empty = combined.test("")

        // Assert
        expect(plain, field).toBe(true)
        expect(stylized, field).toBe(false)
        expect(pattern.startsWith(NO_STYLIZED_UNICODE_REGEX), field).toBe(true)
        if (field !== "buttonLabel") {
          expect(empty, field).toBe(false)
        }
      })
    })

    it("leaves link destinations and anchor ids as technical strings", () => {
      // Arrange / Act
      const buttonUrl = patternOf(step.buttonUrl)
      const anchorId = StepsSchema.properties.id

      // Assert
      expect(buttonUrl).toBe(LINK_HREF_PATTERN)
      expect(anchorId.pattern).toBeUndefined()
    })
  })

  describe("ArticlePageHeaderSchema", () => {
    it("rejects stylized unicode in the button label", () => {
      // Arrange
      const pattern = patternOf(ArticlePageHeaderSchema.properties.buttonLabel)
      const combined = new RegExp(pattern)

      // Act
      const plain = combined.test("Apply now")
      const stylized = combined.test(STYLIZED)

      // Assert
      expect(plain).toBe(true)
      expect(stylized).toBe(false)
      expect(pattern.startsWith(NO_STYLIZED_UNICODE_REGEX)).toBe(true)
    })

    it("leaves the button destination as a link pattern", () => {
      // Arrange / Act
      const pattern = patternOf(ArticlePageHeaderSchema.properties.buttonUrl)

      // Assert
      expect(pattern).toBe(LINK_HREF_PATTERN)
    })
  })
})
