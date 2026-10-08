import { applySession } from "tests/integration/helpers/iron-session"
import { describe, expect, it } from "vitest"

import { clearSessionData } from "../session"

describe("clearSessionData", () => {
  it("wipes every field, including ones not in SessionData, and the session can still be saved", async () => {
    // Arrange
    const session = applySession()
    session.userId = "user-a" as typeof session.userId
    // A key no real code uses, standing in for a field added in the future
    const sentinel = session as unknown as Record<string, unknown>
    sentinel.zz_unusedSentinelKey_8f3c1a = "leaked"

    // Act
    clearSessionData(session)

    // Assert
    expect(Object.keys(session)).toEqual([])
    expect(sentinel.zz_unusedSentinelKey_8f3c1a).toBeUndefined()
    // Unlike destroy(), the session is reusable: methods survive and save works
    session.userId = "user-b" as typeof session.userId
    await expect(session.save()).resolves.toBeUndefined()
  })
})
