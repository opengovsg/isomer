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

export const getUserViewableResourceTypes = (): ResourceType[] => {
  return [
    ResourceType.RootPage,
    ResourceType.Page,
    ResourceType.Folder,
    ResourceType.Collection,
    ResourceType.CollectionLink,
    ResourceType.CollectionPage,
  ]
}
