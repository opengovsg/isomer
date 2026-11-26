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
  const withoutQueryOrHash = path.split(/[?#]/)[0] ?? ""
  const trimmed = withoutQueryOrHash.replace(/\/+$/, "")
  return trimmed === "" ? "/" : trimmed
}

interface IsSentimentAutoTriggerEligibleParams {
  siteUrl: string
  layout: IsomerPageLayoutType
  permalink: string
  // Resolved hrefs of the footer pages (privacy, terms of use, contact us,
  // feedback). These use the content layout but should stay manual.
  footerPageHrefs: (string | undefined)[]
}

export const isSentimentAutoTriggerEligible = ({
  siteUrl,
  layout,
  permalink,
  footerPageHrefs,
}: IsSentimentAutoTriggerEligibleParams) => {
  if (!isRolloutSite(siteUrl)) {
    return false
  }

  if (!AUTO_TRIGGER_LAYOUTS.includes(layout)) {
    return false
  }

  const currentPath = normalisePath(permalink)

  const isFooterPage = footerPageHrefs.some(
    (href) =>
      // Only internal paths can point at this page; external links are ignored
      href !== undefined &&
      href.startsWith("/") &&
      normalisePath(href) === currentPath,
  )

  return !isFooterPage
}
