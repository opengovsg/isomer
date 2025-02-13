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

export const isAllowedToHaveLastEditedText = (
  resourceType: ResourceType,
): boolean => {
  return (
    resourceType === ResourceType.Page ||
    resourceType === ResourceType.CollectionLink ||
    resourceType === ResourceType.CollectionPage
  )
}
