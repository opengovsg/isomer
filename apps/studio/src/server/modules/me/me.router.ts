import { Prisma } from "@prisma/client"
import { TRPCError } from "@trpc/server"
import { z } from "zod"

import { updateMeSchema } from "~/schemas/me"
import { protectedProcedure, router } from "~/server/trpc"
import { defaultMeSelect } from "./me.select"

export const meRouter = router({
  get: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.user.findUniqueOrThrow({
      where: { id: ctx.user.id },
      select: defaultMeSelect,
    })
  }),
  // TODO: Remove in future PRs since this is unused
  updateAvatar: protectedProcedure
    .input(
      z.object({
        imageKey: z.string().nullish(),
      }),
    )
    .mutation(async ({ ctx }) => {
      return ctx.prisma.user.update({
        where: { id: ctx.user.id },
        data: {},
        select: defaultMeSelect,
      })
    }),
  // TODO: Remove in future PRs since this is unused
  update: protectedProcedure
    .input(updateMeSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        return await ctx.prisma.user.update({
          where: { id: ctx.user.id },
          data: input,
          select: defaultMeSelect,
        })
      } catch (e) {
        if (e instanceof Prisma.PrismaClientKnownRequestError) {
          if (e.code === "P2002") {
            ctx.logger.info("Username conflict", {
              userId: ctx.user.id,
              chosen: input.username,
            })

            throw new TRPCError({
              message: "That username has been taken. Please choose another.",
              code: "CONFLICT",
              cause: e,
            })
          }
        }
        throw e
      }
    }),
})
