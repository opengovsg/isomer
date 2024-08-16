import { z } from "zod"

import { OTP_LENGTH } from "~/lib/auth"
import { isGovEmail, isVaptEmail } from "~/utils/email"
import { normaliseEmail } from "~/utils/zod"

export const emailSignInSchema = z.object({
  email: normaliseEmail.refine(email => isGovEmail(email) || isVaptEmail(email), {
    message: "Please sign in with a valid email address.",
  }),
})

export const emailVerifyOtpSchema = emailSignInSchema.extend({
  token: z
    .string()
    .trim()
    .min(1, "OTP is required.")
    .length(OTP_LENGTH, `Please enter a ${OTP_LENGTH} character OTP.`),
})
