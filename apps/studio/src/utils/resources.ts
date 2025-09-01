import type { IconType } from "react-icons"
import { ResourceType } from "~prisma/generated/generatedEnums"
import {
  BiCog,
  BiData,
  BiFile,
  BiFolder,
  BiHome,
  BiLink,
  BiSort,
} from "react-icons/bi"

import type { Resource } from "~/server/modules/database"
import { env } from "~/env.mjs"

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
    case ResourceType.CollectionMeta:
      return BiCog
    default:
      const _: never = resourceType // exhaustive check
      return BiData
  }
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

export const getStudioResourceUrl = (resource: Resource): string => {
  const siteUrlPrefix = `${env.NEXT_PUBLIC_APP_URL}/sites/${resource.siteId}`

  switch (resource.type) {
    case ResourceType.RootPage:
      return siteUrlPrefix
    case ResourceType.Page:
    case ResourceType.IndexPage:
    case ResourceType.CollectionPage:
      return `${siteUrlPrefix}/pages/${String(resource.id)}`
    case ResourceType.CollectionLink:
      return `${siteUrlPrefix}/links/${String(resource.id)}`
    case ResourceType.Folder:
      return `${siteUrlPrefix}/folders/${String(resource.id)}`
    case ResourceType.Collection:
      return `${siteUrlPrefix}/collections/${String(resource.id)}`
    case ResourceType.FolderMeta:
    case ResourceType.CollectionMeta:
      return siteUrlPrefix // they aren't accessible by users but we should return a valid url
    default:
      const exhaustiveCheck: never = resource.type
      return exhaustiveCheck
  }
}
