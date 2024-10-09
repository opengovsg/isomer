import type { IsomerSchema } from "@opengovsg/isomer-components"
import type { Dispatch, PropsWithChildren, SetStateAction } from "react"
import { createContext, useCallback, useContext, useState } from "react"
import { flushSync } from "react-dom"

import type { ModifiedAsset } from "~/types/assets"
import type { ResourceType } from "~prisma/generated/generatedEnums"
import { type DrawerState } from "~/types/editorDrawer"

export interface DrawerContextType
  extends Pick<
    EditorDrawerProviderProps,
    "type" | "permalink" | "siteId" | "pageId" | "updatedAt" | "title"
  > {
  currActiveIdx: number
  setCurrActiveIdx: (currActiveIdx: number) => void
  drawerState: DrawerState
  setDrawerState: (state: DrawerState) => void
  savedPageState: IsomerSchema
  setSavedPageState: Dispatch<SetStateAction<IsomerSchema>>
  previewPageState: IsomerSchema
  setPreviewPageState: (nextState: SetStateAction<IsomerSchema>) => void
  modifiedAssets: ModifiedAsset[]
  setModifiedAssets: Dispatch<SetStateAction<ModifiedAsset[]>>
  addedBlockIndex: number | null
  setAddedBlockIndex: Dispatch<SetStateAction<number | null>>
}
const EditorDrawerContext = createContext<DrawerContextType | null>(null)

interface EditorDrawerProviderProps extends PropsWithChildren {
  initialPageState: IsomerSchema
  type: ResourceType
  permalink: string
  siteId: number
  pageId: number
  updatedAt: Date
  title: string
}

export function EditorDrawerProvider({
  children,
  initialPageState,
  type,
  permalink,
  siteId,
  pageId,
  updatedAt,
  title,
}: EditorDrawerProviderProps) {
  const [drawerState, setDrawerState] = useState<DrawerState>({
    state: "root",
  })
  // Index of the current block being edited
  const [currActiveIdx, setCurrActiveIdx] = useState<number>(-1)
  // Current saved state of page
  const [savedPageState, setSavedPageState] =
    useState<IsomerSchema>(initialPageState)
  // State of the page to render in the preview
  const [previewPageState, _setPreviewPageState] =
    useState<IsomerSchema>(initialPageState)
  // Holding state for images/files that have been modified in the page
  const [modifiedAssets, setModifiedAssets] = useState<ModifiedAsset[]>([])
  const [addedBlockIndex, setAddedBlockIndex] = useState<number | null>(null)

  const setPreviewPageState = useCallback(
    (previewPageState: SetStateAction<IsomerSchema>) => {
      // NOTE: We need this because our `JSONForms` instance writes to this state
      // which is immediately `setState` here.
      // This causes a skipped render issue, where the earlier update might get skipped
      // and lead to the preview updated without any new content.
      // `flushSync` causes react to flush the callbacks and trigger the updates together
      // which will cause the updates to go through successfully rather than being dropped.
      flushSync(() => {
        _setPreviewPageState(previewPageState)
      })
    },
    [],
  )

  return (
    <EditorDrawerContext.Provider
      value={{
        currActiveIdx,
        setCurrActiveIdx,
        drawerState,
        setDrawerState,
        savedPageState,
        setSavedPageState,
        previewPageState,
        setPreviewPageState,
        modifiedAssets,
        setModifiedAssets,
        addedBlockIndex,
        setAddedBlockIndex,
        type,
        permalink,
        siteId,
        pageId,
        updatedAt,
        title,
      }}
    >
      {children}
    </EditorDrawerContext.Provider>
  )
}

export const useEditorDrawerContext = () => {
  const editorDrawerContext = useContext(EditorDrawerContext)

  if (!editorDrawerContext) {
    throw new Error(
      "useEditorDrawer must be used within an EditorDrawerContextProvider",
    )
  }

  return editorDrawerContext
}
