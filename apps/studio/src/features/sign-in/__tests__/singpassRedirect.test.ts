import { describe, expect, it } from "vitest"

import {
  singpassCallbackFailurePath,
  singpassSignInError,
} from "../singpassRedirect"

describe("singpassCallbackFailurePath", () => {
  it("asks the user to retry when Singpass reports a server error", () => {
    expect(singpassCallbackFailurePath("server_error")).toBe(
      "/sign-in/singpass?error=retry",
    )
  })

  it("asks the user to wait when Singpass is unavailable", () => {
    expect(singpassCallbackFailurePath("temporarily_unavailable")).toBe(
      "/sign-in/singpass?error=unavailable",
    )
  })

  it("uses a generic error for any other Singpass error", () => {
    expect(singpassCallbackFailurePath("invalid_request_uri")).toBe(
      "/sign-in/singpass?error=true",
    )
    expect(singpassCallbackFailurePath(undefined)).toBe(
      "/sign-in/singpass?error=true",
    )
  })
})

describe("singpassSignInError", () => {
  it("only treats our own error values as specific cases", () => {
    expect(singpassSignInError("retry")).toBe("retry")
    expect(singpassSignInError("unavailable")).toBe("unavailable")
    expect(singpassSignInError("server_error")).toBe("generic")
    expect(singpassSignInError("true")).toBe("generic")
    expect(singpassSignInError(undefined)).toBeNull()
  })
})
