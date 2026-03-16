import { describe, expect, it } from "vitest"

import { getTableOfContents } from "~/utils/getTableOfContents"
import { getTransformedPageContent } from "~/utils/getTransformedPageContent"

describe("getTransformedPageContent", () => {
  it("should auto-generate ids for level 2 prose headings and structured blocks", () => {
    // Arrange
    const content = [
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
      {
        type: "infocards",
        title: "Useful links",
      },
    ] as never

    // Act
    const transformedContent = getTransformedPageContent(content)

    // Assert
    const proseBlock = transformedContent[0] as never as {
      content: Array<{ attrs: { level: number; id?: string } }>
    }
    const infoCardsBlock = transformedContent[1] as never as { id?: string }

    expect(proseBlock.content[0].attrs.id).toMatch(/^[a-f0-9]{32}$/)
    expect(proseBlock.content[1].attrs.id).toBeUndefined()
    expect(proseBlock.content[2].attrs.id).toBe("existing-id")
    expect(infoCardsBlock.id).toMatch(/^[a-f0-9]{32}$/)
    expect((content as Array<{ content: Array<{ attrs: { id?: string } }> }>)[0]
      .content[0].attrs.id).toBeUndefined()
  })
})

describe("getTableOfContents", () => {
  it("should generate anchor links from transformed prose and block content", () => {
    // Arrange
    const content = [
      {
        type: "prose",
        content: [
          {
            type: "heading",
            attrs: { level: 2 },
            content: [{ type: "text", text: "Overview" }],
          },
          {
            type: "heading",
            attrs: { level: 3 },
            content: [{ type: "text", text: "Hidden from toc" }],
          },
        ],
      },
      {
        type: "infocards",
        title: "Quick links",
      },
    ] as never

    const transformedContent = getTransformedPageContent(content)
    const generatedHeadingId = (
      transformedContent[0] as never as {
        content: Array<{ attrs: { id?: string } }>
      }
    ).content[0].attrs.id
    const generatedInfoCardsId = (transformedContent[1] as never as { id?: string })
      .id

    // Act
    const tableOfContents = getTableOfContents(
      {} as never,
      transformedContent as never,
    )

    // Assert
    expect(tableOfContents).toEqual([
      {
        content: "Overview",
        anchorLink: `#${generatedHeadingId}`,
      },
      {
        content: "Quick links",
        anchorLink: `#${generatedInfoCardsId}`,
      },
    ])
  })
})
