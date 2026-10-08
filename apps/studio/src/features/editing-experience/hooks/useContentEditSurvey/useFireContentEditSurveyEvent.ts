import { useStore } from "jotai"
import { useCallback } from "react"
import { trackEvent } from "~/lib/intercom"

import type { ContentEditSurveyEvent } from "../../constants"
import { hasContentEditAtom } from "../../atoms"

export const useFireContentEditSurveyEvent = (): ((
  eventName: ContentEditSurveyEvent,
) => void) => {
  const store = useStore()

  return useCallback(
    (eventName: ContentEditSurveyEvent) => {
      if (!store.get(hasContentEditAtom)) return
      store.set(hasContentEditAtom, false)
      trackEvent(eventName)
    },
    [store],
  )
}
