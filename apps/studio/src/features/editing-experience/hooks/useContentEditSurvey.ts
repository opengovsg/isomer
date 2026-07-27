import { useStore } from "jotai"
import { isEqual } from "lodash-es"
import { useRouter } from "next/router"
import { useCallback, useEffect, useRef } from "react"
import { useEditorDrawerContext } from "~/contexts/EditorDrawerContext"
import { trackEvent } from "~/lib/intercom"

import type { ContentEditSurveyEvent } from "../constants"
import { hasContentEditAtom } from "../atoms"
import { LEFT_EDITOR_AFTER_EDITING_EVENT } from "../constants"

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

export const useContentEditTracker = (): void => {
  const store = useStore()
  const { previewPageState, drawerState } = useEditorDrawerContext()
  const previousContentRef = useRef(previewPageState.content)

  useEffect(() => {
    const previousContent = previousContentRef.current
    const nextContent = previewPageState.content
    previousContentRef.current = nextContent

    // Raw JSON mode is a staff-only surface excluded from the survey by design
    // (docs/adr/0003-editing-survey-measuring-points.md)
    if (drawerState.state === "rawJsonEditor") return
    if (store.get(hasContentEditAtom)) return
    if (previousContent === nextContent) return
    if (isEqual(previousContent, nextContent)) return

    store.set(hasContentEditAtom, true)
  }, [previewPageState.content, drawerState, store])
}

export const useLeftEditorSurveyTracker = (): void => {
  const router = useRouter()
  const fireContentEditSurveyEvent = useFireContentEditSurveyEvent()

  useEffect(() => {
    // Assumes the editor route has no navigation guard, so routeChangeStart
    // always means the user actually leaves; an unsaved-changes guard that
    // cancels navigation would make this mis-fire.
    const handleRouteChangeStart = () => {
      fireContentEditSurveyEvent(LEFT_EDITOR_AFTER_EDITING_EVENT)
    }

    router.events.on("routeChangeStart", handleRouteChangeStart)
    return () => {
      router.events.off("routeChangeStart", handleRouteChangeStart)
    }
  }, [router.events, fireContentEditSurveyEvent])
}
