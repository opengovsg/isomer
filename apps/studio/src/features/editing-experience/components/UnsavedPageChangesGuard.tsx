import { isEqual } from "lodash-es"
import { useRouter } from "next/router"
import { useState } from "react"
import { useEditorDrawerContext } from "~/contexts/EditorDrawerContext"
import { useNavigationEffect } from "~/hooks/useNavigationEffect"

import { DiscardChangesModal } from "./DiscardChangesModal"

export const UnsavedPageChangesGuard = (): JSX.Element => {
  const router = useRouter()
  const {
    previewPageState,
    savedPageState,
    setSavedPageState,
    setPreviewPageState,
    addedBlockIndex,
    setAddedBlockIndex,
    setDrawerState,
    setModifiedAssets,
  } = useEditorDrawerContext()
  const [nextUrl, setNextUrl] = useState("")
  const isOpen = !!nextUrl

  useNavigationEffect({
    isOpen,
    // A new block lands in saved state before it is persisted.
    isDirty:
      addedBlockIndex !== null || !isEqual(previewPageState, savedPageState),
    callback: setNextUrl,
  })

  // Some links (e.g. View history) stay on the editor, so reset its state.
  const handleDiscard = () => {
    const discardedPageState =
      addedBlockIndex === null
        ? savedPageState
        : {
            ...savedPageState,
            content: savedPageState.content.filter(
              (_, index) => index !== addedBlockIndex,
            ),
          }
    setSavedPageState(discardedPageState)
    setPreviewPageState(discardedPageState)
    setAddedBlockIndex(null)
    setModifiedAssets([])
    setDrawerState({ state: "root" })
    setNextUrl("")
    void router.push(nextUrl)
  }

  return (
    <DiscardChangesModal
      isOpen={isOpen}
      onClose={() => setNextUrl("")}
      onDiscard={handleDiscard}
    />
  )
}
