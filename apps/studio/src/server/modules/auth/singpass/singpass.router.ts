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
import {
  clearSessionData,
  generateSessionOptions,
  SINGPASS_COMPLETED_SESSION_TTL_HOURS,
} from "../session"
import {
  singpassErrorCode,
  singpassLoginLogFields,
  singpassLogMessage,
} from "./singpass.observability"
import { getAuthorizationUrl, login } from "./singpass.service"

export const singpassRouter = router({
  login: publicProcedure
    .input(singpassLoginSchema)
    // TODO: Re-enable per-user + IP rate limits once fingerprint can include session userId.
    // .meta({ rateLimitOptions: { max: 10, windowMs: 60 * 1000 } })
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

      await ctx.gb.setAttributes({ email: user.email })
      const useFapi = getIsSingpassFapi2Enabled({ gb: ctx.gb })

      ctx.logger.info(
        singpassLoginLogFields({
          useFapi,
          stage: "authorization",
          authorizationPhase: "start",
          landingUrl,
        }),
        singpassLogMessage({
          useFapi,
          message: `login flow starting: ${landingUrl.toString()}`,
        }),
      )

      ctx.logger.info(
        singpassLoginLogFields({
          useFapi,
          stage: "authorization",
          authorizationPhase: "routed",
        }),
        singpassLogMessage({
          useFapi,
          message: "login routed to authorization flow",
        }),
      )

      let authorizationUrl: string
      let session: Awaited<ReturnType<typeof getAuthorizationUrl>>["session"]
      try {
        const authorization = await getAuthorizationUrl({
          useFapi,
          logger: ctx.logger,
        })
        authorizationUrl = authorization.authorizationUrl
        session = authorization.session
      } catch (error) {
        ctx.logger.error(
          {
            ...singpassLoginLogFields({
              useFapi,
              stage: "authorization",
              outcome: "failure",
            }),
            singpassError: singpassErrorCode(error),
            err: error,
          },
          singpassLogMessage({
            useFapi,
            message: "authorization request failed",
          }),
        )
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Singpass login failed",
          cause: error,
        })
      }

      // Reset session state without destroy() — iron-session v9 treats destroy as terminal.
      clearSessionData(ctx.session)

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
    // TODO: Re-enable per-user + IP rate limits once fingerprint can include session userId.
    // .meta({ rateLimitOptions: { max: 10, windowMs: 60 * 1000 } })
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
            ...singpassLoginLogFields({
              useFapi: useFapi === true,
              stage: "callback",
              outcome: "failure",
              reason: "invalid_session_state",
            }),
            hasCode: !!code,
            hasCodeVerifier: !!codeVerifier,
            hasNonce: !!nonce,
            hasState: !!expectedState,
            stateMatches: state === expectedState,
            hasDpopKey: !!dpopPrivateJwk,
            userId,
          },
          singpassLogMessage({
            useFapi: useFapi === true,
            message: "invalid session state",
          }),
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
          iss,
          useFapi: useFapi === true,
          dpopPrivateJwk,
          logger: ctx.logger,
        })
        uuid = result.uuid
      } catch (error) {
        ctx.logger.error(
          {
            ...singpassLoginLogFields({
              useFapi: useFapi === true,
              stage: "callback",
              outcome: "failure",
              reason: "token_exchange",
            }),
            singpassError: singpassErrorCode(error),
            err: error,
          },
          singpassLogMessage({
            useFapi: useFapi === true,
            message: "login failed",
          }),
        )
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Singpass login failed",
          cause: error,
        })
      }

      if (!uuid) {
        // Do not log `code`, `codeVerifier`, or `nonce` — see comment above.
        ctx.logger.error(
          {
            ...singpassLoginLogFields({
              useFapi: useFapi === true,
              stage: "callback",
              outcome: "failure",
              reason: "missing_uuid",
            }),
            hasCode: !!code,
            hasCodeVerifier: !!codeVerifier,
            hasNonce: !!nonce,
            state,
          },
          singpassLogMessage({
            useFapi: useFapi === true,
            message: "login failed",
          }),
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
        ctx.logger.error(
          singpassLoginLogFields({
            useFapi: useFapi === true,
            stage: "callback",
            outcome: "failure",
            reason: "profile_mismatch",
            userId,
          }),
          singpassLogMessage({
            useFapi: useFapi === true,
            message: "profile does not match user",
          }),
        )
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

      clearSessionData(ctx.session)
      ctx.session.userId = verifiedUserId
      ctx.session.updateConfig(
        generateSessionOptions({
          ttlInHours: SINGPASS_COMPLETED_SESSION_TTL_HOURS,
        }),
      )
      await ctx.session.save()

      ctx.logger.info(
        singpassLoginLogFields({
          useFapi: useFapi === true,
          stage: "callback",
          outcome: "success",
          isNewUser: !possibleUser.singpassUuid,
          userId,
        }),
        singpassLogMessage({
          useFapi: useFapi === true,
          message: "login completed",
        }),
      )

      return {
        isNewUser: !possibleUser.singpassUuid,
        redirectUrl: DASHBOARD,
      }
    }),
})
