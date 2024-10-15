import type { ResourceType } from "~prisma/generated/generatedEnums"

// Gets the Studio URL subpath for a given resource type
export const getResourceSubpath = (resourceType: ResourceType) => {
  switch (resourceType) {
    case "RootPage":
    case "Page":
    case "IndexPage":
    case "CollectionPage":
      return "pages"
    case "Folder":
      return "folders"
    case "CollectionLink":
      return "file"
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
