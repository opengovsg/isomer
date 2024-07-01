export type RootDrawerState = {
  state: 'root'
}

export type AddNewBlockState = {
  state: 'addBlock'
}

export type NativeEditorState = {
  state: 'nativeEditor'
}

export type ComplexEditorState = {
  state: 'complexEditor'
}

export type DrawerState =
  | RootDrawerState
  | AddNewBlockState
  | NativeEditorState
  | ComplexEditorState
