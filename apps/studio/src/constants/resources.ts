import { ResourceType } from "~prisma/generated/generatedEnums"

// only show user-viewable resources (excluding root page, folder meta etc.)
export const USER_VIEWABLE_RESOURCE_TYPES: ResourceType[] = [
  ResourceType.Page,
  ResourceType.Folder,
  ResourceType.Collection,
  ResourceType.CollectionLink,
  ResourceType.CollectionPage,
]

// Resource types that users can create links to
export const USER_LINKABLE_RESOURCE_TYPES = [
  ResourceType.RootPage,
  ResourceType.Folder,
  ResourceType.Page,
  ResourceType.Collection,
  ResourceType.CollectionPage,
] satisfies ResourceType[]
