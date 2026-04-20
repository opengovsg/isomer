import type { ResourceType } from "~prisma/generated/generatedEnums"

export interface DeleteResourceModalState {
  title: string
  resourceId: string
  resourceType: ResourceType
}

export interface FolderSettingsModalState {
  folderId: string
}

export interface DuplicatePageModalState {
  siteId: number
  pageId: string
  sourceTitle: string
  sourcePermalink: string
  parentId: string | null
  /** Scope used to invalidate `resource.listWithoutRoot` after duplication. */
  tableScopeResourceId?: number
}
