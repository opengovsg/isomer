import { useMediaQuery } from "usehooks-ts"

import type { Breakpoint } from "~/constants/breakpoints"
import { mediaMinWidth } from "~/constants/breakpoints"

/**
 * Returns `true` if the screen is at least `breakpoint` wide (min-width).
 */
export const useBreakpoint = (breakpoint: Breakpoint) => {
  // initializeWithValue: false keeps the initial client render in sync with
  // SSR output (both start as false), preventing React hydration mismatches
  // in components like PaginationControls that derive DOM structure from this.
  return useMediaQuery(mediaMinWidth(breakpoint), {
    initializeWithValue: false,
  })
}
