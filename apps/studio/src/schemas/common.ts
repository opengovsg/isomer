import { z } from "zod"

export const generateBasePermalinkSchema = (label: string) =>
  z
    .string({
      required_error: `Enter a URL for this ${label}.`,
    })
    // Using `*` instead of `+` to allow empty strings, so the correct required error message is shown instead of the regex error message.
    .regex(/^[a-z0-9\-]*$/, {
      message: "Only lowercase alphanumeric characters and hyphens are allowed",
    })
