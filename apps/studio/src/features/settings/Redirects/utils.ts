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

// Shown in place of a reference destination whose page has since been deleted.
export const MISSING_PAGE_LABEL = "Page no longer exists"

// Internal-page destinations are stored as "[resource:siteId:resourceId]"
// references; literal paths and external URLs are not.
export const isReferenceDestination = (destination: string): boolean =>
  REFERENCE_LINK_REGEX.test(destination)

// Turns a stored destination into a user-facing label: a reference becomes the
// resolved permalink (or MISSING_PAGE_LABEL); non-references show verbatim.
// Returns null while a reference is still resolving (caller shows a loader).
export const getDestinationLabel = (
  destination: string,
  permalinkByReference: Map<string, string | null>,
): string | null => {
  if (!isReferenceDestination(destination)) {
    return destination
  }
  if (!permalinkByReference.has(destination)) {
    return null
  }
  return permalinkByReference.get(destination) ?? MISSING_PAGE_LABEL
}
