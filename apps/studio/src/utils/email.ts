import isEmail from "validator/lib/isEmail"

/** Boundary input accepted before email-format validation. */
type EmailRejectInput =
  | number
  | boolean
  | null
  | undefined
  | readonly unknown[]
  | Readonly<Record<string, never>>

type EmailInput = string | EmailRejectInput

const isStringValue = (value: EmailInput): value is string =>
  Object.prototype.toString.call(value) === "[object String]"

/**
 * Returns whether the passed value is a valid government email.
 */
export const isGovEmail = (value: EmailInput) => {
  return isStringValue(value) && isEmail(value) && value.endsWith(".gov.sg")
}

/**
 * Returns whether the passed value is a valid email.
 */
export const isValidEmail = (value: EmailInput) => {
  return isStringValue(value) && isEmail(value)
}
/*
 * Normalizes an email address to lowercase.
 */
export const normalizeEmail = (email: string): string => email.toLowerCase()
