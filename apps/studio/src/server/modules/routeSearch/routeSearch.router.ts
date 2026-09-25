import { TRPCError } from "@trpc/server"
import { IS_AUDIT_LOG_ENABLED_FEATURE_KEY } from "~/lib/growthbook"
import {
  matchStudioRoutesOutputSchema,
  matchStudioRoutesSchema,
} from "~/schemas/routeSearch"
import { IsomerAdminRole, RoleType } from "~prisma/generated/generatedEnums"

import { protectedProcedure, router } from "../../trpc"
import {
  getResourcePermission,
  isActiveIsomerAdmin,
} from "../permissions/permissions.service"
import { validateUserPermissionsForSite } from "../site/site.service"
import { matchStudioRoutes } from "./routeSearch.service"
import { listAccessibleStudioRoutes } from "./studioRoutes"

export const routeSearchRouter = router({
  match: protectedProcedure
    .input(matchStudioRoutesSchema)
    .output(matchStudioRoutesOutputSchema)
    .meta({ rateLimitOptions: { max: 30, windowMs: 60_000 } })
    .query(async ({ ctx, input }) => {
      const siteId = Number(input.siteId)
      if (!Number.isInteger(siteId)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Enter a valid site",
        })
      }

      await validateUserPermissionsForSite({
        siteId,
        userId: ctx.user.id,
        action: "read",
      })

      const roles = await getResourcePermission({
        userId: ctx.user.id,
        siteId,
      })
      const routes = listAccessibleStudioRoutes({
        isSiteAdmin: roles.some(({ role }) => role === RoleType.Admin),
        isIsomerAdmin: await isActiveIsomerAdmin(ctx.user.id, [
          IsomerAdminRole.Core,
          IsomerAdminRole.Migrator,
        ]),
        isAuditLogEnabled: ctx.gb.isOn(IS_AUDIT_LOG_ENABLED_FEATURE_KEY),
      })

      try {
        return await matchStudioRoutes({
          siteId: input.siteId,
          query: input.query,
          routes,
        })
      } catch (error) {
        ctx.logger.error({ err: error }, "Studio route search failed")
        return []
      }
    }),
})
