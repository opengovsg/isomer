import type {
  IsomerCollectionPageSitemap,
  IsomerSiteProps,
  IsomerSitemap,
} from "@opengovsg/isomer-components"
import { getCollectionItems } from "@opengovsg/isomer-components/build-utils"
import { describe, expect, it } from "vitest"

import {
  articleDateToRfc822,
  buildFeedXml,
  escapeXml,
  getFeedItems,
  MAX_FEED_ITEMS,
  toRfc822,
} from "../generateRss"

const COLLECTION_PERMALINK = "/newsroom"
const ASSET_REF = "/1/12345678-1234-1234-1234-123456789abc/report.pdf"

const makeItem = (overrides: Partial<IsomerSitemap>): IsomerSitemap =>
  ({
    id: "item",
    title: "Item title",
    permalink: `${COLLECTION_PERMALINK}/item`,
    summary: "Item summary",
    lastModified: "2026-01-01T00:00:00.000Z",
    layout: "article",
    ...overrides,
  }) as IsomerSitemap

type TagCategories = NonNullable<
  IsomerCollectionPageSitemap["collectionPagePageProps"]
>["tagCategories"]

const makeSite = (
  children: IsomerSitemap[],
  tagCategories?: TagCategories,
): IsomerSiteProps => {
  const collectionNode: IsomerSitemap = {
    id: "collection",
    title: "Newsroom",
    permalink: COLLECTION_PERMALINK,
    summary: "Latest updates from the agency",
    lastModified: "2026-07-01T00:00:00.000Z",
    layout: "collection",
    collectionPagePageProps: { tagCategories },
    children,
  }
  const siteMap: IsomerSitemap = {
    id: "root",
    title: "Home",
    permalink: "/",
    summary: "Home",
    lastModified: "2026-01-01T00:00:00.000Z",
    layout: "homepage",
    children: [collectionNode],
  }

  return {
    siteMap,
    siteMapArray: [siteMap, collectionNode, ...children],
    siteName: "Test Agency",
    url: "https://www.isomer.gov.sg",
    logoUrl: "/images/logo.svg",
    assetsBaseUrl: "https://cdn.example.gov.sg",
    lastUpdated: "2026-07-01",
    navbar: { items: [] },
    footerItems: {
      privacyStatementLink: "/privacy",
      termsOfUseLink: "/terms",
      siteNavItems: [],
    },
    theme: "isomer-next",
    search: { type: "localSearch", searchUrl: "/search" },
  } as unknown as IsomerSiteProps
}

const collectionNodeOf = (site: IsomerSiteProps): IsomerCollectionPageSitemap =>
  site.siteMap.children!.find(
    (c): c is IsomerCollectionPageSitemap => c.layout === "collection",
  )!

describe("escapeXml", () => {
  it("escapes the five XML special characters", () => {
    // Arrange / Act
    const result = escapeXml(`Tom & "Jerry" <b> won't</b>`)

    // Assert
    expect(result).toBe(
      "Tom &amp; &quot;Jerry&quot; &lt;b&gt; won&apos;t&lt;/b&gt;",
    )
  })
})

describe("date formatting", () => {
  it("formats an instant as RFC-822 in Singapore time", () => {
    // Arrange
    const noonSgt = new Date("2026-07-15T04:00:00.000Z") // 12:00 SGT

    // Act
    const result = toRfc822(noonSgt)

    // Assert
    expect(result).toBe("Wed, 15 Jul 2026 12:00:00 +0800")
  })

  it("anchors a calendar-day article date to midnight SGT regardless of parse tz", () => {
    // Arrange — a date parsed at UTC midnight (as the build server would)
    const parsedAtUtcMidnight = new Date("2026-07-15T00:00:00.000Z")

    // Act
    const result = articleDateToRfc822(parsedAtUtcMidnight)

    // Assert
    expect(result).toContain("15 Jul 2026 00:00:00 +0800")
  })
})

describe("getFeedItems", () => {
  it("returns items newest-first by article date", () => {
    // Arrange
    const site = makeSite([
      makeItem({
        id: "old",
        permalink: `${COLLECTION_PERMALINK}/old`,
        date: "2026-01-01",
      }),
      makeItem({
        id: "new",
        permalink: `${COLLECTION_PERMALINK}/new`,
        date: "2026-06-01",
      }),
      makeItem({
        id: "mid",
        permalink: `${COLLECTION_PERMALINK}/mid`,
        date: "2026-03-01",
      }),
    ])

    // Act
    const items = getFeedItems(site, COLLECTION_PERMALINK)

    // Assert
    expect(items.map((i) => i.id)).toEqual([
      `${COLLECTION_PERMALINK}/new`,
      `${COLLECTION_PERMALINK}/mid`,
      `${COLLECTION_PERMALINK}/old`,
    ])
  })

  it(`caps the feed at ${MAX_FEED_ITEMS} items`, () => {
    // Arrange
    const children = Array.from({ length: MAX_FEED_ITEMS + 10 }, (_, i) =>
      makeItem({
        id: `a-${i}`,
        permalink: `${COLLECTION_PERMALINK}/a-${i}`,
        date: `2026-01-${String((i % 28) + 1).padStart(2, "0")}`,
      }),
    )
    const site = makeSite(children)

    // Act
    const items = getFeedItems(site, COLLECTION_PERMALINK)

    // Assert
    expect(items).toHaveLength(MAX_FEED_ITEMS)
  })

  it("matches the item set from getCollectionItems (anti-drift guarantee)", () => {
    // Arrange
    const site = makeSite([
      makeItem({
        id: "a",
        permalink: `${COLLECTION_PERMALINK}/a`,
        date: "2026-01-01",
      }),
      makeItem({
        id: "b",
        permalink: `${COLLECTION_PERMALINK}/b`,
        layout: "link",
        ref: "https://external.example.gov.sg/news",
      }),
    ])

    // Act
    const feedIds = getFeedItems(site, COLLECTION_PERMALINK)
      .map((i) => i.id)
      .sort()
    const collectionIds = getCollectionItems({
      site,
      permalink: COLLECTION_PERMALINK,
    })
      .map((i) => i.id)
      .sort()

    // Assert
    expect(feedIds).toEqual(collectionIds)
  })
})

describe("buildFeedXml", () => {
  it("builds channel metadata and one item per collection item", () => {
    // Arrange
    const site = makeSite([
      makeItem({
        id: "article",
        permalink: `${COLLECTION_PERMALINK}/article-1`,
        title: "First article",
        date: "2026-07-15",
      }),
      makeItem({
        id: "link",
        permalink: `${COLLECTION_PERMALINK}/link-1`,
        title: "External link",
        layout: "link",
        ref: "https://external.example.gov.sg/news",
        date: "2026-07-10",
      }),
      makeItem({
        id: "file",
        permalink: `${COLLECTION_PERMALINK}/file-1`,
        title: "Report",
        layout: "file",
        ref: ASSET_REF,
        fileDetails: { type: "pdf", size: "2MB" },
      }),
    ])

    // Act
    const xml = buildFeedXml({
      site,
      collectionNode: collectionNodeOf(site),
      buildDate: new Date("2026-07-16T04:00:00.000Z"),
    })

    // Assert — channel
    expect(xml).toContain(
      '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    )
    expect(xml).toContain("<title>Test Agency — Newsroom</title>")
    expect(xml).toContain(
      "<description>Latest updates from the agency</description>",
    )
    expect(xml).toContain("<language>en</language>")
    expect(xml).toContain(
      "<generator>Isomer (https://www.isomer.gov.sg)</generator>",
    )
    expect(xml).toContain(
      '<atom:link href="https://www.isomer.gov.sg/newsroom/rss.xml" rel="self" type="application/rss+xml" />',
    )
    // Assert — items
    expect(xml.match(/<item>/g)).toHaveLength(3)
    expect(xml).toContain(
      "<link>https://www.isomer.gov.sg/newsroom/article-1</link>",
    )
    expect(xml).toContain(
      '<guid isPermaLink="true">https://www.isomer.gov.sg/newsroom/article-1</guid>',
    )
    expect(xml).toContain("<link>https://external.example.gov.sg/news</link>")
    expect(xml).toContain(`<link>https://cdn.example.gov.sg${ASSET_REF}</link>`)
    // link/file items are not permalinks
    expect(xml).toContain('<guid isPermaLink="false">')
  })

  it("emits a <category> per selected tag, resolved from tagged", () => {
    // Arrange
    const tagCategories = [
      {
        label: "Topic",
        options: [
          { id: "t1", label: "Public Health" },
          { id: "t2", label: "Transport" },
        ],
      },
      {
        label: "Region",
        options: [{ id: "r1", label: "Central" }],
      },
    ]
    const site = makeSite(
      [
        makeItem({
          id: "tagged-article",
          permalink: `${COLLECTION_PERMALINK}/tagged`,
          date: "2026-07-15",
          tagged: ["t1", "r1"],
        }),
      ],
      tagCategories as TagCategories,
    )

    // Act
    const xml = buildFeedXml({
      site,
      collectionNode: collectionNodeOf(site),
      buildDate: new Date("2026-07-16T04:00:00.000Z"),
    })

    // Assert
    expect(xml).toContain('<category domain="Topic">Public Health</category>')
    expect(xml).toContain('<category domain="Region">Central</category>')
    expect(xml).not.toContain("Transport") // t2 was not selected
  })

  it("omits pubDate for items without an article date", () => {
    // Arrange
    const site = makeSite([
      makeItem({
        id: "no-date",
        permalink: `${COLLECTION_PERMALINK}/no-date`,
        layout: "file",
        ref: ASSET_REF,
        fileDetails: { type: "pdf", size: "1MB" },
      }),
    ])

    // Act
    const xml = buildFeedXml({
      site,
      collectionNode: collectionNodeOf(site),
      buildDate: new Date("2026-07-16T04:00:00.000Z"),
    })

    // Assert
    expect(xml).toContain("<item>")
    expect(xml).not.toContain("<pubDate>")
  })

  it("emits a valid channel with no items for an empty collection", () => {
    // Arrange
    const site = makeSite([])

    // Act
    const xml = buildFeedXml({
      site,
      collectionNode: collectionNodeOf(site),
      buildDate: new Date("2026-07-16T04:00:00.000Z"),
    })

    // Assert
    expect(xml).toContain("<channel>")
    expect(xml).toContain("<title>Test Agency — Newsroom</title>")
    expect(xml).not.toContain("<item>")
  })
})
