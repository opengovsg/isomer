import { z } from "zod"

export type RedirectStatus = "draft" | "active" | "deleted"

export interface RedirectRow {
  id: string
  source: string
  destination: string
  publishedAt: Date | null
  status: RedirectStatus
  hasUnpublishedChanges: boolean
}

const hasInvalidChars = (val: string) =>
  Array.from(val).some((c) => c.charCodeAt(0) < 32 || c === "\\")

const sourceSchema = z
  .string()
  .min(1, "Source path is required")
  .max(1999, "Source path is too long")
  .refine((val) => !hasInvalidChars(val), {
    message: "Source path contains invalid characters",
  })
  .refine(
    (val) => {
      const trimmed = val.replace(/^\/+/, "").replace(/\/+$/, "")
      return trimmed.length > 0
    },
    { message: "Source path cannot be empty" },
  )
  .refine(
    (val) => {
      const trimmed = val.replace(/^\/+/, "").replace(/\/+$/, "")
      return !trimmed.split("/").some((seg) => seg === "..")
    },
    { message: 'Source path cannot contain ".." segments' },
  )

const destinationSchema = z
  .string()
  .min(1, "Destination is required")
  .max(2000, "Destination is too long")
  .refine((val) => /^(https:\/\/|\/)/.test(val), {
    message: "Destination must start with / or https://",
  })

export const addRedirectSchema = z.object({
  source: sourceSchema,
  destination: destinationSchema,
})

export type AddRedirectInput = z.infer<typeof addRedirectSchema>
