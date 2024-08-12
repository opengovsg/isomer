import { ResourceType } from "~prisma/generated/generatedEnums"

export interface DeleteResourceModalState {
  title: string
  resourceId: string
  resourceType: ResourceType
}

export interface FolderSettingsModalState {
  folderId: string
}
