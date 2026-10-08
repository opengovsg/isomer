import { useRouter } from "next/router"
import { useEffect } from "react"

import { LEFT_EDITOR_AFTER_EDITING_EVENT } from "../constants"
import { useFireContentEditSurveyEvent } from "./useFireContentEditSurveyEvent"

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
