// Shared redirect-validation copy, codes, and the preflight result contract.
// Kept out of the Zod schema so the same constants back the validate preflight,
// the create-time guards (redirect.service), and the add-redirect form without
// the server and client ever drifting.

// Prefixes reserved by the framework that must never be a redirect source —
// e.g. /_next serves Next.js build assets, so a redirect there would shadow
// framework internals on the published site.
export const RESERVED_SOURCE_PREFIXES = ["/_next"] as const

// Codes returned by the redirect.validate preflight so the client can render a
// specific message per blocking issue. All of these block creation — advisory
// destination-liveness is surfaced on the table row instead.
export const RedirectValidationCode = {
  AlreadyExists: "ALREADY_EXISTS",
  RedirectLoop: "REDIRECT_LOOP",
  SourceIsExistingPage: "SOURCE_IS_EXISTING_PAGE",
} as const
export type RedirectValidationCode =
  (typeof RedirectValidationCode)[keyof typeof RedirectValidationCode]

// User-facing copy shared between the validate preflight and the create-time
// guards, so the server and client can't drift. Messages that interpolate the
// path (the loop detail) are produced in the service since they aren't reused.
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

export interface RedirectValidationIssue {
  code: RedirectValidationCode
  message: string
  // Optional secondary line rendered beneath the main message. The loop error
  // uses it for its explanatory detail (matching the design's heading + body).
  description?: string
}

export interface RedirectValidationResult {
  errors: RedirectValidationIssue[]
}
