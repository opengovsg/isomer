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
    if (loadedRef.current) return

    const scriptId = src

    const existingScript = document.getElementById(scriptId)
    if (existingScript) {
      existingScript.remove()
    }

    const script = document.createElement("script")
    script.id = scriptId
    script.src = src
    script.async = true
    script.type = "text/javascript"
    script.referrerPolicy = "origin"
    script.onload = () => {
      loadedRef.current = true
      scriptRef.current = script
      clearListenersRef()
      clearTimeoutRef()
    }
    script.onerror = () => {
      clearListenersRef()
      clearTimeoutRef()
    }
    document.body.appendChild(script)
  }, [src, clearTimeoutRef, clearListenersRef])

  useEffect(() => {
    // to not render during static site generation on the server
    if (typeof window === "undefined") return
    if (loadedRef.current) return

    window.addEventListener("scroll", loadScript)
    window.addEventListener("click", loadScript)
    window.addEventListener("touchstart", loadScript)

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
