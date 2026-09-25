import { createOpenAICompatible } from "@ai-sdk/openai-compatible"
import { generateText, type UserContent } from "ai"

const FOUNDRY_BASE_URL = "https://engine.pair.gov.sg"

export interface FoundryClientConfig {
  apiKey: string
}

export interface GenerateFoundryTextInput {
  modelId: string
  system?: string
  prompt: UserContent
  maxOutputTokens?: number
}

/**
 * Pair Foundry client. This package does not read application env and does
 * not know about product use cases — callers pass a key, an optional system
 * prompt, and the user prompt.
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
    maxOutputTokens,
  }: GenerateFoundryTextInput): Promise<string> => {
    const response = await generateText({
      model: provider.chatModel(modelId),
      allowSystemInMessages: true,
      messages: [
        ...(system ? [{ role: "system" as const, content: system }] : []),
        { role: "user" as const, content: prompt },
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
