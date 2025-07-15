import { TRPCError } from "@trpc/server"
import { AuditLogEvent } from "~prisma/generated/generatedEnums"
import set from "lodash/set"

import type { SessionData } from "~/lib/types/session"
import { DASHBOARD } from "~/lib/routes"
import {
  singpassCallbackSchema,
  singpassLoginSchema,
} from "~/schemas/auth/singpass"
import { publicProcedure, router } from "~/server/trpc"
import { logUserEvent } from "../../audit/audit.service"
import { recordUserLogin } from "../auth.service"
import { generateSessionOptions } from "../session"
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

      const { userId, verificationToken } = ctx.session.singpass.sessionState

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
        verificationToken,
      })

      await ctx.session.save()

      return {
        redirectUrl: authorizationUrl,
      }
    }),

  getUserProps: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.session.singpass?.sessionState) {
      ctx.logger.warn("No Singpass session state found")

      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Invalid login flow",
      })
    }

    const { userId } = ctx.session.singpass.sessionState

    const user = await ctx.db
      .selectFrom("User")
      .select(["User.name", "User.email", "User.singpassUuid"])
      .where("User.id", "=", userId)
      .executeTakeFirstOrThrow(
        () => new TRPCError({ code: "NOT_FOUND", message: "User not found" }),
      )

    return {
      name: user.name || user.email,
      isNewUser: !user.singpassUuid,
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

      const { codeVerifier, nonce, userId, verificationToken } =
        ctx.session.singpass.sessionState

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

      const { uuid } = await login({
        code,
        codeVerifier,
        nonce,
        state,
      })

      if (!uuid) {
        ctx.logger.error(
          { code, codeVerifier, nonce, state },
          "Failed to login to Singpass",
        )

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

      if (!possibleUser.singpassUuid) {
        await ctx.db.transaction().execute(async (tx) => {
          const newUser = await tx
            .updateTable("User")
            .set({ singpassUuid: uuid })
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
      } else if (possibleUser.singpassUuid !== uuid) {
        throw new TRPCError({
          // NOTE: We use NOT_FOUND here as UNAUTHORIZED would cause the session
          // state to be destroyed by the error handler middleware
          code: "NOT_FOUND",
          message: "Singpass profile does not match user",
        })
      }

      const verifiedUserId = possibleUser.id as NonNullable<
        SessionData["userId"]
      >

      await ctx.db.transaction().execute(async (tx) => {
        await recordUserLogin({
          tx,
          userId: verifiedUserId,
          verificationToken,
        })
      })

      ctx.session.destroy()
      ctx.session.userId = verifiedUserId
      ctx.session.updateConfig(generateSessionOptions({ ttlInHours: 12 }))
      await ctx.session.save()

      return {
        isNewUser: !possibleUser.singpassUuid,
        redirectUrl: DASHBOARD,
      }
    }),
})
