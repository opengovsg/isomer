interface RootDrawerState {
  state: "root"
}

interface RawJsonEditorModeDrawerState {
  state: "rawJsonEditor"
}

// Where the editor opened the block picker from
export type BlockAddSource = "top_button" | "empty_state" | "inline"

interface AddNewBlockState {
  state: "addBlock"
  source: BlockAddSource
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
  type: "display" | "filter"
}

interface SiderailOrderingEditorState {
  state: "siderailOrderingEditor"
}

interface HistoryDrawerState {
  state: "history"
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
  | HistoryDrawerState
