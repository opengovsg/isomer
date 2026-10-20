// Single source of truth for Isomer's responsive breakpoints (min-width, px).
//
// Previously duplicated as string maps in two places that could silently drift:
//   - presets/next (Tailwind `screens`)
//   - hooks/useBreakpoint (`matchMedia` queries)
// The per-breakpoint image-crop feature needs the same values in a third place
// (the `<picture>` `media` attributes + per-tier object-position `@media` rules),
// so the duplication is consolidated here.
//
// Mobile-first: these are min-width thresholds, sorted smallest-to-largest.
export const BREAKPOINTS = {
  xs: 576,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1240,
  "2xl": 1536,
} as const

export type Breakpoint = keyof typeof BREAKPOINTS

// `576px` — for Tailwind `screens` and other px-string consumers.
export const breakpointPx = (bp: Breakpoint): string => `${BREAKPOINTS[bp]}px`

// `(min-width: 576px)` — for matchMedia and <source media> / @media rules.
export const mediaMinWidth = (bp: Breakpoint): string =>
  `(min-width: ${BREAKPOINTS[bp]}px)`
