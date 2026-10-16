// Shared redirect-validation copy and constants. Kept out of the Zod schema so
// the same constants back the create-time guards (redirect.service) and the
// add-redirect form without the server and client ever drifting.

// Prefixes reserved by the framework that must never be a redirect source —
// e.g. /_next serves Next.js build assets, so a redirect there would shadow
// framework internals on the published site.
export const RESERVED_SOURCE_PREFIXES = ["/_next"] as const

// User-facing copy shared between the create-time guards and the client, so
// the server and client can't drift. Messages that interpolate the path (the
// loop detail) are produced in the service since they aren't reused.
export const REDIRECT_MESSAGES = {
  alreadyExists: "This page is already being redirected.",
  loop: "This will trap visitors in a never-ending loop.",
  sourceIsExistingPage:
    "A live page already uses this URL. The redirect would hide it. Move or unpublish that page first.",
  // Shown on a table row whose destination points at a page/folder that isn't
  // published yet, so the redirect currently leads nowhere.
  destinationNotPublished:
    "This page or folder you're redirecting to hasn't been published yet.",
} as const

// Bulk-upload row errors with no single-create equivalent. Kept beside
// REDIRECT_MESSAGES so all redirect copy lives together; the other bulk row
// errors reuse REDIRECT_MESSAGES, so the errors file reads like the inline form.
export const BULK_MALFORMED_ROW_MESSAGE =
  "This row has extra columns. Put double quotes around any value that contains a comma."
export const BULK_DUPLICATE_SOURCE_MESSAGE =
  "This source is listed more than once in your file."
