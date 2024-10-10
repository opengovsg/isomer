import { z } from "zod"

import type { ResourceType } from "~prisma/generated/generatedEnums"
import { useQueryParse } from "~/hooks/useQueryParse"

const siteSchema = z.object({
  folderId: z.string().optional(),
  resourceId: z.string().optional(),
  siteId: z.string(),
})

export const useIsActive = (
  currentResourceId: string | null,
  type: ResourceType,
): boolean => {
  const siteProps = useQueryParse(siteSchema)

  switch (type) {
    case "RootPage":
      return (
        currentResourceId === null &&
        siteProps.resourceId === undefined &&
        siteProps.folderId === undefined
      )
    case "Page":
    case "CollectionPage":
      return siteProps.resourceId === currentResourceId
    case "Folder":
    case "Collection":
      return siteProps.folderId === currentResourceId
  }
}
