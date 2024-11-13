import { ResourceType } from "~prisma/generated/generatedEnums"

export const isAllowedToHaveChildren = (
  resourceType: ResourceType,
): boolean => {
  return (
    resourceType === ResourceType.Folder ||
    resourceType === ResourceType.Collection ||
    resourceType === ResourceType.RootPage
  )
}

export const getUserSearchViewableResourceTypes = (): ResourceType[] => {
  return [
    ResourceType.Page,
    ResourceType.Folder,
    ResourceType.Collection,
    ResourceType.CollectionLink,
    ResourceType.CollectionPage,
  ]
}
