import { type IsomerComponent } from '@opengovsg/isomer-components'
import {
  createContext,
  useContext,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react'
import { type DrawerState } from '~/types/editorDrawer'

export interface DrawerContextType {
  drawerState: DrawerState
  setDrawerState: (state: DrawerState) => void
  pageState: IsomerComponent[]
  setPageState: (state: IsomerComponent[]) => void
  editorState: IsomerComponent[]
  setEditorState: (state: IsomerComponent[]) => void
}
const EditorDrawerContext = createContext<DrawerContextType | null>(null)

export function EditorDrawerProvider({ children }: PropsWithChildren) {
  const [drawerState, setDrawerState] = useState<DrawerState>({
    state: 'root',
  })
  // Current saved state of page
  const [pageState, setPageState] = useState<IsomerComponent[]>([])
  // Current edit view of page
  const [editorState, setEditorState] = useState<IsomerComponent[]>([])

  const value = useMemo(
    () => ({
      drawerState,
      setDrawerState,
      pageState,
      setPageState,
      editorState,
      setEditorState,
    }),
    [
      drawerState,
      setDrawerState,
      pageState,
      setPageState,
      editorState,
      setEditorState,
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
      'useEditorDrawer must be used within an EditorDrawerContextProvider',
    )
  }

  return editorDrawerContext
}
