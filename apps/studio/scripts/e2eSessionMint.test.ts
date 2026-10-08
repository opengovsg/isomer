import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("~/env.mjs", () => ({
  env: {
    SESSION_SECRET: "test-session-secret-at-least-32-chars-long",
    NODE_ENV: "test",
  },
}))

import { LOGGED_IN_KEY } from "~/constants/localStorage"

import {
  buildPlaywrightStorageState,
  sealSessionCookieValue,
  unsealSessionCookieValue,
} from "../tests/e2e/fixtures/session-mint"

describe("e2e session mint", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("seals a session cookie that unseals to the expected userId", async () => {
    // Arrange
    const userId = "user-abc-123"

    // Act
    const sealed = await sealSessionCookieValue(userId)
    const payload = await unsealSessionCookieValue(sealed)

    // Assert
    expect(payload.userId).toBe(userId)
  })

  it("builds Playwright storage state with session cookie and login flag", async () => {
    // Arrange
    const sealed = await sealSessionCookieValue("editor-user-id")

    // Act
    const state = buildPlaywrightStorageState("http://127.0.0.1:3000", sealed)

    // Assert
    expect(state.cookies[0]?.name).toBe("auth.session-token")
    expect(state.cookies[0]?.value).toBe(sealed)
    expect(state.cookies[0]?.domain).toBe("127.0.0.1")
    expect(state.cookies[0]?.httpOnly).toBe(true)
    expect(state.cookies[0]?.secure).toBe(false)
    expect(state.origins[0]?.origin).toBe("http://127.0.0.1:3000")
    expect(state.origins[0]?.localStorage).toEqual([
      { name: LOGGED_IN_KEY, value: "true" },
    ])
  })
})
