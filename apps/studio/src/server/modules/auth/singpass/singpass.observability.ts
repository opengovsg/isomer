import { errors } from "openid-client"

/**
 * Stable log facets for Singpass FAPI 2.0 login.
 *
 * `singpassStage` and `singpassOutcome` mark funnel steps so authorization can
 * succeed while callback still fails, and failures can be tied to a stage
 * without logging OAuth secrets.
 */

export const singpassErrorCode = (error: unknown): string | undefined => {
  if (error instanceof errors.OPError && typeof error.error === "string") {
    return error.error
  }
  return undefined
}

export const singpassLoginLogFields = ({
  stage,
  outcome,
  ...extra
}: {
  stage: "authorization" | "par" | "token_exchange" | "callback"
  outcome?: "success" | "failure"
} & Record<string, unknown>) => ({
  singpassFlow: "fapi2" as const,
  singpassStage: stage,
  ...(outcome === undefined ? {} : { singpassOutcome: outcome }),
  ...extra,
})

/** Human-readable `msg` prefix so @message grep matches `Singpass FAPI:`. */
export const singpassLogMessage = ({ message }: { message: string }): string =>
  `Singpass FAPI: ${message}`
