export const MOBILE_NAVIGATION_MENU_QUERY_SELECTOR =
  'button[aria-label="Open navigation menu"]'

export const FOOTER_QUERY_SELECTOR = "footer"

// The default settings landing page. Several settings pages redirect here (e.g.
// `/settings` and the admin-only audit page for non-admins), so the href is
// built in one place rather than duplicated per call site.
export const getAgencySettingsHref = (siteId: number | string): string =>
  `/sites/${siteId}/settings/agency`
