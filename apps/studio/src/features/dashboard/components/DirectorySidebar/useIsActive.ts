import { ResourceType } from "~prisma/generated/generatedEnums"
import { z } from "zod"

import { useQueryParse } from "~/hooks/useQueryParse"

const siteSchema = z.object({
  folderId: z.string().optional(),
  resourceId: z.string().optional(),
  linkId: z.string().optional(),
  siteId: z.string(),
})

export const useIsActive = (
  currentResourceId: string | null,
  type: ResourceType,
): boolean => {
  const siteProps = useQueryParse(siteSchema)

  switch (type) {
    case ResourceType.RootPage:
      return (
        currentResourceId === null &&
        siteProps.resourceId === undefined &&
        siteProps.folderId === undefined
      )
    case ResourceType.Page:
    case ResourceType.CollectionPage:
    case ResourceType.IndexPage:
      return siteProps.resourceId === currentResourceId
    case ResourceType.Folder:
    case ResourceType.Collection:
      return siteProps.folderId === currentResourceId
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
