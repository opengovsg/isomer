import { mintPreviewLinkSchema } from "~/schemas/previewLink"
import { protectedProcedure, router } from "~/server/trpc"
import { getBaseUrl } from "~/utils/getBaseUrl"
import getIP from "~/utils/getClientIp"
import { mintPreviewLink } from "./previewLink.service"

export const previewLinkRouter = router({
  mint: protectedProcedure
    .input(mintPreviewLinkSchema)
    .mutation(async ({ ctx, input }) => {
      const link = await mintPreviewLink({
        userId: ctx.user.id,
        siteId: input.siteId,
        resourceId: input.resourceId,
        expiryChoice: input.expiryChoice,
        label: input.label,
        ip: getIP(ctx.req),
      })

      return {
        token: link.token,
        url: `${getBaseUrl()}/preview/${link.token}`,
        expiresAt: link.expiresAt,
        label: link.label,
      }
    }),
})
