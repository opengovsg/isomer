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
  // object via destructuring without including `dateTagged`/`dateFilterCards`,
  // silently dropping them. Since those fields drive the sidebar's date
  // filter counts and the card's status pill, this caused the whole date
  // filter to disappear (getAvailableFilters drops any filter with zero
  // matching items).
  it("carries dateTagged and dateFilterCards through to the processed item", () => {
    const dateTagged = [{ id: "event-date-filter", date: "2026-09-27" }]
    const dateFilterCards = [
      {
        id: "event-date-filter",
        label: "Event Date",
        status: "ONGOING" as const,
        statusLabel: "Ongoing",
        dateText: "27 Sep 2026",
      },
    ]

    const [result] = processCollectionItems([
      createArticleItem({ dateTagged, dateFilterCards }),
    ])

    expect(result?.dateTagged).toEqual(dateTagged)
    expect(result?.dateFilterCards).toEqual(dateFilterCards)
  })

  it("leaves dateTagged and dateFilterCards undefined when the item has none", () => {
    const [result] = processCollectionItems([createArticleItem()])

    expect(result?.dateTagged).toBeUndefined()
    expect(result?.dateFilterCards).toBeUndefined()
  })
})
