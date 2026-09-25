import { beforeEach, describe, expect, it, vi } from "vitest"

const generateTextMock = vi.fn((_args: unknown): Promise<{ text: string }> =>
  Promise.resolve({ text: "" }),
)
const chatModelMock = vi.fn((modelId: string) => ({ modelId }))

vi.mock("ai", () => ({
  generateText: (args: unknown) => generateTextMock(args),
}))

vi.mock("@ai-sdk/openai-compatible", () => ({
  createOpenAICompatible: () => ({
    chatModel: chatModelMock,
  }),
}))

const {
  generateAltText,
  sanitizeAltText,
  isAltTextGenerationSupportedForMimeType,
} = await import("../generateAltText")

describe("generateAltText", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.PAIR_FOUNDRY_API_KEY = "test-key"
    generateTextMock.mockResolvedValue({
      text: "Image of a queue of residents outside a community centre — waiting for vaccinations",
    })
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

  it("sends the image bytes and context to Pair Foundry", async () => {
    generateTextMock.mockResolvedValueOnce({
      text: "Residents queueing outside a community centre",
    })

    const imageBytes = new Uint8Array([1, 2, 3])
    await generateAltText({
      imageBytes,
      mimeType: "image/jpeg",
      context: { componentType: "image", pageTitle: "Vaccination drive" },
    })

    expect(chatModelMock).toHaveBeenCalledWith("claude-sonnet-4-6-v1:rsn")
    expect(generateTextMock).toHaveBeenCalledTimes(1)
    const request = generateTextMock.mock.calls[0]?.[0] as {
      messages: {
        role: string
        content: string | { type: string; text?: string; image?: Uint8Array }[]
      }[]
    }
    const userMessage = request.messages.find(
      (message) => message.role === "user",
    )
    expect(Array.isArray(userMessage?.content)).toBe(true)
    if (!Array.isArray(userMessage?.content)) return
    expect(userMessage.content).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: "image", image: imageBytes }),
        expect.objectContaining({
          type: "text",
          text: expect.stringContaining("Vaccination drive"),
        }),
      ]),
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

  it("throws when PAIR_FOUNDRY_API_KEY is missing", async () => {
    delete process.env.PAIR_FOUNDRY_API_KEY

    await expect(
      generateAltText({
        imageBytes: new Uint8Array([1, 2, 3]),
        mimeType: "image/png",
        context: { componentType: "image" },
      }),
    ).rejects.toThrow(/PAIR_FOUNDRY_API_KEY/)

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
  it("supports the raster formats sent to Pair Foundry", () => {
    expect(isAltTextGenerationSupportedForMimeType("image/png")).toBe(true)
    expect(isAltTextGenerationSupportedForMimeType("image/jpeg")).toBe(true)
    expect(isAltTextGenerationSupportedForMimeType("image/gif")).toBe(true)
    expect(isAltTextGenerationSupportedForMimeType("image/webp")).toBe(true)
  })

  it("rejects formats that are not sent as an image block", () => {
    expect(isAltTextGenerationSupportedForMimeType("image/svg+xml")).toBe(false)
    expect(isAltTextGenerationSupportedForMimeType("image/bmp")).toBe(false)
    expect(isAltTextGenerationSupportedForMimeType("image/avif")).toBe(false)
  })
})
