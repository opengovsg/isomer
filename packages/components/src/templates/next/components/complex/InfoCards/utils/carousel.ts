export function pageCount({
  cardCount,
  cardsPerPage,
}: {
  cardCount: number
  cardsPerPage: number
}): number {
  if (cardsPerPage <= 0) return 1
  return Math.max(1, Math.ceil(cardCount / cardsPerPage))
}

/** On the last page, the first visible card index is cardCount - cardsPerPage. */
export function pageStartIndex({
  pageIndex,
  cardsPerPage,
  cardCount,
}: {
  pageIndex: number
  cardsPerPage: number
  cardCount: number
}): number {
  const pages = pageCount({ cardCount, cardsPerPage })
  const clampedPage = Math.min(Math.max(pageIndex, 0), pages - 1)
  if (clampedPage === pages - 1) {
    return Math.max(0, cardCount - cardsPerPage)
  }
  return clampedPage * cardsPerPage
}

export function pageOffsetPx({
  pageIndex,
  cardsPerPage,
  cardCount,
  cardWidth,
  gap,
  viewportWidth,
}: {
  pageIndex: number
  cardsPerPage: number
  cardCount: number
  cardWidth: number
  gap: number
  viewportWidth: number
}): number {
  if (cardsPerPage <= 0 || cardCount <= cardsPerPage || cardWidth <= 0) {
    return 0
  }

  const contentWidth = cardCount * cardWidth + (cardCount - 1) * gap
  const maxOffset = Math.max(0, contentWidth - viewportWidth)
  const rawOffset = pageIndex * cardsPerPage * (cardWidth + gap)
  return Math.min(Math.max(0, rawOffset), maxOffset)
}

/** Page whose visible cards include `firstVisibleIndex`, preferring the later page when ranges overlap. */
export function pageIndexForFirstVisibleCard({
  firstVisibleIndex,
  cardsPerPage,
  cardCount,
}: {
  firstVisibleIndex: number
  cardsPerPage: number
  cardCount: number
}): number {
  const pages = pageCount({ cardCount, cardsPerPage })
  let match = 0
  for (let page = 0; page < pages; page++) {
    const start = pageStartIndex({ pageIndex: page, cardsPerPage, cardCount })
    const end = start + cardsPerPage
    if (firstVisibleIndex >= start && firstVisibleIndex < end) {
      match = page
    }
  }
  return match
}
