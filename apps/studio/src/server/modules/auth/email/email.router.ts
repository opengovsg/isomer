/* oxlint-disable typescript/no-unsafe-type-assertion -- server lint cleanup */
import type { SessionData } from "~/lib/types/session"
import type { GrowthbookAttributes } from "~/types/growthbook"
import { TRPCError } from "@trpc/server"
import { pick, set } from "lodash-es"
import { env } from "~/env.mjs"
import { sendLoginAlertEmail } from "~/features/mail/service"
import {
  getIsSingpassDisabledInNonPreview,
  getIsSingpassEnabled,
} from "~/lib/growthbook"
import { sendMail } from "~/lib/mail"
import {
  emailSignInSchema,
  emailVerifyOtpSchema,
} from "~/schemas/auth/email/signIn"
import { publicProcedure, router } from "~/server/trpc"
import { getBaseUrl } from "~/utils/getBaseUrl"

import { db } from "../../database/database"
import { defaultUserSelect } from "../../me/me.select"
import { isUserDeleted } from "../../user/user.service"
import { isEmailWhitelisted } from "../../whitelist/whitelist.service"
import { VerificationError } from "../auth.error"
import { recordUserLogin, verifyToken } from "../auth.service"
import { createTokenHash, createVfnPrefix, createVfnToken } from "../auth.util"
import { upsertUser } from "./email.service"
import { getOtpFingerPrint } from "./utils"

export const emailSessionRouter = router({
  // Generate OTP.
  login: publicProcedure
    .input(emailSignInSchema)
    .meta({ rateLimitOptions: {} })
    .mutation(async ({ ctx, input: { email } }) => {
      const [isWhitelisted, isDeleted] = await Promise.all([
        isEmailWhitelisted(email),
        isUserDeleted(email),
      ])

      // Assert that the user is both whitelisted and not deleted
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

      // Deferred: instead of storing expires, store issuedAt to calculate when the next otp can be re-issued
      // Deferred: rate limit this endpoint also
      const expires = new Date(Date.now() + env.OTP_EXPIRY * 1000)
      const expiryMinutes = Math.floor(env.OTP_EXPIRY / 60)

      const staticOtp = env.DANGEROUSLY_SET_STATIC_OTP
      const isStaticOtp = staticOtp !== undefined

      const token = staticOtp ?? createVfnToken()
      const otpPrefix = isStaticOtp ? "OTP" : createVfnPrefix()
      const hashedToken = createTokenHash(token, email)

      // NOTE: Skip issuing the OTP and saving to database so that
      // the person can never log in to the system user email.
      // Not rejecting error outright so that it looks like the email is valid
      if (email === env.SYSTEM_USER_EMAIL) {
        return {
          email,
          otpPrefix,
        }
      }

      const url = new URL(getBaseUrl())

      ctx.logger.info({ email, expires }, "Generated OTP for email sign in")

      // May have one of them fail,
      // so users may get an email but not have the token saved, but that should be fine.
      try {
        await Promise.all([
          ctx.prisma.verificationToken.upsert({
            create: {
              expires,
              identifier: getOtpFingerPrint(email, ctx.req),
              token: hashedToken,
            },
            update: {
              attempts: 0,
              expires,
              token: hashedToken,
            },
            where: {
              identifier: getOtpFingerPrint(email, ctx.req),
            },
          }),
          isStaticOtp
            ? Promise.resolve()
            : sendMail({
                body: `Your OTP is ${otpPrefix}-<b>${token}</b>. It expires in ${expiryMinutes} minutes.
      Please use this to login to your account.
      <p>If your OTP does not work, please request for a new one.</p>`,
                recipient: email,
                subject: `Sign in to ${url.host}`,
              }),
        ])
      } catch (error) {
        ctx.logger.error(
          { email, error },
          "Failed to send OTP email for email sign in",
        )

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to send OTP email",
        })
      }

      ctx.logger.info(
        { email, expires },
        "OTP token stored and sign-in email sent",
      )
      return { email, otpPrefix }
    }),
  verifyOtp: publicProcedure
    .input(emailVerifyOtpSchema)
    .meta({ rateLimitOptions: {} })
    .mutation(async ({ ctx, input: { email, token } }) => {
      const oldVerificationToken = await ctx.prisma.verificationToken.findFirst(
        {
          where: {
            identifier: getOtpFingerPrint(email, ctx.req),
          },
        },
      )

      if (!oldVerificationToken) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Please request for another OTP",
        })
      }

      try {
        await verifyToken(ctx.prisma, ctx.req, {
          email,
          token,
        })
      } catch (error) {
        if (error instanceof VerificationError) {
          ctx.logger.warn(
            { email, error },
            "Failed to verify OTP for email sign in",
          )

          throw new TRPCError({
            cause: error,
            code: "BAD_REQUEST",
            message: error.message,
          })
        }
        throw error
      }

      const newAttributes: Partial<GrowthbookAttributes> = {
        email,
      }

      await ctx.gb.setAttributes(newAttributes)

      const isSingpassEnabled = getIsSingpassEnabled({ gb: ctx.gb })

      if (!isSingpassEnabled) {
        const user = await db.transaction().execute(async (tx) => {
          const userValue = await upsertUser({
            email,
            tx,
          })

          const userId = userValue.id
          // SAFETY: upsertUser returns a persisted User row whose id matches SessionData["userId"]
          const sessionUserId = userId as NonNullable<SessionData["userId"]>

          await recordUserLogin({
            tx,
            userId: sessionUserId,
            verificationToken: oldVerificationToken,
          })

          ctx.session.userId = sessionUserId
          await ctx.session.save()
          return pick(userValue, defaultUserSelect)
        })

        if (getIsSingpassDisabledInNonPreview({ gb: ctx.gb })) {
          await sendLoginAlertEmail({ recipientEmail: email })
        }

        return {
          ...user,
          requiresSingpass: false,
        }
      }

      const userValue = await db.transaction().execute(
        async (tx) => await upsertUser({ email, tx }),
      )

      ctx.session.userId = undefined
      set(ctx.session, "singpass.sessionState", {
        userId: userValue.id,
        verificationToken: oldVerificationToken,
      })
      await ctx.session.save()

      return {
        ...pick(userValue, defaultUserSelect),
        requiresSingpass: true,
      }
    }),
})
