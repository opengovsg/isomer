import { z } from "zod"

export interface NotFoundCta {
  href: string
  label: string
}

export const ALL_SITES_CTA: NotFoundCta = {
  href: "/",
  label: "Back to all sites",
}

// Not the parallel "Back to your sites": one character between the two labels
// is too easy to misread when they mean different destinations.
const siteDashboardCta = (siteId: number | string): NotFoundCta => ({
  href: `/sites/${siteId}`,
  label: "Back to your site",
})

// The site dashboard throws NOT_FOUND itself (page.getRootPage for a site with
// no RootPage row, resource.getChildrenOf), so linking "back" to it would
// return the user to the screen that just failed.
const SITE_DASHBOARD_ROUTE = "/sites/[siteId]"

/**
 * Picks where the not-found error boundary sends the user.
 *
 * Every site-scoped procedure validates site permissions before it throws
 * NOT_FOUND, so reaching that screen with a `siteId` in the route means the
 * site exists and the user may read it. `/sites/<siteId>` is a destination we
 * know loads, unlike the failing resource they asked for.
 */
export const getNotFoundCta = (
  pathname: string,
  siteId: string | string[] | undefined,
): NotFoundCta => {
  if (typeof siteId !== "string" || pathname === SITE_DASHBOARD_ROUTE) {
    return ALL_SITES_CTA
  }

  return siteDashboardCta(siteId)
}

const SITE_PATH_ROOT = "sites"

// Positive integers only, matching the `siteId: z.number().min(1)` the server
// input schemas require (see ~/schemas/site). Coercing also canonicalises the
// id, so "/sites/007/pages" links to "/sites/7".
const siteIdSegmentSchema = z.coerce.number().int().positive()

/**
 * Picks where the 404 page sends the user.
 *
 * No route matched, so `router.query` is empty and the site id has to come out
 * of the requested path instead. Nothing has verified that site exists or is
 * readable: a hand-typed `/sites/99999/pages` links to a dashboard that fails
 * its own permission check. Truncating a real URL is the far more common way
 * to reach a 404 inside a site, so we take the better destination for it.
 */
export const getNotFoundCtaFromPath = (path: string): NotFoundCta => {
  // Placeholder origin so URL splits off any query string and hash for us.
  const { pathname } = new URL(path, "https://studio.invalid")
  const [, root, siteIdSegment] = pathname.split("/")

  if (root !== SITE_PATH_ROOT) {
    return ALL_SITES_CTA
  }

  const siteId = siteIdSegmentSchema.safeParse(siteIdSegment)

  return siteId.success ? siteDashboardCta(siteId.data) : ALL_SITES_CTA
}
