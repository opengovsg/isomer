import { z } from "zod"

import { generateBigIntSchema } from "./common"
import { offsetPaginationSchema } from "./pagination"

export const MAX_REDIRECT_PATH_LENGTH = 2000

// Cap on the page size for listing redirects. The shared offset-pagination
// schema has no upper bound, and the list input is the trust boundary, so a
// read-authorised user could otherwise force an unbounded result set. The UI
// requests 25.
export const MAX_REDIRECT_PAGE_SIZE = 100

// Whitelist of characters allowed in a redirect source path: RFC 3986 `pchar`
// (unreserved + sub-delims + ":" and "@") plus "/" as the segment separator
// and "%" for percent-encoded octets. We whitelist rather than blacklist so
// only known-safe characters reach the generated redirect rules — anything
// outside this set (spaces, control chars, "?", "#", "<", ">", "\\", non-ASCII)
// is rejected up front instead of corrupting the published rules.
const SOURCE_ALLOWED_CHARS_REGEX = /^[A-Za-z0-9\-._~!$&'()*+,;=:@%/]+$/

// Strips slashes from both ends of a path so "/foo/", "foo" and "foo//"
// all normalise to the same inner segments before validation.
const trimSlashes = (value: string) => value.replace(/^\/+|\/+$/g, "")

const sourceSchema = z
  .string()
  .min(1, { message: "Source path is required" })
  .max(MAX_REDIRECT_PATH_LENGTH, { message: "Source path is too long" })
  .refine((value) => SOURCE_ALLOWED_CHARS_REGEX.test(value), {
    message:
      "Source can only contain letters, numbers, and URL path characters",
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
  // Redirect.id is a bigint in the DB, surfaced as a string by kysely — reject
  // non-numeric ids here instead of letting them blow up as a DB cast error
  id: generateBigIntSchema("redirect ID"),
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
  // Override the shared (uncapped) limit with a bounded one — see
  // MAX_REDIRECT_PAGE_SIZE.
  limit: z
    .number()
    .int()
    .positive()
    .max(MAX_REDIRECT_PAGE_SIZE, { message: "Page size is too large" })
    .default(25),
})
export type ListRedirectsInput = z.infer<typeof listRedirectsSchema>

export const countRedirectsSchema = z.object({
  siteId: z.number().min(1),
})
export type CountRedirectsInput = z.infer<typeof countRedirectsSchema>
