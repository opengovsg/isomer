import isEmail from "validator/lib/isEmail"

import { env } from "~/env.mjs"

/**
 * Returns whether the passed value is a valid government email.
 */
export const isGovEmail = (value: unknown) => {
  // Temp. workaround to allow VAPT testers to be added as admins
  if (
    env.NEXT_PUBLIC_APP_ENV === "vapt" &&
    typeof value === "string" &&
    ["marta@cure53.de", "rupp@cure53.de", "dennis@cure53.de"].includes(value)
  ) {
    return true
  }

  return (
    typeof value === "string" && isEmail(value) && value.endsWith(".gov.sg")
  )
}

/**
 * Returns whether the passed value is a valid email.
 */
export const isValidEmail = (value: unknown) => {
  return typeof value === "string" && isEmail(value)
}
/*
 * Normalizes an email address to lowercase.
 */
export const normalizeEmail = (email: string): string => email.toLowerCase()
