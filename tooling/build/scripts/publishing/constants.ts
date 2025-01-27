export const PAGE_RESOURCE_TYPES = [
  "Page",
  "CollectionPage",
  "CollectionLink",
  "IndexPage",
  "RootPage",
] as const
export type PageResourceType = (typeof PAGE_RESOURCE_TYPES)[number]

export const FOLDER_RESOURCE_TYPES = ["Folder", "Collection"] as const
export type FolderResourceType = (typeof FOLDER_RESOURCE_TYPES)[number]
