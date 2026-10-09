export interface ScrollFadeEdges {
  start: boolean
  end: boolean
}

/** No fade when overflow is at most this many pixels (resize handles can add a few). */
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

/** CSS mask: #000 keeps the table visible; transparent lets the editor background show. */
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
