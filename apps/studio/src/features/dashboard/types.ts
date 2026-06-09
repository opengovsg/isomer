import type { ResourceType } from "@isomer/db"

export interface DeleteResourceModalState {
  title: string
  resourceId: string
  resourceType: ResourceType
}

export interface FolderSettingsModalState {
  folderId: string
}
