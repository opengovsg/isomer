export interface RootDrawerState {
  state: "root";
}

export interface AddNewBlockState {
  state: "addBlock";
}

export interface NativeEditorState {
  state: "nativeEditor";
}

export interface ComplexEditorState {
  state: "complexEditor";
}

export type DrawerState =
  | RootDrawerState
  | AddNewBlockState
  | NativeEditorState
  | ComplexEditorState;
