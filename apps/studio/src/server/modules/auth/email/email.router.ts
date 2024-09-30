import { TRPCError } from "@trpc/server"
import { formatInTimeZone } from "date-fns-tz"

import { env } from "~/env.mjs"
import { sendMail } from "~/lib/mail"
import {
  emailSignInSchema,
  emailVerifyOtpSchema,
} from "~/schemas/auth/email/sign-in"
import { publicProcedure, router } from "~/server/trpc"
import { getBaseUrl } from "~/utils/getBaseUrl"
import { defaultMeSelect } from "../../me/me.select"
import { VerificationError } from "../auth.error"
import { verifyToken } from "../auth.service"
import { createTokenHash, createVfnPrefix, createVfnToken } from "../auth.util"
import { getOtpFingerPrint } from "./utils"

export const emailSessionRouter = router({
  // Generate OTP.
  login: publicProcedure
    .input(emailSignInSchema)
    .meta({ rateLimitOptions: {} })
    .mutation(async ({ ctx, input: { email } }) => {
      if (env.NODE_ENV === "production") {
        // check if whitelisted email on Growthbook
        const defaultWhitelist: string[] = []
        const whitelistedUsers = ctx.gb.getFeatureValue("whitelisted_users", {
          whitelist: defaultWhitelist,
        })

        if (!whitelistedUsers.whitelist.includes(email)) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Unauthorized. Contact Isomer support.",
          })
        }
      }

      // TODO: instead of storing expires, store issuedAt to calculate when the next otp can be re-issued
      // TODO: rate limit this endpoint also
      const expires = new Date(Date.now() + env.OTP_EXPIRY * 1000)
      const token = createVfnToken()
      const otpPrefix = createVfnPrefix()
      const hashedToken = createTokenHash(token, email)

      const url = new URL(getBaseUrl())

      // May have one of them fail,
      // so users may get an email but not have the token saved, but that should be fine.
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
          body: `Your OTP is ${otpPrefix}-<b>${token}</b>. It will expire on ${formatInTimeZone(
            expires,
            "Asia/Singapore",
            "dd MMM yyyy, hh:mmaaa",
          )}.
      Please use this to login to your account.
      <p>If your OTP does not work, please request for a new one.</p>`,
          recipient: email,
        }),
      ])
      return { email, otpPrefix }
    }),
  verifyOtp: publicProcedure
    .input(emailVerifyOtpSchema)
    .meta({ rateLimitOptions: {} })
    .mutation(async ({ ctx, input: { email, token } }) => {
      try {
        await verifyToken(ctx.prisma, ctx.req, {
          token,
          email,
        })
      } catch (e) {
        if (e instanceof VerificationError) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: e.message,
            cause: e,
          })
        }
        throw e
      }

      const emailName = email.split("@")[0] ?? "unknown"

      const user = await ctx.prisma.user.upsert({
        where: { email },
        update: {},
        create: {
          email,
          // TODO: add the phone in later, this is a wip
          phone: "",
          name: emailName,
        },
        select: defaultMeSelect,
      })

      ctx.session.userId = user.id
      await ctx.session.save()
      return user
    }),
})
