export interface RootDrawerState {
  state: "root"
}

export interface AdminModeDrawerState {
  state: "adminMode"
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

export interface HeroEditorState {
  state: "heroEditor"
}

export type DrawerState =
  | RootDrawerState
  | AdminModeDrawerState
  | AddNewBlockState
  | NativeEditorState
  | ComplexEditorState
  | MetadataEditorState
  | HeroEditorState
