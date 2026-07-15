import type {
  IsomerCollectionPageSitemap,
  IsomerSiteProps,
} from "@opengovsg/isomer-components"
// Imported from the React-free `build-utils` entrypoint so this build script
// never pulls the component library's React barrel. Reusing getCollectionItems
// keeps the feed's item set identical to the rendered collection page (see
// docs/adr/0004-rss-feeds-via-standalone-script-reusing-components.md).
import {
  getCollectionItems,
  getReferenceLinkHref,
} from "@opengovsg/isomer-components/build-utils"
import { formatInTimeZone, fromZonedTime } from "date-fns-tz"

const SINGAPORE_TIME_ZONE = "Asia/Singapore"
// RFC-822 datetime required by RSS 2.0 <pubDate>/<lastBuildDate>, e.g.
// "Tue, 15 Jul 2026 00:00:00 +0800". English weekday/month come from date-fns'
// default (en-US) locale, which the spec mandates; `xx` yields "+0800".
const RFC_822_FORMAT = "EEE, dd MMM yyyy HH:mm:ss xx"

// Cap emitted items so a large collection never produces an unbounded feed; the
// full archive stays browsable on the collection page.
export const MAX_FEED_ITEMS = 50

type CollectionFeedItem = ReturnType<typeof getCollectionItems>[number]
type FeedTagCategories = Parameters<
  typeof getCollectionItems
>[0]["tagCategories"]

const XML_ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&apos;",
}

export const escapeXml = (value: string): string =>
  value.replace(/[&<>"']/g, (char) => XML_ESCAPES[char] ?? char)

export const toRfc822 = (date: Date): string =>
  formatInTimeZone(date, SINGAPORE_TIME_ZONE, RFC_822_FORMAT)

// The article date is a calendar day with no time; getCollectionItems parses it
// at the build server's local midnight. Re-anchor it to midnight SGT so the feed
// is identical regardless of where it is built.
export const articleDateToRfc822 = (date: Date): string => {
  const day = formatInTimeZone(date, SINGAPORE_TIME_ZONE, "yyyy-MM-dd")
  return toRfc822(fromZonedTime(`${day}T00:00:00`, SINGAPORE_TIME_ZONE))
}

const toAbsoluteUrl = (href: string, siteUrl?: string): string => {
  if (!siteUrl) {
    return href
  }
  try {
    return new URL(href, siteUrl).toString()
  } catch {
    return href
  }
}

const getEffectiveTime = (item: CollectionFeedItem): number => {
  if (item.date) {
    return item.date.getTime()
  }
  const parsed = Date.parse(item.lastModified)
  return Number.isNaN(parsed) ? 0 : parsed
}

// Feeds are always newest-first regardless of the collection page's configured
// sort order, matching reader expectations. Dateless items fall back to
// lastModified for ordering only (they still omit <pubDate>).
export const getFeedItems = (
  site: IsomerSiteProps,
  permalink: string,
  tagCategories?: FeedTagCategories,
): CollectionFeedItem[] =>
  // Passing tagCategories makes getCollectionItems resolve each item's `tags`
  // from its `tagged` selections against the collection's taxonomy.
  [...getCollectionItems({ site, permalink, showDate: true, tagCategories })]
    .sort((a, b) => getEffectiveTime(b) - getEffectiveTime(a))
    .slice(0, MAX_FEED_ITEMS)

const buildItemXml = (
  item: CollectionFeedItem,
  site: IsomerSiteProps,
): string => {
  const resolvedHref =
    getReferenceLinkHref(item.url, site.siteMapArray, site.assetsBaseUrl) ??
    item.url
  const link = toAbsoluteUrl(resolvedHref, site.url)
  // guid is the item's own permalink: stable and unique even for link/file
  // items (whose <link> points off-site). Only articles resolve to a real page,
  // so only they are true permalinks.
  const guid = toAbsoluteUrl(item.id, site.url)
  const isPermaLink = item.variant === "article"

  const parts = [
    `<title>${escapeXml(item.title)}</title>`,
    `<link>${escapeXml(link)}</link>`,
    `<guid isPermaLink="${isPermaLink}">${escapeXml(guid)}</guid>`,
  ]
  if (item.description) {
    parts.push(`<description>${escapeXml(item.description)}</description>`)
  }
  if (item.date) {
    parts.push(`<pubDate>${articleDateToRfc822(item.date)}</pubDate>`)
  }
  // One <category> per selected tag, with the tag category as the RSS domain.
  for (const { category, selected } of item.tags ?? []) {
    for (const label of selected) {
      parts.push(
        `<category domain="${escapeXml(category)}">${escapeXml(label)}</category>`,
      )
    }
  }
  return `<item>${parts.join("")}</item>`
}

export const buildFeedXml = ({
  site,
  collectionNode,
  buildDate,
}: {
  site: IsomerSiteProps
  collectionNode: IsomerCollectionPageSitemap
  buildDate: Date
}): string => {
  const permalinkWithSlash = collectionNode.permalink.endsWith("/")
    ? collectionNode.permalink
    : `${collectionNode.permalink}/`
  const channelLink = toAbsoluteUrl(permalinkWithSlash, site.url)
  const feedUrl = toAbsoluteUrl(`${permalinkWithSlash}rss.xml`, site.url)
  const title = `${site.siteName} — ${collectionNode.title}`
  const description = collectionNode.summary || title

  const channelParts = [
    `<title>${escapeXml(title)}</title>`,
    `<link>${escapeXml(channelLink)}</link>`,
    `<description>${escapeXml(description)}</description>`,
    `<language>en</language>`,
    `<lastBuildDate>${toRfc822(buildDate)}</lastBuildDate>`,
    `<generator>Isomer (https://www.isomer.gov.sg)</generator>`,
    `<atom:link href="${escapeXml(feedUrl)}" rel="self" type="application/rss+xml" />`,
    ...getFeedItems(
      site,
      collectionNode.permalink,
      collectionNode.collectionPagePageProps?.tagCategories,
    ).map((item) => buildItemXml(item, site)),
  ]

  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">`,
    `<channel>`,
    ...channelParts,
    `</channel>`,
    `</rss>`,
  ].join("\n")
}
