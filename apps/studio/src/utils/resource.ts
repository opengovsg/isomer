import type { ResourceType } from "@prisma/client"

// Gets the Studio URL subpath for a given resource type
export const getResourceSubpath = (resourceType: ResourceType) => {
  switch (resourceType) {
    case "RootPage":
    case "Page":
    case "CollectionPage":
      return "pages"
    case "Folder":
      return "folders"
    case "Collection":
      return "collections"
    default:
      const _: never = resourceType
      return ""
  }
}

export const getLinkToResource = ({
  siteId,
  type,
  resourceId,
}: {
  siteId: string | number
  resourceId: string
  type: ResourceType
}) => {
  return `/sites/${siteId}/${getResourceSubpath(type)}/${resourceId}`
}
