import { useRef, useState } from "react"
import { useEventListener, useScript, useTimeout } from "usehooks-ts"

interface UseInteractionScriptLoaderOptions {
  src: string
  timeout?: number
}

export const useInteractionScriptLoader = ({
  src,
  timeout = 3000,
}: UseInteractionScriptLoaderOptions) => {
  const documentRef = useRef<Document | null>(
    typeof document !== "undefined" ? document : null,
  )
  const [shouldLoad, setShouldLoad] = useState(false)

  const triggerLoad = () => setShouldLoad(true)

  useEventListener("scroll", triggerLoad, documentRef, { passive: true })
  useEventListener("click", triggerLoad, documentRef) // as we might need to call preventDefault
  useEventListener("touchstart", triggerLoad, documentRef, { passive: true })

  useTimeout(() => setShouldLoad(true), timeout)

  useScript(shouldLoad ? src : null)
}
