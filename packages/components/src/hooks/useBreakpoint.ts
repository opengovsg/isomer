import { useEffect, useState } from "react"
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
  return useMediaQuery(`(min-width: ${breakpointQuery})`)
}

/**
 * Same as useBreakpoint but uses useEffect instead of useLayoutEffect (via useMediaQuery).
 * Returns `undefined` on first render / SSR, then the real value after the first paint.
 * Use when the breakpoint is only for behavior (e.g. closing menus on resize), not for
 * initial layout—avoids blocking the main thread and reduces TBT on static export.
 */
export const useBreakpointDeferred = (
  breakpoint: keyof typeof breakpoints,
): boolean | undefined => {
  const breakpointQuery = breakpoints[breakpoint]
  const query = `(min-width: ${breakpointQuery})`
  const [matches, setMatches] = useState<boolean | undefined>(undefined)

  useEffect(() => {
    if (typeof window === "undefined") return
    const m = window.matchMedia(query)
    setMatches(m.matches)
    const handler = () => setMatches(m.matches)
    m.addEventListener("change", handler)
    return () => m.removeEventListener("change", handler)
  }, [query])

  return matches
}
