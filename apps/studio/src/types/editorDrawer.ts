interface RootDrawerState {
  state: "root"
}

interface RawJsonEditorModeDrawerState {
  state: "rawJsonEditor"
}

interface AddNewBlockState {
  state: "addBlock"
}

interface NativeEditorState {
  state: "nativeEditor"
}

interface ComplexEditorState {
  state: "complexEditor"
}

interface MetadataEditorState {
  state: "metadataEditor"
}

interface HeroEditorState {
  state: "heroEditor"
}

interface DatabaseEditorState {
  state: "databaseEditor"
}

export interface CollectionEditorState {
  state: "collectionEditor"
}

interface SiderailOrderingEditorState {
  state: "siderailOrderingEditor"
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
  | CollectionEditorState
  | SiderailOrderingEditorState
