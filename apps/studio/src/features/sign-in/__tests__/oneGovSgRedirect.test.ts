import { describe, expect, it } from "vitest"

import { oneGovSgFailurePath, oneGovSgSignInError } from "../oneGovSgRedirect"

describe("oneGovSgFailurePath", () => {
  it("maps UNAUTHORIZED to the access-denied error", () => {
    expect(oneGovSgFailurePath("UNAUTHORIZED")).toBe(
      "/sign-in?oneGovSgError=unauthorized",
    )
  })

  it("maps every other failure to the generic error", () => {
    expect(oneGovSgFailurePath("INTERNAL_SERVER_ERROR")).toBe(
      "/sign-in?oneGovSgError=failed",
    )
    expect(oneGovSgFailurePath()).toBe("/sign-in?oneGovSgError=failed")
  })
})

describe("oneGovSgSignInError", () => {
  it("round-trips the failure path values", () => {
    expect(oneGovSgSignInError("unauthorized")).toBe("unauthorized")
    expect(oneGovSgSignInError("failed")).toBe("oneGovSgFailed")
  })

  it("ignores anything else", () => {
    expect(oneGovSgSignInError(undefined)).toBeUndefined()
    expect(oneGovSgSignInError("<script>")).toBeUndefined()
    expect(oneGovSgSignInError(["failed"])).toBeUndefined()
  })
})
