import { errors } from "openid-client"
import { describe, expect, it } from "vitest"

import { describeOneGovSgError } from "../oneGovSg.service"

describe("describeOneGovSgError", () => {
  it("reduces id_token validation errors to a category without the token", () => {
    // Arrange
    const error = new errors.RPError({
      message: "nonce mismatch, expected abc, got: xyz",
      jwt: "eyJhbGciOiJSUzI1NiJ9.officer.signature",
    })

    // Act
    const result = describeOneGovSgError(error)

    // Assert
    expect(result).toBe("id_token_validation")
  })

  it("keeps only the OAuth error code from one.gov.sg errors", () => {
    // Arrange
    const error = new errors.OPError({
      error: "invalid_grant",
      error_description: "IdP-controlled text",
    })

    // Act
    const result = describeOneGovSgError(error)

    // Assert
    expect(result).toBe("op_error:invalid_grant")
  })

  it("keeps the message of our own errors", () => {
    // Act
    const result = describeOneGovSgError(
      new Error("one.gov.sg discovery issuer mismatch"),
    )

    // Assert
    expect(result).toBe("one.gov.sg discovery issuer mismatch")
  })
})
