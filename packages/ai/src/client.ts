import { createOpenAICompatible } from "@ai-sdk/openai-compatible"

const FOUNDRY_BASE_URL = "https://engine.pair.gov.sg"

export interface FoundryClientConfig {
  apiKey: string
}

/**
 * Pair Foundry provider. This package does not read application env and does
 * not build prompts or messages — callers pass a key and use the AI SDK.
 */
export const createFoundryClient = ({ apiKey }: FoundryClientConfig) =>
  createOpenAICompatible({
    name: "pair-engine",
    baseURL: FOUNDRY_BASE_URL,
    apiKey,
  })
