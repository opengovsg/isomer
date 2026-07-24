import type { IsomerPageSchemaType } from "~/types/schema"
import { describe, expect, it } from "vitest"

import { getMetadata } from "../metadata"

const makeProps = ({
  layout = "collection",
  permalink = "/newsroom",
  title = "Newsroom",
  url = "https://www.isomer.gov.sg",
}: {
  layout?: IsomerPageSchemaType["layout"]
  permalink?: string
  title?: string
  url?: string
}): IsomerPageSchemaType =>
  ({
    layout,
    site: {
      siteName: "Test Agency",
      url,
      logoUrl: "/images/logo.svg",
      favicon: "/favicon.ico",
    },
    page: {
      title,
      permalink,
      subtitle: "Latest updates",
      articlePageHeader: { summary: "An article summary" },
    },
    content: [],
  }) as unknown as IsomerPageSchemaType

describe("getMetadata — RSS feed discovery", () => {
  it("advertises the collection's rss.xml as an application/rss+xml alternate", () => {
    // Arrange
    const props = makeProps({ layout: "collection", permalink: "/newsroom" })

    // Act
    const { alternates } = getMetadata(props)

    // Assert
    expect(alternates.types).toEqual({
      "application/rss+xml": [
        {
          url: "https://www.isomer.gov.sg/newsroom/rss.xml",
          title: "Test Agency — Newsroom",
        },
      ],
    })
  })

  it("does not double the slash when the collection permalink already ends in one", () => {
    // Arrange
    const props = makeProps({ layout: "collection", permalink: "/newsroom/" })

    // Act
    const { alternates } = getMetadata(props)

    // Assert
    expect(alternates.types?.["application/rss+xml"]).toEqual([
      {
        url: "https://www.isomer.gov.sg/newsroom/rss.xml",
        title: "Test Agency — Newsroom",
      },
    ])
  })

  it("falls back to a relative feed path when the site has no url", () => {
    // Arrange
    const props = makeProps({ layout: "collection", url: "" })

    // Act
    const { alternates } = getMetadata(props)

    // Assert
    expect(alternates.types?.["application/rss+xml"]).toEqual([
      { url: "/newsroom/rss.xml", title: "Test Agency — Newsroom" },
    ])
  })

  it("emits no feed alternate for non-collection layouts", () => {
    // Arrange
    const props = makeProps({ layout: "article" })

    // Act
    const { alternates } = getMetadata(props)

    // Assert
    expect(alternates.types).toBeUndefined()
  })
})
