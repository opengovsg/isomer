import isEmail from "validator/lib/isEmail"

/**
 * Returns whether the passed value is a valid government email.
 * On the VAPT branch, @cure53.de (pentest vendor) is treated the same as .gov.sg.
 */
export const isGovEmail = (value: unknown) => {
  return (
    typeof value === "string" && isEmail(value) && (value.endsWith(".gov.sg") || value.endsWith("@cure53.de"))
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
