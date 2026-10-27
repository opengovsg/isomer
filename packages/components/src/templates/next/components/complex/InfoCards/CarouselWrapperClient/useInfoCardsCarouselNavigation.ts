import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react"

import {
  pageCount,
  pageIndexForFirstVisibleCard,
  pageOffsetPx,
  pageStartIndex,
} from "../utils/carousel"

interface TrackMetrics {
  cardsPerPage: number
  cardWidth: number
  gap: number
  viewportWidth: number
}

function readTrackMetrics(viewport: HTMLElement): TrackMetrics | null {
  const cardsPerPage = Number.parseInt(
    getComputedStyle(viewport).getPropertyValue("--cards-per-page"),
    10,
  )
  const track = viewport.querySelector<HTMLElement>("[data-track]")
  const slide = viewport.querySelector<HTMLElement>("[data-slide]")
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

export function useInfoCardsCarouselNavigation(cardCount: number) {
  const viewportRef = useRef<HTMLDivElement>(null)
  const previousButtonRef = useRef<HTMLButtonElement>(null)
  const nextButtonRef = useRef<HTMLButtonElement>(null)
  const metricsRef = useRef<TrackMetrics | null>(null)
  const pageIndexRef = useRef(0)
  const [pageIndex, setPageIndex] = useState(0)
  const [offset, setOffset] = useState(0)
  const [cardsPerPage, setCardsPerPage] = useState(0)
  const [ready, setReady] = useState(false)
  const [announcement, setAnnouncement] = useState("")

  const applyPage = useCallback(
    (nextPage: number, metrics: TrackMetrics, announce: boolean) => {
      const pages = pageCount(cardCount, metrics.cardsPerPage)
      const clamped = Math.min(Math.max(nextPage, 0), pages - 1)
      const nextOffset = pageOffsetPx({
        pageIndex: clamped,
        cardsPerPage: metrics.cardsPerPage,
        cardCount,
        cardWidth: metrics.cardWidth,
        gap: metrics.gap,
        viewportWidth: metrics.viewportWidth,
      })
      pageIndexRef.current = clamped
      metricsRef.current = metrics
      setPageIndex(clamped)
      setOffset(nextOffset)
      setCardsPerPage(metrics.cardsPerPage)
      setReady(true)
      if (announce && cardCount > metrics.cardsPerPage) {
        setAnnouncement(`Page ${clamped + 1} of ${pages}`)
      }
    },
    [cardCount],
  )

  useLayoutEffect(() => {
    const viewport = viewportRef.current
    if (!viewport) return

    const measure = () => {
      const metrics = readTrackMetrics(viewport)
      if (!metrics) return

      const previous = metricsRef.current
      let nextPage = pageIndexRef.current
      if (previous && previous.cardsPerPage !== metrics.cardsPerPage) {
        const firstVisible = pageStartIndex(
          pageIndexRef.current,
          previous.cardsPerPage,
          cardCount,
        )
        nextPage = pageIndexForFirstVisibleCard(
          firstVisible,
          metrics.cardsPerPage,
          cardCount,
        )
      }
      applyPage(nextPage, metrics, false)
    }

    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(viewport)
    return () => observer.disconnect()
  }, [applyPage, cardCount])

  const pages = pageCount(cardCount, cardsPerPage)
  const showControls = ready && cardCount > cardsPerPage
  const isLastPage = pageIndex >= pages - 1
  const pageStart = ready
    ? pageStartIndex(pageIndex, cardsPerPage, cardCount)
    : 0

  // A disabled arrow cannot keep focus, so move it to the arrow that still works.
  useEffect(() => {
    if (!showControls) return
    const active = document.activeElement
    if (pageIndex === 0 && active === previousButtonRef.current) {
      nextButtonRef.current?.focus()
    }
    if (isLastPage && active === nextButtonRef.current) {
      previousButtonRef.current?.focus()
    }
  }, [isLastPage, pageIndex, showControls])

  const goToPage = useCallback(
    (nextPage: number) => {
      const metrics = metricsRef.current
      if (!metrics) return
      applyPage(nextPage, metrics, true)
    },
    [applyPage],
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
