import { describe, expect, it } from "vitest"

import {
  pageCount,
  pageIndexForFirstVisibleCard,
  pageOffsetPx,
  pageStartIndex,
} from "./carousel"

describe("pageCount", () => {
  it("counts pages from the cards that fit in the viewport", () => {
    // Act / Assert
    expect(pageCount({ cardCount: 7, cardsPerPage: 3 })).toBe(3)
    expect(pageCount({ cardCount: 4, cardsPerPage: 3 })).toBe(2)
    expect(pageCount({ cardCount: 3, cardsPerPage: 3 })).toBe(1)
    expect(pageCount({ cardCount: 3, cardsPerPage: 1 })).toBe(3)
    expect(pageCount({ cardCount: 0, cardsPerPage: 3 })).toBe(1)
  })
})

describe("pageOffsetPx", () => {
  const cardWidth = 100
  const gap = 10
  const sliver = 50
  const cardsPerPage = 3
  const viewportWidth =
    cardsPerPage * cardWidth + (cardsPerPage - 1) * gap + sliver

  it("keeps earlier pages on a card boundary and flushes the last page right", () => {
    // Arrange
    const shared = {
      cardsPerPage,
      cardCount: 7,
      cardWidth,
      gap,
      viewportWidth,
    }

    // Act / Assert
    expect(pageOffsetPx({ ...shared, pageIndex: 0 })).toBe(0)
    expect(pageOffsetPx({ ...shared, pageIndex: 1 })).toBe(
      3 * (cardWidth + gap),
    )

    const contentWidth = 7 * cardWidth + 6 * gap
    expect(pageOffsetPx({ ...shared, pageIndex: 2 })).toBe(
      contentWidth - viewportWidth,
    )
    expect(pageStartIndex({ pageIndex: 2, cardsPerPage, cardCount: 7 })).toBe(4)
  })

  it("does not scroll when every card fits", () => {
    // Act / Assert
    expect(
      pageOffsetPx({
        pageIndex: 0,
        cardsPerPage: 3,
        cardCount: 2,
        cardWidth,
        gap,
        viewportWidth,
      }),
    ).toBe(0)
  })
})

describe("pageIndexForFirstVisibleCard", () => {
  it("keeps the page that contains the first visible card when the page size changes", () => {
    // Act / Assert
    expect(
      pageIndexForFirstVisibleCard({
        firstVisibleIndex: 0,
        cardsPerPage: 2,
        cardCount: 7,
      }),
    ).toBe(0)
    expect(
      pageIndexForFirstVisibleCard({
        firstVisibleIndex: 3,
        cardsPerPage: 2,
        cardCount: 7,
      }),
    ).toBe(1)
    expect(
      pageIndexForFirstVisibleCard({
        firstVisibleIndex: 4,
        cardsPerPage: 2,
        cardCount: 7,
      }),
    ).toBe(2)
    expect(
      pageIndexForFirstVisibleCard({
        firstVisibleIndex: 4,
        cardsPerPage: 1,
        cardCount: 7,
      }),
    ).toBe(4)
  })

  it("clamps a desktop last page onto the last tablet page when the ranges overlap", () => {
    // Arrange
    const firstVisible = pageStartIndex({
      pageIndex: 2,
      cardsPerPage: 3,
      cardCount: 7,
    })

    // Act / Assert
    expect(
      pageIndexForFirstVisibleCard({
        firstVisibleIndex: firstVisible,
        cardsPerPage: 2,
        cardCount: 7,
      }),
    ).toBe(2)
    expect(
      pageIndexForFirstVisibleCard({
        firstVisibleIndex: firstVisible,
        cardsPerPage: 2,
        cardCount: 7,
      }),
    ).toBeLessThan(pageCount({ cardCount: 7, cardsPerPage: 2 }))
  })
})
