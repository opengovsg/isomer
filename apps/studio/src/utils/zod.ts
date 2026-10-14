import { z } from "zod"

export const normaliseEmail = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, { error: "Please enter an email address." })
  .pipe(z.email({ error: "Please enter a valid email address." }))
