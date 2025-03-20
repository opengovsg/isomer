import { protectedProcedure, router } from "~/server/trpc"
import { db } from "../database"
import { defaultUserSelect } from "./me.select"

export const meRouter = router({
  get: protectedProcedure.query(async ({ ctx }) => {
    return db
      .selectFrom("User")
      .select(defaultUserSelect)
      .where("id", "=", ctx.user.id)
      .executeTakeFirstOrThrow()
  }),
})
