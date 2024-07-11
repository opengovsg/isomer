import { type IsomerComponent } from '@opengovsg/isomer-components'
import {
  createContext,
  useContext,
  useMemo,
  useState,
  type PropsWithChildren,
  type Dispatch,
  type SetStateAction,
} from 'react'
import type { SectionType } from '~/components/PageEditor/types'
import { type DrawerState } from '~/types/editorDrawer'

export interface DrawerContextType {
  currActiveIdx: number
  setCurrActiveIdx: (currActiveIdx: number) => void
  drawerState: DrawerState
  setDrawerState: (state: DrawerState) => void
  pageState: IsomerComponent[]
  setPageState: Dispatch<SetStateAction<IsomerComponent[]>>
  snapshot: IsomerComponent[]
  setSnapshot: (state: IsomerComponent[]) => void
  addedBlock: Exclude<SectionType, "prose">,
  setAddedBlock: (addedBlock: Exclude<SectionType, "prose">) => void
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
  // NOTE: Give a default value first so we don't have to do null checking everytime
  const [addedBlock, setAddedBlock] = useState<Exclude<SectionType, "prose">>("button")

  const value = useMemo(
    () => ({
      currActiveIdx,
      setCurrActiveIdx,
      drawerState,
      setDrawerState,
      pageState,
      setPageState,
      snapshot,
      setSnapshot,
      addedBlock,
      setAddedBlock
    }),
    [currActiveIdx, drawerState, pageState, snapshot, addedBlock],
  )

  return (
    <EditorDrawerContext.Provider value={value}>
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
