import { ResourceType } from "~prisma/generated/generatedEnums"

// Gets the Studio URL subpath for a given resource type
export const getResourceSubpath = (resourceType: ResourceType) => {
  switch (resourceType) {
    case ResourceType.RootPage:
    case ResourceType.Page:
    case ResourceType.IndexPage:
    case ResourceType.CollectionPage:
      return "pages"
    case ResourceType.Folder:
      return "folders"
    case ResourceType.CollectionLink:
      return "links"
    case ResourceType.Collection:
      return "collections"
    case ResourceType.FolderMeta:
    case ResourceType.CollectionMeta:
      // TODO: Not implemented yet
      return ""
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

export const getFolderHref = (siteId: string, folderId: string) => {
  return `/sites/${siteId}/folders/${folderId}`
}

export const getCollectionHref = (siteId: string, collectionId: string) => {
  return `/sites/${siteId}/collections/${collectionId}`
}
