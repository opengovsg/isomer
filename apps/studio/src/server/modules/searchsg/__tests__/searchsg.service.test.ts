import { beforeEach, describe, expect, it, vi } from "vitest"

const { mockWretch } = vi.hoisted(() => ({
  mockWretch: vi.fn(),
}))

vi.mock("wretch", () => ({ default: mockWretch }))

vi.mock("~/env.mjs", () => ({
  env: {
    NEXT_PUBLIC_APP_ENV: "production",
    SEARCHSG_API_KEY: "test-api-key",
  },
}))

import { updateSearchSGConfig } from "../searchsg.service"

const VALID_UUID = "550e8400-e29b-41d4-a716-446655440000"
const PROPS = { name: "test-site", _kind: "name" } as const
const URL = "https://example.gov.sg"

describe("updateSearchSGConfig", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Throw on the auth call to prevent actual HTTP requests while still
    // allowing us to assert whether wretch was invoked at all
    mockWretch.mockReturnValue({
      auth: vi.fn().mockReturnThis(),
      headers: vi.fn().mockReturnThis(),
      post: vi.fn().mockReturnThis(),
      json: vi.fn().mockRejectedValue(new Error("no network in tests")),
    })
  })

  describe("clientId validation", () => {
    it("should not call the SearchSG API for a clientId containing path traversal sequences", async () => {
      // Arrange
      const clientId = "../../other-client-id"

      // Act
      await updateSearchSGConfig(PROPS, clientId, URL)

      // Assert
      expect(mockWretch).not.toHaveBeenCalled()
    })

    it("should not call the SearchSG API for a plain string clientId", async () => {
      // Arrange
      const clientId = "not-a-uuid"

      // Act
      await updateSearchSGConfig(PROPS, clientId, URL)

      // Assert
      expect(mockWretch).not.toHaveBeenCalled()
    })

    it("should not call the SearchSG API for an empty clientId", async () => {
      // Arrange
      const clientId = ""

      // Act
      await updateSearchSGConfig(PROPS, clientId, URL)

      // Assert
      expect(mockWretch).not.toHaveBeenCalled()
    })

    it("should call the SearchSG API for a valid UUID clientId", async () => {
      // Act
      await updateSearchSGConfig(PROPS, VALID_UUID, URL).catch(() => {})

      // Assert
      expect(mockWretch).toHaveBeenCalled()
    })
  })
})
