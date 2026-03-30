import type { IsomerComponent } from "~/types"
import { describe, expect, it } from "vitest"
import { generateSiteConfig } from "~/stories/helpers/generateSiteConfig"
import { getTableOfContents } from "~/utils/getTableOfContents"
import { getTransformedPageContent } from "~/utils/getTransformedPageContent"

describe("getTableOfContents", () => {
  const anchorPattern = /^#[a-f0-9]{32}$/

  it("generates toc entries from level-2 prose headings only", () => {
    // Arrange
    const site = generateSiteConfig()
    const transformedContent = getTransformedPageContent([
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
          {
            type: "heading",
            attrs: { level: 2 },
            content: [{ type: "text", text: "Details" }],
          },
        ],
      },
    ])

    // Act
    const toc = getTableOfContents(site, transformedContent)

    // Assert
    expect(toc).toHaveLength(2)
    expect(toc.map((t) => t.content)).toEqual(["Overview", "Details"])
    expect(toc.map((t) => t.anchorLink)).toEqual([
      expect.stringMatching(anchorPattern),
      expect.stringMatching(anchorPattern),
    ])
  })

  it("generates toc entries for supported structured blocks with titles", () => {
    // Arrange
    const site = generateSiteConfig()
    const content: IsomerComponent[] = [
      {
        type: "infocards",
        title: "Quick links",
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
    const transformedContent = getTransformedPageContent(content)

    // Act
    const toc = getTableOfContents(site, transformedContent)

    // Assert
    expect(toc.map((t) => t.content)).toEqual([
      "Quick links",
      "Info columns",
      "Image with text",
      "Key stats",
    ])
    expect(toc.map((t) => t.anchorLink)).toEqual([
      expect.stringMatching(anchorPattern),
      expect.stringMatching(anchorPattern),
      expect.stringMatching(anchorPattern),
      expect.stringMatching(anchorPattern),
    ])
  })

  it("preserves order of toc entries across prose and blocks", () => {
    // Arrange
    const content: IsomerComponent[] = [
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
        variant: "cardsWithoutImages",
        cards: [{ title: "Card" }],
      },
    ]

    const site = generateSiteConfig()
    const transformedContent = getTransformedPageContent(content)

    // Act
    const toc = getTableOfContents(site, transformedContent)

    // Assert
    expect(toc.map((t) => t.content)).toEqual(["Overview", "Quick links"])
    expect(toc.map((t) => t.anchorLink)).toEqual([
      expect.stringMatching(anchorPattern),
      expect.stringMatching(anchorPattern),
    ])
  })
})
