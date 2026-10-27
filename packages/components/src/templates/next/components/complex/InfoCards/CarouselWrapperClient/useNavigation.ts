import { clamp } from "lodash-es"
import { useCallback, useEffect, useRef, useState } from "react"
import { useResizeObserver } from "usehooks-ts"

import {
  pageCount,
  pageIndexForFirstVisibleCard,
  pageOffsetPx,
  pageStartIndex,
} from "../utils/carousel"
import {
  CARDS_PER_PAGE_CSS_VAR,
  SLIDE_DATA_ATTRIBUTE,
  TRACK_DATA_ATTRIBUTE,
} from "./constants"
import { useDisabledArrowFocus } from "./useDisabledArrowFocus"

interface UseNavigationProps {
  cardCount: number
}

export const useNavigation = ({ cardCount }: UseNavigationProps) => {
  const viewportRef = useRef<HTMLDivElement>(null)
  const [metrics, setMetrics] = useState<TrackMetrics | null>(null)
  // Track the first visible card rather than the page index, so the position
  // survives cardsPerPage changing across breakpoints.
  const [firstVisible, setFirstVisible] = useState(0)
  const [announcement, setAnnouncement] = useState("")

  const measure = useCallback(() => {
    const next = viewportRef.current && readTrackMetrics(viewportRef.current)
    if (next) setMetrics(next)
  }, [])

  useResizeObserver({ ref: viewportRef, onResize: measure })

  // Adding a card doesn't resize the viewport, so re-measure on cardCount too.
  useEffect(measure, [measure, cardCount])

  const cardsPerPage = metrics?.cardsPerPage ?? 0
  const pages = pageCount({ cardCount, cardsPerPage })
  const pageIndex = pageIndexForFirstVisibleCard({
    firstVisibleIndex: Math.min(firstVisible, cardCount - 1),
    cardsPerPage,
    cardCount,
  })
  const offset = metrics
    ? pageOffsetPx({ ...metrics, pageIndex, cardCount })
    : 0
  const showControls = cardsPerPage > 0 && cardCount > cardsPerPage
  const isLastPage = pageIndex >= pages - 1
  const pageStart = pageStartIndex({ pageIndex, cardsPerPage, cardCount })
  const { previousButtonRef, nextButtonRef } = useDisabledArrowFocus({
    showControls,
    pageIndex,
    isLastPage,
  })

  const goToPage = useCallback(
    (nextPage: number) => {
      if (cardsPerPage <= 0) return
      const clamped = clamp(nextPage, 0, pages - 1)
      setFirstVisible(
        pageStartIndex({ pageIndex: clamped, cardsPerPage, cardCount }),
      )
      setAnnouncement(`Page ${clamped + 1} of ${pages}`)
    },
    [cardCount, cardsPerPage, pages],
  )

  return {
    viewportRef,
    previousButtonRef,
    nextButtonRef,
    offset,
    pageIndex,
    pages,
    cardsPerPage,
    showControls,
    isLastPage,
    pageStart,
    announcement,
    goToPage,
  }
}

interface TrackMetrics {
  cardsPerPage: number
  cardWidth: number
  gap: number
  viewportWidth: number
}

const readTrackMetrics = (viewport: HTMLElement): TrackMetrics | null => {
  const cardsPerPage = Number.parseInt(
    getComputedStyle(viewport).getPropertyValue(CARDS_PER_PAGE_CSS_VAR),
    10,
  )
  const track = viewport.querySelector<HTMLElement>(`[${TRACK_DATA_ATTRIBUTE}]`)
  const slide = viewport.querySelector<HTMLElement>(`[${SLIDE_DATA_ATTRIBUTE}]`)
  if (!track || !slide || !Number.isFinite(cardsPerPage) || cardsPerPage <= 0) {
    return null
  }

  const cardWidth = slide.getBoundingClientRect().width
  const gap = Number.parseFloat(getComputedStyle(track).columnGap)
  const viewportWidth = viewport.clientWidth
  if (cardWidth <= 0 || !Number.isFinite(gap) || viewportWidth <= 0) {
    return null
  }

  return { cardsPerPage, cardWidth, gap, viewportWidth }
}
