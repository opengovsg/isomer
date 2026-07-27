import { useMediaQuery } from "usehooks-ts"

// Unable to use breakpoints directly from tailwind config as it may not be available
// depending on how this component is used.
const breakpoints = {
  xs: "576px",
  sm: "640px",
  md: "768px",
  lg: "1024px",
  xl: "1240px",
  "2xl": "1536px",
}

/**
 * Returns `true` if screen size matches the
 * `breakpoint`.
 */
export const useBreakpoint = (breakpoint: keyof typeof breakpoints) => {
  const breakpointQuery = breakpoints[breakpoint]
  // initializeWithValue: false keeps the initial client render in sync with
  // SSR output (both start as false), preventing React hydration mismatches
  // in components like PaginationControls that derive DOM structure from this.
  return useMediaQuery(`(min-width: ${breakpointQuery})`, {
    initializeWithValue: false,
  })
}
