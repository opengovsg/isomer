"use client"

import type { WogaaSentimentTriggerClientProps } from "~/interfaces"
import { useEffect } from "react"

declare global {
  interface Window {
    wogaaCustom?: {
      sentiments?: {
        showRatingPopup?: () => void
      }
    }
  }
}

export const WOGAA_SENTIMENT_SHOWN_SESSION_KEY = "isomer-wogaa-sentiment-shown"

// wogaa.js is loaded async, so `window.wogaaCustom` may not be ready yet
// when a trigger fires. Poll briefly before giving up.
const WOGAA_READY_POLL_INTERVAL_MS = 500
const WOGAA_READY_MAX_WAIT_MS = 10_000

const hasShownThisSession = () => {
  try {
    return sessionStorage.getItem(WOGAA_SENTIMENT_SHOWN_SESSION_KEY) !== null
  } catch {
    // Storage can be blocked (e.g. some private modes). Fall back to showing
    // at most once per page view, which the `hasFired` guard below handles.
    return false
  }
}

const markShownThisSession = () => {
  try {
    sessionStorage.setItem(WOGAA_SENTIMENT_SHOWN_SESSION_KEY, "true")
  } catch {
    // Ignore, see `hasShownThisSession`
  }
}

const getScrollDepth = () => {
  const { scrollHeight, clientHeight } = document.documentElement
  const scrollTop =
    document.documentElement.scrollTop || document.body.scrollTop

  // Pages that fit on one screen cannot be scrolled; rely on the timer instead
  if (scrollHeight <= clientHeight) {
    return 0
  }

  return (scrollTop + clientHeight) / scrollHeight
}

// Reference: https://docs.wogaa.sg/web-implementation/optional-features/events-triggered-sentiments-pop-up
export const WogaaSentimentTriggerClient = ({
  delayMs,
  scrollDepthThreshold,
}: WogaaSentimentTriggerClientProps) => {
  useEffect(() => {
    if (hasShownThisSession()) {
      return
    }

    let hasFired = false
    let pollIntervalId: ReturnType<typeof setInterval> | undefined

    const showWhenReady = () => {
      const startedAt = Date.now()

      const tryShow = () => {
        const showRatingPopup = window.wogaaCustom?.sentiments?.showRatingPopup

        if (showRatingPopup) {
          clearInterval(pollIntervalId)
          markShownThisSession()
          showRatingPopup()
          return
        }

        if (Date.now() - startedAt >= WOGAA_READY_MAX_WAIT_MS) {
          clearInterval(pollIntervalId)
        }
      }

      pollIntervalId = setInterval(tryShow, WOGAA_READY_POLL_INTERVAL_MS)
      tryShow()
    }

    const fire = () => {
      if (hasFired) {
        return
      }

      hasFired = true
      clearTimeout(timeoutId)
      window.removeEventListener("scroll", handleScroll)
      showWhenReady()
    }

    const handleScroll = () => {
      if (getScrollDepth() >= scrollDepthThreshold) {
        fire()
      }
    }

    const timeoutId = setTimeout(fire, delayMs)
    window.addEventListener("scroll", handleScroll, { passive: true })

    return () => {
      clearTimeout(timeoutId)
      clearInterval(pollIntervalId)
      window.removeEventListener("scroll", handleScroll)
    }
  }, [delayMs, scrollDepthThreshold])

  return null
}
