import type { GrowthbookAttributes } from "~/types/growthbook"
import { TRPCError } from "@trpc/server"
import { IS_CENTRAL_NOTIFICATION_BANNER_ENABLED_FEATURE_KEY } from "~/lib/growthbook"
import { setGlobalNotificationSchema } from "~/schemas/global"
import { protectedProcedure, router } from "~/server/trpc"

import {
  getGlobalNotification,
  publishGlobalNotification,
} from "./global.service"

// Both procedures hit S3
const S3_RATE_LIMIT = { max: 10, windowMs: 60_000 }

const centralBannerProcedure = protectedProcedure
  .meta({ rateLimitOptions: S3_RATE_LIMIT })
  .use(async ({ ctx, next }) => {
    // The request-scoped instance has no attributes until we set them
    const attributes: GrowthbookAttributes = { email: ctx.user.email }
    await ctx.gb.setAttributes(attributes)

    if (!ctx.gb.isOn(IS_CENTRAL_NOTIFICATION_BANNER_ENABLED_FEATURE_KEY)) {
      throw new TRPCError({ code: "FORBIDDEN" })
    }

    return next()
  })

export const globalRouter = router({
  getNotification: centralBannerProcedure.query(() => getGlobalNotification()),

  setNotification: centralBannerProcedure
    .input(setGlobalNotificationSchema)
    .mutation(async ({ input }) => {
      await publishGlobalNotification(input)

      return { success: true }
    }),
})
