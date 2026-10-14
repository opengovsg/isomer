import { errors } from "openid-client"

/**
 * Stable log facets for Singpass login observability.
 *
 * FAPI 2.0 rolls out behind a feature flag while legacy login stays available.
 * We need to compare success and failure rates between flows during the ramp, and
 * to see where FAPI-only steps (PAR, DPoP, token exchange) fail when users drop off.
 *
 * `singpassFlow` pins legacy vs FAPI for the whole attempt (the callback must not
 * re-read the flag). `singpassStage` and `singpassOutcome` mark funnel steps so
 * authorization can succeed while callback still fails, and failures can be tied
 * to a stage without logging OAuth secrets.
 */

export const singpassErrorCode = (error: unknown): string | undefined => {
  if (error instanceof errors.OPError && typeof error.error === "string") {
    return error.error
  }
  return undefined
}

export const singpassLoginLogFields = ({
  useFapi,
  stage,
  outcome,
  ...extra
}: {
  useFapi: boolean
  stage: "authorization" | "par" | "token_exchange" | "callback"
  outcome?: "success" | "failure"
} & Record<string, unknown>) => ({
  singpassFlow: useFapi ? "fapi2" : "legacy",
  singpassStage: stage,
  ...(outcome === undefined ? {} : { singpassOutcome: outcome }),
  ...extra,
})

/** Human-readable `msg` prefix so @message grep matches `Singpass FAPI:` / `Singpass legacy:`. */
export const singpassLogMessage = ({
  useFapi,
  message,
}: {
  useFapi: boolean
  message: string
}): string => `Singpass ${useFapi ? "FAPI" : "legacy"}: ${message}`
