import { setGlobalNotificationSchema } from "~/schemas/global"
import { protectedProcedure, router } from "~/server/trpc"
import { IsomerAdminRole } from "~prisma/generated/generatedEnums"

import { validateUserIsIsomerAdmin } from "../permissions/permissions.service"
import {
  getGlobalNotification,
  publishGlobalNotification,
} from "./global.service"

export const globalRouter = router({
  getNotification: protectedProcedure.query(async ({ ctx }) => {
    await validateUserIsIsomerAdmin({
      userId: ctx.user.id,
      roles: [IsomerAdminRole.Core],
    })

    return getGlobalNotification()
  }),

  setNotification: protectedProcedure
    .input(setGlobalNotificationSchema)
    .mutation(async ({ ctx, input: { entries } }) => {
      await validateUserIsIsomerAdmin({
        userId: ctx.user.id,
        roles: [IsomerAdminRole.Core],
      })

      await publishGlobalNotification(entries)

      return { success: true }
    }),
})
