import type { OneGovSgLoginAttempt, SessionData } from "~/lib/types/session"
import { TRPCError } from "@trpc/server"
import { set } from "lodash-es"
import { env } from "~/env.mjs"
import { sendLoginAlertEmail } from "~/features/mail/service"
import {
  getIsSingpassDisabledInNonPreview,
  getIsSingpassEnabled,
} from "~/lib/growthbook"
import { DASHBOARD, SIGN_IN_SINGPASS } from "~/lib/routes"
import { ONE_GOV_SG_LOGIN_METHOD } from "~/lib/types/session"
import {
  oneGovSgCallbackSchema,
  oneGovSgLoginSchema,
} from "~/schemas/auth/oneGovSg"
import { publicProcedure, router } from "~/server/trpc"

import { db } from "../../database"
import { isUserDeleted } from "../../user/user.service"
import { isEmailWhitelisted } from "../../whitelist/whitelist.service"
import { recordUserLogin } from "../auth.service"
import { upsertUser } from "../email/email.service"
import { getOtpFingerPrint } from "../email/utils"
import { clearSessionData } from "../session"
import {
  exchangeCode,
  getAuthorizationUrl,
  isOneGovSgEnabled,
} from "./oneGovSg.service"

const assertOneGovSgEnabled = () => {
  if (!isOneGovSgEnabled()) {
    throw new TRPCError({ code: "NOT_FOUND" })
  }
}

export const oneGovSgRouter = router({
  isEnabled: publicProcedure.query(() => isOneGovSgEnabled()),

  login: publicProcedure
    .input(oneGovSgLoginSchema)
    .meta({ rateLimitOptions: {} })
    .mutation(async ({ ctx, input: { iss } }) => {
      assertOneGovSgEnabled()

      // Validate the launcher's `iss`, never follow it.
      if (iss !== undefined && iss !== env.ONE_GOV_SG_ISSUER) {
        ctx.logger.warn({ iss }, "one.gov.sg launcher issuer mismatch")
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid one.gov.sg issuer",
        })
      }

      // The app launcher can open this while a Studio session is still live.
      if (ctx.session.userId) {
        const user = await db
          .selectFrom("User")
          .select("email")
          .where("id", "=", ctx.session.userId)
          .where("deletedAt", "is", null)
          .executeTakeFirst()

        if (user && (await isEmailWhitelisted(user.email))) {
          return { redirectUrl: DASHBOARD, isLoggedIn: true }
        }
      }

      let authorization: Awaited<ReturnType<typeof getAuthorizationUrl>>
      try {
        authorization = await getAuthorizationUrl()
      } catch (error) {
        ctx.logger.error(
          { err: error },
          "one.gov.sg authorization request failed",
        )
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "one.gov.sg login failed",
          cause: error,
        })
      }

      clearSessionData(ctx.session)
      set(ctx.session, "oneGovSg.sessionState", authorization.session)
      await ctx.session.save()

      return { redirectUrl: authorization.authorizationUrl, isLoggedIn: false }
    }),

  // Check order follows the one.gov.sg integration guide: a forged callback
  // must fail before it can consume the real pending login.
  callback: publicProcedure
    .input(oneGovSgCallbackSchema)
    .query(async ({ ctx, input: { state, iss, code, error } }) => {
      assertOneGovSgEnabled()

      const sessionState = ctx.session.oneGovSg?.sessionState
      if (!sessionState || sessionState.expiresAt < Date.now()) {
        // Expected once per login under Menlo: its cloud browser has no cookie.
        ctx.logger.warn("No pending one.gov.sg login")
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid login flow",
        })
      }

      if (state !== sessionState.state) {
        ctx.logger.warn("one.gov.sg callback state mismatch")
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid login flow",
        })
      }

      if (iss !== env.ONE_GOV_SG_ISSUER) {
        ctx.logger.warn({ iss }, "one.gov.sg callback issuer mismatch")
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid login flow",
        })
      }

      clearSessionData(ctx.session)
      await ctx.session.save()

      if (error) {
        // `error_description` is IdP-controlled text: keep it out of logs and UI.
        ctx.logger.warn({ error }, "one.gov.sg returned an error")
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "one.gov.sg login failed",
        })
      }

      if (!code) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid login flow",
        })
      }

      let email: string
      try {
        email = await exchangeCode({ code, iss, session: sessionState })
      } catch (err) {
        // Do not log `code` or the session state: they complete the exchange.
        ctx.logger.error({ err }, "one.gov.sg token exchange failed")
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "one.gov.sg login failed",
          cause: err,
        })
      }

      // one.gov.sg admits any officer; whether they may use Studio is ours to
      // decide, before anything is provisioned.
      const isWhitelisted = await isEmailWhitelisted(email)
      const isDeleted = await isUserDeleted(email)
      if (!isWhitelisted || isDeleted) {
        ctx.logger.warn(
          { email, isDeleted, isWhitelisted },
          "User is not whitelisted or deleted",
        )
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Email address is not whitelisted",
        })
      }

      await ctx.gb.setAttributes({ email })
      const loginAttempt: OneGovSgLoginAttempt = {
        identifier: getOtpFingerPrint(email, ctx.req),
        method: ONE_GOV_SG_LOGIN_METHOD,
      }

      if (!getIsSingpassEnabled({ gb: ctx.gb })) {
        await db.transaction().execute(async (tx) => {
          const user = await upsertUser({ tx, email })
          const userId = user.id as NonNullable<SessionData["userId"]>

          await recordUserLogin({
            tx,
            userId,
            verificationToken: loginAttempt,
          })

          ctx.session.userId = userId
          await ctx.session.save()
        })

        if (getIsSingpassDisabledInNonPreview({ gb: ctx.gb })) {
          await sendLoginAlertEmail({ recipientEmail: email })
        }

        ctx.logger.info({ email }, "one.gov.sg login completed")
        return { redirectUrl: DASHBOARD, isLoggedIn: true }
      }

      const user = await db
        .transaction()
        .execute((tx) => upsertUser({ tx, email }))

      set(ctx.session, "singpass.sessionState", {
        userId: user.id,
        verificationToken: loginAttempt,
      })
      await ctx.session.save()

      ctx.logger.info({ email }, "one.gov.sg verified, continuing to Singpass")
      return { redirectUrl: SIGN_IN_SINGPASS, isLoggedIn: false }
    }),
})
