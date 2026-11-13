import { z } from "zod"

export const oneGovSgLoginSchema = z.object({
  // Present only when the one.gov.sg app launcher started the login.
  iss: z.string().min(1, { error: "Enter the one.gov.sg issuer" }).optional(),
})

// one.gov.sg sends `state` and `iss` on success and error responses alike.
export const oneGovSgCallbackSchema = z.object({
  state: z.string().min(1, { error: "Enter the login state" }),
  iss: z.string().min(1, { error: "Enter the one.gov.sg issuer" }),
  code: z.string().min(1, { error: "Enter the authorization code" }).optional(),
  error: z.string().min(1, { error: "Enter the error code" }).optional(),
})
