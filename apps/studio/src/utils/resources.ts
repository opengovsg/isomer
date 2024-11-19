import type { IconType } from "react-icons"
import { ResourceType } from "~prisma/generated/generatedEnums"
import {
  BiData,
  BiFile,
  BiFolder,
  BiHome,
  BiLink,
  BiSort,
} from "react-icons/bi"

export const isAllowedToHaveChildren = (
  resourceType: ResourceType,
): boolean => {
  return (
    resourceType === ResourceType.Folder ||
    resourceType === ResourceType.Collection ||
    resourceType === ResourceType.RootPage
  )
}

export const getIcon = (resourceType: ResourceType): IconType => {
  switch (resourceType) {
    case ResourceType.Page:
    case ResourceType.IndexPage:
    case ResourceType.CollectionPage:
      return BiFile
    case ResourceType.Folder:
      return BiFolder
    case ResourceType.Collection:
      return BiData
    case ResourceType.CollectionLink:
      return BiLink
    case ResourceType.RootPage:
      return BiHome
    case ResourceType.FolderMeta:
      return BiSort
    default:
      const _: never = resourceType // exhaustive check
      return BiData
  }
}
