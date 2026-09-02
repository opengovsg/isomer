import type { AllCardProps } from "~/interfaces"
import { describe, expect, it } from "vitest"
import { generateSiteConfig } from "~/stories/helpers/generateSiteConfig"

import { processCollectionItems } from "../processCollectionItems"

const site = generateSiteConfig({
  siteMap: {
    id: "root",
    title: "Isomer Next",
    summary: "",
    lastModified: "2024-01-01",
    permalink: "/",
    layout: "homepage",
  },
})

const createArticleItem = (overrides?: Partial<AllCardProps>): AllCardProps =>
  ({
    variant: "article",
    id: "article-1",
    title: "Article 1",
    description: "Summary",
    lastModified: "2024-01-01",
    url: "/collection/article-1",
    site,
    ...overrides,
  }) as AllCardProps

describe("processCollectionItems", () => {
  // Regression test: an earlier version of this function rebuilt the item
  // object via destructuring without including date-filter fields, silently
  // dropping them.
  it("carries dateTagged and dateFilterDisplayEntries through to the processed item", () => {
    const dateTagged = [{ id: "event-date-filter", date: "2026-09-27" }]
    const dateFilterDisplayEntries = [
      {
        id: "event-date-filter",
        label: "Event Date",
        dateText: "27 Sep 2026",
        date: "2026-09-27",
        statusLabels: [
          { id: "ENDED" as const, label: "Ended" },
          { id: "ONGOING" as const, label: "Ongoing" },
          { id: "UPCOMING" as const, label: "Upcoming" },
        ],
      },
    ]

    const [result] = processCollectionItems([
      createArticleItem({ dateTagged, dateFilterDisplayEntries }),
    ])

    expect(result?.dateTagged).toEqual(dateTagged)
    expect(result?.dateFilterDisplayEntries).toEqual(dateFilterDisplayEntries)
  })

  it("leaves dateTagged and dateFilterDisplayEntries undefined when the item has none", () => {
    const [result] = processCollectionItems([createArticleItem()])

    expect(result?.dateTagged).toBeUndefined()
    expect(result?.dateFilterDisplayEntries).toBeUndefined()
  })
})
