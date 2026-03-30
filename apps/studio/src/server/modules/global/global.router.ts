import { ADMIN_ROLE } from "~/lib/growthbook"
import { setGlobalNotificationSchema } from "~/schemas/global"
import { protectedProcedure, router } from "~/server/trpc"
import { validateUserIsIsomerCoreAdmin } from "../permissions/permissions.service"
import {
  getGlobalNotification,
  publishGlobalNotification,
} from "./global.service"

export const globalRouter = router({
  getNotification: protectedProcedure.query(async ({ ctx }) => {
    await validateUserIsIsomerCoreAdmin({
      userId: ctx.user.id,
      gb: ctx.gb,
      roles: [ADMIN_ROLE.CORE],
    })

    return getGlobalNotification()
  }),

  setNotification: protectedProcedure
    .input(setGlobalNotificationSchema)
    .mutation(async ({ ctx, input: { entries } }) => {
      await validateUserIsIsomerCoreAdmin({
        userId: ctx.user.id,
        gb: ctx.gb,
        roles: [ADMIN_ROLE.CORE],
      })

      await publishGlobalNotification(entries)

      return { success: true }
    }),
})
