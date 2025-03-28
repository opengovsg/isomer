import { TRPCError } from "@trpc/server"
import { AuditLogEvent } from "~prisma/generated/generatedEnums"
import set from "lodash/set"

import { DASHBOARD } from "~/lib/routes"
import {
  singpassCallbackSchema,
  singpassLoginSchema,
  singpassStateSchema,
} from "~/schemas/auth/singpass"
import { publicProcedure, router } from "~/server/trpc"
import { safeSchemaJsonParse } from "~/utils/zod"
import { logUserEvent } from "../../audit/audit.service"
import { getAuthorizationUrl, login } from "./singpass.service"

export const singpassRouter = router({
  login: publicProcedure
    .input(singpassLoginSchema)
    .mutation(async ({ ctx, input: { landingUrl } }) => {
      // NOTE: The Singpass login flow is not the first login mechanism that the
      // user encounters, as they should have completed the email OTP
      // verification before this. Hence, the user will need to have a partial
      // user session created before this step.
      if (!ctx.session.singpass?.sessionState?.userId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Email verification has not been completed",
        })
      }

      const { userId } = ctx.session.singpass.sessionState

      ctx.logger.info(
        { landingUrl },
        `Starting Singpass login flow: ${landingUrl.toString()}`,
      )

      const { authorizationUrl, session } = getAuthorizationUrl()

      // Reset session state
      ctx.session.destroy()

      set(ctx.session, "singpass.sessionState", {
        ...session,
        userId,
      })

      await ctx.session.save()

      return {
        redirectUrl: authorizationUrl,
      }
    }),

  callback: publicProcedure
    .input(singpassCallbackSchema)
    .query(async ({ ctx, input: { state, code } }) => {
      if (!ctx.session.singpass?.sessionState) {
        ctx.logger.warn("No Singpass session state found")

        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid login flow",
        })
      }

      const parsedState = safeSchemaJsonParse(singpassStateSchema, state)

      if (!parsedState.success) {
        ctx.logger.error(
          { state, error: parsedState.error },
          "Invalid Singpass callback state",
        )

        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid Singpass callback state",
        })
      }

      const { codeVerifier, nonce, userId } = ctx.session.singpass.sessionState
      ctx.session.destroy()

      if (!code || !codeVerifier || !nonce || !userId) {
        ctx.logger.error(
          { code, codeVerifier, nonce, userId },
          "Invalid Singpass session state",
        )

        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid Singpass session state",
        })
      }

      const { uuid } = await login({ code, codeVerifier, nonce })

      if (!uuid) {
        throw new TRPCError({
          // TODO: Change to SERVICE_UNAVAILABLE when TRPC is upgraded to 11.x
          code: "INTERNAL_SERVER_ERROR",
          message: "Singpass login failed",
        })
      }

      const possibleUser = await ctx.db
        .selectFrom("User")
        .selectAll()
        .where("User.id", "=", userId)
        .executeTakeFirstOrThrow(
          () => new TRPCError({ code: "NOT_FOUND", message: "User not found" }),
        )

      // TODO: Change phone to UUID once the column is available
      if (!possibleUser.phone) {
        await ctx.db.transaction().execute(async (tx) => {
          const newUser = await tx
            .updateTable("User")
            .set({ phone: uuid }) // TODO: Change to UUID
            .where("id", "=", userId)
            .returningAll()
            .executeTakeFirstOrThrow(
              () =>
                new TRPCError({
                  code: "NOT_FOUND",
                  message: "User not found",
                }),
            )

          await logUserEvent(tx, {
            eventType: AuditLogEvent.UserUpdate,
            by: newUser,
            delta: {
              before: possibleUser,
              after: newUser,
            },
          })
        })
        // TODO: Change to UUID
      } else if (possibleUser.phone !== uuid) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Singpass profile does not match user",
        })
      }

      ctx.session.destroy()
      ctx.session.userId = userId
      await ctx.session.save()

      return {
        redirectUrl: DASHBOARD,
      }
    }),
})
