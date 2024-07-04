import { type IsomerComponent } from '@opengovsg/isomer-components'
import {
  createContext,
  useContext,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react'
import { type DrawerState } from '~/types/editorDrawer'
import { type IsomerJsonSchema } from '~/types/schema'

export interface DrawerContextType {
  drawerState: DrawerState
  setDrawerState: (state: DrawerState) => void
  pageState: IsomerComponent[]
  setPageState: (state: IsomerComponent[]) => void
  editorState: IsomerComponent[]
  setEditorState: (state: IsomerComponent[]) => void
  isomerJsonSchema: IsomerJsonSchema | null
  setIsomerJsonSchema: (schema: IsomerJsonSchema) => void
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
  // Isomer page schema
  const [isomerJsonSchema, setIsomerJsonSchema] =
    useState<IsomerJsonSchema | null>(null)

  const value = useMemo(
    () => ({
      drawerState,
      setDrawerState,
      pageState,
      setPageState,
      editorState,
      setEditorState,
      isomerJsonSchema,
      setIsomerJsonSchema,
    }),
    [
      drawerState,
      setDrawerState,
      pageState,
      setPageState,
      editorState,
      setEditorState,
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
      'useEditorDrawer must be used within an EditorDrawerContextProvider',
    )
  }

  return editorDrawerContext
}
