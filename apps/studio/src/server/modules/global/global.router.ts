import { setGlobalNotificationSchema } from "~/schemas/global"
import { protectedProcedure, router } from "~/server/trpc"
import { IsomerAdminRole } from "~prisma/generated/generatedEnums"

import { validateUserIsIsomerAdmin } from "../permissions/permissions.service"
import {
  getGlobalNotification,
  publishGlobalNotification,
} from "./global.service"

// Both procedures hit S3
const S3_RATE_LIMIT = { max: 10, windowMs: 60_000 }

export const globalRouter = router({
  getNotification: protectedProcedure
    .meta({ rateLimitOptions: S3_RATE_LIMIT })
    .query(async ({ ctx }) => {
      await validateUserIsIsomerAdmin({
        userId: ctx.user.id,
        roles: [IsomerAdminRole.Core],
      })

      return getGlobalNotification()
    }),

  setNotification: protectedProcedure
    .meta({ rateLimitOptions: S3_RATE_LIMIT })
    .input(setGlobalNotificationSchema)
    .mutation(async ({ ctx, input }) => {
      await validateUserIsIsomerAdmin({
        userId: ctx.user.id,
        roles: [IsomerAdminRole.Core],
      })

      await publishGlobalNotification(input)

      return { success: true }
    }),
})
