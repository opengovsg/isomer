import type { IsomerComponent } from "@opengovsg/isomer-components"
import { describe, expect, it } from "vitest"

import { inferAsProse } from "../inferAsProse"

describe("inferAsProse", () => {
  it("should return the component when it is a prose block with valid content", () => {
    // Arrange
    const component: IsomerComponent = {
      type: "prose",
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: "Hello world" }],
        },
      ],
    }

    // Act
    const result = inferAsProse(component)

    // Assert
    expect(result).toBe(component)
  })

  it("should return schema-invalid prose content without throwing", () => {
    const component: IsomerComponent = {
      type: "prose",
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: "𝐎𝐟𝐟𝐢𝐜𝐢𝐚𝐥" }],
        },
      ],
    }

    // Act & Assert
    expect(() => inferAsProse(component)).not.toThrow()
  })

  it("should throw when component is undefined", () => {
    expect(() => inferAsProse(undefined)).toThrow(
      "Expected component of type prose but got undefined",
    )
  })

  it("should throw when component is not of type prose", () => {
    // Arrange
    const component: IsomerComponent = {
      type: "callout",
      content: {
        type: "prose",
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", text: "Hello world" }],
          },
        ],
      },
    }

    // Act & Assert
    expect(() => inferAsProse(component)).toThrow(
      "Expected component of type prose but got type callout",
    )
  })
})
