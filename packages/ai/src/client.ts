import { createOpenAICompatible } from "@ai-sdk/openai-compatible"
import { generateText } from "ai"

const FOUNDRY_BASE_URL = "https://engine.pair.gov.sg"

export interface FoundryClientConfig {
  apiKey: string
}

export interface FoundryImageInput {
  bytes: Uint8Array
  mimeType: string
}

export interface GenerateFoundryTextInput {
  modelId: string
  system: string
  prompt: string
  image?: FoundryImageInput
  maxOutputTokens?: number
}

/**
 * Pair Foundry client. This package does not read application env and does
 * not know about product use cases — callers pass a key and the prompt.
 */
export const createFoundryClient = ({ apiKey }: FoundryClientConfig) => {
  const provider = createOpenAICompatible({
    name: "pair-engine",
    baseURL: FOUNDRY_BASE_URL,
    apiKey,
  })

  const generateFoundryText = async ({
    modelId,
    system,
    prompt,
    image,
    maxOutputTokens = 300,
  }: GenerateFoundryTextInput): Promise<string> => {
    const response = await generateText({
      model: provider.chatModel(modelId),
      allowSystemInMessages: true,
      messages: [
        { role: "system", content: system },
        {
          role: "user",
          content: image
            ? [
                { type: "text" as const, text: prompt },
                {
                  type: "image" as const,
                  image: image.bytes,
                  mediaType: image.mimeType,
                },
              ]
            : prompt,
        },
      ],
      maxOutputTokens,
    })

    const text = response.text.trim()
    if (!text) {
      throw new Error("Foundry returned no text")
    }

    return text
  }

  return { generateText: generateFoundryText }
}
