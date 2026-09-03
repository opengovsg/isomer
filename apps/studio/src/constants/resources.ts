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
  ResourceType.Folder,
  ResourceType.Page,
  ResourceType.Collection,
  ResourceType.CollectionPage,
] satisfies ResourceType[]

// Resource types that can be individually unpublished via unpublishPage.
// RootPage is deliberately excluded: unpublishing it would drop its sitemap
// entry and break redirects that resolve to it.
export const UNPUBLISHABLE_RESOURCE_TYPES: ResourceType[] = [
  ResourceType.Page,
  ResourceType.CollectionPage,
  ResourceType.IndexPage,
  ResourceType.CollectionLink,
]

// Folder/Collection ids are also accepted by unpublishPage: they have no
// publishedVersionId of their own, so unpublishPageResource resolves them
// to their child IndexPage first.
export const UNPUBLISHABLE_RESOURCE_TYPES_WITH_CONTAINERS: ResourceType[] = [
  ...UNPUBLISHABLE_RESOURCE_TYPES,
  ResourceType.Folder,
  ResourceType.Collection,
]
