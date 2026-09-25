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

const { createFoundryClient } = await import("../client")

describe("createFoundryClient", () => {
  const client = createFoundryClient({ apiKey: "test-key" })

  beforeEach(() => {
    vi.clearAllMocks()
    generateTextMock.mockResolvedValue({ text: "  A plain answer.  " })
  })

  it("returns trimmed model text", async () => {
    const result = await client.generateText({
      modelId: "claude-sonnet-4-6-v1:rsn",
      system: "Be brief.",
      prompt: "Say hello.",
    })

    expect(result).toBe("A plain answer.")
    expect(chatModelMock).toHaveBeenCalledWith("claude-sonnet-4-6-v1:rsn")
  })

  it("sends a system prompt and an image when one is provided", async () => {
    const image = { bytes: new Uint8Array([1, 2, 3]), mimeType: "image/png" }

    await client.generateText({
      modelId: "claude-sonnet-4-6-v1:rsn",
      system: "Describe the image.",
      prompt: "What is this?",
      image,
      maxOutputTokens: 120,
    })

    const request = generateTextMock.mock.calls[0]?.[0] as {
      maxOutputTokens: number
      messages: {
        role: string
        content: string | { type: string; text?: string; image?: Uint8Array }[]
      }[]
    }
    expect(request.maxOutputTokens).toBe(120)
    expect(request.messages[0]).toEqual({
      role: "system",
      content: "Describe the image.",
    })
    expect(request.messages[1]?.content).toEqual([
      { type: "text", text: "What is this?" },
      { type: "image", image: image.bytes, mediaType: "image/png" },
    ])
  })

  it("throws when Foundry returns empty text", async () => {
    generateTextMock.mockResolvedValueOnce({ text: "   " })

    await expect(
      client.generateText({
        modelId: "claude-sonnet-4-6-v1:rsn",
        system: "Be brief.",
        prompt: "Say hello.",
      }),
    ).rejects.toThrow(/no text/i)
  })
})
