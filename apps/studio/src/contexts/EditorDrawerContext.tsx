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
  isomerJsonSchema: IsomerJsonSchema | null
  setIsomerJsonSchema: (schema: IsomerJsonSchema) => void
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
  const [isomerJsonSchema, setIsomerJsonSchema] =
    useState<IsomerJsonSchema | null>(null)
  const [currActiveIdx, setCurrActiveIdx] = useState(0)

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
      isomerJsonSchema,
      setIsomerJsonSchema,
    }),
    [
      currActiveIdx,
      setCurrActiveIdx,
      drawerState,
      setDrawerState,
      pageState,
      setPageState,
      snapshot,
      setSnapshot,
      isomerJsonSchema,
      setIsomerJsonSchema,
    ],
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
