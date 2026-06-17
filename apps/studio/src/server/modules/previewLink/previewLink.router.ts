import {
  listPagePreviewLinksSchema,
  mintPreviewLinkSchema,
  revokePreviewLinkSchema,
} from "~/schemas/previewLink"
import { protectedProcedure, router } from "~/server/trpc"
import { getBaseUrl } from "~/utils/getBaseUrl"
import getIP from "~/utils/getClientIp"

import {
  listActivePagePreviewLinks,
  mintPreviewLink,
  revokePreviewLink,
} from "./previewLink.service"

const MINT_RATE_LIMIT_MAX = 20
const MINT_RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000 // 1 hour

export const previewLinkRouter = router({
  mint: protectedProcedure
    .meta({
      rateLimitOptions: {
        max: MINT_RATE_LIMIT_MAX,
        windowMs: MINT_RATE_LIMIT_WINDOW_MS,
      },
    })
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

  revoke: protectedProcedure
    .input(revokePreviewLinkSchema)
    .mutation(async ({ ctx, input }) => {
      const link = await revokePreviewLink({
        userId: ctx.user.id,
        linkId: input.linkId,
        ip: getIP(ctx.req),
      })

      return {
        id: String(link.id),
        revokedAt: link.revokedAt,
      }
    }),

  listForPage: protectedProcedure
    .input(listPagePreviewLinksSchema)
    .query(async ({ ctx, input }) => {
      const rows = await listActivePagePreviewLinks({
        userId: ctx.user.id,
        siteId: input.siteId,
        resourceId: input.resourceId,
      })

      return rows.map(({ link, viewCount, lastViewedAt }) => ({
        id: String(link.id),
        url: `${getBaseUrl()}/preview/${link.token}`,
        label: link.label,
        expiresAt: link.expiresAt,
        createdAt: link.createdAt,
        viewCount,
        lastViewedAt,
      }))
    }),
})
