import type { IconType } from "react-icons"
import type { Resource } from "~/server/modules/database"
import {
  BiCog,
  BiData,
  BiFile,
  BiFolder,
  BiHome,
  BiLink,
  BiSort,
} from "react-icons/bi"
import { SEARCH_PAGE_PERMALINK } from "~/constants/sitemap"
import { env } from "~/env.mjs"
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

type BareResource = Pick<
  Resource,
  "type" | "id" | "siteId" | "permalink" | "parentId"
>

// NOTE: Assumes that both source and destination already exist
export const isResourceMoveValid = (
  source: BareResource,
  destination: BareResource,
) => {
  // Prevent users from moving the search page (permalink /search, no parent)
  // This is a special page that is used to display the SearchSG results
  if (source.permalink === SEARCH_PAGE_PERMALINK && source.parentId === null) {
    return new Error("The search page cannot be moved")
  }

  if (
    !destination ||
    // NOTE: we only allow moves to folders/root.
    // for moves to root, we only allow this for admin
    (destination.type !== ResourceType.RootPage &&
      destination.type !== ResourceType.Folder &&
      destination.type !== ResourceType.Collection)
  ) {
    return new Error(
      "Please ensure that you are trying to move your resource into a valid destination",
    )
  }

  if (source.parentId === destination.id) {
    return new Error("You cannot move a resource to the same folder")
  }

  // NOTE: If the users are trying to move into a collection,
  // check that the resource first belongs to a collection
  if (
    destination.type !== ResourceType.Collection &&
    (source.type === ResourceType.CollectionPage ||
      source.type === ResourceType.CollectionLink)
  ) {
    return new Error("Collection items can only be moved to another collection")
  }

  if (
    destination.type === ResourceType.Collection &&
    source.type !== ResourceType.CollectionPage &&
    source.type !== ResourceType.CollectionLink
  ) {
    return new Error("Folder items can only be moved to another folder")
  }

  if (source.id === destination.id) {
    return new Error("You cannot move a resource to the same folder")
  }

  if (source.siteId !== destination.siteId) {
    return new Error("You cannot move a resource to a different site")
  }

  return true
}
