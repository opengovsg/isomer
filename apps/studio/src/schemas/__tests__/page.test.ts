import { updatePageBlobSchema } from "../page"

const noImageInfocardsPage = {
  version: "0.1.0",
  layout: "content",
  page: { title: "Page title", permalink: "page-title" },
  content: [
    {
      type: "infocards",
      title: "Cards",
      variant: "cardsWithoutImages",
      cards: [
        {
          title: "Card 1",
          description: "A description",
          url: "https://www.google.com",
          imageUrl: "/placeholder_no_image.png",
          imageAlt: "A photo of the office building",
          imageFit: "cover",
        },
      ],
    },
  ],
}

describe("updatePageBlobSchema", () => {
  it("accepts leftover combinator fields without rewriting them", () => {
    // Arrange
    const input = {
      pageId: 1,
      siteId: 1,
      content: JSON.stringify(noImageInfocardsPage),
    }

    // Act
    const parsed = updatePageBlobSchema.parse(input)

    // Assert
    const block = parsed.content.content[0]
    expect(block?.type).toBe("infocards")
    if (block?.type !== "infocards") {
      return
    }
    expect(block.cards[0]).toEqual({
      title: "Card 1",
      description: "A description",
      url: "https://www.google.com",
      imageUrl: "/placeholder_no_image.png",
      imageAlt: "A photo of the office building",
      imageFit: "cover",
    })
  })
})
