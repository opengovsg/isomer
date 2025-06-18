import { TRPCError } from "@trpc/server"
import pick from "lodash/pick"
import set from "lodash/set"

import type { SessionData } from "~/lib/types/session"
import type { GrowthbookAttributes } from "~/types/growthbook"
import { env } from "~/env.mjs"
import { IS_SINGPASS_ENABLED_FEATURE_KEY } from "~/lib/growthbook"
import { sendMail } from "~/lib/mail"
import {
  emailSignInSchema,
  emailVerifyOtpSchema,
} from "~/schemas/auth/email/sign-in"
import { publicProcedure, router } from "~/server/trpc"
import { getBaseUrl } from "~/utils/getBaseUrl"
import { db } from "../../database"
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
      const isWhitelisted = await isEmailWhitelisted(email)
      const isDeleted = await isUserDeleted(email)

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

      // TODO: instead of storing expires, store issuedAt to calculate when the next otp can be re-issued
      // TODO: rate limit this endpoint also
      const expires = new Date(Date.now() + env.OTP_EXPIRY * 1000)
      const expiryMinutes = Math.floor(env.OTP_EXPIRY / 60)
      const token = createVfnToken()
      const otpPrefix = createVfnPrefix()
      const hashedToken = createTokenHash(token, email)

      const url = new URL(getBaseUrl())

      ctx.logger.info({ email, expires }, "Generated OTP for email sign in")

      // May have one of them fail,
      // so users may get an email but not have the token saved, but that should be fine.
      try {
        await Promise.all([
          ctx.prisma.verificationToken.upsert({
            where: {
              identifier: getOtpFingerPrint(email, ctx.req),
            },
            update: {
              token: hashedToken,
              expires,
              attempts: 0,
            },
            create: {
              identifier: getOtpFingerPrint(email, ctx.req),
              token: hashedToken,
              expires,
            },
          }),
          sendMail({
            subject: `Sign in to ${url.host}`,
            body: `Your OTP is ${otpPrefix}-<b>${token}</b>. It expires in ${expiryMinutes} minutes.
      Please use this to login to your account.
      <p>If your OTP does not work, please request for a new one.</p>`,
            recipient: email,
          }),
        ])
      } catch (e) {
        ctx.logger.error(
          { error: e, email },
          "Failed to send OTP email for email sign in",
        )

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to send OTP email",
        })
      }
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
          token,
          email,
        })
      } catch (e) {
        if (e instanceof VerificationError) {
          ctx.logger.warn(
            { error: e, email },
            "Failed to verify OTP for email sign in",
          )

          throw new TRPCError({
            code: "BAD_REQUEST",
            message: e.message,
            cause: e,
          })
        }
        throw e
      }

      const newAttributes: Partial<GrowthbookAttributes> = {
        email,
      }

      await ctx.gb.setAttributes(newAttributes)

      const isSingpassEnabled = ctx.gb.isOn(IS_SINGPASS_ENABLED_FEATURE_KEY)

      if (!isSingpassEnabled) {
        return db.transaction().execute(async (tx) => {
          const user = await upsertUser({
            tx,
            email,
          })

          const userId = user.id as NonNullable<SessionData["userId"]>

          await recordUserLogin({
            tx,
            userId,
            verificationToken: oldVerificationToken,
          })

          ctx.session.userId = userId
          await ctx.session.save()
          return pick(user, defaultUserSelect)
        })
      }

      return db.transaction().execute(async (tx) => {
        const user = await upsertUser({
          tx,
          email,
        })

        ctx.session.destroy()
        set(ctx.session, "singpass.sessionState", {
          userId: user.id,
          verificationToken: oldVerificationToken,
        })
        await ctx.session.save()
        return pick(user, defaultUserSelect)
      })
    }),
})
