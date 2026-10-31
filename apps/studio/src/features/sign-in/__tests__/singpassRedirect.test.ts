import { describe, expect, it } from "vitest"

import {
  singpassCallbackFailurePath,
  singpassSignInError,
} from "../singpassRedirect"

describe("singpassCallbackFailurePath", () => {
  it("asks the user to retry when Singpass reports a server error", () => {
    // Arrange + Act
    const path = singpassCallbackFailurePath("server_error")

    // Assert
    expect(path).toBe("/sign-in/singpass?error=retry")
  })

  it("asks the user to wait when Singpass is unavailable", () => {
    // Arrange + Act
    const path = singpassCallbackFailurePath("temporarily_unavailable")

    // Assert
    expect(path).toBe("/sign-in/singpass?error=unavailable")
  })

  it("uses a generic error for any other Singpass error", () => {
    // Arrange + Act
    const unknown = singpassCallbackFailurePath("invalid_request_uri")
    const missing = singpassCallbackFailurePath(undefined)

    // Assert
    expect(unknown).toBe("/sign-in/singpass?error=true")
    expect(missing).toBe("/sign-in/singpass?error=true")
  })
})

describe("singpassSignInError", () => {
  it("only treats our own error values as specific cases", () => {
    // Arrange + Act
    const retry = singpassSignInError("retry")
    const unavailable = singpassSignInError("unavailable")
    const singpassCode = singpassSignInError("server_error")
    const genericFlag = singpassSignInError("true")
    const missing = singpassSignInError(undefined)

    // Assert
    expect(retry).toBe("retry")
    expect(unavailable).toBe("unavailable")
    expect(singpassCode).toBe("generic")
    expect(genericFlag).toBe("generic")
    expect(missing).toBeNull()
  })
})
