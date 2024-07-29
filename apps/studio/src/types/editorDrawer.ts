export interface RootDrawerState {
  state: "root"
}

export interface AddNewBlockState {
  state: "addBlock"
}

export interface NativeEditorState {
  state: "nativeEditor"
}

export interface ComplexEditorState {
  state: "complexEditor"
}

export interface MetadataEditorState {
  state: "metadataEditor"
}

export type DrawerState =
  | RootDrawerState
  | AddNewBlockState
  | NativeEditorState
  | ComplexEditorState
  | MetadataEditorState
