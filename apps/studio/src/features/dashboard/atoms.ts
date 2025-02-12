import { ResourceType } from "~prisma/generated/generatedEnums"
import { atom } from "jotai"

import type {
  DeleteResourceModalState,
  FolderSettingsModalState,
} from "./types"

export const DEFAULT_RESOURCE_MODAL_STATE = {
  isOpen: false,
  title: "",
  resourceId: "",
  resourceType: ResourceType.Collection,
}
export const deleteResourceModalAtom = atom<DeleteResourceModalState>(
  DEFAULT_RESOURCE_MODAL_STATE,
)

export const DEFAULT_FOLDER_SETTINGS_MODAL_STATE = {
  folderId: "",
}
export const folderSettingsModalAtom = atom<FolderSettingsModalState>(
  DEFAULT_FOLDER_SETTINGS_MODAL_STATE,
)

export interface PageSettingsState {
  pageId: string
  type:
    | typeof ResourceType.Page
    | typeof ResourceType.CollectionPage
    | typeof ResourceType.CollectionLink
}
export const pageSettingsModalAtom = atom<null | PageSettingsState>(null)
