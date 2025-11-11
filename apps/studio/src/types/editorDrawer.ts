export interface RootDrawerState {
  state: "root"
}

export interface RawJsonEditorModeDrawerState {
  state: "rawJsonEditor"
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

export interface DatabaseEditorState {
  state: "databaseEditor"
}

export type DrawerState =
  | RootDrawerState
  | RawJsonEditorModeDrawerState
  | AddNewBlockState
  | NativeEditorState
  | ComplexEditorState
  | MetadataEditorState
  | DatabaseEditorState
  | HeroEditorState
