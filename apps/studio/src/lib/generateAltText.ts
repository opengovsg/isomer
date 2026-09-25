import { isAltTextAcceptedByFormSchema } from "~/lib/isAltTextAcceptedByFormSchema"
import { pairFoundryClient } from "~/lib/pairFoundry"

const ALT_TEXT_MAX_CHARACTERS = 120

const SUPPORTED_IMAGE_MIME_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
])

export const isAltTextGenerationSupportedForMimeType = (
  mimeType: string,
): boolean => SUPPORTED_IMAGE_MIME_TYPES.has(mimeType)

export const generateAltText = async (
  imageUrl: string,
  abortSignal?: AbortSignal,
): Promise<string> => {
  if (!pairFoundryClient) {
    throw new Error("PAIR_FOUNDRY_API_KEY is not set")
  }

  return pairFoundryClient.generateText({
    modelId: "claude-sonnet-4-6-v1:rsn",
    system: `You generate alternative text (alt text) for images for visually impaired users.
Your job:
- Describe the key visual information clearly and concretely.
- Mention only what is visible, no guessing or extra context.
- Use plain language, no emojis.
- HARD LIMIT: Your response MUST be a single sentence of at most ${ALT_TEXT_MAX_CHARACTERS} characters.
- Do NOT include quotes or the words "alt text" in your answer. It cannot be empty, contain only spaces, or have generic terms like 'image', 'logo', 'graph', etc.
Return ONLY the alt text, nothing else.`,
    prompt: [
      {
        type: "text",
        text: `Describe this image for a visually impaired user in at most ${ALT_TEXT_MAX_CHARACTERS} characters.`,
      },
      { type: "image", image: new URL(imageUrl) },
    ],
    maxOutputTokens: 300,
    abortSignal,
  })
}

const MAX_ALT_TEXT_GENERATION_ATTEMPTS = 2

// Pair Foundry can return text that fails the image block's alt regex. Retry once
// before the router surfaces an error to the editor.
export const generateAltTextWithValidationRetry = async (
  imageUrl: string,
  abortSignal?: AbortSignal,
): Promise<string> => {
  for (let attempt = 0; attempt < MAX_ALT_TEXT_GENERATION_ATTEMPTS; attempt++) {
    const altText = await generateAltText(imageUrl, abortSignal)
    if (isAltTextAcceptedByFormSchema(altText)) {
      return altText
    }
  }

  throw new Error("Generated alt text did not pass validation")
}
