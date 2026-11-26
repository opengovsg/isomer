import type { IsomerPageLayoutType } from "~/types"
import { ISOMER_PAGE_LAYOUTS } from "~/types/constants"

// Only pages that usually hold the main content get the automatic WOGAA
// Sentiments pop-up. Everything else (homepage, index, collection, database,
// search, etc.) keeps the default manual trigger via the WOGAA widget.
const AUTO_TRIGGER_LAYOUTS: readonly IsomerPageLayoutType[] = [
  ISOMER_PAGE_LAYOUTS.Content,
  ISOMER_PAGE_LAYOUTS.Article,
]

// TEMPORARY rollout gate: only enabled on the Isomer site itself for testing.
// Remove this allowlist (and the `siteUrl` check below) to roll out to all sites.
const ROLLOUT_SITE_HOSTNAMES = ["isomer.gov.sg", "www.isomer.gov.sg"]

const isRolloutSite = (siteUrl: string) => {
  try {
    return ROLLOUT_SITE_HOSTNAMES.includes(new URL(siteUrl).hostname)
  } catch {
    return false
  }
}

const normalisePath = (path: string) => {
  const trimmed = path.replace(/\/+$/, "")
  return trimmed === "" ? "/" : trimmed
}

const getHostname = (url: URL) => url.hostname.replace(/^www\./, "")

// Returns the normalised path of `href` if it points at a page on this site
// (relative path or a full URL on the site's own domain), otherwise undefined
const getSitePath = (href: string, siteUrl: string) => {
  try {
    const site = new URL(siteUrl)
    const target = new URL(href, site)

    if (getHostname(target) !== getHostname(site)) {
      return undefined
    }

    return normalisePath(target.pathname)
  } catch {
    return undefined
  }
}

interface IsSentimentAutoTriggerEligibleParams {
  siteUrl: string
  layout: IsomerPageLayoutType
  permalink: string
  // Resolves the hrefs of the footer pages (privacy, terms of use, contact us,
  // feedback). These use the content layout but should stay manual.
  // Lazy so the links are only resolved for pages that could be eligible.
  getFooterPageHrefs: () => (string | undefined)[]
}

export const isSentimentAutoTriggerEligible = ({
  siteUrl,
  layout,
  permalink,
  getFooterPageHrefs,
}: IsSentimentAutoTriggerEligibleParams) => {
  if (!isRolloutSite(siteUrl)) {
    return false
  }

  if (!AUTO_TRIGGER_LAYOUTS.includes(layout)) {
    return false
  }

  const currentPath = normalisePath(permalink)

  const isFooterPage = getFooterPageHrefs().some(
    (href) => href !== undefined && getSitePath(href, siteUrl) === currentPath,
  )

  return !isFooterPage
}
