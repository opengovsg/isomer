export type Block = {
  text: string
  id: string
}

export type RootDrawerState = {
  state: 'root'
  blocks: Block[]
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
