import { ConverseCommand } from "@aws-sdk/client-bedrock-runtime"
import { ALT_TEXT_REGEX_PATTERN } from "@opengovsg/isomer-components"
import { beforeEach, describe, expect, it, vi } from "vitest"

// Mock the Bedrock client so we can control the model's raw response without
// hitting AWS, following the pattern in s3.test.ts.
const sendMock = vi.fn()
vi.mock("@aws-sdk/client-bedrock-runtime", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@aws-sdk/client-bedrock-runtime")>()
  return {
    ...actual,
    BedrockRuntimeClient: vi.fn(function () {
      return { send: sendMock }
    }),
  }
})

const {
  generateAltText,
  sanitizeAltText,
  isAltTextGenerationSupportedForMimeType,
} = await import("../generateAltText")

const altTextRegex = new RegExp(ALT_TEXT_REGEX_PATTERN)

const mockBedrockResponse = (text: string) => ({
  output: { message: { content: [{ text }] } },
})

describe("generateAltText", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns sanitized alt text that passes ALT_TEXT_REGEX_PATTERN and contains no em dash", async () => {
    sendMock.mockResolvedValueOnce(
      mockBedrockResponse(
        "Image of a queue of residents outside a community centre — waiting for vaccinations",
      ),
    )

    const result = await generateAltText({
      imageBytes: new Uint8Array([1, 2, 3]),
      mimeType: "image/png",
      context: { componentType: "image", pageTitle: "Vaccination drive" },
    })

    expect(result).not.toContain("—")
    expect(altTextRegex.test(result)).toBe(true)
    expect(result.toLowerCase().startsWith("image of")).toBe(false)
  })

  it("sends the image bytes and context to Bedrock via ConverseCommand", async () => {
    sendMock.mockResolvedValueOnce(
      mockBedrockResponse("Residents queueing outside a community centre"),
    )

    await generateAltText({
      imageBytes: new Uint8Array([1, 2, 3]),
      mimeType: "image/jpeg",
      context: { componentType: "image", pageTitle: "Vaccination drive" },
    })

    expect(sendMock).toHaveBeenCalledTimes(1)
    const command = sendMock.mock.calls[0]?.[0] as ConverseCommand
    expect(command).toBeInstanceOf(ConverseCommand)
    expect(command.input.messages?.[0]?.content?.[0]?.image?.format).toBe(
      "jpeg",
    )
  })

  it("throws for an unsupported MIME type instead of calling Bedrock", async () => {
    await expect(
      generateAltText({
        imageBytes: new Uint8Array([1, 2, 3]),
        mimeType: "image/svg+xml",
        context: { componentType: "image" },
      }),
    ).rejects.toThrow(/unsupported/i)

    expect(sendMock).not.toHaveBeenCalled()
  })
})

describe("sanitizeAltText", () => {
  it("strips generic prefixes, quotes, and em dashes", () => {
    const result = sanitizeAltText(
      '"Photo of a sunset over the harbour — taken at dusk"',
    )

    expect(result).not.toContain("—")
    expect(result.toLowerCase().startsWith("photo of")).toBe(false)
    expect(altTextRegex.test(result)).toBe(true)
  })
})

describe("isAltTextGenerationSupportedForMimeType", () => {
  it("supports the four raster formats Bedrock's Converse API accepts", () => {
    expect(isAltTextGenerationSupportedForMimeType("image/png")).toBe(true)
    expect(isAltTextGenerationSupportedForMimeType("image/jpeg")).toBe(true)
    expect(isAltTextGenerationSupportedForMimeType("image/gif")).toBe(true)
    expect(isAltTextGenerationSupportedForMimeType("image/webp")).toBe(true)
  })

  it("rejects formats Bedrock can't accept as an image block", () => {
    expect(isAltTextGenerationSupportedForMimeType("image/svg+xml")).toBe(false)
    expect(isAltTextGenerationSupportedForMimeType("image/bmp")).toBe(false)
    expect(isAltTextGenerationSupportedForMimeType("image/avif")).toBe(false)
  })
})
