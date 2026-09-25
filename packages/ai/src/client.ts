import { createOpenAICompatible } from "@ai-sdk/openai-compatible"
import { type FlexibleSchema, Output, generateText } from "ai"

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

export interface GenerateFoundryObjectInput<T> {
  modelId: string
  system: string
  prompt: string
  schema: FlexibleSchema<T>
  schemaName?: string
  schemaDescription?: string
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

  const buildUserContent = (prompt: string, image?: FoundryImageInput) =>
    image
      ? [
          { type: "text" as const, text: prompt },
          {
            type: "image" as const,
            image: image.bytes,
            mediaType: image.mimeType,
          },
        ]
      : prompt

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
        { role: "user", content: buildUserContent(prompt, image) },
      ],
      maxOutputTokens,
    })

    const text = response.text.trim()
    if (!text) {
      throw new Error("Foundry returned no text")
    }

    return text
  }

  const generateFoundryObject = async <T>({
    modelId,
    system,
    prompt,
    schema,
    schemaName,
    schemaDescription,
    image,
    maxOutputTokens = 300,
  }: GenerateFoundryObjectInput<T>): Promise<T> => {
    const response = await generateText({
      model: provider.chatModel(modelId),
      allowSystemInMessages: true,
      output: Output.object({
        schema,
        name: schemaName,
        description: schemaDescription,
      }),
      messages: [
        { role: "system", content: system },
        { role: "user", content: buildUserContent(prompt, image) },
      ],
      maxOutputTokens,
    })

    if (response.output == null) {
      throw new Error("Foundry returned no structured output")
    }

    return response.output
  }

  return {
    generateText: generateFoundryText,
    generateObject: generateFoundryObject,
  }
}
