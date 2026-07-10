import { z } from "zod"
import { useQueryParse } from "~/hooks/useQueryParse"
import { ResourceType } from "~prisma/generated/generatedEnums"

const siteSchema = z.object({
  collectionId: z.string().optional(),
  folderId: z.string().optional(),
  resourceId: z.string().optional(),
  linkId: z.string().optional(),
  siteId: z.string(),
})

type SiteProps = z.infer<typeof siteSchema>

export const getIsActiveForResource = (
  currentResourceId: string | null,
  type: ResourceType,
  siteProps: SiteProps,
): boolean => {
  const hasActiveRoutedResource =
    siteProps.collectionId !== undefined ||
    siteProps.folderId !== undefined ||
    siteProps.resourceId !== undefined ||
    siteProps.linkId !== undefined

  switch (type) {
    case ResourceType.RootPage:
      return currentResourceId === null && !hasActiveRoutedResource
    case ResourceType.Page:
    case ResourceType.CollectionPage:
    case ResourceType.IndexPage:
      return siteProps.resourceId === currentResourceId
    case ResourceType.Folder:
      return siteProps.folderId === currentResourceId
    case ResourceType.Collection:
      return siteProps.collectionId === currentResourceId
    case ResourceType.CollectionLink:
      return siteProps.linkId === currentResourceId
    case ResourceType.FolderMeta:
    case ResourceType.CollectionMeta:
      // TODO: Not implemented yet
      return false
    default:
      const _uncaught: never = type
      throw new Error(`Unhandled case for useIsActive`)
  }
}

export const useIsActive = (
  currentResourceId: string | null,
  type: ResourceType,
): boolean => {
  const siteProps = useQueryParse(siteSchema)

  return getIsActiveForResource(currentResourceId, type, siteProps)
}
