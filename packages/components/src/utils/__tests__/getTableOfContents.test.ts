/* oxlint-disable typescript/no-unsafe-type-assertion -- test fixtures use partial content shapes with hardBreak nodes */
import type { IsomerComponent } from "~/types"
import { describe, expect, it } from "vitest"
import { generateSiteConfig } from "~/stories/helpers/generateSiteConfig"
import { getTableOfContents } from "~/utils/getTableOfContents"
import { getTransformedPageContent } from "~/utils/getTransformedPageContent"

describe("getTableOfContents", () => {
  const anchorPattern = /^#[a-f0-9]{32}$/u

  it("generates toc entries from level-2 prose headings only", () => {
    // Arrange
    const site = generateSiteConfig()
    const transformedContent = getTransformedPageContent([
      {
        content: [
          {
            attrs: { level: 2 },
            content: [{ text: "Overview", type: "text" }],
            type: "heading",
          },
          {
            attrs: { level: 3 },
            content: [{ text: "Hidden from toc", type: "text" }],
            type: "heading",
          },
          {
            attrs: { level: 2 },
            content: [{ text: "Details", type: "text" }],
            type: "heading",
          },
        ],
        type: "prose",
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
        cards: [{ title: "Card" }],
        title: "Quick links",
        type: "infocards",
        variant: "cardsWithoutImages",
      },
      {
        infoBoxes: [{ title: "Column" }],
        title: "Info columns",
        type: "infocols",
      },
      {
        imageAlt: "Diagram showing process flow",
        imageSrc: "/image.png",
        title: "Image with text",
        type: "infopic",
      },
      {
        statistics: [{ label: "Metric", value: "100" }],
        title: "Key stats",
        type: "keystatistics",
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

  it("strips hard breaks from level-2 heading toc entries", () => {
    // Arrange
    const site = generateSiteConfig()
    // SAFETY: editor may insert hardBreak nodes into heading content at runtime
    const transformedContent = getTransformedPageContent([
      {
        content: [
          {
            attrs: { level: 2 },
            content: [
              { text: "Line one", type: "text" },
              { type: "hardBreak" },
              { text: "Line two", type: "text" },
            ],
            type: "heading",
          },
        ],
        type: "prose",
      },
    ] as IsomerComponent[])

    // Act
    const toc = getTableOfContents(site, transformedContent)

    // Assert
    expect(toc).toHaveLength(1)
    expect(toc[0]?.content).toBe("Line one Line two")
    expect(toc[0]?.content).not.toContain("<br")
  })

  it("skips empty level-2 headings (e.g. containing only a hard break)", () => {
    // Arrange
    const site = generateSiteConfig()
    const pageContent = [
      {
        content: [
          {
            attrs: { level: 2 },
            content: [{ type: "hardBreak" }],
            type: "heading",
          },
          {
            attrs: { level: 2 },
            content: [{ text: "Real heading", type: "text" }],
            type: "heading",
          },
        ],
        type: "prose",
      },
    ]
    // SAFETY: editor may insert hardBreak nodes into heading content at runtime
    const transformedContent = getTransformedPageContent(
      pageContent as IsomerComponent[],
    )

    // Act
    const toc = getTableOfContents(site, transformedContent)

    // Assert
    expect(toc).toHaveLength(1)
    expect(toc.map((t) => t.content)).toEqual(["Real heading"])
    expect(toc[0]?.anchorLink).toEqual(expect.stringMatching(anchorPattern))
  })

  it("skips whitespace-only level-2 headings (spaces, tabs, non-breaking space)", () => {
    // Arrange
    const site = generateSiteConfig()
    const transformedContent = getTransformedPageContent([
      {
        content: [
          {
            attrs: { level: 2 },
            content: [{ text: "   \t ", type: "text" }],
            type: "heading",
          },
          {
            attrs: { level: 2 },
            content: [{ text: " ", type: "text" }],
            type: "heading",
          },
          {
            attrs: { level: 2 },
            content: [{ text: "Real heading", type: "text" }],
            type: "heading",
          },
        ],
        type: "prose",
      },
    ])

    // Act
    const toc = getTableOfContents(site, transformedContent)

    // Assert
    expect(toc).toHaveLength(1)
    expect(toc.map((t) => t.content)).toEqual(["Real heading"])
    expect(toc[0]?.anchorLink).toEqual(expect.stringMatching(anchorPattern))
  })

  it("preserves order of toc entries across prose and blocks", () => {
    // Arrange
    const content: IsomerComponent[] = [
      {
        content: [
          {
            attrs: { level: 2 },
            content: [{ text: "Overview", type: "text" }],
            type: "heading",
          },
          {
            attrs: { level: 3 },
            content: [{ text: "Hidden from toc", type: "text" }],
            type: "heading",
          },
        ],
        type: "prose",
      },
      {
        cards: [{ title: "Card" }],
        title: "Quick links",
        type: "infocards",
        variant: "cardsWithoutImages",
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
