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
// Everything else is excluded for its own reason:
// - FolderMeta/CollectionMeta are internal ordering metadata, never built
//   into a visitor-facing page.
// - RootPage has a real publish state and can be published via publishPage,
//   but is deliberately excluded here: the static-site build has no real
//   "unpublished homepage" case. Unpublishing it drops the RootPage's sitemap
//   entry entirely (no schema/_index.json gets written for `/`) and silently
//   drops any redirect whose destination resolves to the RootPage
//   (tooling/build/scripts/publishing/queries.ts GET_REDIRECTS requires a
//   non-null publishedVersionId to resolve a [resource:...] target).
export const UNPUBLISHABLE_RESOURCE_TYPES: ResourceType[] = [
  ResourceType.Page,
  ResourceType.CollectionPage,
  ResourceType.IndexPage,
  ResourceType.CollectionLink,
]

// Folder/Collection ids are also accepted by unpublishPage: they never carry
// their own publishedVersionId — their liveness is entirely their child
// IndexPage's — so unpublishPageResource resolves them to that child
// IndexPage before doing anything else.
export const UNPUBLISHABLE_RESOURCE_TYPES_WITH_CONTAINERS: ResourceType[] = [
  ...UNPUBLISHABLE_RESOURCE_TYPES,
  ResourceType.Folder,
  ResourceType.Collection,
]
