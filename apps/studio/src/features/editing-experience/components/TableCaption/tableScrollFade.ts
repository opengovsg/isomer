export interface ScrollFadeEdges {
  /** Hidden content sits before the visible area. */
  start: boolean
  /** Hidden content sits after the visible area. */
  end: boolean
}

/** Ignore hairline overflow so a 1px rounding error does not paint a fade. */
const OVERFLOW_THRESHOLD_PX = 8
const EDGE_EPSILON_PX = 1

export const TABLE_SCROLL_FADE_WIDTH = "1.5rem"

export const scrollFadeEdges = ({
  scrollLeft,
  scrollWidth,
  clientWidth,
}: {
  scrollLeft: number
  scrollWidth: number
  clientWidth: number
}): ScrollFadeEdges => {
  const hidden = scrollWidth - clientWidth
  if (hidden <= OVERFLOW_THRESHOLD_PX) return { start: false, end: false }
  return {
    start: scrollLeft > EDGE_EPSILON_PX,
    end: scrollLeft < hidden - EDGE_EPSILON_PX,
  }
}

/**
 * Mask, not a painted gradient: transparent pixels show the editor surface,
 * so the fade reads as white on the light canvas and dark on a dark one.
 */
export const tableScrollFadeMask = ({
  start,
  end,
}: ScrollFadeEdges): string | undefined => {
  const fade = TABLE_SCROLL_FADE_WIDTH
  if (start && end) {
    return `linear-gradient(to right, transparent, #000 ${fade}, #000 calc(100% - ${fade}), transparent)`
  }
  if (end) {
    return `linear-gradient(to right, #000 calc(100% - ${fade}), transparent)`
  }
  if (start) {
    return `linear-gradient(to right, transparent, #000 ${fade})`
  }
  return undefined
}

export const tableScrollFadeLabel = ({
  start,
  end,
}: ScrollFadeEdges): "start" | "end" | "both" | undefined => {
  if (start && end) return "both"
  if (start) return "start"
  if (end) return "end"
  return undefined
}
