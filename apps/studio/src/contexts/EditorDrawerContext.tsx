import type { IsomerSchema } from "@opengovsg/isomer-components"
import type { Dispatch, PropsWithChildren, SetStateAction } from "react"
import { createContext, useContext, useState } from "react"

import type { ModifiedAsset } from "~/types/assets"
import type { ResourceType } from "~prisma/generated/generatedEnums"
import { type DrawerState } from "~/types/editorDrawer"

export interface DrawerContextType
  extends Pick<EditorDrawerProviderProps, "type" | "permalink" | "siteId"> {
  currActiveIdx: number
  setCurrActiveIdx: (currActiveIdx: number) => void
  drawerState: DrawerState
  setDrawerState: (state: DrawerState) => void
  savedPageState: IsomerSchema
  setSavedPageState: Dispatch<SetStateAction<IsomerSchema>>
  previewPageState: IsomerSchema
  setPreviewPageState: Dispatch<SetStateAction<IsomerSchema>>
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
}

export function EditorDrawerProvider({
  children,
  initialPageState,
  type,
  permalink,
  siteId,
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
  const [previewPageState, setPreviewPageState] =
    useState<IsomerSchema>(initialPageState)
  // Holding state for images/files that have been modified in the page
  const [modifiedAssets, setModifiedAssets] = useState<ModifiedAsset[]>([])
  const [addedBlockIndex, setAddedBlockIndex] = useState<number | null>(null)

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
