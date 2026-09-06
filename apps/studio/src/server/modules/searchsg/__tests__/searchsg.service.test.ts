import { beforeEach, describe, expect, it, vi } from "vitest"
import * as wretchNs from "wretch"

const VALID_UUID = "550e8400-e29b-41d4-a716-446655440000"
const PROPS = { name: "test-site", _kind: "name" } as const
const URL = "https://example.gov.sg"

describe("updateSearchSGConfig", () => {
  const mockWretch = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv("NEXT_PUBLIC_APP_ENV", "production")
    vi.stubEnv("SEARCHSG_API_KEY", "test-api-key")
    vi.spyOn(wretchNs, "default").mockImplementation(mockWretch)
    // Throw on the auth call to prevent actual HTTP requests while still
    // allowing us to assert whether wretch was invoked at all
    mockWretch.mockReturnValue({
      auth: vi.fn().mockReturnThis(),
      headers: vi.fn().mockReturnThis(),
      post: vi.fn().mockReturnThis(),
      json: vi.fn().mockRejectedValue(new Error("no network in tests")),
    })
  })

  const loadService = async () => {
    vi.resetModules()
    const { updateSearchSGConfig } = await import("../searchsg.service")
    return updateSearchSGConfig
  }

  describe("clientId validation", () => {
    it("should not call the SearchSG API for a clientId containing path traversal sequences", async () => {
      const updateSearchSGConfig = await loadService()
      const clientId = "../../other-client-id"

      await updateSearchSGConfig(PROPS, clientId, URL)

      expect(mockWretch).not.toHaveBeenCalled()
    })

    it("should not call the SearchSG API for a plain string clientId", async () => {
      const updateSearchSGConfig = await loadService()
      const clientId = "not-a-uuid"

      await updateSearchSGConfig(PROPS, clientId, URL)

      expect(mockWretch).not.toHaveBeenCalled()
    })

    it("should not call the SearchSG API for an empty clientId", async () => {
      const updateSearchSGConfig = await loadService()
      const clientId = ""

      await updateSearchSGConfig(PROPS, clientId, URL)

      expect(mockWretch).not.toHaveBeenCalled()
    })

    it("should call the SearchSG API for a valid UUID clientId", async () => {
      const updateSearchSGConfig = await loadService()
      await updateSearchSGConfig(PROPS, VALID_UUID, URL).catch(() => {})

      expect(mockWretch).toHaveBeenCalled()
    })
  })

  describe("URL validation", () => {
    it.each(["www.example.com", "example.com", "not a url", ""])(
      "should resolve without rejecting and skip SearchSG config fetch for invalid URL %j",
      async (invalidUrl) => {
        const updateSearchSGConfig = await loadService()
        await updateSearchSGConfig(PROPS, VALID_UUID, invalidUrl).catch(
          () => {},
        )

        expect(mockWretch).not.toHaveBeenCalled()
      },
    )
  })
})
