import { useEffect, useState } from "react"
import { useScript, useTimeout } from "usehooks-ts"

interface UseInteractionScriptLoaderOptions {
  src: string
  timeout?: number
}

const hasIdleCallback = typeof requestIdleCallback !== "undefined"

// TBT flags any script blocking the main thread for >50ms.
// Large third-party widgets (Vica ~800kb, AskGov ~250kb) exceed this,
// and Lighthouse still counts them even with async
// Thus we use a custom loader hook to delay loading until after Wogaa has stopped measuring TBT.
export const useInteractionScriptLoader = ({
  src,
  timeout = 3000, // 3 seconds from manual testing
}: UseInteractionScriptLoaderOptions) => {
  const [shouldLoad, setShouldLoad] = useState(false)

  useEffect(() => {
    if (shouldLoad) return

    const triggerLoad = () => setShouldLoad(true)

    // Prefer requestIdleCallback when available
    if (hasIdleCallback) {
      const id = requestIdleCallback(triggerLoad)
      return () => cancelIdleCallback(id)
    }

    // Safari fallback: load on user interaction
    // NOTE: Safari doesn't support requestIdleCallback
    // so we default to loading the script on user interactions
    const events = [
      "scroll",
      "click",
      "touchstart",
      "mousemove",
      "keydown",
    ] as const

    events.forEach((event) => {
      document.addEventListener(event, triggerLoad, {
        passive: event !== "click", // click may need preventDefault
        once: true,
      })
    })

    return () => {
      events.forEach((event) =>
        document.removeEventListener(event, triggerLoad),
      )
    }
  }, [shouldLoad])

  // Fallback timeout - pass null after load to cancel
  useTimeout(() => setShouldLoad(true), timeout)

  // We load the script based on the earlier of:
  // timeout (3s), idle, or user interaction (Safari only)
  useScript(shouldLoad ? src : null)
}
