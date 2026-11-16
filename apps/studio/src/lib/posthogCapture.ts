import type { Properties } from "posthog-js"
// oxlint-disable-next-line no-restricted-imports
import posthog from "posthog-js"

import { SITE_GROUP_TYPE } from "./posthog"

/** Captures an event not tied to any site, e.g. login and logout. */
export const captureEvent = (event: string, properties?: Properties) => {
  posthog.capture(event, properties)
}

/**
 * Captures an event tied to a site. The event-level `$groups` overrides the
 * persisted site group, so events that complete after the user has switched
 * sites or tabs keep their originating site.
 */
export const captureSiteEvent = (
  event: string,
  siteId: number | string,
  properties?: Properties,
) => {
  const site = String(siteId)
  captureEvent(event, {
    ...properties,
    site_id: site,
    $groups: { [SITE_GROUP_TYPE]: site },
  })
}
