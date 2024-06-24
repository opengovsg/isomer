import React, {
  createContext,
  useState,
  useContext,
  useMemo,
  type PropsWithChildren,
} from 'react'
import { type DrawerState } from '~/types/editorDrawer'

export interface DrawerContextType {
  drawerState: DrawerState | null
  setDrawerState: (state: DrawerState) => void
}
const EditorDrawerContext = createContext<DrawerContextType | null>(null)

export function EditorDrawerProvider({ children }: PropsWithChildren) {
  const [drawerState, setDrawerState] = useState<DrawerState | null>(null)

  const value = useMemo(
    () => ({
      drawerState,
      setDrawerState,
    }),
    [drawerState, setDrawerState],
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
