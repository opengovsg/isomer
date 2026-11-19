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
    // beforeHistoryChange, not routeChangeStart: the unsaved-changes guard
    // cancels navigation in routeChangeStart, so only this means the user left.
    const handleBeforeHistoryChange = () => {
      fireContentEditSurveyEvent(LEFT_EDITOR_AFTER_EDITING_EVENT)
    }

    router.events.on("beforeHistoryChange", handleBeforeHistoryChange)
    return () => {
      router.events.off("beforeHistoryChange", handleBeforeHistoryChange)
    }
  }, [router.events, fireContentEditSurveyEvent])
}
