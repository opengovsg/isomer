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

// Resource types with their own real publish state (a publishedVersionId that
// gets built into a visitor-facing page — mirrors PAGE_RESOURCE_TYPES in
// tooling/build/scripts/publishing/constants.ts) and so can be individually
// published/unpublished via publishPage/unpublishPage. Everything else is
// excluded for its own reason:
// - Folder/Collection never carry their own publishedVersionId — their
//   liveness is entirely their child IndexPage's (already a member of this
//   list), which is why unpublishFolder/unpublishCollection resolve to the
//   child IndexPage rather than needing their own state.
// - FolderMeta/CollectionMeta are internal ordering metadata, never built
//   into a visitor-facing page.
export const PUBLISHABLE_RESOURCE_TYPES = [
  ResourceType.Page,
  ResourceType.CollectionPage,
  ResourceType.IndexPage,
  ResourceType.CollectionLink,
  ResourceType.RootPage,
] satisfies ResourceType[]
