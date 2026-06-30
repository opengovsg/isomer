// Shared redirect-validation copy, codes, and the preflight result contract.
// Kept out of the Zod schema so the same constants back the validate preflight,
// the create-time guards (redirect.service), and the add-redirect form without
// the server and client ever drifting.

// Prefixes reserved by the framework that must never be a redirect source —
// e.g. /_next serves Next.js build assets, so a redirect there would shadow
// framework internals on the published site.
export const RESERVED_SOURCE_PREFIXES = ["/_next"] as const

// Codes returned by the redirect.validate preflight so the client can render a
// specific message (and styling) per issue. Errors block creation; warnings do
// not, but are surfaced so users can reconsider before the redirect goes live.
export const RedirectValidationCode = {
  AlreadyExists: "ALREADY_EXISTS",
  RedirectLoop: "REDIRECT_LOOP",
  SourceIsExistingPage: "SOURCE_IS_EXISTING_PAGE",
  DestinationIsRedirectSource: "DESTINATION_IS_REDIRECT_SOURCE",
  DestinationNotFound: "DESTINATION_NOT_FOUND",
  DestinationNotPublished: "DESTINATION_NOT_PUBLISHED",
} as const
export type RedirectValidationCode =
  (typeof RedirectValidationCode)[keyof typeof RedirectValidationCode]

// User-facing copy shared between the validate preflight, the create-time
// guards, and the add-redirect form, so the server and client can't drift.
// Messages that interpolate the path (the loop detail and the chain warning)
// are produced in the service since they aren't reused by the client.
export const REDIRECT_MESSAGES = {
  alreadyExists: "This page is already being redirected.",
  loop: "This will trap visitors in a never-ending loop.",
  destinationNotLive:
    "This page doesn't exist on your site yet. Make sure the page is live before publishing this redirect.",
  sourceIsExistingPage:
    "A live page already uses this URL. The redirect would hide it. Move or unpublish that page first.",
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
  warnings: RedirectValidationIssue[]
}
