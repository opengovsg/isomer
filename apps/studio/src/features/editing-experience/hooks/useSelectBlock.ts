import { useCallback } from "react"
import { useEditorDrawerContext } from "~/contexts/EditorDrawerContext"
import { scrollToBlockElement } from "~/features/editing-experience/utils/scrollToBlockElement"
import { type DrawerState } from "~/types/editorDrawer"

// Marks a block as active, switches the drawer to its editor, and scrolls
// the preview to it — the combination every "click a block" handler needs.
export const useSelectBlock = () => {
  const {
    setCurrActiveIdx,
    setDrawerState,
    setFlashBlockIndex,
    iframeDocument,
  } = useEditorDrawerContext()

  return useCallback(
    (index: number, drawerState: DrawerState) => {
      setCurrActiveIdx(index)
      setDrawerState(drawerState)
      setFlashBlockIndex(index)
      scrollToBlockElement({
        iframeDocument,
        index,
      })
    },
    [setCurrActiveIdx, setDrawerState, setFlashBlockIndex, iframeDocument],
  )
}
