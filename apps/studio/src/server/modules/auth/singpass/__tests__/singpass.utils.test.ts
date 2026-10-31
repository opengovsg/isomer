import type { TokenSet } from "openid-client"

import { extractUuid } from "../singpass.utils"

const tokensWithSub = (sub: string) =>
  ({
    id_token: "id-token",
    claims: () => ({ sub }),
  }) as TokenSet

describe("extractUuid", () => {
  it("returns a bare UUID from a FAPI ID token", () => {
    // Arrange
    const tokens = tokensWithSub("beef6054-985f-4073-ae91-cd61552e2a7d")

    // Act
    const uuid = extractUuid(tokens)

    // Assert
    expect(uuid).toBe("beef6054-985f-4073-ae91-cd61552e2a7d")
  })

  it("returns the UUID from a legacy u= subject", () => {
    // Arrange
    const tokens = tokensWithSub(
      "s=S8829314B,u=1c0cee38-3a8f-4f8a-83bc-7a0e4c59d6a9",
    )

    // Act
    const uuid = extractUuid(tokens)

    // Assert
    expect(uuid).toBe("1c0cee38-3a8f-4f8a-83bc-7a0e4c59d6a9")
  })

  it("returns undefined when the subject has no UUID", () => {
    // Arrange
    const tokens = tokensWithSub("s=S8829314B")

    // Act
    const uuid = extractUuid(tokens)

    // Assert
    expect(uuid).toBeUndefined()
  })

  it("returns undefined when there is no ID token", () => {
    // Arrange
    const tokens = { claims: () => ({ sub: "u=abc" }) } as TokenSet

    // Act
    const uuid = extractUuid(tokens)

    // Assert
    expect(uuid).toBeUndefined()
  })
})
