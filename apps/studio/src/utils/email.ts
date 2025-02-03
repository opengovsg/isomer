import isEmail from "validator/lib/isEmail"

export const getEmailDomain = (email?: string) => {
  if (!email) {
    return undefined
  }
  if (!isEmail(email)) {
    return undefined
  }
  return email.split("@").pop()
}

/**
 * Returns whether the passed value is a valid government email.
 */
export const isGovEmail = (value: unknown) => {
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
