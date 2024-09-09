import type { IsomerSchema } from "@opengovsg/isomer-components"
import type { Dispatch, PropsWithChildren, SetStateAction } from "react"
import { createContext, useContext, useState } from "react"

import type { ModifiedAsset } from "~/types/assets"
import { type DrawerState } from "~/types/editorDrawer"

type MetadataEditorType = "hero" | "metadata"

export interface DrawerContextType {
  currActiveIdx: number
  setCurrActiveIdx: (currActiveIdx: number) => void
  drawerState: DrawerState
  setDrawerState: (state: DrawerState) => void
  savedPageState?: IsomerSchema
  setSavedPageState: Dispatch<SetStateAction<IsomerSchema | undefined>>
  previewPageState?: IsomerSchema
  setPreviewPageState: Dispatch<SetStateAction<IsomerSchema | undefined>>
  modifiedAssets: ModifiedAsset[]
  setModifiedAssets: Dispatch<SetStateAction<ModifiedAsset[]>>
  addedBlockIndex: number | null
  setAddedBlockIndex: Dispatch<SetStateAction<number | null>>
  metadataEditorType: MetadataEditorType
  setMetadataEditorType: Dispatch<SetStateAction<MetadataEditorType>>
}
const EditorDrawerContext = createContext<DrawerContextType | null>(null)

export function EditorDrawerProvider({ children }: PropsWithChildren) {
  const [drawerState, setDrawerState] = useState<DrawerState>({
    state: "root",
  })
  // Index of the current block being edited
  const [currActiveIdx, setCurrActiveIdx] = useState<number>(-1)
  // Current saved state of page
  const [savedPageState, setSavedPageState] = useState<
    IsomerSchema | undefined
  >()
  // State of the page to render in the preview
  const [previewPageState, setPreviewPageState] = useState<
    IsomerSchema | undefined
  >()
  // Holding state for images/files that have been modified in the page
  const [modifiedAssets, setModifiedAssets] = useState<ModifiedAsset[]>([])
  const [addedBlockIndex, setAddedBlockIndex] = useState<number | null>(null)
  const [metadataEditorType, setMetadataEditorType] =
    useState<MetadataEditorType>("hero")

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
        metadataEditorType,
        setMetadataEditorType,
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
