import type { SessionData } from "~/lib/types/session"
import { TRPCError } from "@trpc/server"
import { set } from "lodash-es"
import { getIsSingpassFapi2Enabled } from "~/lib/growthbook"
import { DASHBOARD } from "~/lib/routes"
import {
  singpassCallbackSchema,
  singpassLoginSchema,
} from "~/schemas/auth/singpass"
import { publicProcedure, router } from "~/server/trpc"
import { AuditLogEvent } from "~prisma/generated/generatedEnums"

import { logUserEvent } from "../../audit/audit.service"
import { recordUserLogin } from "../auth.service"
import { generateSessionOptions } from "../session"
import { SingpassRequestError } from "./singpass.error"
import { getAuthorizationUrl, login } from "./singpass.service"
import { singpassLogFields } from "./singpass.utils"

export const singpassRouter = router({
  login: publicProcedure
    .input(singpassLoginSchema)
    .meta({ rateLimitOptions: { max: 10, windowMs: 60 * 1000 } })
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

      // GrowthBook is created per request. The email attribute set during OTP
      // verification does not carry over, so reload it from the user row
      // before evaluating the FAPI flag. Targeting lives in the GrowthBook
      // dashboard (`email` is in the list), not in an in-app allowlist.
      const user = await ctx.db
        .selectFrom("User")
        .select(["email"])
        .where("User.id", "=", userId)
        .executeTakeFirstOrThrow(
          () => new TRPCError({ code: "NOT_FOUND", message: "User not found" }),
        )

      if (!user.email) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid login flow",
        })
      }

      await ctx.gb.setAttributes({ email: user.email })
      const useFapi = getIsSingpassFapi2Enabled({ gb: ctx.gb })

      let authorizationUrl: string
      let session: Awaited<ReturnType<typeof getAuthorizationUrl>>["session"]
      try {
        const authorization = await getAuthorizationUrl({ useFapi })
        authorizationUrl = authorization.authorizationUrl
        session = authorization.session
      } catch (error) {
        if (error instanceof TRPCError) throw error
        ctx.logger.error(
          singpassLogFields(error),
          "Singpass authorization request failed",
        )
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Singpass login failed",
          cause: error instanceof SingpassRequestError ? error : undefined,
        })
      }

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
    .meta({ rateLimitOptions: { max: 10, windowMs: 60 * 1000 } })
    .query(async ({ ctx, input: { state, code, iss } }) => {
      if (!ctx.session.singpass?.sessionState) {
        ctx.logger.warn("No Singpass session state found")

        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid login flow",
        })
      }

      const {
        codeVerifier,
        nonce,
        userId,
        verificationToken,
        state: expectedState,
        useFapi,
        dpopPrivateJwk,
      } = ctx.session.singpass.sessionState

      if (
        !code ||
        !codeVerifier ||
        !nonce ||
        !userId ||
        !expectedState ||
        state !== expectedState ||
        (useFapi && !dpopPrivateJwk)
      ) {
        // Do not log `code`, `codeVerifier`, or `nonce` — they are OAuth/OIDC secrets
        // (PKCE verifier + auth code complete the token exchange; nonce binds the ID token).
        ctx.logger.error(
          {
            hasCode: !!code,
            hasCodeVerifier: !!codeVerifier,
            hasNonce: !!nonce,
            hasState: !!expectedState,
            stateMatches: state === expectedState,
            useFapi: useFapi === true,
            hasDpopKey: !!dpopPrivateJwk,
            userId,
          },
          "Invalid Singpass session state",
        )

        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid Singpass session state",
        })
      }

      let uuid: string | undefined
      try {
        const result = await login({
          code,
          codeVerifier,
          nonce,
          state: expectedState,
          useFapi: useFapi === true,
          dpopPrivateJwk,
          iss,
        })
        uuid = result.uuid
      } catch (error) {
        if (error instanceof TRPCError) throw error
        ctx.logger.error(
          singpassLogFields(error),
          "Failed to login to Singpass",
        )
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Singpass login failed",
          cause: error instanceof SingpassRequestError ? error : undefined,
        })
      }

      if (!uuid) {
        // Do not log `code`, `codeVerifier`, or `nonce` — see comment above.
        ctx.logger.error(
          {
            hasCode: !!code,
            hasCodeVerifier: !!codeVerifier,
            hasNonce: !!nonce,
            state,
          },
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
