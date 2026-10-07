import { z } from "zod"

export interface NotFoundCta {
  href: string
  label: string
}

export const ALL_SITES_CTA: NotFoundCta = {
  href: "/",
  label: "Back to all sites",
}

// "Back to your site", not "Back to your sites". One letter is easy to misread.
const siteDashboardCta = (siteId: number | string): NotFoundCta => ({
  href: `/sites/${siteId}`,
  label: "Back to your site",
})

// /sites/[siteId] throws NOT_FOUND when getRootPage finds no RootPage row.
const SITE_DASHBOARD_ROUTE = "/sites/[siteId]"

// DefaultNotFound: route matched, siteId is in router.query. Site-scoped
// procedures check read permission before NOT_FOUND, so /sites/<siteId> is
// safe when siteId is a single string.
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

// Positive integers only (see ~/schemas/site). "/sites/007/pages" -> "/sites/7".
const siteIdSegmentSchema = z
  .string()
  .regex(/^\d+$/)
  .transform(Number)
  .pipe(z.number().int().positive())

// 404 page: no route params, parse site id from asPath. A guessed id like
// /sites/99999/pages may 404 again; truncated URLs are common enough to link
// to the site dashboard anyway.
export const getNotFoundCtaFromPath = (path: string): NotFoundCta => {
  // Fake origin strips query string and hash.
  const { pathname } = new URL(path, "https://studio.invalid")
  const [, root, siteIdSegment] = pathname.split("/")

  if (root !== SITE_PATH_ROOT) {
    return ALL_SITES_CTA
  }

  const siteId = siteIdSegmentSchema.safeParse(siteIdSegment)

  return siteId.success ? siteDashboardCta(siteId.data) : ALL_SITES_CTA
}
