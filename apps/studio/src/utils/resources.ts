import { ResourceType } from "@prisma/client"

export const isAllowedToHaveChildren = (
  resourceType: ResourceType,
): boolean => {
  return (
    resourceType !== ResourceType.Page &&
    resourceType !== ResourceType.CollectionPage
  )
}
