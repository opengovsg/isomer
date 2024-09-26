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
import { db } from "../../database"
import { defaultMeSelect } from "../../me/me.select"
import { VerificationError } from "../auth.error"
import { verifyToken } from "../auth.service"
import { createTokenHash, createVfnPrefix, createVfnToken } from "../auth.util"

export const emailSessionRouter = router({
  // Generate OTP.
  login: publicProcedure
    .input(emailSignInSchema)
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
      const { savedPrefix, newlyCreated } = await db
        .transaction()
        .setIsolationLevel("serializable")
        .execute(async (tx) => {
          const existing = await tx
            .selectFrom("VerificationToken")
            .forUpdate()
            .where("identifier", "=", email)
            .select(["expires", "prefix", "token"])
            .executeTakeFirst()

          // NOTE: if we don't have a stored entry for the token, we will create a new token
          if (!existing) {
            await tx
              .insertInto("VerificationToken")
              .values({
                identifier: email,
                token: hashedToken,
                prefix: otpPrefix,
                expires,
              })
              .execute()

            return {
              savedPrefix: otpPrefix,
              newlyCreated: true,
            }
          } else if (existing.expires < new Date(Date.now())) {
            // NOTE: only reset the count if the existing one is already expired
            await tx
              .updateTable("VerificationToken")
              .set({
                token: hashedToken,
                expires,
                attempts: 0,
                prefix: otpPrefix,
              })
              .where("identifier", "=", email)
              .execute()

            return {
              savedPrefix: otpPrefix,
              newlyCreated: true,
            }
          } else {
            return {
              savedPrefix: existing.prefix,
              newlyCreated: false,
            }
          }
        })

      if (newlyCreated) {
        await sendMail({
          subject: `Sign in to ${url.host}`,
          body: `Your OTP is ${savedPrefix}-<b>${token}</b>. It will expire on ${formatInTimeZone(
            expires,
            "Asia/Singapore",
            "dd MMM yyyy, hh:mmaaa",
          )}.
      Please use this to login to your account.
      <p>If your OTP does not work, please request for a new one.</p>`,
          recipient: email,
        })
      } else {
        await sendMail({
          subject: `Sign in to ${url.host}`,
          body: `Please use your existing OTP beginning with ${savedPrefix} to login to your account.
      <p>If your OTP does not work, please request for a new one.</p>`,
          recipient: email,
        })
      }

      return { email, otpPrefix: savedPrefix }
    }),
  verifyOtp: publicProcedure
    .meta({ rateLimitOptions: {} })
    .input(emailVerifyOtpSchema)
    .mutation(async ({ ctx, input: { email, token } }) => {
      try {
        await verifyToken(ctx.prisma, {
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
