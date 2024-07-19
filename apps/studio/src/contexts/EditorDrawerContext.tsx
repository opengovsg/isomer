import type { Dispatch, PropsWithChildren, SetStateAction } from "react"
import { createContext, useContext, useState } from "react"
import { type IsomerComponent } from "@opengovsg/isomer-components"

import { type DrawerState } from "~/types/editorDrawer"

export interface DrawerContextType {
  currActiveIdx: number
  setCurrActiveIdx: (currActiveIdx: number) => void
  drawerState: DrawerState
  setDrawerState: (state: DrawerState) => void
  pageState: IsomerComponent[]
  setPageState: Dispatch<SetStateAction<IsomerComponent[]>>
  snapshot: IsomerComponent[]
  setSnapshot: (state: IsomerComponent[]) => void
}
const EditorDrawerContext = createContext<DrawerContextType | null>(null)

export function EditorDrawerProvider({ children }: PropsWithChildren) {
  const [drawerState, setDrawerState] = useState<DrawerState>({
    state: "root",
  })
  // Current saved state of page
  const [pageState, setPageState] = useState<IsomerComponent[]>([])
  // Current edit view of page
  const [snapshot, setSnapshot] = useState<IsomerComponent[]>([])
  // Isomer page schema
  const [currActiveIdx, setCurrActiveIdx] = useState(0)

  return (
    <EditorDrawerContext.Provider
      value={{
        currActiveIdx,
        setCurrActiveIdx,
        drawerState,
        setDrawerState,
        pageState,
        setPageState,
        snapshot,
        setSnapshot,
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
