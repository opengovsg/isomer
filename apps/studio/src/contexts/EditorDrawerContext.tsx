import { IsomerComponent } from "@opengovsg/isomer-components"
import type { Dispatch, PropsWithChildren, SetStateAction } from "react"
import { createContext, useContext, useState } from "react"

import type { SectionType } from "~/components/PageEditor/types"
import { type DrawerState } from "~/types/editorDrawer"

export interface DrawerContextType {
  currActiveIdx: number
  setCurrActiveIdx: (currActiveIdx: number) => void
  drawerState: DrawerState
  setDrawerState: (state: DrawerState) => void
  addedBlock: Exclude<SectionType, "prose">
  setAddedBlock: (addedBlock: Exclude<SectionType, "prose">) => void
  savedPageState: IsomerComponent[]
  setSavedPageState: Dispatch<SetStateAction<IsomerComponent[]>>
  previewPageState: IsomerComponent[]
  setPreviewPageState: Dispatch<SetStateAction<IsomerComponent[]>>
}
const EditorDrawerContext = createContext<DrawerContextType | null>(null)

export function EditorDrawerProvider({ children }: PropsWithChildren) {
  const [drawerState, setDrawerState] = useState<DrawerState>({
    state: "root",
  })
  // Index of the current block being edited
  const [currActiveIdx, setCurrActiveIdx] = useState<number>(-1)
  // Current saved state of page
  const [savedPageState, setSavedPageState] = useState<IsomerComponent[]>([])
  // State of the page to render in the preview
  const [previewPageState, setPreviewPageState] = useState<IsomerComponent[]>(
    [],
  )
  const [addedBlock, setAddedBlock] = useState<Exclude<SectionType, "prose">>("button")

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
        addedBlock,
        setAddedBlock
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
