import { REFERENCE_LINK_REGEX } from "@opengovsg/isomer-components"
import { differenceInMinutes, format, isToday, isYesterday } from "date-fns"

// Coarse relative time for the "Added" column, matching the design:
// "just now" → "today" → "yesterday" → "12 Sep 2024"
export const formatAddedAt = (date: Date): string => {
  if (differenceInMinutes(new Date(), date) < 5) return "just now"
  if (isToday(date)) return "today"
  if (isYesterday(date)) return "yesterday"
  return format(date, "d MMM yyyy")
}

// Internal-page destinations are stored as "[resource:siteId:resourceId]"
// references; literal paths and external URLs are not. Anchored (the shared
// REFERENCE_LINK_REGEX is not) so a destination only counts as a reference when
// it is exactly one — an external URL merely containing the substring doesn't.
const REFERENCE_DESTINATION_REGEX = new RegExp(
  `^${REFERENCE_LINK_REGEX.source}$`,
)
export const isReferenceDestination = (destination: string): boolean =>
  REFERENCE_DESTINATION_REGEX.test(destination)

// Resolved info for a stored internal destination: a reference's current
// permalink for display (null once the page is gone), and `warn` — true when the
// destination has no published page behind it (missing or not-yet-published).
export interface ResolvedDestination {
  permalink: string | null
  warn: boolean
}

// Resolution state of a stored destination for display. The status is a stable
// sentinel — user-facing copy for the "missing" case lives at the render site,
// so the wording can change without touching this logic.
export type DestinationDisplay =
  | { status: "resolving" }
  | { status: "missing" }
  | { status: "resolved"; label: string }

// Maps a stored destination to its display state: a reference resolves to the
// page's current permalink (or "missing" once we know the page is gone), and is
// "resolving" until the lookup lands; non-references show verbatim.
export const getDestinationDisplay = (
  destination: string,
  infoByDestination: Map<string, ResolvedDestination>,
): DestinationDisplay => {
  if (!isReferenceDestination(destination)) {
    return { status: "resolved", label: destination }
  }
  const info = infoByDestination.get(destination)
  if (!info) {
    return { status: "resolving" }
  }
  return info.permalink === null
    ? { status: "missing" }
    : { status: "resolved", label: info.permalink }
}

// Whether the table should flag this destination as leading nowhere (missing or
// not-yet-published). Driven by the server's resolved `warn`; external URLs and
// still-resolving references don't warn.
export const shouldWarnDestination = (
  destination: string,
  infoByDestination: Map<string, ResolvedDestination>,
): boolean => infoByDestination.get(destination)?.warn ?? false
