import { TRPCError } from "@trpc/server"

import { publicProcedure, router } from "~/server/trpc"
import getIP from "~/utils/getClientIp"
import { logAuthEvent } from "../audit/audit.service"
import { db } from "../database"
import { emailSessionRouter } from "./email/email.router"
import { singpassRouter } from "./singpass/singpass.router"

export const authRouter = router({
  email: emailSessionRouter,
  singpass: singpassRouter,
  logout: publicProcedure.mutation(async ({ ctx }) => {
    ctx.session.destroy()
    const userId = ctx.session.userId

    if (!userId) {
      throw new TRPCError({ code: "BAD_REQUEST" })
    }

    await db.transaction().execute(async (tx) => {
      const user = await db
        .selectFrom("User")
        .where("id", "=", userId)
        .selectAll()
        .executeTakeFirst()

      if (!user) {
        throw new TRPCError({ code: "BAD_REQUEST" })
      }

      const ip = getIP(ctx.req)

      return logAuthEvent(tx, {
        eventType: "Logout",
        delta: {
          before: user,
          after: null,
        },
        by: user,
        ip,
      })
    })

    return { isLoggedIn: false }
  }),
})
