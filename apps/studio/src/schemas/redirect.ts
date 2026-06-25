import { REFERENCE_LINK_REGEX } from "@opengovsg/isomer-components"
import { z } from "zod"
import { RESERVED_SOURCE_PREFIXES } from "~/constants/redirect"

import { generateBigIntSchema } from "./common"
import { offsetPaginationSchema } from "./pagination"

// A redirect is published as an S3 object whose key is
// `${siteName}/${buildNumber}/latest/${source}/index.html` (see
// tooling/build/scripts/publishing/uploadRedirects.ts), and AWS caps an object
// key at 1024 bytes. Pages publish under the SAME prefix, so a redirect source
// and a page's full permalink are keyed identically — any path a page can
// publish at, a redirect can use as its source. The source character whitelist
// below forbids raw non-latin characters, so a stored source is always ASCII
// (one byte per char in the key); there is no percent-encoding expansion to
// budget for. 900 leaves comfortable headroom under 1024 for the site name
// (realistically <~30), the build number, the `latest/` segment and the
// `/index.html` suffix, while exceeding the page permalink limit so a moved or
// renamed page can always auto-create a redirect from its old URL.
export const MAX_REDIRECT_SOURCE_LENGTH = 900

// Destinations can be a full external https URL — with a query string and
// fragment those are legitimately long — so they get a far more generous limit
// than the source path.
export const MAX_REDIRECT_DESTINATION_LENGTH = 2000

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

// ASCII control characters (0x00-0x1f, 0x7f). A destination is persisted verbatim
// and later emitted into the published site's redirect rules (S3 object metadata
// and ultimately the CloudFront Location header), so a CR/LF/NUL must never reach
// it. These are stripped (not rejected) — the global flag strips every match.
// (Source paths use the stricter whitelist above instead.)
const CONTROL_CHARS_REGEX = /[\x00-\x1f\x7f]/g

// Anchored form of the shared [resource:siteId:resourceId] reference (the shared
// regex is unanchored, so a value only counts as a reference when it is exactly
// one). Internal-page destinations are stored in this form (converted from a
// path on create, see redirect.service) so the redirect follows the page if its
// permalink changes.
const REFERENCE_DESTINATION_REGEX = new RegExp(
  `^${REFERENCE_LINK_REGEX.source}$`,
)

// A prefix check ("https://") is too lax: "https://https://www.isomer.gov.sg"
// passes it, yet parses with hostname "https". Require a parseable https URL
// whose host looks like a public domain (has a dot) — this rejects the doubled
// scheme and bare single-label hosts (localhost, intranet names) that are never
// valid redirect targets for a published site.
const isValidExternalDestination = (value: string) => {
  try {
    const url = new URL(value)
    return url.protocol === "https:" && url.hostname.includes(".")
  } catch {
    return false
  }
}

// Strips slashes from both ends of a path so "/foo/", "foo" and "foo//"
// all normalise to the same inner segments before validation.
const trimSlashes = (value: string) => value.replace(/^\/+|\/+$/g, "")

// Normalises a path to a single leading slash, no trailing slash, collapsed
// runs ("/foo/", "foo", "foo//" -> "/foo"). Exported so the server can compare
// a destination path against stored sources, persisted in this form.
export const normalizeRedirectPath = (value: string) =>
  `/${trimSlashes(value).replace(/\/{2,}/g, "/")}`

// Sources are additionally lowercased — page permalinks are lowercase-only, so
// a source must lowercase to compare against (and not shadow) a real page.
// Exported so the server's source/loop guards compare in the same form.
export const normalizeRedirectSource = (value: string) =>
  normalizeRedirectPath(value).toLowerCase()

// True when the (normalised) source falls under a reserved prefix — the prefix
// itself or anything nested beneath it.
const isReservedSource = (value: string) => {
  const normalised = normalizeRedirectSource(value)
  return RESERVED_SOURCE_PREFIXES.some(
    (prefix) => normalised === prefix || normalised.startsWith(`${prefix}/`),
  )
}

const sourceSchema = z
  .string()
  .min(1, { message: "Source path is required" })
  .max(MAX_REDIRECT_SOURCE_LENGTH, { message: "Source path is too long" })
  .refine((value) => SOURCE_ALLOWED_CHARS_REGEX.test(value), {
    message:
      "Source can only contain letters, numbers, and URL path characters",
  })
  // The source is a path on this site, never a full URL — a scheme like
  // "https://" can never match an incoming request path, so reject it instead
  // of silently mangling it into a slashed source.
  .refine((value) => !value.includes("://"), {
    message: "Enter what comes behind your URL (e.g., /contact-us).",
  })
  .refine((value) => trimSlashes(value).length > 0, {
    message: "Source path cannot consist only of slashes",
  })
  .refine((value) => !trimSlashes(value).split("/").includes(".."), {
    message: "Source must not contain '..' path segments",
  })
  .refine((value) => !isReservedSource(value), {
    message: "This path is reserved and can't be used as a redirect source",
  })
  // Normalise and lowercase so equivalent inputs map to one source. Page
  // permalinks are lowercase-only, so the source must lowercase to match (and
  // guard against shadowing) a real page at the same path.
  .transform(normalizeRedirectSource)

// Shown whenever a destination isn't a shape we accept. Spells out the valid
// forms (a site path or an external URL) instead of a terse "invalid" so the
// user knows what to type.
const INVALID_DESTINATION_MESSAGE =
  "Enter a valid path (/path-to-page) or URL (starts with www., http://, or https://)."

const destinationSchema = z
  .string()
  .min(1, { message: "Destination is required" })
  .max(MAX_REDIRECT_DESTINATION_LENGTH, { message: "Destination is too long" })
  // Strip control characters up front (a stray pasted CR/LF/NUL shouldn't block
  // the user, and must never reach the published redirect rules — see
  // CONTROL_CHARS_REGEX). The cleaned value flows through the checks below.
  .transform((value) => value.replace(CONTROL_CHARS_REGEX, ""))
  // Same-site path ("/..."), external https URL, or an already-resolved page
  // reference ([resource:...]); anything else (http://, javascript:, ...) rejected.
  .refine(
    (value) =>
      value.startsWith("/") ||
      isValidExternalDestination(value) ||
      REFERENCE_DESTINATION_REGEX.test(value),
    { message: INVALID_DESTINATION_MESSAGE },
  )
  // Backslashes are rejected, not stripped: "\\" is ambiguous in a path/URL and
  // silently removing it could turn "/\\evil.com" into an open redirect.
  .refine((value) => !value.includes("\\"), {
    message: INVALID_DESTINATION_MESSAGE,
  })
  // Reject "../" path traversal in any destination. It is never meaningful here:
  // an internal path is resolved on our side, and a live site collapses ".." in
  // an external URL's path anyway — so the user can already express the intended
  // target directly. Banning it outright keeps the rule simple.
  .refine((value) => !trimSlashes(value).split("/").includes(".."), {
    message: INVALID_DESTINATION_MESSAGE,
  })
  // An internal path can't redirect to an on-page anchor — the published
  // redirect emits a Location header, which can't target a fragment. External
  // https URLs may legitimately carry a #fragment, so this is scoped to paths.
  .refine((value) => !value.startsWith("/") || !value.includes("#"), {
    message: "Destination can't link to an anchor on a page",
  })
  // Normalise internal-path destinations like sources (this also collapses a
  // protocol-relative "//evil.com" to "/evil.com", closing an open redirect).
  // External https URLs and [resource:...] references are left as entered.
  .transform((value) =>
    value.startsWith("/") ? normalizeRedirectPath(value) : value,
  )

// Cross-field rule shared by the create schema and the siteId-less form schema:
// a redirect from a path to itself is a no-op. `source` is already normalised,
// so the destination is normalised the same way before comparing.
export const refineSourceDestinationDiffer = (
  { source, destination }: { source: string; destination: string },
  ctx: z.RefinementCtx,
) => {
  if (
    destination.startsWith("/") &&
    normalizeRedirectSource(destination) === source
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["destination"],
      message: "You can't redirect a URL to itself.",
    })
  }
}

// Refinement-free base so callers can still `.omit()` / `.extend()` it (a
// refinement turns a ZodObject into a ZodEffects, losing those helpers). The
// form omits siteId and re-applies the cross-field refinement.
export const createRedirectObjectSchema = z.object({
  siteId: z.number().min(1),
  source: sourceSchema,
  destination: destinationSchema,
})

export const createRedirectSchema = createRedirectObjectSchema.superRefine(
  refineSourceDestinationDiffer,
)
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
