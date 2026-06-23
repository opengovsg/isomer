import { REFERENCE_LINK_REGEX } from "@opengovsg/isomer-components"
import { z } from "zod"

import { generateBigIntSchema } from "./common"
import { offsetPaginationSchema } from "./pagination"

export const MAX_REDIRECT_PATH_LENGTH = 2000

// Caps how many references one resolve request can turn back into permalinks.
// The table sends one page's worth, so this is a generous upper bound.
export const MAX_REDIRECT_REFERENCES = 100

// Caps the list page size — the shared offset-pagination schema is unbounded,
// and this input is the trust boundary. The UI requests 25.
export const MAX_REDIRECT_PAGE_SIZE = 100

// Whitelist of characters allowed in a source path: RFC 3986 `pchar` plus "/"
// and "%". Whitelisting keeps anything that could corrupt the published rules
// (spaces, control chars, "?", "#", "\\", non-ASCII) out up front.
const SOURCE_ALLOWED_CHARS_REGEX = /^[A-Za-z0-9\-._~!$&'()*+,;=:@%/]+$/

// Matches ASCII control characters (0x00-0x1f, 0x7f) and backslashes. These are
// never valid in a destination and can corrupt the generated redirect rules on
// the published site. (Source paths use the stricter whitelist above instead.)
const INVALID_PATH_CHARS_REGEX = /[\x00-\x1f\x7f\\]/

// Anchored form of the shared [resource:siteId:resourceId] reference (the shared
// regex is unanchored, so a value only counts as a reference when it is exactly
// one). Internal-page destinations are stored in this form (converted from a
// path on create, see redirect.service) so the redirect follows the page if its
// permalink changes.
const REFERENCE_DESTINATION_REGEX = new RegExp(
  `^${REFERENCE_LINK_REGEX.source}$`,
)

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
  // Normalise to a single leading slash, no trailing slash, collapsed runs, so
  // equivalent inputs map to one source (keeps the unique constraint meaningful).
  .transform((value) => `/${trimSlashes(value).replace(/\/{2,}/g, "/")}`)

const destinationSchema = z
  .string()
  .min(1, { message: "Destination is required" })
  .max(MAX_REDIRECT_PATH_LENGTH, { message: "Destination is too long" })
  .refine((value) => !INVALID_PATH_CHARS_REGEX.test(value), {
    message: "Destination must not contain control characters or backslashes",
  })
  // Internal path ("/..."), external https URL, or an already-resolved page
  // reference (internal paths are converted to a reference server-side).
  .refine(
    (value) =>
      value.startsWith("/") ||
      value.startsWith("https://") ||
      REFERENCE_DESTINATION_REGEX.test(value),
    {
      message: "Destination must start with '/' or 'https://'",
    },
  )
  // An internal path can't redirect to an on-page anchor — the published
  // redirect emits a Location header, which can't target a fragment. External
  // https URLs may legitimately carry a #fragment, so this is scoped to paths.
  .refine((value) => !value.startsWith("/") || !value.includes("#"), {
    message: "Destination can't link to an anchor on a page",
  })
  // Collapse a leading run of slashes on an internal path so a protocol-relative
  // "//evil.com" can't pass as an open redirect ("//evil.com" -> "/evil.com").
  .transform((value) =>
    value.startsWith("/") ? `/${value.replace(/^\/+/, "")}` : value,
  )

// Shared by the AddRedirectCard form (siteId omitted) and the create endpoint
// so client and server validate identically.
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

// Server-side sort (paginated rows). "publishedAt" sorts on createdAt — the
// publish time, since creates publish immediately.
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

// Resolves stored [resource:...] destinations back to display permalinks. Kept
// off the list endpoint so the read path stays a plain query; the table calls
// this once per page to render references as the page's current permalink.
export const resolveRedirectReferencesSchema = z.object({
  siteId: z.number().min(1),
  references: z
    .array(z.string())
    .max(MAX_REDIRECT_REFERENCES, { message: "Too many references" }),
})
export type ResolveRedirectReferencesInput = z.infer<
  typeof resolveRedirectReferencesSchema
>
