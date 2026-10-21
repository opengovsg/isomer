import { useCallback, useEffect, useRef, useState } from "react"
import { HERO_CAROUSEL_SLIDE_LIMITS } from "~/interfaces/complex/Hero"

import { HERO_CAROUSEL_ROTATION_INTERVAL_MS } from "../constants"
import { useHeroCarouselPreview } from "../HeroCarouselPreviewContext"
import { useNavigation } from "./useNavigation"

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)"

type RotationPhase = "pending" | "rotating" | "stopped"

const prefersReducedMotion = () =>
  window.matchMedia(REDUCED_MOTION_QUERY).matches

export const useRotation = (slideCount: number) => {
  const isPreview = useHeroCarouselPreview() !== null
  const { currentIndex, controlProps } = useNavigation(slideCount)
  const [phase, setPhase] = useState<RotationPhase>("pending")
  const [isHoverPaused, setIsHoverPaused] = useState(false)
  const [isDocumentHidden, setIsDocumentHidden] = useState(false)
  const [countdown, setCountdown] = useState<{
    elapsedMs: number
    startedAt: number | null
  }>({ elapsedMs: 0, startedAt: null })
  const elapsedMsRef = useRef(0)
  const runningSinceRef = useRef<number | null>(null)

  const resetElapsed = useCallback(() => {
    elapsedMsRef.current = 0
    runningSinceRef.current = null
  }, [])

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

    setPhase((current) => {
      if (current === "stopped") {
        return "stopped"
      }
      if (isPreview || media.matches) {
        return "stopped"
      }
      return "rotating"
    })

    media.addEventListener("change", stopIfReduced)
    return () => media.removeEventListener("change", stopIfReduced)
  }, [isPreview])

  useEffect(() => {
    const syncVisibility = () => {
      if (document.hidden) {
        resetElapsed()
        setCountdown({ elapsedMs: 0, startedAt: null })
      }
      setIsDocumentHidden(document.hidden)
    }
    syncVisibility()
    document.addEventListener("visibilitychange", syncVisibility)
    return () =>
      document.removeEventListener("visibilitychange", syncVisibility)
  }, [resetElapsed])

  const { onNext, onPrev } = controlProps
  const hasEnoughSlides = slideCount >= HERO_CAROUSEL_SLIDE_LIMITS.minItems
  const canRotate =
    phase === "rotating" && !isDocumentHidden && !isPreview && hasEnoughSlides
  const shouldRun = canRotate && !isHoverPaused

  useEffect(() => {
    if (!shouldRun) {
      return
    }

    const startedAt = performance.now()
    runningSinceRef.current = startedAt
    setCountdown({ elapsedMs: elapsedMsRef.current, startedAt })

    const remaining = Math.max(
      0,
      HERO_CAROUSEL_ROTATION_INTERVAL_MS - elapsedMsRef.current,
    )
    const timeoutId = window.setTimeout(() => {
      elapsedMsRef.current = 0
      runningSinceRef.current = null
      onNext()
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
      setCountdown({ elapsedMs: elapsedMsRef.current, startedAt: null })
    }
  }, [onNext, shouldRun])

  const onUserPrev = useCallback(() => {
    stop()
    onPrev()
  }, [onPrev, stop])

  const onUserNext = useCallback(() => {
    stop()
    onNext()
  }, [onNext, stop])

  const onRotationChange = useCallback(
    (next: "rotating" | "stopped") => {
      if (isPreview) {
        return
      }
      resetElapsed()
      if (next === "rotating") {
        setIsHoverPaused(false)
        setCountdown({ elapsedMs: 0, startedAt: null })
      }
      setPhase(next)
    },
    [resetElapsed, isPreview],
  )

  const showRotationControl = phase !== "pending" && hasEnoughSlides

  return {
    currentIndex,
    showLiveRegion: hasEnoughSlides,
    politeness: phase === "stopped" ? ("polite" as const) : ("off" as const),
    sectionProps: {
      onFocus: stop,
      onPointerEnter: () => setIsHoverPaused(true),
      onPointerLeave: () => setIsHoverPaused(false),
    },
    controlProps: {
      ...controlProps,
      onPrev: onUserPrev,
      onNext: onUserNext,
      rotation: showRotationControl
        ? {
            isRotating: phase === "rotating",
            showCountdown: canRotate,
            elapsedMs: countdown.elapsedMs,
            startedAt: countdown.startedAt,
            onChange: onRotationChange,
          }
        : undefined,
    },
  }
}
