import { z } from "zod"

import { offsetPaginationSchema } from "./pagination"

export const MAX_REDIRECT_PATH_LENGTH = 2000

// Matches ASCII control characters (0x00-0x1f, 0x7f) and backslashes.
// These are never valid in a URL path and can corrupt the generated
// redirect rules on the published site.
const INVALID_PATH_CHARS_REGEX = /[\x00-\x1f\x7f\\]/

// Strips slashes from both ends of a path so "/foo/", "foo" and "foo//"
// all normalise to the same inner segments before validation.
const trimSlashes = (value: string) => value.replace(/^\/+|\/+$/g, "")

const sourceSchema = z
  .string()
  .min(1, { message: "Source path is required" })
  .max(MAX_REDIRECT_PATH_LENGTH, { message: "Source path is too long" })
  .refine((value) => !INVALID_PATH_CHARS_REGEX.test(value), {
    message: "Source must not contain control characters or backslashes",
  })
  .refine((value) => trimSlashes(value).length > 0, {
    message: "Source path cannot consist only of slashes",
  })
  .refine((value) => !trimSlashes(value).split("/").includes(".."), {
    message: "Source must not contain '..' path segments",
  })
  // Normalise to a single leading slash with no trailing slash, collapsing
  // runs of slashes so equivalent inputs map to the same source. This keeps
  // the (siteId, source) unique constraint meaningful.
  .transform((value) => `/${trimSlashes(value).replace(/\/{2,}/g, "/")}`)

const destinationSchema = z
  .string()
  .min(1, { message: "Destination is required" })
  .max(MAX_REDIRECT_PATH_LENGTH, { message: "Destination is too long" })
  // Destinations must be a path on the same site ("/...") or an external
  // https URL — anything else (http://, javascript:, ...) is rejected.
  .refine((value) => value.startsWith("/") || value.startsWith("https://"), {
    message: "Destination must start with '/' or 'https://'",
  })

// Shared between the AddRedirectCard form (with siteId omitted) and the
// create endpoint so the client and server always validate identically
export const createRedirectSchema = z.object({
  siteId: z.number().min(1),
  source: sourceSchema,
  destination: destinationSchema,
})
export type CreateRedirectInput = z.infer<typeof createRedirectSchema>

export const deleteRedirectSchema = z.object({
  siteId: z.number().min(1),
  // Redirect.id is a bigint in the DB, surfaced as a string by kysely — so
  // reject non-numeric ids here instead of letting them blow up as a DB
  // cast error (same shape as the bigint id schema in resource.ts)
  id: z.string().regex(/^[1-9][0-9]*$/, { message: "Invalid redirect ID" }),
})
export type DeleteRedirectInput = z.infer<typeof deleteRedirectSchema>

// Rows are paginated server-side, so sorting happens server-side too —
// sorting only the visible page would be misleading. "publishedAt" sorts on
// createdAt, which is the publish time since creates publish immediately.
const redirectSortFieldSchema = z.enum(["source", "destination", "publishedAt"])
export type RedirectSortField = z.infer<typeof redirectSortFieldSchema>

export const listRedirectsSchema = z.object({
  siteId: z.number().min(1),
  sortBy: redirectSortFieldSchema.default("publishedAt"),
  sortDirection: z.enum(["asc", "desc"]).default("desc"),
  ...offsetPaginationSchema.shape,
})
export type ListRedirectsInput = z.infer<typeof listRedirectsSchema>

export const countRedirectsSchema = z.object({
  siteId: z.number().min(1),
})
export type CountRedirectsInput = z.infer<typeof countRedirectsSchema>
