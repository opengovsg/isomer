export type ResourceType = "page" | "folder"
export const getResourceType = (parentId: number | null): ResourceType => {
  return parentId ? "page" : "folder"
}
