import type {
  IsomerCollectionPageSitemap,
  IsomerSiteProps,
  IsomerSitemap,
} from "@opengovsg/isomer-components/build-utils"
// Imported from the React-free `build-utils` entrypoint so this build script
// never pulls the component library's React barrel. Reusing getCollectionItems
// keeps the feed's item set identical to the rendered collection page (see
// docs/adr/0004-rss-feeds-via-standalone-script-reusing-components.md).
import {
  getCollectionItems,
  getReferenceLinkHref,
  getSitemapAsArray,
} from "@opengovsg/isomer-components/build-utils"
import { format } from "date-fns"
import { formatInTimeZone, fromZonedTime } from "date-fns-tz"
import { mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { argv } from "node:process"
import { pathToFileURL } from "node:url"

const SINGAPORE_TIME_ZONE = "Asia/Singapore"
// RFC-822 datetime required by RSS 2.0 <pubDate>/<lastBuildDate>, e.g.
// "Tue, 15 Jul 2026 00:00:00 +0800". English weekday/month come from date-fns'
// default (en-US) locale, which the spec mandates; `xx` yields "+0800".
const RFC_822_FORMAT = "EEE, dd MMM yyyy HH:mm:ss xx"

// Cap emitted items so a large collection never produces an unbounded feed; the
// full archive stays browsable on the collection page.
export const MAX_FEED_ITEMS = 200

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

// The article date is a calendar day with no time; getCollectionItems (via
// getParsedDate) turns it into the build server's *local* midnight. Read the day
// back off the local fields — converting the instant to SGT first would roll it
// back a day anywhere east of Singapore — then anchor it to midnight SGT so the
// feed is identical regardless of where it is built.
export const articleDateToRfc822 = (date: Date): string => {
  const day = format(date, "yyyy-MM-dd")
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

const getEffectiveTime = (item: CollectionFeedItem): number =>
  item.date?.getTime() ?? (Date.parse(item.lastModified) || 0)

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
  resourceIdByPermalink: Map<string, string>,
): string => {
  // No `?? item.url` fallback: getReferenceLinkHref returns undefined when
  // DOMPurify strips the href (javascript:, data:, vbscript: …), and falling
  // back would put the unsafe original straight into the feed. Omitting <link>
  // matches what the collection page renders for the same item.
  const resolvedHref = getReferenceLinkHref(
    item.url,
    site.siteMapArray,
    site.assetsBaseUrl,
  )
  const resourceId = resourceIdByPermalink.get(item.id)
  if (!resourceId) {
    throw new Error(`Missing resource ID for collection item: ${item.id}`)
  }

  const parts = [`<title>${escapeXml(item.title)}</title>`]
  if (resolvedHref) {
    parts.push(
      `<link>${escapeXml(toAbsoluteUrl(resolvedHref, site.url))}</link>`,
    )
  }
  parts.push(
    `<guid isPermaLink="false">urn:isomer:resource:${escapeXml(resourceId)}</guid>`,
  )
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
  // getCollectionItems reports each item's permalink as its `id`, so this maps
  // back to the sitemap node holding the stable database resource id.
  const resourceIdByPermalink = new Map(
    site.siteMapArray.map((node) => [node.permalink, node.id]),
  )

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
    ).map((item) => buildItemXml(item, site, resourceIdByPermalink)),
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

const requireEnv = (name: string): string => {
  const value = process.env[name]
  if (!value) throw new Error(`Missing required environment variable: ${name}`)
  return value
}

interface SiteConfigFile {
  site: Omit<IsomerSiteProps, "siteMap" | "siteMapArray">
}

const main = (): void => {
  const sitemap = JSON.parse(
    readFileSync(requireEnv("SITEMAP_JSON"), "utf-8"),
  ) as IsomerSitemap
  const config = JSON.parse(
    readFileSync(requireEnv("CONFIG_JSON"), "utf-8"),
  ) as SiteConfigFile
  const outDir = requireEnv("OUT_DIR")
  const siteMapArray = getSitemapAsArray(sitemap)
  const site = {
    ...config.site,
    siteMap: sitemap,
    siteMapArray,
    assetsBaseUrl: process.env.NEXT_PUBLIC_ASSETS_BASE_URL,
  } as unknown as IsomerSiteProps
  const collections = siteMapArray.filter(
    (node): node is IsomerCollectionPageSitemap => node.layout === "collection",
  )
  const buildDate = new Date()

  for (const collectionNode of collections) {
    const feedPath = join(outDir, collectionNode.permalink, "rss.xml")
    mkdirSync(dirname(feedPath), { recursive: true })
    writeFileSync(
      feedPath,
      buildFeedXml({ site, collectionNode, buildDate }),
      "utf-8",
    )
    console.log(`Wrote ${feedPath}`)
  }

  console.log(`Generated ${collections.length} RSS feed(s).`)
}

if (argv[1] && import.meta.url === pathToFileURL(argv[1]).href) main()
