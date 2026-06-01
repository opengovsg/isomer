import type { IsomerComponent } from "~/types"
import { describe, expect, it } from "vitest"
import { getDigestFromText } from "~/utils/getDigestFromText"
import { getTransformedPageContent } from "~/utils/getTransformedPageContent"

describe("getTransformedPageContent", () => {
  const idPattern = /^[a-f0-9]{32}$/

  it("preserves array length and block order", () => {
    // Arrange
    const content: IsomerComponent[] = [
      { type: "prose", content: [{ type: "heading", attrs: { level: 2 } }] },
      {
        type: "infocards",
        title: "Useful links",
        variant: "cardsWithoutImages",
        cards: [{ title: "Card" }],
      },
      {
        type: "infocols",
        title: "Info columns",
        infoBoxes: [{ title: "Column" }],
      },
      {
        type: "infopic",
        title: "Image with text",
        imageSrc: "/image.png",
        imageAlt: "Diagram showing process flow",
      },
      {
        type: "keystatistics",
        title: "Key stats",
        statistics: [{ label: "Metric", value: "100" }],
      },
    ]

    // Act
    const transformed = getTransformedPageContent(content)

    // Assert
    expect(transformed).toHaveLength(content.length)
    expect(transformed.map((b) => b.type)).toEqual(content.map((b) => b.type))
  })

  it("adds ids only to level-2 prose headings without ids", () => {
    // Arrange
    const content: IsomerComponent[] = [
      {
        type: "prose",
        content: [
          {
            type: "heading",
            attrs: { level: 2 },
            content: [{ type: "text", text: "Auto generated heading" }],
          },
          {
            type: "heading",
            attrs: { level: 3 },
            content: [{ type: "text", text: "Ignored heading level" }],
          },
          {
            type: "heading",
            attrs: { level: 2, id: "existing-id" },
            content: [{ type: "text", text: "Predefined heading" }],
          },
        ],
      },
    ]

    // Act
    const transformed = getTransformedPageContent(content)
    const proseBlock = transformed[0]

    // Assert
    expect(proseBlock?.type).toBe("prose")
    if (proseBlock?.type === "prose" && proseBlock.content) {
      const headingInfo = proseBlock.content.map((node) => {
        if (node.type !== "heading") return undefined
        return { level: node.attrs.level, id: node.attrs.id }
      })

      expect(headingInfo).toHaveLength(3)
      expect(headingInfo[0]).toEqual({
        level: 2,
        id: expect.stringMatching(idPattern),
      })
      expect(headingInfo[1]).toEqual({ level: 3, id: undefined })
      expect(headingInfo[2]).toEqual({ level: 2, id: "existing-id" })
    }
  })

  it("generates unique IDs for identical headings in different prose blocks", () => {
    // Arrange
    const proseBlock: IsomerComponent = {
      type: "prose",
      content: [
        {
          type: "heading",
          attrs: { level: 2 },
          content: [{ type: "text", text: "Introduction" }],
        },
      ],
    }
    const seed = `${JSON.stringify(proseBlock.content[0])}_0`
    const content: IsomerComponent[] = [proseBlock, proseBlock]

    // Act
    const transformed = getTransformedPageContent(content)

    // Assert
    const ids = transformed.map((block) => {
      if (block.type !== "prose" || !block.content) return undefined
      const node = block.content[0]
      return node?.type === "heading" ? node.attrs.id : undefined
    })

    expect(ids[0]).toBe(getDigestFromText(seed)) // preserve legacy seed for the first heading
    expect(ids[1]).toBe(getDigestFromText(`${seed}_1`))
    expect(ids[0]).not.toBe(ids[1])
  })

  it("adds ids to supported structured blocks", () => {
    // Arrange
    const content: IsomerComponent[] = [
      {
        type: "infocards",
        title: "Useful links",
        variant: "cardsWithoutImages",
        cards: [{ title: "Card" }],
      },
      {
        type: "infocols",
        title: "Info columns",
        infoBoxes: [{ title: "Column" }],
      },
      {
        type: "infopic",
        title: "Image with text",
        imageSrc: "/image.png",
        imageAlt: "Diagram showing process flow",
      },
      {
        type: "keystatistics",
        title: "Key stats",
        statistics: [{ label: "Metric", value: "100" }],
      },
    ]

    // Act
    const transformed = getTransformedPageContent(content)

    // Assert
    transformed.forEach((block) => {
      expect(
        block.type === "infocards" ||
          block.type === "infocols" ||
          block.type === "infopic" ||
          block.type === "keystatistics",
      ).toBe(true)

      if (
        block.type === "infocards" ||
        block.type === "infocols" ||
        block.type === "infopic" ||
        block.type === "keystatistics"
      ) {
        expect(block.id).toMatch(idPattern)
      }
    })
  })
})
