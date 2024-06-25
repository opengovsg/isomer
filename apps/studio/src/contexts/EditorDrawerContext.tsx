import React, {
  createContext,
  useState,
  useContext,
  useMemo,
  type PropsWithChildren,
} from 'react'
import { type Block, type DrawerState } from '~/types/editorDrawer'

export interface DrawerContextType {
  drawerState: DrawerState
  setDrawerState: (state: DrawerState) => void
  pageState: Block[]
  setPageState: (state: Block[]) => void
  editorState: Block[]
  setEditorState: (state: Block[]) => void
}
const EditorDrawerContext = createContext<DrawerContextType | null>(null)

export function EditorDrawerProvider({ children }: PropsWithChildren) {
  const [drawerState, setDrawerState] = useState<DrawerState>({
    state: 'root',
  })
  // Current saved state of page
  const [pageState, setPageState] = useState<Block[]>([])
  // Current edit view of page
  const [editorState, setEditorState] = useState<Block[]>([])

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
