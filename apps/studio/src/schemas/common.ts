import { z } from "zod"

export const generateBasePermalinkSchema = (label: string) =>
  z
    .string({
      error: `Enter a URL for this ${label}.`,
    })
    // Using `*` instead of `+` to allow empty strings, so the correct required error message is shown instead of the regex error message.
    .regex(/^[a-z0-9-]*$/, {
      message: "Only lowercase alphanumeric characters and hyphens are allowed",
    })

// A bigint id surfaced by kysely as a string. kysely won't accept a JS bigint
// in a query, so ids cross the wire as strings; we validate the string shape
// here so a malformed id is a 400 rather than a DB cast error.
// Valid form: digits only, with no leading zero.
export const generateBigIntSchema = (label: string) =>
  z
    .string()
    .min(1, { message: `Enter a valid ${label}` })
    .regex(/^[0-9]+$/, { message: `Enter a valid ${label}` })
    .refine((value) => !value.startsWith("0"), {
      message: `Enter a valid ${label}`,
    })
