import { listVersionHistorySchema } from "~/schemas/version"

import { protectedProcedure, router } from "../../trpc"
import { bulkValidateUserPermissionsForResources } from "../permissions/permissions.service"
import { listVersionHistory } from "./version.service"

export const versionRouter = router({
  listHistory: protectedProcedure
    .input(listVersionHistorySchema)
    .query(async ({ ctx, input: { pageId, siteId, cursor, limit } }) => {
      await bulkValidateUserPermissionsForResources({
        siteId,
        action: "read",
        userId: ctx.user.id,
      })

      return listVersionHistory({
        resourceId: pageId,
        siteId,
        cursor,
        limit,
      })
    }),
})
