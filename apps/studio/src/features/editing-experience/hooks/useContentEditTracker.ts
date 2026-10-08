import { useStore } from "jotai"
import { isEqual } from "lodash-es"
import { useEffect, useRef } from "react"
import { useEditorDrawerContext } from "~/contexts/EditorDrawerContext"

import { hasContentEditAtom } from "../atoms"

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
