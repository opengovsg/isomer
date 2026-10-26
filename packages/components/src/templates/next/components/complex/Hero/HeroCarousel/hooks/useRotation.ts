import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent,
  type PointerEvent,
} from "react"
import { useIntersectionObserver } from "usehooks-ts"
import { HERO_CAROUSEL_SLIDE_LIMITS } from "~/interfaces/complex/Hero"

import { HERO_CAROUSEL_ROTATION_INTERVAL_MS } from "../constants"
import { useHeroCarouselPreview } from "../HeroCarouselPreviewContext"
import { useNavigation } from "./useNavigation"

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)"
const SWIPE_THRESHOLD_PX = 40

type RotationPhase = "pending" | "rotating" | "stopped"

const prefersReducedMotion = () =>
  window.matchMedia(REDUCED_MOTION_QUERY).matches

export const useRotation = (slideCount: number) => {
  const preview = useHeroCarouselPreview()
  // The preview context syncs the editor slide list. Rotation stays off there
  // unless Studio opts in, which it does for fullscreen.
  const blockRotation = preview !== null && !preview.autoplay
  const blockRotationRef = useRef(blockRotation)
  const { currentIndex, onGoTo } = useNavigation(slideCount)
  const [phase, setPhase] = useState<RotationPhase>("pending")
  const [isDocumentHidden, setIsDocumentHidden] = useState(false)
  const elapsedMsRef = useRef(0)
  const runningSinceRef = useRef<number | null>(null)
  const swipeRef = useRef<{
    pointerId: number
    x: number
    y: number
  } | null>(null)
  const suppressClickRef = useRef(false)

  const resetElapsed = useCallback(() => {
    elapsedMsRef.current = 0
    runningSinceRef.current = null
  }, [])

  // The hook starts "not intersecting". This hero should rotate until the
  // observer reports that it has left the viewport.
  const { ref: sectionRef, isIntersecting } = useIntersectionObserver({
    initialIsIntersecting: true,
    onChange: (intersecting) => {
      if (!intersecting) {
        resetElapsed()
      }
    },
  })
  const isOffscreen = !isIntersecting

  const stop = useCallback(() => {
    resetElapsed()
    setPhase("stopped")
  }, [resetElapsed])

  useEffect(() => {
    const media = window.matchMedia(REDUCED_MOTION_QUERY)
    const stopIfReduced = () => {
      if (prefersReducedMotion()) {
        setPhase("stopped")
      }
    }

    const becameAllowed = blockRotationRef.current && !blockRotation
    blockRotationRef.current = blockRotation

    setPhase((current) => {
      if (blockRotation || media.matches) {
        return "stopped"
      }
      if (becameAllowed || current === "pending") {
        return "rotating"
      }
      return current
    })

    media.addEventListener("change", stopIfReduced)
    return () => media.removeEventListener("change", stopIfReduced)
  }, [blockRotation])

  useEffect(() => {
    const syncVisibility = () => {
      if (document.hidden) {
        resetElapsed()
      }
      setIsDocumentHidden(document.hidden)
    }
    syncVisibility()
    document.addEventListener("visibilitychange", syncVisibility)
    return () =>
      document.removeEventListener("visibilitychange", syncVisibility)
  }, [resetElapsed])

  const hasEnoughSlides = slideCount >= HERO_CAROUSEL_SLIDE_LIMITS.minItems
  const canRotate =
    phase === "rotating" &&
    !isDocumentHidden &&
    !isOffscreen &&
    !blockRotation &&
    hasEnoughSlides

  useEffect(() => {
    if (!canRotate) {
      return
    }

    const startedAt = performance.now()
    runningSinceRef.current = startedAt
    const remaining = Math.max(
      0,
      HERO_CAROUSEL_ROTATION_INTERVAL_MS - elapsedMsRef.current,
    )
    const timeoutId = window.setTimeout(() => {
      elapsedMsRef.current = 0
      runningSinceRef.current = null
      onGoTo((currentIndex + 1) % slideCount)
    }, remaining)

    return () => {
      window.clearTimeout(timeoutId)
      if (runningSinceRef.current === null) {
        return
      }
      elapsedMsRef.current = Math.min(
        HERO_CAROUSEL_ROTATION_INTERVAL_MS,
        elapsedMsRef.current + (performance.now() - runningSinceRef.current),
      )
      runningSinceRef.current = null
    }
  }, [currentIndex, onGoTo, canRotate, slideCount])

  const onUserPrev = useCallback(() => {
    stop()
    if (slideCount === 0) {
      return
    }
    onGoTo((currentIndex - 1 + slideCount) % slideCount)
  }, [currentIndex, onGoTo, slideCount, stop])

  const onUserNext = useCallback(() => {
    stop()
    if (slideCount === 0) {
      return
    }
    onGoTo((currentIndex + 1) % slideCount)
  }, [currentIndex, onGoTo, slideCount, stop])

  const onPointerDown = (event: PointerEvent<HTMLElement>) => {
    suppressClickRef.current = false
    if (event.pointerType === "touch" || event.pointerType === "pen") {
      stop()
    }
    if (event.pointerType !== "touch") {
      swipeRef.current = null
      return
    }
    swipeRef.current = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
    }
  }

  const onPointerUp = (event: PointerEvent<HTMLElement>) => {
    const start = swipeRef.current
    swipeRef.current = null
    if (!start || start.pointerId !== event.pointerId) {
      return
    }

    const dx = event.clientX - start.x
    const dy = event.clientY - start.y
    if (Math.abs(dx) < SWIPE_THRESHOLD_PX || Math.abs(dx) <= Math.abs(dy)) {
      return
    }

    // Block the synthetic click after a swipe so links under the finger do not fire.
    suppressClickRef.current = true
    if (dx < 0) {
      onUserNext()
    } else {
      onUserPrev()
    }
  }

  const onPointerCancel = () => {
    swipeRef.current = null
  }

  const onClickCapture = (event: MouseEvent<HTMLElement>) => {
    if (!suppressClickRef.current) {
      return
    }
    suppressClickRef.current = false
    event.preventDefault()
    event.stopPropagation()
  }

  const onRotationChange = useCallback(
    (next: "rotating" | "stopped") => {
      if (blockRotation) {
        return
      }
      resetElapsed()
      setPhase(next)
    },
    [blockRotation, resetElapsed],
  )

  const showRotationControl = phase !== "pending" && hasEnoughSlides

  return {
    currentIndex,
    showLiveRegion: hasEnoughSlides,
    politeness: phase === "stopped" ? ("polite" as const) : ("off" as const),
    sectionProps: {
      ref: sectionRef,
      // Focus stops rotation, which is how keyboard and screen reader users
      // reach the controls. Hover does not, so the mouse can pass over the hero.
      onFocus: stop,
      onPointerDown,
      onPointerUp,
      onPointerCancel,
      onClickCapture,
    },
    controlProps: {
      slideCount,
      currentIndex,
      onPrev: onUserPrev,
      onNext: onUserNext,
      rotation: showRotationControl
        ? {
            isRotating: phase === "rotating",
            showCountdown: canRotate,
            onChange: onRotationChange,
          }
        : undefined,
    },
  }
}
