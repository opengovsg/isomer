import { protectedProcedure, router } from "~/server/trpc"
import { defaultMeSelect } from "./me.select"

export const meRouter = router({
  get: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.user.findUniqueOrThrow({
      where: { id: ctx.user.id },
      select: defaultMeSelect,
    })
  }),
})
