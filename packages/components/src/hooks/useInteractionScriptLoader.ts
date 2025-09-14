import { useCallback, useEffect, useRef } from "react"

interface UseInteractionScriptLoaderOptions {
  src: string
  timeout?: number
}

export const useInteractionScriptLoader = ({
  src,
  timeout = 3000,
}: UseInteractionScriptLoaderOptions) => {
  const loadedRef = useRef(false)
  const loadingRef = useRef(false)
  const scriptRef = useRef<HTMLScriptElement | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const listenersRef = useRef<(() => void) | null>(null)

  const clearListenersRef = useCallback(() => {
    if (listenersRef.current) {
      listenersRef.current()
      listenersRef.current = null
    }
  }, [])

  const clearTimeoutRef = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }, [])

  const loadScript = useCallback(() => {
    if (loadedRef.current || loadingRef.current) return

    loadingRef.current = true
    const scriptId = src

    const script = document.createElement("script")
    script.id = scriptId
    script.src = src
    script.async = true
    script.type = "text/javascript"
    script.referrerPolicy = "origin"
    script.onload = () => {
      loadedRef.current = true
      loadingRef.current = false
      scriptRef.current = script
      clearListenersRef()
      clearTimeoutRef()
    }
    script.onerror = () => {
      loadingRef.current = false
      clearListenersRef()
      clearTimeoutRef()
    }
    document.body.appendChild(script)
  }, [src, clearTimeoutRef, clearListenersRef])

  useEffect(() => {
    // to not render during static site generation on the server
    if (typeof window === "undefined") return
    if (loadedRef.current) return

    window.addEventListener("scroll", loadScript, { passive: true })
    window.addEventListener("click", loadScript) // no passive as it might need to call preventDefault
    window.addEventListener("touchstart", loadScript, { passive: true })

    // Fallback timeout to ensure script loads even without interaction
    timeoutRef.current = setTimeout(loadScript, timeout)

    const cleanup = () => {
      window.removeEventListener("scroll", loadScript)
      window.removeEventListener("click", loadScript)
      window.removeEventListener("touchstart", loadScript)
    }
    listenersRef.current = cleanup

    return () => {
      clearTimeoutRef()
      cleanup()
    }
  }, [loadScript, timeout, clearTimeoutRef])
}
