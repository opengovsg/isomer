import type { UploadLinkTarget } from "~/hooks/useUploadAssetMutation"
import { useRouter } from "next/router"
import { z } from "zod"
import { useOptionalSiteWideUploadSource } from "~/contexts/UploadLinkTargetContext"

const resourceRouteSchema = z.object({
  pageId: z.coerce.number().optional(),
  linkId: z.coerce.number().optional(),
})

// Undefined when nothing names a target; callers must then withhold uploads
export const useUploadLinkTarget = (): UploadLinkTarget | undefined => {
  const source = useOptionalSiteWideUploadSource()
  const { query } = useRouter()

  if (source !== undefined) {
    return { source }
  }

  const route = resourceRouteSchema.safeParse(query)
  const resourceId = route.success
    ? (route.data.pageId ?? route.data.linkId)
    : undefined

  return resourceId === undefined
    ? undefined
    : { resourceId: String(resourceId) }
}
