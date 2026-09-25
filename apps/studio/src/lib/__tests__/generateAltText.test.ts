import { beforeEach, describe, expect, it, vi } from "vitest"

const generateTextMock = vi.fn((_args: unknown): Promise<string> =>
  Promise.resolve(""),
)

vi.mock("~/lib/foundry", () => ({
  foundryClient: {
    generateText: (args: unknown) => generateTextMock(args),
  },
}))

const {
  generateAltText,
  sanitizeAltText,
  isAltTextGenerationSupportedForMimeType,
} = await import("../generateAltText")

describe("generateAltText", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    generateTextMock.mockResolvedValue(
      "Image of a queue of residents outside a community centre — waiting for vaccinations",
    )
  })

  it("returns sanitized alt text with no em dash or generic prefix", async () => {
    const result = await generateAltText({
      imageBytes: new Uint8Array([1, 2, 3]),
      mimeType: "image/png",
      context: { componentType: "image", pageTitle: "Vaccination drive" },
    })

    expect(result).not.toContain("—")
    expect(result.toLowerCase().startsWith("image of")).toBe(false)
  })

  it("asks Foundry for alt text with the page context and image", async () => {
    generateTextMock.mockResolvedValueOnce(
      "Residents queueing outside a community centre",
    )
    const imageBytes = new Uint8Array([1, 2, 3])

    await generateAltText({
      imageBytes,
      mimeType: "image/jpeg",
      context: { componentType: "image", pageTitle: "Vaccination drive" },
    })

    expect(generateTextMock).toHaveBeenCalledWith(
      expect.objectContaining({
        modelId: "claude-sonnet-4-6-v1:rsn",
        image: { bytes: imageBytes, mimeType: "image/jpeg" },
        prompt: expect.stringContaining("Vaccination drive"),
      }),
    )
  })

  it("throws for an unsupported MIME type instead of calling Foundry", async () => {
    await expect(
      generateAltText({
        imageBytes: new Uint8Array([1, 2, 3]),
        mimeType: "image/svg+xml",
        context: { componentType: "image" },
      }),
    ).rejects.toThrow(/unsupported/i)

    expect(generateTextMock).not.toHaveBeenCalled()
  })
})

describe("sanitizeAltText", () => {
  it("strips generic prefixes, quotes, and em dashes", () => {
    const result = sanitizeAltText(
      '"Photo of a sunset over the harbour — taken at dusk"',
    )

    expect(result).not.toContain("—")
    expect(result.toLowerCase().startsWith("photo of")).toBe(false)
  })
})

describe("isAltTextGenerationSupportedForMimeType", () => {
  it("supports png, jpeg, gif, and webp", () => {
    expect(isAltTextGenerationSupportedForMimeType("image/png")).toBe(true)
    expect(isAltTextGenerationSupportedForMimeType("image/jpeg")).toBe(true)
    expect(isAltTextGenerationSupportedForMimeType("image/gif")).toBe(true)
    expect(isAltTextGenerationSupportedForMimeType("image/webp")).toBe(true)
  })

  it("rejects other formats", () => {
    expect(isAltTextGenerationSupportedForMimeType("image/svg+xml")).toBe(false)
    expect(isAltTextGenerationSupportedForMimeType("image/bmp")).toBe(false)
    expect(isAltTextGenerationSupportedForMimeType("image/avif")).toBe(false)
  })
})
