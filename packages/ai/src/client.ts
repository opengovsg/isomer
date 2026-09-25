import { createOpenAICompatible } from "@ai-sdk/openai-compatible"
import { generateText, type UserContent } from "ai"

const PAIR_FOUNDRY_BASE_URL = "https://engine.pair.gov.sg"

export interface PairFoundryClientConfig {
  apiKey: string
}

export interface GeneratePairFoundryTextInput {
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
export const createPairFoundryClient = ({
  apiKey,
}: PairFoundryClientConfig) => {
  const provider = createOpenAICompatible({
    name: "pair-engine",
    baseURL: PAIR_FOUNDRY_BASE_URL,
    apiKey,
  })

  const generatePairFoundryText = async ({
    modelId,
    system,
    prompt,
    maxOutputTokens,
  }: GeneratePairFoundryTextInput): Promise<string> => {
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
      throw new Error("Pair Foundry returned no text")
    }

    return text
  }

  return { generateText: generatePairFoundryText }
}
